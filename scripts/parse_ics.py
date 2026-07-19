#!/usr/bin/env python3
"""臺科行事曆 ics → 可人工編輯的 JSON。

用法：
    python3 scripts/parse_ics.py <輸入.ics> [-o 輸出.json] [--sync 已編輯.json]

欄位：
    機器欄位 — _titleRaw（置頂、請勿編輯）/ id / uid / start / end / title /
               dates / splitIndex / exceptions / auto / manual
    人工欄位 — titleDisplay / note / link（--sync 時以 id 為鍵保留）

處理規則：
    1. 多事項標題自動拆分（splitIndex 標記）：先依「1.xxx 2.yyy」編號，
       再依內部「。」句號
    2. title 正規化：去除開頭殘留編號「N.」、去除結尾「。」與「.」、
       標點符號轉全形、數字與英文字母強制半形、全形括號前空白移除、
       CJK 與數字交界補半形空白
    3. _titleRaw 中的日期（民國年月日或月日）自動解析為 ISO 寫入 dates，
       年份缺省時以距離事件起日最近者推定
    4. 「（至N月N日截止/止）」範圍字串自動從 title 移除（日期已存於 dates）
    5. 「XX開始（至N截止/止）」且 dates 唯一時，自動複製一筆「XX結束」
       事件到截止日（auto: true 標記）
    6. titleDisplay 未特別指定時自動對齊 title（sync 時：舊值若等同舊 title
       視為自動對齊，會隨新 title 更新；不同者視為人工指定，完整保留）
    7. link 為陣列，允許多個連結（sync 時舊的分號分隔字串自動轉換）
    8. 例外標記 exceptions（乾淨事件無此欄位）；人工改過 title 的事件視為
       已審核，不再標記例外：
       digits — 標題仍含數字，需人工判讀
       period — 去除首尾「。」後仍含「。」，多敘述句需人工拆分
    9. --sync：人工欄位保留；人工改過的 title 沿用；舊檔多出的事件視為
       人工新增（manual: true）保留，與自動複製事件重複者合併。
       sync 前先驗證 id 對齊（同 id 的 uid／splitIndex／auto 必須相符）：
       id 是同日流水號，ics 同日增刪事件會使序號位移、人工欄位貼錯對象，
       偵測到錯位即中止不寫檔，交人工比對
   10. house rules（定案內容規則）：類型連結自動附加（LINK_RULES）、
       學位考試截止日去「第 N 學期」前綴、
       「本學年度開始」→「{年} 學年度開始」、節日「X（放假…）」display 縮為
       「X放假」（光復節特例改名）、學雜費 display 縮寫、
       校務會議／補上班／調整放假／彈性補充教學等類別自動視為已審核
"""
import argparse
import hashlib
import json
import re
import sys
from datetime import date, datetime, timedelta
from pathlib import Path


def unfold(text: str) -> str:
    """RFC 5545 折行還原：CRLF + 空白/TAB 開頭為接續行。"""
    return re.sub(r"\r?\n[ \t]", "", text)


def unescape(value: str) -> str:
    return (
        value.replace("\\n", "\n")
        .replace("\\N", "\n")
        .replace("\\,", ",")
        .replace("\\;", ";")
        .replace("\\\\", "\\")
        .strip()
    )


def parse_date(value: str) -> date:
    value = value.split("T")[0]
    return date(int(value[:4]), int(value[4:6]), int(value[6:8]))


def parse_props(block: str) -> dict:
    props = {}
    for line in block.strip().splitlines():
        if ":" not in line:
            continue
        key, _, value = line.partition(":")
        name = key.split(";")[0].upper()
        props.setdefault(name, value)
    return props


def split_title(title: str) -> list[str]:
    """多事項標題拆分：先依「N.」編號標記（兩個以上才拆），再依內部「。」句號。"""
    segments = [s.strip() for s in re.split(r"(?<!\d)(?=\d+[.．])", title) if s.strip()]
    if len(segments) < 2:
        segments = [title]
    out = []
    for seg in segments:
        out.extend(p.strip() for p in seg.strip().strip("。").split("。") if p.strip())
    return out or [title]


def normalize_width(text: str) -> str:
    """標點符號轉全形；數字與英文字母強制半形；空白維持。"""
    out = []
    for c in text:
        o = ord(c)
        if 0xFF10 <= o <= 0xFF19 or 0xFF21 <= o <= 0xFF3A or 0xFF41 <= o <= 0xFF5A:
            out.append(chr(o - 0xFEE0))  # 全形數字/英文 → 半形
        elif 0x21 <= o <= 0x7E and not c.isalnum():
            out.append(chr(o + 0xFEE0))  # 半形標點 → 全形
        else:
            out.append(c)
    return "".join(out)


