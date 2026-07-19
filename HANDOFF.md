# HANDOFF — 臺科新生懶人包（2026-07-19 更新：進入內容遷移階段）

新 session 交接檔。先讀 `AGENTS.md`（最高行為準則，含進度區塊），再讀本檔，最後看 `TODO.md`。
要動內容前必讀 `docs/README.md`（遷移狀態＋守則）與 `docs/spec/SPEC.md`（語法規格 v1.0）。

## 專案是什麼

臺科大新生指南網站，取代舊站 ntust.merlinkuo.tw。內容以自訂 Markdown 語法撰寫（規格 `docs/spec/SPEC.md`），
由 remark serializer 渲染。目標網域 `https://freshman.ntust.org`，部署至 Cloudflare Pages（DNS 綁定待使用者操作）。

## 技術棧與指令

- Astro 7（SSG）＋ unified/remark 管線＋View Transitions（ClientRouter）
- 開發：`./node_modules/.bin/astro dev`（daemon 型，stop 指令同路徑）；建置：`npm run build`
- Node：`.nvmrc`＝24、engines `>=22.12`；CI：`.github/workflows/ci.yml`（push/PR 跑 build）
- **鐵則**：改 `astro.config.mjs`、`src/plugins/`、content schema 後必須
  「stop → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟」。
  content layer 快取實體在 `node_modules/.astro`，漏清連 build 都吃舊輸出（踩過四次，
  最近一次症狀：dev server 上所有 /article/* 變 404）
- 驗證習慣：改完 build ＋ curl dev 頁面 grep markup（不開瀏覽器，使用者禁止操作其瀏覽器）
- headless 檢查工具：puppeteer-core（devDep）＋系統 Chrome，但目前約定不啟動瀏覽器

## 檔案地圖

- `src/plugins/remark-custom.mjs` — serializer 核心（directive → HTML 全部映射在此）
- `src/plugins/rehype-post.mjs` — 表格捲動包裝、figure 化、圖片 lazy
- `src/layouts/Base.astro` — head/SEO（og:type、noindex）、header（persist）、系別下拉、全站 client script
- `src/pages/index.astro` — landing（四站捷運動畫：中正紀念堂—古亭—台電大樓—公館，雙班型）
- `src/components/Calendar.astro` — 行事曆 rail（hover popup＋點擊原生 dialog）
- `src/pages/article/[slug].astro` — 文章頁（cascade、註腳預覽、貢獻人卡、Article JSON-LD、slug 唯一斷言）
- `src/styles/` — tokens／global／markdown／article；分類色由 `.cat-*` 掛 `--cat`
- `src/content/articles/` — 內容；schema 在 `src/content.config.ts`（**strict**）
- `src/lib/depts.mjs` — 系別清單（all 永遠第一）
- `docs/dump/` — 舊站 23 頁存檔；`docs/README.md` — 遷移狀態、已知源資料問題、**遷移守則**
- `docs/calendar/parsed/{110..115}.json` — 行事曆正本（人工編輯過，機器欄位勿動）
- `docs/review-2026-07-19.md` — 全專案對抗審查報告（80 項，含修復狀態與未處理原因）
- `public/_headers` — CSP 等安全標頭；`scripts/parse_ics.py`＋`.claude/skills/calendar-sync` — 行事曆管線

## 關鍵實作備忘（不在 AGENTS 的細節）

- **serializer 是嚴格模式**（寫內文最常撞到）：未定義 directive、壞 wikilink（驗 frontmatter slug
  且排除 draft）、tabs 超過 6 頁 → production build 直接失敗；card 的 href 必填且僅收
  http(s)／站內路徑，站內連結不開新分頁。行內 `:名稱` 誤寫只還原字面不擋 build
- **frontmatter 是 strict schema**：未知欄位（筆誤）、slug 格式（小寫英數連字號）、email 格式、
  slug 重複都擋 build；`noindex: true` 可上線但退出搜尋（meta robots＋sitemap 排除，prototype 現正使用）
- 客製語法新增流程：remark-custom 加 handler → markdown.css 加樣式 → SPEC.md 補章節 → prototype.md 加示範
- **CSP 注意**：`public/_headers` 以 hash 放行 Base.astro 唯一的 `is:inline` script（dept 初始化），
  改那支 script 必須重算 hash 更新 _headers（其餘 script 因 assetsInlineLimit:0 全部外部化）
- 三處 inline JSON（WebSite/Article LD、行事曆 payload）都有 `.replace(/</g, '\\u003c')`，新增時比照
- View Transitions：header 有獨立 group（`:only-child` 區分單邊進出）；client script 掛
  `astro:page-load`，persist 元素用 `dataset.bound` 防重綁；**document 層級監聽器一律模組頂層
  註冊一次**（handler 內以 id 查當前元素），不放 init 裡；popup 類元素 append 到 body 再定位（fixed）
- `<p>` 內不可放 div/button 群（瀏覽器會拆結構）——eyebrow 用 div 的原因
- 行事曆：窗口＝當學年 ±1（client 算），資料載 113–115；byDay 同日同名去重（跨學年檔交界事件）；
  calendarEnd「排他月初」與「月末日」兩種慣例已相容；parse_ics `--sync` 有 id 對齊防線（錯位即中止）
- shiki：token span 背景必須 transparent（否則反白行浮方框）；行號 = `showLineNumbers` meta
- 圖示：`public/icons/`（svgrepo stroke-width 2 版，來源 `docs/svg2/`），CSS mask 上色；tip.svg 是手繪燈泡
- callout 型別：info/tip/warning/danger/fatal（critical 為別名）

## 與使用者協作的默契

- 使用者會直接改 repo 檔案，也會從**另一台機器**（作者 aionyx）推 commit——開工前先
  `git fetch`＋`git status`＋diff，理解並保留其調整；有分歧用 rebase 保持線性歷史
- 使用者口頭核准後才動大架構；風格決策（命名、文案、機率參數）以其修改為準
- 內容與 md style 的調整以使用者指示為準，不自行擴充語法
- commit：英文、`type(Scope): desc`＋bullets、GPG 簽（驗證 `%G?`＝G）、每功能一 commit、不加 trailer

## 下一步（優先序）

1. **舊站 16 篇內容遷移**（本階段主軸）：清單、已知問題與守則見 `docs/README.md`
   （goo.gl 全滅需重建連結、clubs 標題筆誤、HTML 表格改 GFM、圖片一律重製自託管）；
   每篇完成即 commit ＋ build 驗證（serializer 嚴格模式會把語法錯誤直接變 build 失敗）
2. qa 區塊輸出 FAQPage JSON-LD（SPEC 已註記為規劃中）
3. og-image 1200×630 資產（現暫用 logo.png）
4. Cloudflare Pages 部署與 DNS（使用者操作；綁定後在 dashboard 設 `*.pages.dev` → 正式域 301，
   Search Console 提交 sitemap）
5. prototype 恢復 `draft: true`（使用者指示的時機；現為臨時公開＋noindex）
6. 延後項：dark mode、非首頁新動畫（等使用者指示）；行動裝置自適應已完成並驗收
