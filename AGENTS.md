# 臺科新生懶人包 — 專案規則

專案最高行為準則，AI 協作與人工開發皆須遵守。

## 語言

- UI、內容、文件一律繁體中文；例外為程式碼識別字、網址、無慣用譯名的專有名詞（NTUST、GPA、Moodle）
- 標點全形，數字與英文半形，CJK 與數字或英文交界加半形空白
- 程式碼註解一律英文、斷言句，只寫非顯而易見的限制與順序相依，不重述程式碼

## 禁止

- emoji：UI、內容、commit 訊息皆不得出現
- 未討論過的執行期依賴，優先原生平台能力
- 直接搬用 `docs/dump/` 的字句

## Git

- 遵循 [Conventional Commits](https://www.conventionalcommits.org/)，格式 `type(Scope): description`，細節補在下方 bullet
- type：feat、fix、refactor、docs、test、chore、perf、ci。Scope 首字大寫為本專案慣例
- 訊息純英文，一個功能一個 commit，不加 Co-Authored-By 等 trailer
- PR 一律 target `dev`；開 PR 前先跑本機 code review，流程見 `.claude/skills/rookie`

## 設計

- 僅 white mode，桌面優先（≥1280px），320px 起不得溢出
- 圓角為核心語彙，tokens 見 `src/styles/tokens.css`
- 品牌色臺科深紅；分類色取北捷路線色（選課綠、生活藍、資訊橘、其他棕）
- 首頁不顯示 header 與 footer（`Base.astro` 的 `chrome`）
- 圖示一律 `public/icons/` 的 SVG 以 CSS mask 上色；描邊取 svgrepo stroke-width 2、24×24，來源存 `docs/svg2/`

## 內容

- 文章 `src/content/articles/*.md`，檔名＝slug
- 自訂語法規格 `docs/spec/SPEC.md`，serializer `src/plugins/remark-custom.mjs`，不自行擴充
- 涵蓋狀態與源資料問題見 `docs/README.md`；待辦記於 `TODO.md`，補齊即刪
- 圖片自託管於 `public/images/<slug>/`，不熱鏈

## 系別選擇器

- 清單 `src/lib/depts.mjs`，`all` 永遠第一；選擇存 `localStorage.dept`
- `<html data-dept>` 由 head 內 inline script 於繪製前設定
- `:::dept{for="csie"}` 渲染為 `data-dept-only`，新增系別要同步補 `src/styles/markdown.css` 的顯隱規則

## 行事曆

- 管線見 `.claude/skills/calendar-sync`，規則真相源為 `scripts/parse_ics.py` 的 docstring
- 正本 `docs/calendar/parsed/{學年}.json`，副本 `src/data/calendar-{113,114,115}.json`，三份同步
- 須顯示 `meta.parsedAt`

## 銘謝頁（`/thanks/`）

- 貢獻者名單由 `src/lib/contributors.mjs` 於 build 時取得，不落地成檔案；fetch 只能放這裡，不得寫回頁面 frontmatter
- API 失敗時該區塊退化為說明文字，build 不中斷
- 頭像直連 `https://avatars.githubusercontent.com/<login>?s=160`，為自託管原則的唯一例外
- 信箱只列 `docs/dump/about.md` 已載明的那幾位；含 `mailto:` 的區塊必須包在 `<!--email_off-->` 內
- 第三方素材授權記在 `NOTICE`

## 工作流程

- 改 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 後：停 dev server → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟
- client script 放 `src/scripts/*.ts`，一律掛 `astro:page-load`；persist 元素用 `dataset.bound` 防重複綁定
- document 層級監聽器在模組頂層註冊一次，handler 內以 id 取當前元素
- `transition:persist` 的元素不得再加 `transition:name`，其 `view-transition-name` 寫在 CSS class 上
- `scroll-behavior` 不掛在 `html` 上，只在同頁錨點點擊時短暫掛 `.scroll-smooth`
- 版本相關決策先以 context7 驗證
