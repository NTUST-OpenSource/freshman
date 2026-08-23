---
name: rookie
description: 臺科新生懶人包的貢獻流程。當使用者用自然語言說想改網站哪裡（錯字、用字、過期資訊、失效連結、內容補充、版面問題），或直接輸入 /rookie 加上敘述時使用。一律先開 Issue；使用者願意動手才開分支、改檔、建 PR 到 dev 並關聯 Issue，最後盯 Greptile 審查到 5/5。
---

# 貢獻流程

寫給不熟 Git 的使用者。使用者只要用中文說「哪一頁怎麼了」，其餘由本流程完成。

repo：`NTUST-OpenSource/freshman`，PR 一律 target `dev`，reviewer 一律 `xinshoutw`。

## 0. 前置檢查

```bash
gh auth status                                            # 未登入就請使用者跑 gh auth login
gh repo view NTUST-OpenSource/freshman --json viewerPermission
```

`viewerPermission` 是 `WRITE` / `MAINTAIN` / `ADMIN` 才能直接推分支，其餘一律走 fork（見步驟 4）。

## 1. 定位問題

把使用者的描述對到實際檔案，不要憑印象猜：

- 文章正文：`src/content/articles/<slug>.md`，網址 `/article/<slug>/` 的最後一段即檔名
- 行事曆：`docs/calendar/parsed/{學年}.json` 為正本，改動要走 `calendar-sync` skill
- 版面與樣式：`src/styles/`、`src/layouts/Base.astro`、`src/components/`
- 系別清單：`src/lib/depts.mjs`

用字類問題（例如「台北」應寫作「臺北」）先 grep 全域，確認影響範圍再決定是一處還是全站：

```bash
grep -rn "台北" src/content/articles/
```

專有名詞照抄原名，不套用字規則（社團名「台灣科大佛學社」就是這樣註冊的，不要改）。

找不到對應檔案就回頭問使用者是哪一頁，不要自己編一個。

## 2. 一律先開 Issue

**不管使用者打算不打算自己修，都先開 Issue。** 這是留紀錄，也讓別人知道有人在處理。

```bash
gh issue create --repo NTUST-OpenSource/freshman \
  --title "住宿篇的地址範例把「臺北」寫成「台北」" \
  --label bug \
  --body '## 問題

`src/content/articles/dorm.md` 第 135 行的地址寫法範例使用「台北市」。

## 建議

全站用字統一為「臺」，此處應為「臺北市」。

## 影響範圍

`grep -rn "台北" src/content/articles/` 共 4 處（dorm 1、prototype 3）。'
```

標題寫**具體問題**，不要寫「有問題」。內文指出**哪一篇、哪一段**，知道正確答案就一併附上。

label 從 repo 現有這組挑，不要自創：

| 情況 | label |
|---|---|
| 錯字、用字、失效連結、過期資訊、寫錯 | `bug` |
| 補充內容、改寫、新增文章、文件 | `documentation` |
| 新功能、版面調整、無障礙與效能 | `enhancement` |
| 只是提問或不確定該不該改 | `question` |
| 知道有問題但不知道正確答案 | `help wanted` |
| 改動單純、適合第一次貢獻的人接手 | `good first issue` |

記下回傳的 Issue 編號，步驟 9 要用。

## 3. 問使用者要不要順手修

Issue 開完後問一句：「要不要順便把它修掉、直接開 PR？」

- **不要** → 到此為止。把 Issue 網址給使用者，告訴他之後有人會接手。
- **要** → 往下走。

使用者說不清楚正確答案的時候，不要硬修，停在 Issue 就好。

## 4. 開分支

從 `dev` 開，不要在 `main` 或 `dev` 上直接動手。

```bash
git fetch origin
git switch -c fix/dorm-taipei-typo origin/dev
```

分支名為 `<type>/<簡短英文說明>`，後半小寫英文加連字號。type 與 Conventional Commits 共用同一組：`feat`、`fix`、`docs`、`refactor`、`perf`、`chore`、`ci`。

沒有寫入權限的話先 fork：

```bash
gh repo fork NTUST-OpenSource/freshman --remote --remote-name fork
```

## 5. 改檔

動到內容就把該檔 frontmatter 的 `updated:` 改成今天。

寫作規範（違反會被退，其中三項會直接讓 build 失敗）：

- 繁體中文，標點全形，數字與英文字母半形，CJK 與數字／英文交界加一個半形空白
- **禁用 emoji**，圖示一律用 `public/icons/` 底下的 SVG
- 制度性內容標明學年（例如「115 學年度」）
- 不確定的資訊寫「依當年最新公告為準」並附官方連結
- 引用他人問答只留日期與泛稱（「臺科學長姐」），不寫原始貼文者姓名
- 內容必須自己重寫，不得複製他站字句
- 圖片放 `public/images/<slug>/` 並轉 WebP，不熱鏈外站
- build 失敗地雷：區塊名稱打錯（`:::tipp`）、`[[slug]]` 指向不存在或草稿文章、frontmatter 出現不存在的欄位、`slug` 重複或含大寫、`::card` 缺 `href`

