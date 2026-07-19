// 臺科懶人包自訂 Markdown 語法 → HTML 映射（規格見 docs/spec/SPEC.md）
import fs from 'node:fs';
import { visit } from 'unist-util-visit';
import { DEPTS } from '../lib/depts.mjs';

// 以本檔位置定位（cwd 無關）；wikilink 驗證＝frontmatter slug 且排除 draft，
// 與路由（[slug].astro 的 getStaticPaths）同一套規則，不快取以免 dev 新增文章後誤報
const ARTICLES_DIR = new URL('../content/articles/', import.meta.url);

const CALLOUT_TYPES = {
  info: '補充',
  tip: '小撇步',
  warning: '注意',
  danger: '警告',
  fatal: '重大',
};

/** 建立帶 hast 資訊的節點（type 用 paragraph 當載體，hName 會覆蓋輸出標籤） */
const el = (hName, hProperties = {}, children = []) => ({
  type: 'paragraph',
  children,
  data: { hName, hProperties },
});

const text = (value) => ({ type: 'text', value });

/** 取出 directive 的 [label]（第一個 directiveLabel 段落），回傳其 inline children */
function takeLabel(node) {
  const first = node.children[0];
  if (first?.data?.directiveLabel) {
    node.children.shift();
    return first.children;
  }
  return null;
}

