---
name: rookie
description: 臺科新生懶人包的貢獻流程。當使用者用自然語言說想改網站哪裡（錯字、用字、過期資訊、失效連結、內容補充、版面問題），或直接輸入 /rookie 加上敘述時使用。一律先開 Issue；使用者願意動手才開分支、改檔、建 PR 到 dev 並關聯 Issue，最後盯審查到 5/5。
---

# 貢獻流程

使用者用中文說「哪一頁怎麼了」，照以下十步走完。repo `NTUST-OpenSource/freshman`。

GitHub 相關操作一律透過 `pr.py`（與本檔同目錄），它已處理好 base 分支、reviewer、審查狀態判定：

```bash
pr.py open --title T [--issue N] [--body B] [--label L]   # 建 PR 到 dev 並回報實際結果
pr.py status <PR>  [--watch] [--interval 秒] [--max 次]    # 5/5 且零未解決留言才 exit 0
pr.py threads <PR>                                        # 列出未解決留言與其 thread id
pr.py resolve <PR> --thread ID --reply "說明"              # 回覆並標記 resolved
```

## 1. 定位

把描述對到實際檔案：

- 文章正文 `src/content/articles/<slug>.md`，網址 `/article/<slug>/` 最後一段即檔名
- 行事曆走 `calendar-sync` skill；版面在 `src/styles/`、`src/layouts/`、`src/components/`；系別清單 `src/lib/depts.mjs`

用字類問題先 `grep -rn "台北" src/content/articles/` 確認影響範圍。專有名詞照抄原名（社團名「台灣科大佛學社」就是這樣註冊的）。對不到檔案就問使用者是哪一頁。

## 2. 開 Issue

一律先開，不管使用者打算不打算自己修。標題寫具體問題，內文指出哪一篇、哪一段，知道正確答案就附上。

```bash
gh issue create --repo NTUST-OpenSource/freshman --title T --label L --body B
```

label 從現有這組挑：`bug`（錯字、用字、失效連結、過期資訊）、`documentation`（補內容、新文章）、`enhancement`（新功能、版面）、`question`（提問）、`help wanted`（知道有問題但不知正確答案）、`good first issue`（適合新手接手）。

記下 Issue 編號。

## 3. 問使用者要不要順手修

說不要，或使用者講不出正確答案，就把 Issue 網址給他，到此結束。說要才往下。

## 4. 開分支

```bash
git fetch origin && git switch -c fix/dorm-taipei-typo origin/dev
```

分支名 `<type>/<簡短英文說明>`，type 與 commit 共用：`feat`、`fix`、`docs`、`refactor`、`perf`、`chore`、`ci`。沒有寫入權限先 `gh repo fork NTUST-OpenSource/freshman --remote --remote-name fork`。

## 5. 改檔

把該檔 frontmatter 的 `updated:` 改成今天。寫作規範：

- 繁體中文，標點全形，數字與英文半形，CJK 與數字或英文交界加一個半形空白
- 圖示用 `public/icons/` 的 SVG，圖片放 `public/images/<slug>/` 並轉 WebP
- 制度性內容標明學年；不確定的資訊寫「依當年最新公告為準」並附官方連結
- 引用他人問答只留日期與泛稱（「臺科學長姐」）
- 內容自己重寫

自訂語法見 `docs/spec/SPEC.md`，範例見 `src/content/articles/prototype.md`。

## 6. 建置

```bash
npm run build
```

動過 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 就先 `rm -rf .astro node_modules/.astro node_modules/.vite`。build 要綠燈才往下。

## 7. 本機 code review

```
/code-review
```

有 finding 就修完再往下。判定為誤判的記下理由，步驟 10 遇到同一件事直接引用。

## 8. Commit

遵循 [Conventional Commits](https://www.conventionalcommits.org/)，`type(Scope): description`，細節補 bullet。純英文，Scope 首字大寫，一件事一個 commit。

## 9. 開 PR

```bash
.claude/skills/rookie/pr.py open --issue 12 --label bug \
  --title "fix(Content): use the standard 臺 form in the dorm address sample" \
  --body "$(cat body.md)"
```

它會 push 當前分支、建 PR 到 `dev`、帶上 `Closes #12`、指定 reviewer，然後印出 PR 實際的 base、labels、reviewers 供核對。body 寫改了什麼、依據是什麼、驗證過什麼。

## 10. 盯審查到 5/5

**分數 5/5 且零未解決留言，兩個條件同時成立才算完成。** 明確告訴使用者這件事。

```bash
.claude/skills/rookie/pr.py status 17 --watch
```

以 `run_in_background` 執行，PASS 時 exit 0。`score` 為 `none` 代表這一版還沒有審查結果，push 之後出現 `none` 屬正常，等新審查落地。

沒過就這樣處理：

1. `pr.py threads 17` 取得每一則未解決留言與其 thread id
2. 判斷哪些真的要改，主動向使用者說明抓到什麼、打算怎麼修
3. 改完 commit、push 到同一分支，`--watch` 會接著印新分數
4. 修好的與判定為誤判的，都用 `pr.py resolve <PR> --thread ID --reply "說明"` 回覆並收掉

審查工具安裝之前就開好的 PR 不會自動審，在 PR 留一則 `@greptileai review` 觸發。

最後把 Issue 與 PR 兩個網址交給使用者。
