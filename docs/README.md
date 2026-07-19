# docs

| 目錄 | 內容 |
|---|---|
| `spec/` | 自訂 Markdown 語法規格書（`SPEC.md`）與全功能示範文章（`prototype.md`，同步於 `src/content/articles/prototype.md`） |
| `dump/` | 舊站（ntust.merlinkuo.tw）全部 23 頁內容的 Markdown 存檔＋站點結構（`_site.md`）＋抽取腳本（`notion2md.py`）。新站內容至少需涵蓋這些 |

## 內容遷移狀態

- [x] course-select（選課）— 已轉新語法，見 `src/content/articles/`
- [ ] 其餘 21 篇待使用者規劃格式後遷移

## 已知源資料問題（遷移時需處理）

- `dump/article-eating.md`：goo.gl 短網址已於 2025/8 全面失效，地圖連結需重建
- `dump/article-clubs.md`：標題殘留筆誤「區塊弓道社絃韻吉他社…」、劍道社在清單中重複（#3、#5）
- 各篇 `attachment:` 開頭的圖片為 Notion 內部附件，無法直接取用（圖片一律重新製作，不遷移）
