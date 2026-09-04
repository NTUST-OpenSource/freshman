<div align="center">
<a href="https://rookie.ntust.org">
  <img width="2000" src=".github/assets/banner.png" alt="臺科新生懶人包 Banner"/>
</a>
<br>

[![License](https://img.shields.io/github/license/NTUST-OpenSource/freshman?style=for-the-badge)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)

 **繁體中文** | [English](README-en.md)

</div>

## 總覽

臺科新生懶人包是一份由學生共同維護的新生指南

把選課、住宿、生活這些新生最容易卡住的事情整理在一起，以開源方式維護，任何人都能補上自己知道的那一塊

### **內容**
- **選課** — 從專有名詞認識到實戰技巧
- **生活** — 住宿、吃飯、交通、社團
- **資訊** — 校園帳號、繳費、好用工具、社群
- **其他** — 新生常見問題、臺科冷知識

### **特色**
- **系別專屬內容** — 同一篇文章依系別顯示直屬學長姐的建議
- **學年行事曆** — 取自[臺科行事曆](https://www.academic.ntust.edu.tw/p/404-1048-78935.php)，113 至 115 學年
- **人人可改** — 一篇文章就是一個 Markdown 檔，錯字在 GitHub 網頁上就能修

<br/>

## 快速開始

### 需求

- Node 22.12 以上（`.nvmrc` 指定 24）
- Python 3（可選，只有重新轉換行事曆 ics 時需要）

### 本機開發

```bash
git clone https://github.com/NTUST-OpenSource/freshman.git
cd freshman

npm ci
npm run dev      # 開發伺服器
npm run build    # 產生靜態站台到 dist/
npm run preview  # 預覽 build 產物
```

開啟 <http://localhost:4321>。

> [!IMPORTANT]
> 改過 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 之後，必須停掉 dev server、清除快取再重啟
>
> ```bash
> rm -rf .astro node_modules/.astro node_modules/.vite
> ```
>
> content layer 以內容 digest 快取渲染結果，快取實體在 `node_modules/.astro`。漏清它的話連 `npm run build` 都會吃到舊的 serializer 輸出。只改文章內容則不需要清。

### 行事曆

校方 ics 轉 JSON 由 `scripts/parse_ics.py` 完成，規則的真相源是它的 docstring。轉換流程與驗證步驟見 `.claude/skills/calendar-sync`。

<br/>

## 技術棧

| 項目 | 選用 |
|---|---|
| 框架 | Astro 7（SSG） |
| 內容 | Markdown ＋ content collections（zod strict schema） |
| 語法擴充 | remark-directive ＋ serializer（`src/plugins/`） |
| 導航 | View Transitions（ClientRouter） |
| 部署 | Cloudflare Pages |

### 專案結構

```
src/content/articles/     文章正文，一篇一個 .md，檔名即 slug
src/content.config.ts     frontmatter schema（zod strict）
src/pages/                路由：首頁、/article/[slug]、/thanks、404
src/layouts/Base.astro    head 與 SEO、header、系別選擇器、全站 script
src/components/           Calendar、PersonCard 等
src/plugins/              自訂 Markdown serializer（directive → HTML）與後處理
src/scripts/              client script，掛 astro:page-load
src/styles/               tokens / global / markdown / article
src/lib/                  depts（系別清單）、contributors（build 時抓 GitHub）
src/data/                 calendar-113~115.json、credits.json
public/icons/             全站 SVG 圖示，以 CSS mask 上色
public/images/<slug>/     文章圖片，一律自託管
scripts/parse_ics.py      校方行事曆 ics 轉 JSON
docs/                     語法規格書、行事曆正本、內容涵蓋狀態
```

<br/>

## 文件

| 檔案 | 內容 |
|---|---|
| [貢獻指南](https://rookie.ntust.org/article/contribute/) | 兩種修改方式的逐步教學、分支命名、送出前檢查清單（正文在 `src/content/articles/contribute.md`） |
| [`AGENTS.md`](AGENTS.md) | 專案最高行為準則：語言規範、設計語言、內容架構、Git 規範 |
| [`docs/spec/SPEC.md`](docs/spec/SPEC.md) | 自訂 Markdown 語法規格書 |
| [`docs/README.md`](docs/README.md) | 內容涵蓋狀態、已知源資料問題、改寫守則 |
| [`TODO.md`](TODO.md) | 待辦事項 |

<br/>

## 貢獻

歡迎回報錯誤、補充內容。完整貢獻者名單見網站的[銘謝頁](https://rookie.ntust.org/thanks/)。

- 發現問題但不確定正確答案，或不方便自己動手改，開一則 [Issue](https://github.com/NTUST-OpenSource/freshman/issues)
- 已經知道怎麼修（錯字、失效連結、過期金額），開一則 [Issue](https://github.com/NTUST-OpenSource/freshman/issues) 然後發 Pull Request 關聯到此 Issue

PR 送出前請確認

1. UI 文案、內容、文件一律繁體中文；程式碼註解一律英文
2. commit 遵循 [Conventional Commits](https://www.conventionalcommits.org/zh-hant/v1.0.0/)
3. 以 `feat/your-feature` 或 `fix/your-fix` 命名分支
4. 內容改動請附上來源或親身經驗，年度性資料（金額、費率、辦法連結）標明查證日期
5. 不使用 emoji

<br/>

## 授權

Copyright (C) 2026 NTUST-OpenSource contributors

本專案採用 **GNU Affero General Public License v3.0 或更新版本** 授權，完整條款見 [LICENSE](LICENSE)。第三方素材的授權見 [`NOTICE`](NOTICE)

<br/>

## 免責聲明

本專案與國立臺灣科技大學無官方關聯。內容由學生依經驗整理，實際規定、金額與時程一律以校方公告為準
