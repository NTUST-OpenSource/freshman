# TODO（待補資料與待決事項，補齊後移入已完成區）

## 待使用者確認

- [ ] 首頁與文章頁樣式驗收（內容與 md style 調整依使用者後續指示）
- [ ] 系別擴充：其餘系所英文代號（現有 all、csie）

## 待辦

- [ ] contribute 頁補完貢獻流程與聯絡方式（現為佔位稿，header 直連）
- [ ] DNS 綁定後：Cloudflare 設 `*.pages.dev` → `freshman.ntust.org` 301（`_redirects` 不支援跨網域比對，需在 dashboard 設 redirect rule）
- [ ] prototype 恢復 `draft: true`（現為臨時公開＋noindex，使用者指示之後取消註解）

## 明確延後（使用者指示）

- [ ] dark mode（現階段僅 white mode）

## 已完成（留檔備查）

- [x] 行動裝置自適應基線與驗收（320px 起；2026-07-19）
- [x] 動畫設計（首頁進場與互動動畫；2026-07-19）
- [x] 全專案對抗審查與修復（報告 `docs/review-2026-07-19.md`；2026-07-19）
- [x] 行事曆 110–115 全年份轉換、例外歸零、link 自動附加（2026-07-19）
- [x] `.claude/skills/calendar-sync` skill 建立
- [x] commit 英文重寫＋GPG 簽章驗證、AGENTS.md、logo/favicon、SVG 圖示去 emoji、
      全繁中、white mode 圓角、首頁行事曆、系別選擇器（2026-07-19）