自訂語法全文見 `docs/spec/SPEC.md`，實際範例見 `src/content/articles/prototype.md`。

## 6. 驗證

推之前一定要跑，這是唯一能擋下語法地雷的關卡：

```bash
npm ci        # 只有第一次或 package.json 變動時需要
npm run build
```

改過 `astro.config.mjs`、`src/plugins/` 或 `src/content.config.ts` 的話，build 前先清快取：

```bash
rm -rf .astro node_modules/.astro node_modules/.vite
```

build 不過就修到過，不要把紅燈推上去。

## 7. 本機 code review

**PR 開出去之前一定要先在本機審過。** 不要把 Greptile 抓得到的東西留給 Greptile 抓，那只會讓分數卡在 4/5 然後多繞一輪。

```
/code-review
```

處理原則：

- 有 finding 就修完再往下，不要帶著紅字開 PR
- 判斷為誤判的，記下理由，步驟 9 寫進 PR body，Greptile 提同一件事時直接引用
- 改的是文章內容而非程式碼時，改對照步驟 5 的寫作規範自查一遍：全形標點、半形空白、無 emoji、學年標註、`updated` 日期

## 8. Commit 與推送

commit 訊息遵循 [Conventional Commits](https://www.conventionalcommits.org/)，格式 `type(Scope): description`，需要細節就在下面補 bullet。**一律純英文**，Scope 首字大寫是本專案慣例。一件事一個 commit，不要把數項修改塞成一筆。不加 `Co-Authored-By` 之類的 trailer。

```bash
git commit -m 'fix(Content): use the standard 臺 form in the dorm address sample

- the address example wrote 台北市 while the rest of the site uses 臺北市'

git push -u origin fix/dorm-taipei-typo      # fork 的話推到 fork remote
```

## 9. 建 PR

base 一律 `dev`。GitHub 預設會指向 `main`，這步最容易錯。

```bash
gh pr create --repo NTUST-OpenSource/freshman \
  --base dev \
  --title "fix(Content): use the standard 臺 form in the dorm address sample" \
  --reviewer xinshoutw \
  --label bug \
  --body 'Closes #12

## 改了什麼

`src/content/articles/dorm.md` 的地址範例「台北市」改為「臺北市」。

## 依據

全站用字統一為「臺」，其餘文章皆為「臺北」。

## 驗證

`npm run build` 通過。'
```

label 沿用 Issue 那顆。作者本人就是 `xinshoutw` 的時候要拿掉 `--reviewer`：GitHub 不接受自己指派自己審查，而且 `gh` 不會報錯，是**靜默忽略**，事後看起來就像指定成功但 reviewer 是空的。

`Closes #N` 建立與 Issue 的關聯；因為 repo 的預設分支是 `main`，合進 `dev` 時 Issue 還不會自動關閉，等 `dev` 併進 `main` 才會。這是預期行為，不用改寫法。

## 10. 盯 Greptile 到 5/5

PR 一開，Greptile 會自動觸發審查並給一個信心分數。**只有 5/5 且沒有未處理的留言，才算提交完成。** 要明確告訴使用者這件事，不要開完 PR 就說「好了」。

開背景 shell 輪詢，不要讓使用者自己去按重新整理：

```bash
PR=<PR 編號>
for i in $(seq 1 60); do
  body=$(gh pr view "$PR" --repo NTUST-OpenSource/freshman --json comments,reviews \
    --jq '[(.comments[]?, .reviews[]?) | select(((.author.login // "") | ascii_downcase) | contains("greptile"))] | last // {} | .body // ""')
  score=$(printf '%s' "$body" | grep -oiE 'confidence score[^0-9]*[0-9]+/5' | tail -1)
  printf '[%s] %s\n' "$i" "${score:-waiting for greptile}"
  printf '%s\n' "$body" | tail -60
  case "$score" in *5/5*) echo GREPTILE_PASS; exit 0;; esac
  sleep 60
done
echo GREPTILE_TIMEOUT
```

以 `run_in_background` 執行。它印出的是 Greptile 最新那則留言全文，分數低於 5/5 時：

1. 讀留言指出的問題，判斷哪些是真的要改（Greptile 也會誤判，不要照單全收）
2. 主動向使用者說明它抓到什麼、你打算怎麼修，改完 commit 並 push 到同一個分支
3. push 後 Greptile 會重審，輪詢會接著印新分數，重複直到 `GREPTILE_PASS`
4. 判斷為誤判的項目，在 PR 留言說明理由，不要默默略過

最後把 Issue 與 PR 兩個網址交給使用者。
