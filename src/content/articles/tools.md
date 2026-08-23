---
title: 好用工具
slug: tools
category: info
tags: [工具, 資訊]
description: 學長姐做的課表轉日曆、GPA 計算機、GPA 分佈與課程評價，非官方但很好用
order: 3
updated: 2026-07-27
---

這裡列的都是**非學校官方**的工具，多數是學長姐無償做的。覺得好用的話，去 GitHub 給一顆星星是最便宜的回報方式。

:::info
非官方工具的資料來源與更新頻率不受學校保證，重要決策（例如畢業學分認定）請以官方系統與公告為準。
:::

## 課表轉日曆

把選課系統的課表變成 `.ics` 檔，匯入 Google 日曆、Apple 行事曆或任何支援的軟體，之後上課時間就會自動出現在手機上。

::card[NTUST Calendar Maker]{href="https://ntust-calendar-maker.zudo.cc/" desc="上傳課表網頁檔，產生可匯入通用日曆軟體的 .ics"}
::card[原始碼（GitHub）]{href="https://github.com/WuSandWitch/NTUST-Calendar-Maker" desc="WuSandWitch／NTUST-Calendar-Maker"}

![NTUST Calendar Maker 操作介面](/images/tools/calendar-maker.webp "填入開學與結業日期，上傳課表網頁檔即可下載 .ics")

用法很單純：填入該學期的**開學日與結業日**，上傳從課程系統另存的課表網頁檔（HTML），按下載即可。

![匯入日曆軟體之後的課表](/images/tools/calendar-result.webp "匯入之後，每週課程會自動排進行事曆")

:::tip
這個網站是純前端的，課表資料不會上傳到任何伺服器。當學期的開學與結業日期可以直接看首頁的行事曆。
:::

## GPA 計算機

輸入各等第的學分數，直接算出 GPA（4.3 制），要抓推甄門檻或估算能不能超修時很方便。

::card[GPA 計算機]{href="https://gpa-calculator.vicwen.app/" desc="GP 4.3 制，無須登入、純前端"}
::card[原始碼（GitHub）]{href="https://github.com/viiccwen/GPA-calculator" desc="viiccwen／GPA-calculator"}

## 選課研究

選課相關的工具在 [[course-select|選課]]那篇有更完整的用法說明，這裡先列出來：

::card[myNTUST]{href="https://myntust.com/" desc="查歷年 GPA 分佈、空教室、考古題"}
::card[CrossLink]{href="https://www.crosslink.tw/" desc="課程評價平台，修課前先看看別人怎麼說"}
::card[志願序助手]{href="https://github.com/NTUST-Tool/Course-order-assistant/" desc="依中籤機率計算志願序的最佳排法"}

## 公告推播

::card[臺科公佈欄 Telegram Bot]{href="https://t.me/NTUST_bulletin" desc="每天推播校內公佈欄新訊息，不用自己去刷網頁"}

## 官方常用網站

工具講完，順手把官方入口一起收在這裡：

| 網站 | 用途 |
|---|---|
| [臺科首頁](https://www.ntust.edu.tw/) | 各處室入口的起點 |
| [學生資訊系統](https://i.ntust.edu.tw/) | 選課、成績、學籍，詳見 [[account\|校園帳號]] |
| [WebMail](https://mail.ntust.edu.tw/) | 學校信箱 |
| [Moodle](https://moodle2.ntust.edu.tw/) | 課程教材與作業繳交 |
| [課程查詢系統](https://querycourse.ntust.edu.tw/) | 查課表、課程大綱、選課人數 |
| [選課系統](https://courseselection.ntust.edu.tw/) | 排志願序、加退選、加簽 |
| [臺科公佈欄](https://bulletin.ntust.edu.tw/p/403-1045-1391-1.php) | 校內公告（限校內連線） |
| [學生建言討論平台](https://suggestionbox.ntust.edu.tw/process_introduction) | 對校務有意見時的正式管道 |

:::tip
公佈欄限校內連線，在外面看不到。宿舍網路算校內，詳見 [[dorm|住宿]]的宿舍網路段。
:::
