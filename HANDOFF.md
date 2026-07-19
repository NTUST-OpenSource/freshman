# HANDOFF — 臺科新生懶人包（2026-07-19）

新 session 交接檔。先讀 `AGENTS.md`（最高行為準則，含進度區塊），再讀本檔，最後看 `TODO.md`。

## 專案是什麼

臺科大新生指南網站，取代舊站 ntust.merlinkuo.tw。內容以自訂 Markdown 語法撰寫（規格 `docs/spec/SPEC.md`），
由 remark serializer 渲染。目標網域 `https://freshman.ntust.org`，部署至 Cloudflare Pages（DNS 綁定待使用者操作）。

## 技術棧與指令

- Astro 7（SSG）＋ unified/remark 管線＋View Transitions（ClientRouter）
- 開發：`./node_modules/.bin/astro dev`（daemon 型，stop 指令同路徑）；建置：`npm run build`
- **鐵則**：改 `astro.config.mjs`、`src/plugins/`、content schema 後必須
  「stop → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟」，
  content layer 快取實體在 `node_modules/.astro`，漏清連 build 都吃舊輸出（踩過四次）
- 驗證習慣：改完 build ＋ curl dev 頁面 grep markup（不開瀏覽器，使用者禁止操作其瀏覽器）
- headless 檢查工具：puppeteer-core（devDep）＋系統 Chrome，但目前約定不啟動瀏覽器

## 檔案地圖

- `src/plugins/remark-custom.mjs` — serializer 核心（directive → HTML 全部映射在此）
- `src/plugins/rehype-post.mjs` — 表格捲動包裝、figure 化
- `src/layouts/Base.astro` — head/SEO、header（persist）、系別下拉、全站 client script（astro:page-load）
- `src/pages/index.astro` — landing（路線列車動畫）；`src/components/Calendar.astro` — 行事曆 rail
- `src/pages/article/[slug].astro` — 文章頁（cascade、註腳預覽、貢獻人卡、Article JSON-LD）
- `src/styles/` — tokens／global／markdown／article 四份
- `src/content/articles/` — 內容（檔名＝slug）；schema 在 `src/content.config.ts`
- `src/lib/depts.mjs` — 系別清單（all 永遠第一）
- `scripts/parse_ics.py` ＋ `.claude/skills/calendar-sync` — 行事曆資料管線
- `docs/dump/` — 舊站 23 頁存檔；`docs/README.md` — 遷移狀態與源資料問題
- `docs/calendar/parsed/{110..115}.json` — 行事曆正本（人工編輯過，機器欄位勿動）

## 關鍵實作備忘（不在 AGENTS 的細節）

- 客製語法新增流程：remark-custom 加 handler → markdown.css 加樣式 → SPEC.md 補章節 → prototype.md 加示範
- 圖示：`public/icons/`（svgrepo stroke-width 2 版，來源 `docs/svg2/`），CSS mask 上色；tip.svg 是手繪燈泡
- callout 型別：info/tip/warning/danger/fatal（critical 為別名）
- View Transitions：header 有獨立 group（`:only-child` 區分單邊進出）；所有 client script 掛
  `astro:page-load`，persist 元素用 `dataset.bound` 防重綁；popup 類元素一律 append 到 body 再定位（fixed）
- `<p>` 內不可放 div/button 群（瀏覽器會拆結構）——eyebrow 用 div 的原因
- 行事曆窗口 = 當學年 ±1（client 算），資料載 113–115；「暑假結束」類超界事件由窗口自然截掉
- shiki：token span 背景必須 transparent（否則反白行浮方框）；行號 = `showLineNumbers` meta

## 與使用者協作的默契

- 使用者會直接改 repo 檔案（含 scratchpad 時期習慣已改掉），開工前先 `git status`＋diff 理解其調整並保留
- 使用者口頭核准後才動大架構；風格決策（命名、文案、機率參數）以其修改為準
- commit：英文、`type(Scope): desc`＋bullets、GPG 簽（驗證 `%G?`＝G）、每功能一 commit、不加 trailer

## 下一步（優先序）

1. 舊站 21 篇內容遷移（最大工程；`docs/README.md` 有清單與已知問題：goo.gl 全滅、clubs 標題筆誤等）
2. qa 區塊輸出 FAQPage JSON-LD（SPEC 已承諾）
3. og-image 1200×630 資產（現暫用 logo.png）
4. Cloudflare Pages 部署與 DNS（使用者操作，Search Console 提交 sitemap）
5. 延後項：dark mode、非首頁新動畫（等使用者指示）；行動裝置自適應已完成並驗收
