# 臺科新生懶人包

給臺灣科技大學新生的開學前指南：選課、住宿、生活與資訊帳號整理，附三學年行事曆與系別專屬內容。

網站：<https://freshman.ntust.org>

本專案為獨立創作的開源網站，內容由在校生共同維護。校內制度年年變動、連結年年失效，因此我們把整份懶人包放在 GitHub 上：任何人都能回報錯誤或直接提交修正，讓它不依賴特定個人也能一屆一屆傳下去。

## 技術棧

| 項目 | 選用 |
|---|---|
| 框架 | Astro 7（純靜態產生，SSG） |
| 內容 | Markdown ＋ content collections（zod strict schema） |
| 語法擴充 | remark-directive ＋ 自寫 serializer（`src/plugins/`） |
| 導航 | View Transitions（ClientRouter） |
| 部署 | Cloudflare Pages |

執行期不依賴任何 UI 框架，互動一律以原生平台能力實作。

## 本機開發

需要 Node 22.12 以上（`.nvmrc` 指定 24）。

```bash
npm ci
npm run dev      # 開發伺服器
npm run build    # 產生靜態站台到 dist/
npm run preview  # 預覽 build 產物
```

修改 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 之後，**必須停掉 dev server、清除快取再重啟**：

```bash
rm -rf .astro node_modules/.astro node_modules/.vite
```

content layer 以內容 digest 快取渲染結果，快取實體在 `node_modules/.astro`。漏清它的話連 `npm run build` 都會吃到舊的 serializer 輸出。只改文章內容則不需要清。

## 專案結構

| 路徑 | 說明 |
|---|---|
| `src/content/articles/` | 文章正文，一篇一個 `.md`；schema 定義在 `src/content.config.ts` |
| `src/pages/` | 路由：首頁、`/article/[slug]`、404 |
| `src/layouts/Base.astro` | head 與 SEO、header、系別選擇器、全站 client script |
| `src/components/Calendar.astro` | 首頁行事曆 |
| `src/plugins/` | 自訂 Markdown serializer（directive 轉 HTML）與後處理 |
| `src/styles/` | tokens／global／markdown／article |
| `src/lib/depts.mjs` | 系別清單 |
| `src/data/calendar-*.json` | 網站用的行事曆資料（人工編輯正本在 `docs/calendar/parsed/`） |
| `public/icons/` | 全站 SVG 圖示，以 CSS mask 上色 |
| `public/images/<slug>/` | 文章圖片，一律自託管 |
| `scripts/parse_ics.py` | 校方行事曆 ics 轉 JSON |

## 文件

| 檔案 | 內容 |
|---|---|
| [貢獻](https://freshman.ntust.org/article/contribute/) | 貢獻指南：兩種修改方式的逐步教學、分支命名、送出前檢查清單（正文在 `src/content/articles/contribute.md`） |
| [`AGENTS.md`](AGENTS.md) | 專案最高行為準則：語言規範、設計語言、內容架構、Git 規範 |
| [`docs/spec/SPEC.md`](docs/spec/SPEC.md) | 自訂 Markdown 語法規格書 |
| [`docs/README.md`](docs/README.md) | 內容涵蓋狀態、已知源資料問題、改寫守則 |
| [`TODO.md`](TODO.md) | 待補資料與待決事項 |

## 貢獻

歡迎回報錯誤、補充內容、分享自己踩過的坑。

- 發現問題但不確定正確答案，或不方便自己動手改 → 開一則 [Issue](https://github.com/NTUST-OpenSource/freshman/issues)
- 已經知道怎麼修（錯字、失效連結、過期金額）→ 直接發 Pull Request

不會用 Git 也可以參與，錯字之類的小修改全程能在 GitHub 網頁上點擊完成。完整步驟、寫作守則與送出前檢查清單見網站上的 [貢獻](https://freshman.ntust.org/article/contribute/)。

## 貢獻者

完整名單見網站的[銘謝頁](https://freshman.ntust.org/thanks/)：原始團隊，以及自動更新的貢獻者網格。

## 授權

本專案以 [MIT License](LICENSE) 釋出。
