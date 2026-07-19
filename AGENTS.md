# 臺科新生懶人包 — 專案規則

本檔為專案的最高行為準則（等同 CLAUDE.md），所有 AI 協作與人工開發都必須遵守。

## 目前進度（2026-07-19 更新）

**已完成**
- 行事曆資料管線：110–115 六學年轉換完成、例外歸零、calendar-sync skill 就緒
- 首頁：單一入口設計、捷運路線列車循環動畫、三學年行事曆 rail（hover popup、i 更新卡、回到今天）
- 文章系統：全套自訂 Markdown 語法（callout／spoiler／qa／tabs／steps 形色／card 圖片／dept／table 對齊框線／行號／註腳 hover 預覽）
- 導航：View Transitions 縱向滑動、header 獨立 group（文章間靜止、進出首頁滑入滑出）、sticky 毛玻璃 header、自訂系別下拉
- SEO 基礎：site=https://freshman.ntust.org、canonical、sitemap、robots.txt、OG 完整、WebSite/Article JSON-LD、404 頁
- RWD 基線：320px 起 header／landing／文章／popup 皆不溢出，文章目錄避開 sticky header

**待辦（大項）**
- 舊站 16 篇內容遷移（docs/README.md 有清單與已知問題；選課篇已併五篇課程類重寫完成）
- Cloudflare Pages 自訂網域 DNS 綁定（使用者操作）
- og-image 1200×630 設計資產（目前暫用 logo.png）
- qa 區塊輸出 FAQPage JSON-LD（規格已載明，未實作）
- dark mode、非首頁新動畫（依指示延後）

## 語言規範

- 網站 UI 文案、內容、註解、文件一律**繁體中文**
- 例外：程式碼識別字、網址、無慣用中文譯名的專有名詞（NTUST、GPA、Moodle）
- 內容文字規範：標點符號全形、數字與英文字母半形、CJK 與數字或英文字母交界加半形空白

## 禁止事項

- **全站禁止 emoji**：UI、內容、commit 訊息皆不得出現。圖示一律使用 `public/icons/` 下的 SVG（svgrepo stroke-width 2 版、24×24、round cap/join，來源 `docs/svg2/`），以 CSS mask 上色
- 不引入未討論過的執行期依賴；優先原生平台能力

## Git 規範

- Commit 訊息**純英文**，格式：`type(Scope): short description` ＋ bullet points
- type：feat、fix、refactor、docs、test、chore、perf、ci
- **每完成一個功能就 commit** 當作 checkpoint，不堆積
- **必須 GPG 簽章**（全域 config 已設定，簽章驗證 `git log --format='%h %G? %s'` 應為 G）
- 不加 Co-Authored-By 等 trailer

## 設計語言

- 現階段**僅 white mode**（dark mode 未來再做）
- **桌面版優先**（≥1280px）；行動裝置自適應基線已完成並經使用者驗收（320px 起）
- **圓角**為核心設計語言（radius tokens 見 `src/styles/tokens.css`）
- 品牌色：臺科深紅；分類色：北捷路線色（選課綠、生活藍、資訊橘、其他棕）
- 動畫：**首頁**進場與互動動畫已依使用者指示實作（進場上浮、路線描線、hover 微互動）；其他頁面新增動畫仍待指示
- 首頁**不顯示 header 與 footer**（`Base.astro` 的 `chrome` 開關），僅保留單一入口按鈕（`/article/start/`）與行事曆
- 行事曆顯示**當學年 ±1 學年**（保底；client 依今日計算窗口，資料載入 113–115）、hover 顯示事件 popup、更新時間收在標題旁的 i 提示卡

## 內容架構

- 文章：`src/content/articles/*.md`，檔名＝slug，自訂語法規格見 `docs/spec/SPEC.md`
- serializer：`src/plugins/remark-custom.mjs`（directive → HTML 映射）
- 舊站內容存檔：`docs/dump/`（新站內容至少需涵蓋）
- 遷移狀態與已知源資料問題：`docs/README.md`

## 系別選擇器

- 系別清單：`src/lib/depts.mjs`，**「所有系」（all）永遠排第一**，新增系別即擴充此陣列
- 目前支援：`all`（所有系）、`csie`（資工系）
- 使用者選擇存於 `localStorage.dept`，預設 `all`；`<html data-dept="...">` 由 head 內 inline script 於繪製前設定
- 內容條件顯示語法：`:::dept{for="csie"}`（區塊僅該系別選擇者可見），渲染為 `data-dept-only` 屬性＋CSS 顯隱；新增系別需在 `src/styles/markdown.css` 增加對應顯隱規則

## 行事曆

- 資料管線見 `.claude/skills/calendar-sync`（ics 更新時觸發）；轉換腳本 `scripts/parse_ics.py` 的 docstring 為規則唯一真相源
- 人工編輯正本：`docs/calendar/parsed/{學年}.json`；網站副本：`src/data/calendar-{113,114,115}.json`（三份一律同步）
- 首頁右側行事曆：整學年連續月曆流、可上下捲動、過去日期降透明度、「回到今天」按鈕、點擊有事件日開 popup（原生 dialog）
- 網站需顯示行事曆資料更新時間（`meta.parsedAt`）

## 工作流程

- **修改 `astro.config.mjs` 或 `src/plugins/` 後必須：停 dev server → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟**。content layer 以內容 digest 快取渲染結果，快取實體在 `node_modules/.astro`（漏清它連 `npm run build` 都會吃舊 serializer 輸出，已踩過四次）
- 全站使用 ClientRouter（View Transitions）：**所有 client script 必須掛 `astro:page-load`**，persist 元素（如 site-header）要用 `dataset.bound` 防重複綁定
- 待補資料與待決事項記錄於 `TODO.md`，補齊後刪除該項
- 內容與 md style 的調整以使用者指示為準，不自行擴充語法
- 檔案版本相關決策先以 context7 驗證
