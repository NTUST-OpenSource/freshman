#!/usr/bin/env python3
"""Extract NotionNext __NEXT_DATA__ from SiteSucker dump -> per-page Markdown."""
import glob
import json
import os
import re
import sys

SRC = "ntust.merlinkuo.tw"
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "md")


def rich_text(parts, blocks):
    """Notion rich-text array -> markdown inline."""
    if not parts:
        return ""
    out = []
    for part in parts:
        text = part[0]
        decos = part[1] if len(part) > 1 else []
        if text == "‣":  # mention (page/date/user)
            for d in decos:
                if d[0] == "d":  # date mention
                    dv = d[1]
                    text = dv.get("start_date", "")
                    if dv.get("end_date"):
                        text += " → " + dv["end_date"]
                elif d[0] == "p":  # page mention
                    ref = blocks.get(d[1], {}).get("value", {})
                    title = (ref.get("properties", {}).get("title") or [[""]])[0][0]
                    text = title or "(page)"
                elif d[0] == "lm":  # external link mention
                    lm = d[1]
                    text = f"[{lm.get('title') or lm.get('href')}]({lm.get('href')})"
            out.append(text)
            continue
        link = None
        for d in decos:
            tag = d[0]
            if tag == "b":
                text = f"**{text}**"
            elif tag == "i":
                text = f"*{text}*"
            elif tag == "s":
                text = f"~~{text}~~"
            elif tag == "c":
                text = f"`{text}`"
            elif tag == "a":
                link = d[1]
        if link:
            text = f"[{text}]({link})"
        out.append(text)
    return "".join(out)


def block_to_md(bid, blocks, indent=0, num=None):
    """One block -> list of markdown lines (children included)."""
    v = blocks.get(bid, {}).get("value")
    if not v:
        return []
    t = v["type"]
    props = v.get("properties", {})
    fmt = v.get("format", {})
    title = rich_text(props.get("title"), blocks)
    pad = "  " * indent
    lines = []
    children = v.get("content", [])
    child_indent = indent

    if t in ("page", "collection_view_page", "collection_view"):
        return []  # root handled by caller; embedded db = nav widget, skip
    elif t == "text":
        lines.append(pad + title if title else "")
    elif t == "sub_header":
        lines.append(f"## {title}")
    elif t == "sub_sub_header":
        lines.append(f"### {title}")
    elif t == "bulleted_list":
        lines.append(f"{pad}- {title}")
        child_indent = indent + 1
    elif t == "numbered_list":
        lines.append(f"{pad}{num or 1}. {title}")
        child_indent = indent + 1
    elif t == "quote":
        lines.extend(f"> {ln}" if ln else ">" for ln in title.split("\n"))
    elif t == "callout":
        icon = fmt.get("page_icon", "💡")
        body = title.replace("\n", "\n> ")
        lines.append(f"> {icon} {body}")
    elif t == "code":
        lang = rich_text(props.get("language"), blocks) or ""
        lines.append(f"```{lang.lower()}\n{title}\n```")
    elif t == "image":
        src = fmt.get("display_source") or rich_text(props.get("source"), blocks)
        cap = rich_text(props.get("caption"), blocks)
        lines.append(f"![{cap}]({src})")
        if cap:
            lines.append(f"*{cap}*")
    elif t == "bookmark":
        link = rich_text(props.get("link"), blocks)
        desc = rich_text(props.get("description"), blocks)
        lines.append(f"🔖 [{title or link}]({link})" + (f" — {desc}" if desc else ""))
    elif t == "file":
        src = rich_text(props.get("source"), blocks)
        lines.append(f"📎 [{title}]({src})")
    elif t == "table":
        order = fmt.get("table_block_column_order", [])
        rows = []
        for rid in children:
            rv = blocks.get(rid, {}).get("value", {})
            rp = rv.get("properties", {})
            rows.append([rich_text(rp.get(c), blocks).replace("\n", " ") for c in order])
        if rows:
            header = fmt.get("table_block_column_header")
            head, body = (rows[0], rows[1:]) if header else ([""] * len(order), rows)
            lines.append("| " + " | ".join(head) + " |")
            lines.append("|" + "---|" * len(order))
            lines.extend("| " + " | ".join(r) + " |" for r in body)
        children = []
    elif t in ("column_list", "column"):
        pass  # just recurse into children
    elif t == "table_row":
        return []  # handled inside table
    elif t == "divider":
        lines.append("---")
    else:
        lines.append(f"<!-- unhandled block type: {t} -->")
        if title:
            lines.append(pad + title)

    counter = 0
    for cid in children:
        cv = blocks.get(cid, {}).get("value", {})
        counter = counter + 1 if cv.get("type") == "numbered_list" else 0
        lines.extend(block_to_md(cid, blocks, child_indent, counter or None))
    return lines