def normalize_title(text: str) -> str:
    text = re.sub(r"^\s*\d+[.．]\s*", "", text)  # 殘留編號前綴（半形或全形句點）
    text = re.sub(r"\s+", " ", text).strip()
    text = text.rstrip("。.")  # 句尾句號
    text = normalize_width(text).strip()
    text = re.sub(r"\s+（", "（", text)  # 全形括號前空白
    text = re.sub(r"(?<=[\u4e00-\u9fff])(?=\d)", " ", text)  # CJK與數字交界補半形空白
    text = re.sub(r"(?<=\d)(?=[\u4e00-\u9fff])", " ", text)
    return re.sub(r"\s*（至[^）]*止）", "", text).strip()  # 範圍字串（日期已存於 dates）


def extract_dates(text: str, anchor: date) -> list[str]:
    """文字中的（民國年）月日 → ISO 日期；無年份者取距 anchor 最近的年份。"""
    found = []
    for m in re.finditer(r"(?:(\d{2,3})年)?(\d{1,2})月(\d{1,2})日", text):
        roc, month, day = m.groups()
        month, day = int(month), int(day)
        try:
            if roc:
                d = date(int(roc) + 1911, month, day)
            else:
                candidates = []
                for y in (anchor.year - 1, anchor.year, anchor.year + 1):
                    try:
                        candidates.append(date(y, month, day))
                    except ValueError:
                        continue
                d = min(candidates, key=lambda x: abs((x - anchor).days))
        except ValueError:
            continue
        iso = d.isoformat()
        if iso not in found:
            found.append(iso)
    return found


def find_exceptions(title: str) -> list[str]:
    flags = []
    if re.search(r"[0-9０-９]", title):
        flags.append("digits")
    if "。" in title.strip().strip("。"):
        flags.append("period")
    return flags


HOLIDAY_RENAME = {"臺灣光復暨金門古寧頭大捷紀念日": "光復節"}

# 事件類型 → 自動附加連結（僅填入 link 為空者，人工值優先）
LINK_RULES = [
    (re.compile(r"(選課|加退選|退選)開始$"), ["https://courseselection.ntust.edu.tw/"]),
    (re.compile(r"輔系[．、]雙主修.*申請開始$"), [
        "https://cour01.ntust.edu.tw/DMP_student/#/",
        "https://cour01.ntust.edu.tw/StudentDoubleMajor/Announcement/Index",
    ]),
]

# 這些類別的數字為語意必要，視為已審核不標例外
AUTO_REVIEWED = re.compile(r"校務會議|補上班|調整放假|彈性補充教學|補行上課|退 \d／\d 學雜費|學年度開始")


def apply_house_rules(events: list[dict], year) -> None:
    """定案的內容風格規則（使用者 2026-07 核准）：
    學位考試去學期前綴、學年度開始帶年份、節日 display 縮寫、
    學雜費 display 縮寫、特定類別自動視為已審核。"""
    for e in events:
        t = e["title"]
        t = re.sub(r"^第 ?\d+ ?學期 ?(?=研究生學位考試截止日$)", "", t)
        if t == "本學年度開始" and year:
            t = f"{year} 學年度開始"
        if t != e["title"]:
            e["title"] = t
            e.pop("exceptions", None)
        if not e.get("titleDisplay"):
            m = re.match(r"^(.+?)（放假[^）]*）$", t)
            if m:
                name = HOLIDAY_RENAME.get(m.group(1).strip(), m.group(1).strip())
                e["titleDisplay"] = f"{name}放假"
            elif "學雜費截止" in t:
                e["titleDisplay"] = t.replace("休、退學學生退", "休退學退")
        if e.get("exceptions") and AUTO_REVIEWED.search(t):
            del e["exceptions"]
        if not e.get("link"):
            for pattern, urls in LINK_RULES:
                if pattern.search(t):
                    e["link"] = list(urls)
                    break


def json_lenient(text: str) -> dict:
    """容忍手動編輯產生的 trailing comma。"""
    return json.loads(re.sub(r",(\s*[}\]])", r"\1", text))


def make_record(raw, id_, uid, start, end, title, **extra):
    record = {
        "_titleRaw": raw,
        "id": id_,
        "uid": uid,
        "start": start,
        "end": end,
        "title": title,
        "titleDisplay": "",
        "note": "",
        "link": [],
    }
    record.update({k: v for k, v in extra.items() if v})
    exceptions = find_exceptions(title)
    if exceptions:
        record["exceptions"] = exceptions
    return record