function articleSlugs() {
  const slugs = new Set();
  for (const f of fs.readdirSync(ARTICLES_DIR)) {
    if (!f.endsWith('.md')) continue;
    const fm = fs.readFileSync(new URL(f, ARTICLES_DIR), 'utf8').split(/^---$/m)[1] ?? '';
    if (/^draft:\s*true\b/m.test(fm)) continue; // prod 不出該頁，連向它就是死鏈
    const m = fm.match(/^slug:\s*["']?([\w-]+)/m);
    if (m) slugs.add(m[1]);
  }
  return slugs;
}

export function remarkCustom() {
  let tabsCounter = 0;

  return (tree, file) => {
    // --- 行內自訂文法：[[wikilink]] 與 ==mark== ---
    // 連結文字內仍解析 ==mark==，僅 wikilink 保持字面（避免巢狀連結）
    visit(tree, 'text', (node, index, parent) => {
      if (!parent) return;
      const parts = splitInline(node.value, file, { wikilink: parent.type !== 'link' });
      if (parts) parent.children.splice(index, 1, ...parts);
    });

    // --- directive 映射 ---
    visit(tree, (node) => {
      if (node.data?.hName) return; // 已處理（如 tabs 內的 tab）
      if (node.type === 'containerDirective') container(node);
      else if (node.type === 'leafDirective') leaf(node);
      else if (node.type === 'textDirective') inline(node);
      else if (node.type === 'code' && node.lang === 'mermaid') mermaid(node);
    });

    function container(node) {
      const attrs = node.attributes ?? {};
      const type = node.name === 'critical' ? 'fatal' : node.name; // critical 為 fatal 別名
      if (type in CALLOUT_TYPES) {
        const label = takeLabel(node);
        node.data = { hName: 'aside', hProperties: { className: ['callout', `callout--${type}`] } };
        node.children.unshift(
          el('p', { className: ['callout__title'] }, label ?? [text(CALLOUT_TYPES[type])]),
        );
      } else if (node.name === 'spoiler') {
        const label = takeLabel(node) ?? [text('點我展開')];
        node.data = {
          hName: 'details',
          hProperties: { className: ['spoiler'], ...('open' in attrs ? { open: true } : {}) },
        };
        node.children.unshift(el('summary', { className: ['spoiler__summary'] }, label));
      } else if (node.name === 'qa') {
        const label = takeLabel(node) ?? [text('Q')];
        node.data = { hName: 'section', hProperties: { className: ['qa'] } };
        // 非 h3：qa 問題不得混入右側目錄（Astro 內建收集器抓所有 heading），SR 靠 role 取得層級
        node.children.unshift(el('p', { className: ['qa__q'], role: 'heading', ariaLevel: 3 }, label));
        const meta = [attrs.by, attrs.date].filter(Boolean).join(' · ');
        if (meta) node.children.push(el('footer', { className: ['qa__meta'] }, [text(meta)]));
      } else if (node.name === 'dept') {
        const code = (attrs.for ?? '').trim();
        const dept = DEPTS.find((d) => d.code === code && d.code !== 'all');
        if (!dept) return unknown(node);
        node.data = {
          hName: 'div',
          hProperties: {
            className: ['dept-block'],
            'data-dept-only': code,
            'data-dept-label': `${dept.label}`,
          },
        };
      } else if (node.name === 'table') {
        // 表格包裝：:::table{vlines} 顯示垂直框線
        const cls = ['table-scroll'];
        if ('vlines' in attrs) cls.push('table--vlines');
        node.data = { hName: 'div', hProperties: { className: cls } };
      } else if (node.name === 'steps') {
        const props = { className: ['steps'] };
        const color = (attrs.color ?? '').trim();
        // 3/4/6/8 碼合法 hex；{3,8} 會放行 5、7 碼使 color-mix 整條失效
        if (/^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(color)) {
          props.style = `--steps-clr: ${color}`;
        }
        const shape = (attrs.shape ?? '').trim();
        if (shape === 'square' || shape === 'diamond') props.className.push(`steps--${shape}`);
        node.data = { hName: 'div', hProperties: props };
      } else if (node.name === 'tabs') {
        tabs(node, tabsCounter++, file);
      } else if (node.name === 'tab') {
        // 落單的 tab（不在 tabs 內）— 當一般區塊呈現
        node.data = { hName: 'div', hProperties: { className: ['tabs__panel'] } };
      } else {
        unknown(node);
      }
    }

    function leaf(node) {
      const attrs = node.attributes ?? {};
      if (node.name === 'card') {
        const href = (attrs.href ?? '').trim();
        if (!href) return unknown(node); // 缺 href 不再靜默輸出 "#"
        let domain = '';
        let external = false;
        try {
          const url = new URL(href);
          if (!/^https?:$/.test(url.protocol)) return unknown(node); // 擋 javascript: 等 scheme
          domain = url.hostname;
          external = true;
        } catch {
          if (!href.startsWith('/')) return unknown(node); // 僅接受絕對 URL 或站內路徑
        }
        const title = node.children.length ? [...node.children] : [text(domain || href)];
        const img = (attrs.img ?? '').trim();
        node.data = {
          hName: 'a',
          hProperties: {
            className: ['linkcard', ...(img ? ['linkcard--with-img'] : [])],
            href,
            ...(external ? { target: '_blank', rel: ['noopener', 'noreferrer'] } : {}),
          },
        };
        node.children = [
          el('span', { className: ['linkcard__body'] }, [
            el('span', { className: ['linkcard__title'] }, title),
            ...(attrs.desc ? [el('span', { className: ['linkcard__desc'] }, [text(attrs.desc)])] : []),
            ...(domain ? [el('span', { className: ['linkcard__domain'] }, [text(domain)])] : []),
          ]),
          ...(img
            ? [el('img', { className: ['linkcard__img'], src: img, alt: '', loading: 'lazy' })]
            : []),
        ];
      } else if (node.name === 'yt') {
        const id = attrs.id;
        if (!id || !/^[\w-]{11}$/.test(id)) return unknown(node); // YouTube id 固定 11 碼
        const title = attrs.title ?? 'YouTube 影片';
        node.data = {
          hName: 'a',
          hProperties: {
            className: ['yt'],
            href: `https://www.youtube.com/watch?v=${id}`,
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
            'data-yt-id': id,
          },
        };
        node.children = [
          el('img', {
            className: ['yt__thumb'],
            src: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            alt: title,
            loading: 'lazy',
            width: 480,
            height: 360,
          }),
          el('span', { className: ['yt__play'], ariaHidden: 'true' }),
          el('span', { className: ['yt__title'] }, [text(title)]),
        ];
      } else {
        unknown(node);
      }
    }

    function inline(node) {
      if (node.name === 'kbd') {
        node.data = { hName: 'kbd', hProperties: {} };
      } else if (node.name === 'year') {
        node.data = { hName: 'span', hProperties: { className: ['year-chip'] } };
        node.children = [...node.children, text(' 學年')]; // CJK 與數字交界半形空白
      } else {
        // 不認得的 text directive（例如內文出現「文字:比例」）— 連同方括號與屬性還原原文
        const attrStr = Object.entries(node.attributes ?? {})
          .map(([k, v]) => (v === '' ? k : `${k}="${v}"`))
          .join(' ');
        const hasLabel = node.children.length > 0;
        node.data = { hName: 'span', hProperties: {} };
        node.children = [
          text(`:${node.name}${hasLabel ? '[' : ''}`),
          ...node.children,
          ...(hasLabel ? [text(']')] : []),
          ...(attrStr ? [text(`{${attrStr}}`)] : []),
        ];
      }
    }

    function unknown(node) {
      // 冒號數依 directive 型別（::: 容器、:: leaf、: 行內），錯誤訊息才不誤導
      const colons = { containerDirective: ':::', leafDirective: '::', textDirective: ':' }[node.type] ?? ':::';
      const label = `${colons}${node.name}`;
      if (process.env.NODE_ENV === 'production') {
        // 除錯框只給 dev；production 出現未定義語法直接擋 build，與 wikilink 同嚴格度
        throw new Error(`[directive] 未定義語法 ${label}（於 ${file.path ?? '未知檔案'}）`);
      }
      node.data = { hName: 'div', hProperties: { className: ['directive-unknown'] } };
      node.children.unshift(el('p', { className: ['directive-unknown__name'] }, [text(`未定義語法 ${label}`)]));
    }
  };

  function tabs(node, n, file) {
    const groupId = `tabs-${n}`;
    const isTab = (c) => c.type === 'containerDirective' && c.name === 'tab';
    const items = node.children.filter(isTab);
    if (items.length > 6) {
      // CSS 的 :has 選中規則只列舉到 6 個分頁，超過會靜默空白
      throw new Error(`[tabs] 最多 6 個分頁（收到 ${items.length}，於 ${file?.path ?? '未知檔案'}）`);
    }
    // 非 tab 的子節點（誤放的段落等）保留在分頁列上方，不靜默丟棄；[label] 除外
    const others = node.children.filter((c) => !isTab(c) && !c.data?.directiveLabel);
    const inputs = [];
    const labels = [];
    const panels = [];
    items.forEach((tab, i) => {
      const label = takeLabel(tab) ?? [text(`Tab ${i + 1}`)];
      const id = `${groupId}-${i}`;
      inputs.push(
        el('input', {
          type: 'radio',
          name: groupId,
          id,
          className: ['tabs__radio'],
          ...(i === 0 ? { checked: true } : {}),
        }),
      );
      labels.push(el('label', { htmlFor: id, className: ['tabs__label'] }, label));
      tab.data = { hName: 'div', hProperties: { className: ['tabs__panel'] } };
      panels.push(tab);
    });
    node.data = { hName: 'div', hProperties: { className: ['tabs'] } };
    node.children = [
      ...others,
      ...inputs,
      // 無 role="tablist"：子元素是 label 非 tab，掛了反而違反 ARIA 結構（radio group 語意已足）
      el('div', { className: ['tabs__bar'] }, labels),
      el('div', { className: ['tabs__panels'] }, panels),
    ];
  }

  function mermaid(node) {
    // 整個節點換成 paragraph 載體：code 節點掛 hName 會輸出巢狀 <pre><pre>（無效 HTML）
    Object.assign(node, {
      type: 'paragraph',
      children: [],
      value: undefined,
      data: {
        hName: 'pre',
        hProperties: { className: ['mermaid'] },
        hChildren: [{ type: 'text', value: node.value }],
      },
    });
  }
}

/** 把一個 text node 的值切成 [[wikilink]] / ==mark== 混合節點；無匹配回傳 null */
function splitInline(value, file, opts = { wikilink: true }) {
  // mark 內容允許單一 =（如「上限=25」），=(?!=) 擋住跨界吃到下一個標記
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|==((?:[^=\n]|=(?!=))+)==/g;
  if (!re.test(value)) return null;
  re.lastIndex = 0;
  const parts = [];
  let last = 0;
  for (const m of value.matchAll(re)) {
    if (m.index > last) parts.push(text(value.slice(last, m.index)));
    if (m[1] !== undefined) {
      if (!opts.wikilink) {
        parts.push(text(m[0])); // 已在連結內：wikilink 保持字面
      } else {
        const slug = m[1].trim();
        if (!articleSlugs().has(slug)) {
          throw new Error(`[wikilink] 找不到文章 "${slug}"（於 ${file.path ?? '未知檔案'}）`);
        }
        parts.push({ type: 'link', url: `/article/${slug}/`, children: [text(m[2]?.trim() || slug)] });
      }
    } else {
      parts.push({ type: 'emphasis', data: { hName: 'mark' }, children: [text(m[3])] });
    }
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push(text(value.slice(last)));
  return parts;
}
