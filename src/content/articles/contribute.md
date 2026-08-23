---
title: 貢獻
slug: contribute
category: info
tags: [導覽]
description: 本站以開源模式運作，人人皆可參與。回報壞掉的資訊，或直接動手把它修好
order: 98
updated: 2026-08-23
---

:::tip[不會寫程式？]
只要有 [GitHub](https://github.com/signup) 帳號，就可以與我們一起完善這個懶人包！
:::

## 開源是什麼？

**資訊過時了**、**連結又壞了？**

開源專案能夠直接被大家查看與修改，為了懶人包的存亡，懇請你伸出援手幫忙 dOuOb

:::steps
1. **好編輯**：用記事本就可以查看與修改
2. **好提案**：有 [GitHub](https://github.com/signup) 帳號就能提出修復與改進
3. **好把關**：經過核准確認後，新資訊才會出現在網頁中
4. **好歷程**：所有編輯皆有紀錄，感謝曾經[貢獻](/thanks/)的同學們
:::

## 可以貢獻什麼？

只要是對學弟妹有幫助的資訊，我們都歡迎

- **回報錯誤**：內容寫錯、連結失效、資訊已過期
- **補充內容**：講得不夠清楚、缺少了某些環節
- **技術改善**：版面最佳化、無障礙設計、效能調整
- **各系專屬資訊**：選課慣例、計算機要不要買等資訊

## 反映問題

發現網站有問題，加入 [Discord](https://discord.gg/k7NyDBmVPP) 傳訊息給我們，會用 GitHub 也可以直接開 [Issue](https://github.com/NTUST-OpenSource/freshman/issues)  
不確定是不是真的問題，也很歡迎直接向我們聯絡確認！我們會很感謝你的 QWQ

## 修復問題或貢獻

感謝你的舉手之勞，你的名字也會被留在[銘謝頁](/thanks/)中

不會寫程式也沒關係。打開你常用的 AI Agent（Claude Code、Codex 之類），貼上這段話然後跟他聊聊天

:::spoiler[展開後點右上角複製]
```text title="AI 初始化提示詞"
你是協助我向「臺科新生懶人包」提交貢獻的助理。請依序完成以下事項，需要我決定的地方先問我：

1. 檢查我的環境有沒有 git、gh、Node 22.12 以上與 Python 3。缺哪一個就看我的系統可用哪套件管理工具（winget、brew、apt），問過我再安裝。
2. 執行 gh auth status，沒登入就帶我跑 gh auth login。
3. 把 https://github.com/NTUST-OpenSource/freshman.git clone 下來，進入資料夾並切換到 dev 分支。
4. 讀完 ./AGENTS.md 後，問我要改什麼：網址是什麼、哪裡寫錯、想補上什麼內容。
5. 使用專案內的 .claude/skills/rookie，照它的流程完成後續工作。
```
:::

:::steps
1. **準備工具**：檢查 git、gh、Node、Python 是否可用
2. **登入 GitHub**：`gh auth login` 跑一次，之後開 Issue 與 PR 都靠它
3. **複製專案**：初始化專案並切到 `dev` 分支
4. **講出你想改什麼**：用中文講想要做的事情
5. **等待完成**：開 Issue、處理任務、建構與審查，最後送 PR 到 `dev`，可能需要數分鐘到數十分鐘
:::

<br/>

:::fatal[加入我們啊啊啊啊！]
**加入團隊**：如果你對專案有興趣，歡迎透過 [Discord](https://discord.gg/k7NyDBmVPP) 向我們聯絡！
:::