def parse_ics(raw: str) -> tuple[dict, list[dict]]:
    text = unfold(raw)

    def cal_prop(name: str) -> str:
        m = re.search(rf"^{name}[;:]([^\r\n]*)", text, re.M)
        return m.group(1).partition(":")[2] if m and ":" in m.group(1) else (m.group(1) if m else "")

    events = []
    for block in re.findall(r"BEGIN:VEVENT(.*?)END:VEVENT", text, re.S):
        props = parse_props(block)
        if "DTSTART" not in props or "SUMMARY" not in props:
            continue
        start = parse_date(props["DTSTART"])
        end = parse_date(props["DTEND"]) - timedelta(days=1) if "DTEND" in props else start
        if end < start:
            end = start
        events.append(
            {
                "uid": props.get("UID", ""),
                "start": start,
                "end": end,
                "summary": re.sub(r"\s+", " ", unescape(props["SUMMARY"])),
                "description": unescape(props.get("DESCRIPTION", "")),
            }
        )

    events.sort(key=lambda e: (e["start"], e["end"], e["uid"]))

    out = []
    day_counter = {}

    def next_id(day: str) -> str:
        day_counter[day] = day_counter.get(day, 0) + 1
        return f"{day}-{day_counter[day]}"

    for ev in events:
        items = split_title(ev["summary"])
        for i, raw_segment in enumerate(items, start=1):
            day = ev["start"].isoformat()
            record = make_record(
                raw_segment,
                next_id(day),
                ev["uid"],
                day,
                ev["end"].isoformat(),
                normalize_title(raw_segment),
                dates=extract_dates(raw_segment, ev["start"]),
                splitIndex=i if len(items) > 1 else 0,
            )
            if ev["description"]:
                record["note"] = ev["description"]
            out.append(record)

    # 「XX開始（至N截止/止）」→ 自動複製「XX結束」事件到截止日
    for rec in list(out):
        title = rec["title"]
        dates = rec.get("dates", [])
        if (
            "開始" in title
            and len(dates) == 1
            and dates[0] != rec["start"]
            and re.search(r"[（(]至[^）)]*止[）)]", rec["_titleRaw"])
        ):
            copy_title = title.replace("開始", "結束")
            out.append(
                make_record(
                    rec["_titleRaw"],
                    next_id(dates[0]),
                    rec["uid"],
                    dates[0],
                    dates[0],
                    copy_title,
                    auto=True,
                    _src=rec["id"],
                )
            )

    out.sort(key=lambda e: (e["start"], e["id"]))
    meta_range = {
        "calName": cal_prop("X-WR-CALNAME"),
        "calStart": cal_prop("X-CALSTART"),
        "calEnd": cal_prop("X-CALEND"),
    }
    return meta_range, out


