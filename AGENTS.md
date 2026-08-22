# 臺科新生懶人包 — 專案規則

本檔為專案的最高行為準則（等同 CLAUDE.md），所有 AI 協作與人工開發都必須遵守。

## 目前進度（2026-08-23 更新）

**已完成**
- 行事曆資料管線：110–115 六學年轉換完成、例外歸零、calendar-sync skill 就緒
- 首頁：單一入口設計、捷運路線列車循環動畫、三學年行事曆 rail（hover popup、i 更新卡、回到今天）
- 文章系統：全套自訂 Markdown 語法（callout／spoiler／qa／tabs／steps 形色／card 圖片／dept／table 對齊框線／行號／註腳 hover 預覽）
- 導航：View Transitions 縱向滑動、header 獨立 group（文章間靜止、進出首頁滑入滑出）、sticky 毛玻璃 header、自訂系別下拉
- SEO 基礎：site=https://freshman.ntust.org、canonical、sitemap、robots.txt、OG 完整、WebSite/Article JSON-LD、404 頁
- RWD 基線：320px 起 header／landing／文章／popup 皆不溢出，文章目錄避開 sticky header
- 銘謝頁 `/thanks/`：創辦人、原始貢獻者、GitHub 貢獻者網格；GitHub 名單與頭像於 build 時向 API 取得（規則見「銘謝頁」一節）

**待辦（大項）**
- Cloudflare Pages 自訂網域 DNS 綁定（使用者操作）
- og-image 1200×630 設計資產（目前暫用 logo.png）
- qa 區塊輸出 FAQPage JSON-LD（規格已載明，未實作）
- dark mode、非首頁新動畫（依指示延後）

## 語言規範

- 網站 UI 文案、內容、文件一律**繁體中文**
- 例外：程式碼識別字、網址、無慣用中文譯名的專有名詞（NTUST、GPA、Moodle）
- **程式碼註解一律英文，且必須是斷言句**：只寫「刪掉之後下一個人會踩到」的事（非顯而易見的限制、平台怪癖、順序相依）。不寫辯護、不重述程式碼在做什麼、不記錄當初為什麼沒選另一條路。既有中文註解在動到該檔時順手換掉
- 內容文字規範：標點符號全形、數字與英文字母半形、CJK 與數字或英文字母交界加半形空白

## 禁止事項

- **全站禁止 emoji**：UI、內容、commit 訊息皆不得出現。圖示一律使用 `public/icons/` 下的 SVG（svgrepo stroke-width 2 版、24×24、round cap/join，來源 `docs/svg2/`），以 CSS mask 上色
- 不引入未討論過的執行期依賴；優先原生平台能力

## 與另一專案（ntust.merlinkuo.tw）的關係

- 本站是**獨立的重新創作**，與 ntust.merlinkuo.tw（他人維護的新生懶人包）在營運上互不隸屬：不是其新版、續作、分支或接手維護
- 2026-07-27 起，該站**已授權本站使用其內容與圖片素材**（使用者轉達）。授權範圍限於素材使用，仍維持以下作法：
  - 內容一律**改寫**成本站語氣與自訂語法，不原樣搬字
  - 引用歷年問答時只留日期與泛稱（「臺科學長姐」），不寫入原始貼文者姓名
  - 圖片自託管於 `public/images/<slug>/`，不熱鏈外站
- `docs/dump/` 為該站內容的 Markdown 存檔，供改寫與事實查證使用
- 站內不放指向該站的導流連結或「舊版／新版」式的說明文字
- **例外：`/thanks/` 銘謝頁**（2026-08-23 使用者決議）具名致謝該站創辦人與貢獻者 —— 「原始團隊」列 Choseph Qian（標創辦人）與該站五位貢獻者。此頁措辭僅寫身分，**不提對方域名、不放對方站連結**；GitHub 帳號與信箱依 2026-08-23 使用者指示列出

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
- 首頁**不顯示 header 與 footer**（`Base.astro` 的 `chrome` 開關），只有兩顆按鈕（實心「進入懶人包」＋外框「銘謝」）與行事曆
- 行事曆顯示**當學年 ±1 學年**（保底；client 依今日計算窗口，資料載入 113–115）、hover 顯示事件 popup、更新時間收在標題旁的 i 提示卡

## 內容架構

- 文章：`src/content/articles/*.md`，檔名＝slug，自訂語法規格見 `docs/spec/SPEC.md`
- serializer：`src/plugins/remark-custom.mjs`（directive → HTML 映射）
- 外部參考素材存檔：`docs/dump/`（僅供主題涵蓋比對與借鑑改寫，禁止直接複製）
- 主題涵蓋狀態與已知源資料問題：`docs/README.md`

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

## 銘謝頁（`/thanks/`）

- 區塊順序固定：原始團隊 → GitHub 貢獻者。**不設專案管理員區塊**，現任維護者本來就在 GitHub 貢獻者網格裡
- 原始團隊一區內創辦人排第一張卡，靠 `chip--founder` 標籤與底色與其他人區分，不另開一節
- **人工資料**：`src/data/credits.json`（創辦人、原始貢獻者）。這兩塊是歷史事實、不會再變動，所以版面以美觀為先，不為未來擴充預留結構
- **自動資料**：GitHub 貢獻者名單由 `src/pages/thanks.astro` 在 build 時打 GitHub API 取得，**不落地成檔案、不進 git**。合併 PR 會觸發 Cloudflare Pages 重建，名單與頭像隨部署更新
- API 失敗（離線、rate limit、GitHub 掛掉）時該區塊退化成 repo 連結，**build 不中斷**；build log 留 `[thanks]` 警告
- 匿名 API 為 60 次/小時/IP。CI 用 `secrets.GITHUB_TOKEN`；Cloudflare Pages 端目前不設 token，撞到 rate limit 再於 dashboard 加環境變數 `GITHUB_TOKEN`
- 頭像直連 `avatars.githubusercontent.com`（CSP `img-src` 已放行）。**這是第三方帳號頭像的唯一例外，內容圖片仍一律自託管於 `public/images/<slug>/`**
- 卡片一律走 `src/components/PersonCard.astro`（`founder` prop 決定標籤與底色）：頭像直連 `https://avatars.githubusercontent.com/<login>?s=160`（用帳號即可，不必查 user id），整張卡點擊開 GitHub（stretched link），右側飛機圖示 `mailto:`。`github` 留空字串者卡片不可點、頭像退化成空圓
- 創辦人與原始貢獻者的信箱經 2026-08-23 使用者指示公開，來源為對方公開 about 頁的存檔 `docs/dump/about.md`；**其餘任何人的信箱一律不得逕自補上**
- 有 `mailto:` 的區塊必須包在 `<!--email_off-->` 內：Cloudflare Email Obfuscation 會改寫信箱，而它的解碼 script 被 CSP 擋掉，畫面會殘留 [email protected]
- 名單長到版面明顯過長時，再拆 `/thanks/archive/`，屆時只是搬資料

## 工作流程

- **修改 `astro.config.mjs` 或 `src/plugins/` 後必須：停 dev server → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟**。content layer 以內容 digest 快取渲染結果，快取實體在 `node_modules/.astro`（漏清它連 `npm run build` 都會吃舊 serializer 輸出，已踩過四次）
- 全站使用 ClientRouter（View Transitions）：**所有 client script 必須掛 `astro:page-load`**，persist 元素（如 site-header）要用 `dataset.bound` 防重複綁定
- 待補資料與待決事項記錄於 `TODO.md`，補齊後刪除該項
- 內容與 md style 的調整以使用者指示為準，不自行擴充語法
- 檔案版本相關決策先以 context7 驗證
