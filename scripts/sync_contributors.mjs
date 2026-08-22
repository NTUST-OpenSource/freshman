// GitHub 貢獻者同步：抓 contributors API、自託管頭像、產生網站資料與 README 區塊。
//
// 產出（三處，皆為可提交的檔案）：
//   1. src/data/contributors.json    網站銘謝頁的貢獻者網格
//   2. public/images/people/*.webp   貢獻者與現任管理員的頭像（160×160，自託管不熱鏈）
//   3. README.md 的 contributors 標記區塊  GitHub 專案頁上的名單
//
// 刻意不寫入產生時間：資料本身沒有時效語意，加了時間戳會讓每週排程都產生一筆無意義的
// commit。內容沒變就沒有 diff，workflow 那端也就不會提交。
//
// 用法：node scripts/sync_contributors.mjs
//   GITHUB_TOKEN  選填。未帶 token 時走匿名 API（每小時 60 次，本機手動跑足夠）
//   REPO          選填，預設 NTUST-OpenSource/freshman

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.REPO || 'NTUST-OpenSource/freshman';
const TOKEN = process.env.GITHUB_TOKEN || '';
const AVATAR_DIR = path.join(ROOT, 'public', 'images', 'people');
const AVATAR_PX = 160; // 顯示 80px，@2x 供高密度螢幕
const README_START = '<!-- contributors:start -->';
const README_END = '<!-- contributors:end -->';

/** ImageMagick 7 是 magick、6 是 convert；runner 與本機可能各有一種 */
function imageMagick() {
  for (const bin of ['magick', 'convert']) {
    try {
      execFileSync(bin, ['-version'], { stdio: 'ignore' });
      return bin;
    } catch {
      /* 換下一個 */
    }
  }
  throw new Error('找不到 ImageMagick（magick 或 convert），無法轉出 WebP 頭像');
}

async function api(pathname) {
  const res = await fetch(`https://api.github.com${pathname}`, {
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'freshman-contributors-sync',
      ...(TOKEN ? { authorization: `Bearer ${TOKEN}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${pathname} 回應 ${res.status} ${res.statusText}`);
  return res.json();
}

async function fetchContributors() {
  const out = [];
  for (let page = 1; page <= 10; page++) {
    const batch = await api(`/repos/${REPO}/contributors?per_page=100&page=${page}`);
    out.push(...batch);
    if (batch.length < 100) break;
  }
  // API 已依貢獻數由多到少排序；bot 不是人，不列入銘謝
  return out.filter((c) => c.type !== 'Bot' && !c.login.endsWith('[bot]'));
}

/** 下載頭像轉 WebP；內容與現有檔相同就不寫入，避免產生無意義 diff */
function writeAvatar(magick, login, bytes) {
  const file = path.join(AVATAR_DIR, `${login.toLowerCase()}.webp`);
  const tmp = path.join(AVATAR_DIR, `.${login.toLowerCase()}.src`);
  fs.writeFileSync(tmp, bytes);
  try {
    execFileSync(magick, [
      tmp,
      '-resize', `${AVATAR_PX}x${AVATAR_PX}^`,
      '-gravity', 'center',
      '-extent', `${AVATAR_PX}x${AVATAR_PX}`,
      '-strip',
      '-quality', '82',
      '-define', 'webp:method=6',
      file.replace(/\\/g, '/'),
    ]);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  return path.basename(file);
}

function renderReadmeBlock(people) {
  const perRow = 6;
  const rows = [];
  for (let i = 0; i < people.length; i += perRow) {
    const cells = people
      .slice(i, i + perRow)
      .map(
        (p) =>
          `<td align="center"><a href="${p.url}"><img src="${p.avatarUrl}&s=80" width="80" height="80" alt=""><br><sub>${p.login}</sub></a></td>`,
      )
      .join('');
    rows.push(`  <tr>${cells}</tr>`);
  }
  // README 走 GitHub 自家 CDN 的頭像：這裡不是本站頁面，不受自託管與 CSP 規則約束
  return `<table>\n${rows.join('\n')}\n</table>`;
}

function updateReadme(people) {
  const file = path.join(ROOT, 'README.md');
  const md = fs.readFileSync(file, 'utf8');
  const start = md.indexOf(README_START);
  const end = md.indexOf(README_END);
  if (start === -1 || end === -1) {
    console.warn(`README.md 找不到 ${README_START} / ${README_END} 標記，略過 README 更新`);
    return;
  }
  const next =
    md.slice(0, start + README_START.length) +
    `\n\n${renderReadmeBlock(people)}\n\n` +
    md.slice(end);
  if (next !== md) fs.writeFileSync(file, next);
}

const magick = imageMagick();
const credits = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'credits.json'), 'utf8'));
const maintainers = credits.terms.flatMap((t) => t.members).map((m) => m.github);
const contributors = await fetchContributors();

// 管理員的頭像也走同一條管線：他若哪天不在 contributors 名單裡，卡片仍然有圖
const wanted = new Map();
for (const c of contributors) wanted.set(c.login, c.avatar_url);
for (const login of maintainers) {
  if (wanted.has(login)) continue;
  const user = await api(`/users/${login}`);
  wanted.set(user.login, user.avatar_url);
}

fs.mkdirSync(AVATAR_DIR, { recursive: true });
const keep = new Set();
for (const [login, avatarUrl] of wanted) {
  const res = await fetch(`${avatarUrl}&s=${AVATAR_PX}`);
  if (!res.ok) throw new Error(`頭像下載失敗：${login} ${res.status}`);
  keep.add(writeAvatar(magick, login, Buffer.from(await res.arrayBuffer())));
}
// 已離開名單的人：頭像檔一併清掉，這個目錄完全由本腳本管理
for (const file of fs.readdirSync(AVATAR_DIR)) {
  if (file.endsWith('.webp') && !keep.has(file)) fs.rmSync(path.join(AVATAR_DIR, file));
}

const people = contributors.map((c) => ({
  login: c.login,
  url: c.html_url,
  avatar: `/images/people/${c.login.toLowerCase()}.webp`,
  avatarUrl: c.avatar_url,
}));

fs.writeFileSync(
  path.join(ROOT, 'src', 'data', 'contributors.json'),
  `${JSON.stringify(
    { repo: REPO, contributors: people.map(({ login, url, avatar }) => ({ login, url, avatar })) },
    null,
    2,
  )}\n`,
);
updateReadme(people);

console.log(`同步完成：${people.length} 位貢獻者，${keep.size} 張頭像`);
