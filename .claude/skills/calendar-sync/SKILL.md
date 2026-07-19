---
name: calendar-sync
description: 臺科行事曆 ics 轉換與同步。當使用者提供新的或更新的學年行事曆 ics、要求重新生成 calendar JSON、或修改了 docs/calendar/parsed/ 下的檔案需要同步時使用。轉換由 scripts/parse_ics.py 完成，本 skill 的重點是轉換後的 AI 驗證流程，避免規則例外悄悄流入資料。
---

# 行事曆轉換與同步

## 檔案位置

- 轉換腳本：`scripts/parse_ics.py`（規則全文見其 docstring，為唯一真相源）
- 各學年資料：`docs/calendar/parsed/{學年}.json`（人工編輯的正本）
- 網站用資料：`src/data/calendar-{學年}.json`（從 parsed 複製，113／114／115 三份一律同步）

## 轉換指令

```bash
# 已有人工編輯版（一律用 --sync 保留人工欄位，正本自身就是 sync 來源）
cp docs/calendar/parsed/115.json "$TMPDIR/s.json"
python3 scripts/parse_ics.py <輸入.ics> --sync "$TMPDIR/s.json" -o docs/calendar/parsed/115.json
rm "$TMPDIR/s.json"

# 全新學年（無人工編輯）
python3 scripts/parse_ics.py <輸入.ics> -o docs/calendar/parsed/116.json

# 網站副本一律全數同步（parsed 正本改了哪年就複製哪年，最保險是三份全跑）
for y in 113 114 115; do cp "docs/calendar/parsed/$y.json" "src/data/calendar-$y.json"; done
```

## 更新識別

拿到 ics 先比對 `meta.sourceSha256`（`shasum -a 256 檔案`）：相同代表無更新，直接結束。
不同才轉換；轉換後 `meta.parsedAt` 為新時間戳（網站顯示「行事曆更新於」）。

## 欄位語義（人工欄位絕不可被機器覆蓋）

- 機器欄位：`_titleRaw`（置頂、除錯追溯用）、`id`、`uid`、`start`、`end`、`title`、`dates`、`splitIndex`、`exceptions`、`auto`（自動複製的結束事件）、`_src`（auto 事件的來源 id）、`manual`（人工新增事件）
- 人工欄位：`titleDisplay`、`note`、`link`（陣列）
- `--sync` 保留人工欄位與人工標題；`titleDisplay` 等同 `title` 視為自動對齊（會隨新 title 更新），不同者視為人工指定
- 人工檔可能含 trailing comma（腳本已容忍），但輸出永遠是合法 JSON

## 轉換後 AI 驗證清單（每次必跑）

1. 數量對帳：`rawEventCount` → 拆分後 → +自動複製 = `eventCount`，與 stderr 輸出一致
2. 殘留掃描：全部 title 不得含「N.」「N．」編號殘留、內部「。」、半形標點、全形英數
3. 例外對帳：`exceptions` 應為 0；若非 0，逐筆判斷是新型態（回報使用者訂規則）還是規則失效
4. pair 一致性：每個 `auto` 事件 title == 其 `_src` 事件 title 的「開始→結束」替換
5. sync 統計合理性：titleKept 數量異常暴增代表舊檔被誤判為人工編輯；manualAdded 出現非預期 id 代表 id 偏移（腳本另有 id 對齊防線：uid／splitIndex／auto 不符即中止，中止時人工比對後再跑）
6. 抽樣 3 筆對照原始 ics 的 SUMMARY 行，確認拆分與日期無誤
7. 亂碼檢查：來源含 big5 內嵌 HTML，確認中文欄位無 mojibake
8. 超界事件：start 超出 `calendarStart`~`calendarEnd` 者列出（如 115 的「暑假結束」2027-09-03，屬正常，UI 依範圍截斷）
9. 跨檔重疊：新學年檔加入後，與相鄰學年檔比對同日同名事件（學年交界的「暑假結束」兩檔皆收屬正常，UI 已去重，但非交界事件的重疊要回報）

## 定案內容規則備忘（使用者 2026-07 核准，實作於腳本 house rules）

- 學位考試截止日去「第 N 學期」前綴；「本學年度開始」→「{年} 學年度開始」
- 節日「X（放假…）」display 縮為「X放假」；「臺灣光復暨金門古寧頭大捷紀念日」特例改「光復節」
- 「休、退學學生退 N／3 學雜費截止」display 縮為「休退學退 N／3 學雜費截止」
- 校務會議／補上班／調整放假／彈性補充教學／學年度開始／退學雜費類別的數字為語意必要，自動視為已審核
- 類型連結（LINK_RULES）：選課／加退選／退選開始 → courseselection.ntust.edu.tw；輔系雙主修申請開始 → cour01 兩連結。新類型連結規則加在 `LINK_RULES`
- 「二次退選」為專有名詞，非「第二次退選」漏字（115 起校方兩種寫法都出現過，以人工版為準）

## 歷史例外案例（判讀新資料時的參考）

- 110／111 的 Google 匯出檔是前人手動拆分的產物，殘留「N.」前綴且存在「從 2. 開頭、中段帶 3.」的複合段
- 範圍寫法「（至X月X日截止）」自 113 學年才出現，110-112 用獨立的開始／結束（截止）兩筆事件
- 民國年出現於範圍字串（「至116年2月19日止」），腳本已支援
- 多事項分隔符出現過：半形「N.」、全形「N．」、句號「。」三種
