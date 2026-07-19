# 台科懶人包 Markdown 語法規格 v0.1（草案）

> 設計原則：**標準 Markdown（GFM）為底，擴充一律走 directive 語法**（`:::name` 區塊 / `::name` 單行 / `:name[]` 行內）。
> 只有 `==螢光==` 和 `[[內部連結]]` 兩個例外用自訂文法（因為太常打，值得縮寫）。
> 好處：不發明新文法就不用自寫 parser，serializer 只是「directive 節點 → HTML」的映射表，每個功能約 10~30 行 plugin 程式碼。

---

## 0. Frontmatter（每篇文章的中繼資料）

```yaml
---
title: 住宿
slug: dorm              # 路由 /article/dorm
category: life          # course | life | info | misc（決定 nav 分區）
tags: [住, 宿舍]
description: 入住流程、宿舍網路、冷氣卡與門禁的完整指南   # SEO + 列表卡片摘要
year: 114               # 年度性內容標記；網站偵測到新學年時自動掛「資料年度」提醒橫幅
order: 3                # 同分區內排序
updated: 2025-08-01     # 顯示「最後更新」章
draft: false            # true 時不 build
---
```

由 Astro content collections + zod schema 驗證，欄位缺漏或型別錯誤 → build 直接失敗。

---

## 1. GFM 基礎（零成本，內建）

表格、`~~刪除線~~`、`- [ ] 待辦清單`、註腳 `[^1]`、自動連結。不另定義語法。

渲染層附加行為（不是語法，是 renderer 規則）：

| 行為 | 說明 |
|---|---|
| 標題錨點 | h2/h3 自動加 id；h3 帶分類色圓點、h4 為低調細項層級（不進目錄） |
| TOC | 從 h2/h3 自動生成右側目錄，不需在文中寫 `[toc]` |
| 外部連結 | 自動 `target="_blank" rel="noopener noreferrer"`（無圖示） |
| 寬表格 | 自動包 `<div class="table-scroll">` 橫向捲動，手機不爆版 |
| 表格對齊 | GFM `:---`／`:---:`／`---:` 對應靠左／置中／靠右 |
| 表格框線 | `:::table{vlines}` 包住表格顯示垂直框線 |
| 圖片 | `![alt](src "說明文字")` 的 title → `<figure><figcaption>` |
| 註腳預覽 | `[^1]` 游標 hover 直接浮出註腳內容，不需點擊跳轉 |
| 捲動顯示 | 內容區塊進入視窗時上浮淡入（無 JS 時直接可見） |

---

## 2. Callout 提示區塊

原站六種 emoji callout 收斂成五個語意型別；圖示為 `public/icons/` 下的 SVG（CSS mask 上色），全站禁用 emoji：

```md
:::info[標題（可省略）]
一般補充說明。
:::

:::tip
建議、小撇步。
:::

:::warning
要注意的事。
:::

:::danger
會出事的。退宿、退選、詐騙警告。
:::

:::fatal
重大事項。（別名 :::critical，換學年時最該檢查的區塊）
:::
```

```html
<aside class="callout callout--warning">
  <p class="callout__title">標題</p>
  <div class="callout__body">…</div>
</aside>
```

---

## 3. Spoiler 摺疊區塊

```md
:::spoiler[經歷分享：宿舍打麻將的下場]
有人在宿舍開局打麻將，結果宿管阿杯剛好上來貼資料，然後就 GG 了。
:::

:::spoiler[預設展開]{open}
…
:::
```

```html
<details class="spoiler" open?>
  <summary>經歷分享：宿舍打麻將的下場</summary>
  <div class="spoiler__body">…</div>
</details>
```

原生 `<details>`，零 JS。

---

## 4. QA 問答區塊

Q&A 頁與各篇 FAQ 的結構化寫法。renderer 同時輸出 FAQPage JSON-LD（Google 搜尋可直接展開問答，SEO 加成）。

```md
:::qa[系學會會費一定要繳嗎？]{by="Yu-chen Kuo" date="2025-08-24"}
不一定，依照個人意願繳交即可。
:::
```

```html
<section class="qa">
  <h3 class="qa__q">系學會會費一定要繳嗎？</h3>
  <div class="qa__a">…</div>
  <footer class="qa__meta">Yu-chen Kuo · 2025-08-24</footer>
</section>
```

---

## 5. Tabs 分頁

互斥選項（搭捷運路線一/二、iOS/Android 設定…）。外層四個冒號，內層三個。

```md
::::tabs
:::tab[路線一：走西門]
**板南線** 北車 → 西門，轉 **松山新店線** → 公館
:::
:::tab[路線二：走中正紀念堂]
**淡水信義線** 北車 → 中正紀念堂，轉 **松山新店線** → 公館
:::
::::
```

