<div align="center">

<a href="https://rookie.ntust.org/">

# 臺科新生懶人包

</a>

[![License](https://img.shields.io/github/license/NTUST-OpenSource/freshman?style=for-the-badge)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)

</div>

## 總覽

<a href="https://rookie.ntust.org/">

<img align="right" width="420" alt="臺科新生懶人包首頁" src=".github/assets/hero.png" />

</a>

**臺科新生懶人包** 是由多位學生共同維護的指南
將選課、住宿、生活等新生常感到困惑事情整理在一起
以開源的精神，所有人都能為此盡一份心力

### 內容

- **選課** — 志願序、加退選、加簽，從專有名詞到實戰技巧
- **生活** — 住宿、吃飯、交通、社團、校園生活
- **資訊** — 校園帳號、繳費、好用工具、系學會與社群
- **其他** — 新生常見問題、臺科冷知識、Q&A、國外交換

### 特色

- **系別專屬內容** — 了解直屬學長姐們的建議
- **學年行事曆** — 取自[臺科行事曆](https://www.academic.ntust.edu.tw/p/404-1048-78935.php)
- **人人可改** — 一篇文章就是一個 Markdown 檔，錯字在 GitHub 網頁上就能修

<br clear="right"/>

## 技術棧

| 項目 | 選用 |
|---|---|
| 框架 | Astro 7（純靜態產生，SSG） |
| 內容 | Markdown ＋ content collections（zod strict schema） |
| 語法擴充 | remark-directive ＋ 自寫 serializer（`src/plugins/`） |
| 導航 | View Transitions（ClientRouter） |
| 部署 | Cloudflare Pages |

## 開發環境建置

### 需求

- Node 22.12 以上（`.nvmrc` 指定 24）
- Python 3（只有要重新轉換行事曆 ics 時需要）

### 本機開發

```bash
git clone https://github.com/NTUST-OpenSource/freshman.git
cd freshman

npm ci
npm run dev      # 開發伺服器
npm run build    # 產生靜態站台到 dist/
npm run preview  # 預覽 build 產物
```

> 改過 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 之後，**必須停掉 dev server、清除快取再重啟**：
>
> ```bash
> rm -rf .astro node_modules/.astro node_modules/.vite
> ```
>
> content layer 以內容 digest 快取渲染結果，快取實體在 `node_modules/.astro`。漏清它的話連 `npm run build` 都會吃到舊的 serializer 輸出。只改文章內容則不需要清。

## 專案架構

```
freshman/
├── src/
│   ├── content/articles/        # 文章正文，一篇一個 .md，檔名即 slug
│   ├── content.config.ts        # frontmatter schema（zod strict）
│   ├── pages/                   # 路由：首頁、/article/[slug]、/thanks、404
│   ├── layouts/Base.astro       # head 與 SEO、header、系別選擇器、全站 script
│   ├── components/              # Calendar、PersonCard 等
│   ├── plugins/                 # 自訂 Markdown serializer（directive → HTML）與後處理
│   ├── scripts/                 # client script，掛 astro:page-load
│   ├── styles/                  # tokens / global / markdown / article
│   ├── lib/                     # depts（系別清單）、contributors（build 時抓 GitHub）
│   └── data/                    # calendar-113~115.json、credits.json
├── public/
│   ├── icons/                   # 全站 SVG 圖示，以 CSS mask 上色
│   └── images/<slug>/           # 文章圖片，一律自託管
├── scripts/parse_ics.py         # 校方行事曆 ics 轉 JSON
└── docs/
    ├── spec/SPEC.md             # 自訂 Markdown 語法規格書
    └── calendar/parsed/         # 行事曆人工正本
```

## 文件

| 檔案 | 內容 |
|---|---|
| [貢獻指南](https://rookie.ntust.org/article/contribute/) | 兩種修改方式的逐步教學、分支命名、送出前檢查清單（正文在 `src/content/articles/contribute.md`） |
| [`AGENTS.md`](AGENTS.md) | 專案最高行為準則：語言規範、設計語言、內容架構、Git 規範 |
| [`docs/spec/SPEC.md`](docs/spec/SPEC.md) | 自訂 Markdown 語法規格書 |
| [`docs/README.md`](docs/README.md) | 內容涵蓋狀態、已知源資料問題、改寫守則 |
| [`TODO.md`](TODO.md) | 待辦事項 |

## 貢獻

完整貢獻者名單見網站的[銘謝頁](https://rookie.ntust.org/thanks/)。

歡迎回報錯誤、補充內容。

- 發現問題但不確定正確答案，或不方便自己動手改，開一則 [Issue](https://github.com/NTUST-OpenSource/freshman/issues)
- 已經知道怎麼修（錯字、失效連結、過期金額），開一則 [Issue](https://github.com/NTUST-OpenSource/freshman/issues) 然後發 Pull Request 關聯到此 Issue 

PR 送出前請確認

1. UI 文案、內容、文件一律繁體中文；程式碼註解一律英文
2. commit 遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/)
3. 以 `feat/your-feature` 或 `fix/your-fix` 命名分支
4. 內容改動請附上來源或親身經驗，年度性資料（金額、費率、辦法連結）標明查證日期
5. 不使用 emoji


## 授權

本專案以 [GNU Affero General Public License v3.0](LICENSE) 釋出。第三方素材的授權見 [`NOTICE`](NOTICE)。
