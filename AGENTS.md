# 臺科新生懶人包 — 專案規則

本檔為專案最高行為準則（等同 CLAUDE.md），所有 AI 協作與人工開發都必須遵守。

## 語言

- UI 文案、內容、文件一律繁體中文
- 例外：程式碼識別字、網址、無慣用中文譯名的專有名詞（NTUST、GPA、Moodle）
- 程式碼註解一律英文、斷言句，只寫非顯而易見的限制、平台怪癖與順序相依。不寫辯護、不重述程式碼、不記錄捨棄的做法。動到的檔案順手把既有中文註解換掉
- 標點全形，數字與英文字母半形，CJK 與數字或英文字母交界加半形空白

## 禁止

- emoji：UI、內容、commit 訊息皆不得出現
- 未討論過的執行期依賴；優先原生平台能力
- 直接搬用 `docs/dump/` 的字句

## Git

- Commit 訊息純英文，`type(Scope): short description` ＋ bullet points
- type：feat、fix、refactor、docs、test、chore、perf、ci
- 一個功能一個 commit
- 一律 GPG 簽章，`git log --format='%h %G? %s'` 須為 `G`
- 不加 Co-Authored-By 等 trailer

## 圖示

- 一律 `public/icons/` 下的 SVG，以 CSS mask 上色
- 描邊圖示取 svgrepo stroke-width 2 版，24×24、round cap/join，來源存 `docs/svg2/`
- 品牌標誌取官方 mark，自託管

## 設計語言

- 僅 white mode
- 桌面優先（≥1280px），320px 起不得溢出
- 圓角為核心語彙，tokens 見 `src/styles/tokens.css`
- 品牌色臺科深紅；分類色為北捷路線色（選課綠、生活藍、資訊橘、其他棕）
- 首頁以外的新動畫等指示
- 首頁不顯示 header 與 footer（`Base.astro` 的 `chrome`），只有「進入懶人包」與「銘謝」兩顆按鈕與行事曆
- 藥丸用 `.nav-pill`，圓形圖示鍵用 `.icon-btn`，兩者等高
- 銘謝頁的 footer 不重複顯示銘謝連結

## 內容架構

- 文章：`src/content/articles/*.md`，檔名＝slug
- 自訂語法規格 `docs/spec/SPEC.md`，serializer `src/plugins/remark-custom.mjs`
- 語法不自行擴充，依指示
- 主題涵蓋狀態與已知源資料問題：`docs/README.md`
- 待補資料與待決事項記於 `TODO.md`，補齊即刪除該項

## 與 ntust.merlinkuo.tw 的關係

- 本站為獨立重新創作，不是其新版、續作、分支或接手維護
- 該站已授權本站使用內容與圖片素材；內容一律改寫，不原樣搬字
- 引用歷年問答只留日期與泛稱（「臺科學長姐」），不寫原始貼文者姓名
- 圖片自託管於 `public/images/<slug>/`，不熱鏈
- 站內不放指向該站的連結，也不寫「舊版／新版」式說明
- 例外為 `/thanks/`：具名致謝該站創辦人與五位貢獻者，只寫身分，不提對方域名、不放對方站連結

## 系別選擇器

- 清單 `src/lib/depts.mjs`，`all` 永遠第一
- 選擇存 `localStorage.dept`，預設 `all`；`<html data-dept>` 由 head 內 inline script 於繪製前設定
- 條件顯示語法 `:::dept{for="csie"}` 渲染為 `data-dept-only` ＋ CSS 顯隱；新增系別要同步補 `src/styles/markdown.css` 的顯隱規則
- 沒選過系別時顯示一次性提示，關閉或點開選單即寫入 `localStorage.deptHintDone`

## 行事曆

- 管線見 `.claude/skills/calendar-sync`，規則真相源為 `scripts/parse_ics.py` 的 docstring
- 人工正本 `docs/calendar/parsed/{學年}.json`，網站副本 `src/data/calendar-{113,114,115}.json`，三份同步
- 顯示當學年 ±1，資料載入 113–115
- 須顯示 `meta.parsedAt`

## 銘謝頁（`/thanks/`）

- 區塊順序：原始團隊 → 貢獻者。不設專案管理員區塊
- 卡片一律走 `src/components/PersonCard.astro`；`founder` prop 給 `Founder` 角標與淡紅底
- 人工資料 `src/data/credits.json`；`github` 留空字串者卡片不可點、頭像為空圓
- 貢獻者名單由 `src/lib/contributors.mjs` 於 build 時取得，不落地成檔案、不進 git
- fetch 只能放在 `src/lib/contributors.mjs`，不得寫回頁面 frontmatter
- API 失敗時該區塊退化為說明文字，build 不中斷
- 匿名 API 60 次/小時/IP；CI 用 `secrets.GITHUB_TOKEN`，Pages 端撞到 rate limit 才在 dashboard 加 `GITHUB_TOKEN`
- 第三方素材的授權聲明記在 `NOTICE`
- 頭像直連 `https://avatars.githubusercontent.com/<login>?s=160`，不經 `unavatar.io` 這類代理。這是第三方帳號頭像的唯一例外，內容圖片仍一律自託管
- 信箱只列 `docs/dump/about.md` 已載明的那幾位，其餘任何人一律不得補上
- 含 `mailto:` 的區塊必須包在 `<!--email_off-->` 內
- 名單過長時再拆 `/thanks/archive/`

## 工作流程

- 改 `astro.config.mjs` 或 `src/plugins/` 後：停 dev server → `rm -rf .astro node_modules/.astro node_modules/.vite` → 重啟
- client script 放 `src/scripts/*.ts`，`Base.astro` 只保留 import 與 `astro:page-load` 註冊
- client script 一律掛 `astro:page-load`，persist 元素用 `dataset.bound` 防重複綁定
- document 層級監聽器在模組頂層註冊一次，handler 內以 id 取當前元素
- `transition:persist` 的元素不得再加 `transition:name`，其 `view-transition-name` 寫在 CSS class 上
- `scroll-behavior` 不掛在 `html` 上，只在同頁錨點點擊時短暫掛 `.scroll-smooth`
- 檔案版本相關決策先以 context7 驗證