```html
<div class="tabs" role="tablist">
  <button role="tab" aria-selected="true">路線一：走西門</button>
  …
  <div role="tabpanel">…</div>
</div>
```

唯一需要少量 client JS 的元件（React island 或 ~20 行 vanilla script）。

---

## 6. Steps 步驟時間軸

```md
:::steps
1. **排志願**：初選前三天到選課系統填志願序
2. **抽選**：系統暫停 1~2 天進行志願序抽選
:::

:::steps{color="#7c3aed" shape="square"}
1. 站點可用 color 指定 hex 色、shape 指定形狀
2. shape 支援 circle（預設）、square、diamond
:::
```

```html
<ol class="steps">
  <li class="steps__item">…</li>
</ol>
```

只是給 `<ol>` 換裝（左側連線 + 圓點編號），純 CSS。

---

## 7. 連結卡片

原站 Notion bookmark 的替代。

```md
::card[myNTUST]{href="https://myntust.com" desc="查空教室、考古題、GPA 分布"}
::card[含圖卡片]{href="https://example.com" desc="img 屬性會在卡片右側顯示示意圖" img="/images/demo.jpg"}
```

```html
<a class="linkcard" href="…" target="_blank" rel="noopener">
  <span class="linkcard__title">myNTUST</span>
  <span class="linkcard__desc">查空教室、考古題、GPA 分布</span>
  <span class="linkcard__domain">myntust.com</span>  <!-- 由 href 自動取 -->
</a>
```

不做 OG 抓取（build 時打外站太脆），標題描述手寫。

---

## 8. YouTube 嵌入

```md
::yt{id="kTR4vX3KBHs" title="宿舍介紹影片 - 二三宿"}
```

渲染成 lite-youtube 樣式的 facade：靜態縮圖 + 播放鍵，點擊才載入 iframe（不拖累 LCP/TBT）。

---

## 9. 程式碼區塊 / Mermaid

````md
```bash title="連宿舍有線網路" {2}
ping 140.118.1.1
ssh b11000000@host   # 反白強調第 2 行
```

```mermaid
graph LR;
填志願-->抽選-->查看選上的課-->搶課
```
````

- Shiki 語法上色（build 時，零 client JS）、`title` 檔名列、`{n,n-m}` 行反白、右上角複製按鈕。
- `showLineNumbers` 顯示行號（預設隱藏）：`​```python title="x.py" showLineNumbers {3}`。
- mermaid 於 **build 時轉 SVG**（不載入 mermaid.js runtime）。

---

## 10. 行內語法

| 語法 | 渲染 | 用途 |
|---|---|---|
| `==只能選三門==` | `<mark>` 螢光筆 | 重點強調（自訂文法例外 #1） |
| `[[course-select]]`、`[[course-select\|選課篇]]` | 站內 `<a>` | 內部連結；slug 不存在 → **build 失敗**，不會有死內鏈（自訂文法例外 #2） |
| `:kbd[Ctrl+C]` | `<kbd>` | 按鍵 |
| `:year[114]` | 年度 chip | 標記行內年度性資料，換年自動變色提醒 |

---

## 11. 系別條件區塊

依 header 系別選擇（localStorage `dept`）條件顯示的內容。系別代號見 `src/lib/depts.mjs`。

```md
:::dept{for="csie"}
資工系新生請先追蹤系學會 Instagram，課程公告都在那裡。
:::
```

```html
<div class="dept-block" data-dept-only="csie" data-dept-label="資工系限定">…</div>
```

- 僅選擇該系別的使用者可見（`html[data-dept]` 與 CSS 顯隱），SSG 全量渲染、client 過濾
- 區塊左上顯示「Ｘ系限定」chip（CSS `attr(data-dept-label)`）
- `for="all"` 無意義（預設內容本來就人人可見），會被視為未定義語法

## 12. 明確不做（YAGNI）

- 留言系統語法、評分、投票 → 不是內容，是功能，之後用 island 做
- OG link preview 自動抓取 → build 脆弱，手寫 desc
- 自訂顏色/字級行內語法 → 設計系統管顏色，內容不管
- LaTeX 數學 → 懶人包內容用不到，需要時加 remark-math 一行

---

## 13. Serializer 落地方式（Astro 7）

兩條路，擇一：

1. **Sätteri（Astro 7 新預設）**：`features: { directive: true }` 原生開 directive 解析，寫 mdast plugin 做映射。
2. **unified 相容層**（`@astrojs/markdown-remark`）：`remark-directive` + 自寫 plugin，生態最成熟。

兩者的 plugin 都是「walk AST → 遇到 directive 節點 → 換成上表 HTML」，規格定案後 serializer 半天內可完成。scaffold 時再用 context7 鎖定確切套件版本。
