import fs from 'node:fs';
import path from 'node:path';

const REPO = 'NTUST-OpenSource/freshman';
/* not import.meta.url: the build bundles this module elsewhere, cwd stays the project root */
const CACHE = path.join(process.cwd(), 'node_modules', '.astro', 'contributors-cache.json');

let pending = null;

async function fromApi() {
  const token = process.env.GITHUB_TOKEN;
  const res = await fetch(`https://api.github.com/repos/${REPO}/contributors?per_page=100`, {
    headers: {
      accept: 'application/vnd.github+json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
  const list = await res.json();
  return list
    .filter((c) => c.type !== 'Bot' && !c.login.endsWith('[bot]'))
    .sort((a, b) => b.contributions - a.contributions || a.login.localeCompare(b.login))
    .map((c) => ({ login: c.login, url: c.html_url }));
}

/**
 * Returns null when there is no list to show at all.
 * Memoised per process: dev re-runs page frontmatter on every request, and the
 * anonymous API allows 60 calls an hour. The disk copy carries dev restarts.
 */
export function getContributors() {
  pending ??= fromApi()
    .then((list) => {
      fs.mkdirSync(path.dirname(CACHE), { recursive: true });
      fs.writeFileSync(CACHE, `${JSON.stringify(list)}\n`);
      return list;
    })
    .catch((err) => {
      console.warn(`[thanks] GitHub API unavailable: ${err}`);
      if (!fs.existsSync(CACHE)) return null;
      console.warn('[thanks] falling back to the cached contributor list');
      return JSON.parse(fs.readFileSync(CACHE, 'utf8'));
    });
  return pending;
}