def extract(path):
    html = open(path, encoding="utf-8").read()
    m = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html, re.S)
    if not m:
        return None
    d = json.loads(m.group(1))
    return d.get("props", {}).get("pageProps") or {}


def main():
    os.makedirs(OUT, exist_ok=True)
    site_done = False
    total = 0
    for path in sorted(glob.glob(f"{SRC}/**/*.html", recursive=True)):
        pp = extract(path)
        if not pp:
            continue
        post = pp.get("post") or {}
        bm = post.get("blockMap")
        if not site_done and pp.get("siteInfo"):
            si = pp["siteInfo"]
            nav = pp.get("allNavPages") or []
            menu = pp.get("customMenu") or []
            with open(os.path.join(OUT, "_site.md"), "w", encoding="utf-8") as f:
                f.write(f"# 站點資訊\n\n- 標題：{si.get('title')}\n- 描述：{si.get('description')}\n")
                notice = pp.get("notice") or {}
                if notice.get("title"):
                    f.write(f"- 公告：{notice.get('title')}\n")
                f.write("\n## 選單結構\n\n")
                for m_ in menu:
                    f.write(f"- {m_.get('icon','')} {m_.get('title')} → {m_.get('href')}\n")
                    for s in m_.get("subMenus") or []:
                        f.write(f"  - {s.get('title')} → {s.get('href')}\n")
                f.write("\n## 全部頁面（nav 順序）\n\n")
                f.write("| slug | 標題 | 分類 | 標籤 | 發布日 | 最後編輯 |\n|---|---|---|---|---|---|\n")
                for p in nav:
                    f.write(f"| {p.get('slug')} | {p.get('title')} | {p.get('category','')} | "
                            f"{','.join(p.get('tags') or [])} | {p.get('publishDay','')} | {p.get('lastEditedDay','')} |\n")
            site_done = True
        if not bm:
            continue
        blocks = bm.get("block", {})
        root = next((k for k, v in blocks.items()
                     if v.get("value", {}).get("type") == "page"), None)
        if not root:
            continue
        lines = []
        counter = 0
        for cid in blocks[root]["value"].get("content", []):
            cv = blocks.get(cid, {}).get("value", {})
            counter = counter + 1 if cv.get("type") == "numbered_list" else 0
            lines.extend(block_to_md(cid, blocks, 0, counter or None))
        # collapse 3+ blank lines
        md = re.sub(r"\n{3,}", "\n\n", "\n".join(lines)).strip()
        slug = (post.get("slug") or "index").replace("/", "-")
        fm = (f"---\ntitle: {post.get('title')}\nslug: {post.get('slug')}\n"
              f"category: {post.get('category')}\ntags: {', '.join(post.get('tags') or [])}\n"
              f"publish: {post.get('publishDay')}\nlastEdited: {post.get('lastEditedDay')}\n---\n\n")
        out_path = os.path.join(OUT, f"{slug}.md")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(fm + f"# {post.get('title')}\n\n" + md + "\n")
        size = os.path.getsize(out_path)
        total += size
        print(f"{size:>7,}  {slug}.md")
    print(f"{total:>7,}  TOTAL")


if __name__ == "__main__":
    sys.exit(main())