def sync_manual(events: list[dict], edited_path: Path) -> dict:
    """把舊版（人工編輯過）檔案的人工欄位與人工新增事件併入新生成結果。"""
    old = json_lenient(edited_path.read_text(encoding="utf-8"))
    old_by_id = {e["id"]: e for e in old.get("events", [])}
    stats = {"matched": 0, "titleKept": 0, "manualAdded": [], "merged": []}

    # id 是同日流水號：ics 同日增刪事件會使序號位移，人工欄位會靜默貼錯對象。
    # 同 id 的 uid／splitIndex／auto 任一不符即中止，交人工比對後再 sync。
    misaligned = []
    for rec in events:
        o = old_by_id.get(rec["id"])
        if not o:
            continue
        if (
            (o.get("uid") and rec.get("uid") and o["uid"] != rec["uid"])
            or o.get("splitIndex", 0) != rec.get("splitIndex", 0)
            or bool(o.get("auto")) != bool(rec.get("auto"))
        ):
            misaligned.append(rec["id"])
    if misaligned:
        raise SystemExit(
            f"[sync] id 對齊檢查失敗（{len(misaligned)} 筆）：{'、'.join(misaligned[:5])}"
            "……ics 同日事件增刪造成序號位移，請人工比對舊檔後再 sync"
        )

    def apply_manual_fields(rec: dict, o: dict) -> None:
        # titleDisplay 若等同舊 title 視為自動對齊，交由重新對齊；不同者為人工指定
        if o.get("titleDisplay") and o["titleDisplay"] != o.get("title", ""):
            rec["titleDisplay"] = o["titleDisplay"]
            rec.pop("exceptions", None)  # 人工客製顯示名亦視為已審核
        if o.get("note"):
            rec["note"] = o["note"]
        link = o.get("link")
        if isinstance(link, str):
            link = [s.strip() for s in re.split(r"[;；]", link) if s.strip()]
        if link:
            rec["link"] = link

    for rec in events:
        o = old_by_id.pop(rec["id"], None)
        if not o:
            continue
        stats["matched"] += 1
        apply_manual_fields(rec, o)
        old_title = o.get("title", "")
        old_raw = o.get("_titleRaw", o.get("titleRaw", ""))
        # 舊檔 _titleRaw 與新生成不同代表拆分方式改變，舊 title 不視為人工編輯
        if old_raw and old_raw != rec["_titleRaw"]:
            continue
        if old_title and normalize_title(old_title) != rec["title"] and old_title != old_raw:
            rec["title"] = normalize_width(old_title.rstrip("。.")).strip()
            stats["titleKept"] += 1
            rec.pop("exceptions", None)  # 人工改過即視為已審核
        # 標題與人工檔一致且人工檔無例外 → 已審核狀態延續
        if rec["title"] == old_title and "exceptions" not in o:
            rec.pop("exceptions", None)

    # 舊檔多出的事件：與自動複製事件同日同名者合併，否則視為人工新增保留
    by_day_title = {(e["start"], e["title"]): e for e in events}
    for o in old_by_id.values():
        title = normalize_width((o.get("title") or "").rstrip("。.")).strip()
        twin = by_day_title.get((o.get("start"), title))
        if twin:
            apply_manual_fields(twin, o)
            stats["merged"].append(o["id"])
            continue
        record = make_record(
            o.get("_titleRaw", o.get("titleRaw", o.get("title", ""))),
            o["id"],
            o.get("uid", ""),
            o["start"],
            o.get("end", o["start"]),
            title,
            manual=True,
        )
        apply_manual_fields(record, o)
        events.append(record)
        stats["manualAdded"].append(o["id"])
    if stats["manualAdded"]:
        events.sort(key=lambda e: (e["start"], e["id"]))
    return stats


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("input", type=Path, help="ics 檔案路徑")
    ap.add_argument("-o", "--output", type=Path, default=None, help="輸出 JSON 路徑（預設 stdout）")
    ap.add_argument("--sync", type=Path, default=None, help="人工編輯過的舊版 JSON，人工欄位將被保留")
    args = ap.parse_args()

    raw_bytes = args.input.read_bytes()
    raw = raw_bytes.decode("utf-8")
    cal, events = parse_ics(raw)

    pre_titles = {e["id"]: e["title"] for e in events}
    sync_stats = sync_manual(events, args.sync) if args.sync else None

    # auto 事件標題跟隨（可能被人工改過的）base 事件：base.title 開始→結束
    by_id = {e["id"]: e for e in events}
    for e in events:
        if not e.get("auto") or e["title"] != pre_titles.get(e["id"]):
            continue  # 無 sync 或 auto 標題已被人工改過 → 不動
        base = by_id.get(e.get("_src", ""))
        if not base or "開始" not in base["title"]:
            continue
        expected = base["title"].replace("開始", "結束")
        if e["title"] != expected:
            e["title"] = expected
            e.pop("exceptions", None)
            if base["title"] == pre_titles.get(base["id"]):
                exceptions = find_exceptions(expected)
                if exceptions:
                    e["exceptions"] = exceptions

    year_match = re.search(r"\d+", cal["calName"] or args.input.stem)
    apply_house_rules(events, int(year_match.group(0)) if year_match else None)

    for e in events:  # titleDisplay 未指定者自動對齊 title
        if not e.get("titleDisplay"):
            e["titleDisplay"] = e["title"]
    cal_start = parse_date(cal["calStart"]).isoformat() if cal["calStart"] else min(e["start"] for e in events)
    cal_end = parse_date(cal["calEnd"]).isoformat() if cal["calEnd"] else max(e["end"] for e in events)
    meta = {
        "academicYear": int(year_match.group(0)) if year_match else None,
        "source": args.input.name,
        "sourceSha256": hashlib.sha256(raw_bytes).hexdigest(),
        "parsedAt": datetime.now().astimezone().isoformat(timespec="seconds"),
        "calendarStart": cal_start,
        "calendarEnd": cal_end,
        "rawEventCount": raw.count("BEGIN:VEVENT"),
        "eventCount": len(events),
        "autoCount": sum(1 for e in events if e.get("auto")),
        "exceptionCount": sum(1 for e in events if e.get("exceptions")),
    }
    doc = {"meta": meta, "events": events}
    text = json.dumps(doc, ensure_ascii=False, indent=2) + "\n"

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
        msg = (
            f"{meta['eventCount']} 筆事件（原始 {meta['rawEventCount']} 筆，"
            f"自動複製 {meta['autoCount']} 筆，例外 {meta['exceptionCount']} 筆）→ {args.output}"
        )
        if sync_stats:
            msg += (
                f"\n  sync：對上 {sync_stats['matched']} 筆、人工標題沿用 {sync_stats['titleKept']} 筆"
                + (f"、與自動複製合併 {sync_stats['merged']}" if sync_stats["merged"] else "")
                + (f"、人工新增事件保留 {sync_stats['manualAdded']}" if sync_stats["manualAdded"] else "")
            )
        print(msg, file=sys.stderr)
    else:
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
