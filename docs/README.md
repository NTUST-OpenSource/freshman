# docs

| 目錄 | 內容 |
|---|---|
| `spec/` | 自訂 Markdown 語法規格書（`SPEC.md`）；全功能示範文章的正本＝`src/content/articles/prototype.md`（舊 `spec/prototype.md` 已因脫節刪除） |
| `dump/` | 外部參考站（ntust.merlinkuo.tw）23 頁內容的 Markdown 存檔＋站點結構（`_site.md`）＋抽取腳本（`notion2md.py`）。僅供主題涵蓋比對與借鑑改寫，**禁止直接複製**（兩專案關係見 AGENTS.md） |

## 主題涵蓋狀態

- [x] course-select（選課）— 與下列五篇合併重寫為單篇（115 學年資料），見 `src/content/articles/course-select.md`
- [x] chinese-course、english-course、general-education、physical-education、department-required — 併入選課篇（教授評價依決議不收錄）
- [x] dorm（住宿）— 併 115 新生說明會宿舍段與 Q&A 篇住宿繳費一題重寫，見 `src/content/articles/dorm.md`
- [x] about（參考站首頁）— 主題由新首頁與 start 涵蓋，不另行改寫
- [x] intro-ntust、account、tools、social-media、student-organization、pay、eating、transportation、clubs、trivia、other-question、exchange、q-and-a — 各自成篇
- [x] life（生活）＋ electronic-equipment（平板）— 合併為 `life.md`（校園生活：ATM、電子設備、貓）

全 23 篇主題已全數涵蓋。

## 已知源資料問題（處理結果）

- [x] `dump/article-eating.md`：goo.gl 短網址已於 2025/8 全面失效 → 改用 `google.com/maps/search/?api=1&query=` 形式，不再依賴短網址
- [x] `dump/article-clubs.md`：標題殘留筆誤、劍道社重複（#3、#5）→ 清單改為粗略分類呈現，去除重複與流水號
- [x] 各篇 `attachment:` 圖片為 Notion 內部附件 → 經授權後自靜態鏡像取得原圖，轉 WebP 自託管於 `public/images/<slug>/`
- [ ] `dump/article-dorm.md`：宿舍報修 Google 表單連結已失效（回 401）需新管道；Dcard 行李文連結有反爬（403）無法自動驗證

## 改寫守則

- 原生 HTML `<table>` 一律改寫為 GFM 表格（HTML 表格不會被包橫向捲動層，窄視窗會爆版）
- 圖片一律自託管於本站（不熱鏈 imgur 等外站），放在 `public/images/<slug>/`、統一轉 WebP
- 圖片尺寸由 `src/plugins/rehype-post.mjs` 於 build 時讀檔頭自動標上 `width`／`height`（避免 CLS），不需手寫
- 引用他人問答時只留日期與泛稱（如「臺科學長姐」），不寫入原始貼文者姓名
