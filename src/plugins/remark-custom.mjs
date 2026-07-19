// 台科懶人包自訂 Markdown 語法 → HTML 映射（規格見 docs/spec/SPEC.md）
import fs from 'node:fs';
import path from 'node:path';
import { visit } from 'unist-util-visit';
import { DEPTS } from '../lib/depts.mjs';

const ARTICLES_DIR = path.resolve('src/content/articles');

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

let knownSlugs = null;
function articleSlugs() {
  if (!knownSlugs) {
    knownSlugs = new Set(
      fs.readdirSync(ARTICLES_DIR).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')),
    );
  }
  return knownSlugs;
}

export function remarkCustom() {
  let tabsCounter = 0;

  return (tree, file) => {
    // --- 行內自訂文法：[[wikilink]] 與 ==mark== ---
    visit(tree, 'text', (node, index, parent) => {
      if (!parent || parent.type === 'link') return;
      const parts = splitInline(node.value, file);
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
        node.children.unshift(el('h3', { className: ['qa__q'] }, label));
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
            'data-dept-label': `${dept.label}限定`,
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
        if (/^#[0-9a-fA-F]{3,8}$/.test(color)) props.style = `--steps-clr: ${color}`;
        const shape = (attrs.shape ?? '').trim();
        if (shape === 'square' || shape === 'diamond') props.className.push(`steps--${shape}`);
        node.data = { hName: 'div', hProperties: props };
      } else if (node.name === 'tabs') {
        tabs(node, tabsCounter++);
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
        const href = attrs.href ?? '#';
        let domain = '';
        try {
          domain = new URL(href).hostname;
        } catch {
          /* 保留空 domain */
        }
        const title = node.children.length ? [...node.children] : [text(domain || href)];
        const img = (attrs.img ?? '').trim();
        node.data = {
          hName: 'a',
          hProperties: {
            className: ['linkcard', ...(img ? ['linkcard--with-img'] : [])],
            href,
            target: '_blank',
            rel: ['noopener', 'noreferrer'],
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
        if (!id) return unknown(node);
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
        node.children = [...node.children, text('學年')];
      } else {
        // 不認得的 text directive（例如內文出現「文字:比例」）— 還原成純文字
        node.data = { hName: 'span', hProperties: {} };
        node.children = [text(`:${node.name}`), ...node.children];
      }
    }

    function unknown(node) {
      node.data = { hName: 'div', hProperties: { className: ['directive-unknown'] } };
      node.children.unshift(el('p', { className: ['directive-unknown__name'] }, [text(`未定義語法 :::${node.name}`)]));
    }
  };

  function tabs(node, n) {
    const groupId = `tabs-${n}`;
    const items = node.children.filter((c) => c.type === 'containerDirective' && c.name === 'tab');
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
      ...inputs,
      el('div', { className: ['tabs__bar'], role: 'tablist' }, labels),
      el('div', { className: ['tabs__panels'] }, panels),
    ];
  }

  function mermaid(node) {
    node.data = {
      hName: 'pre',
      hProperties: { className: ['mermaid'] },
      hChildren: [{ type: 'text', value: node.value }],
    };
  }
}

/** 把一個 text node 的值切成 [[wikilink]] / ==mark== 混合節點；無匹配回傳 null */
function splitInline(value, file) {
  const re = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]|==([^=\n]+)==/g;
  if (!re.test(value)) return null;
  re.lastIndex = 0;
  const parts = [];
  let last = 0;
  for (const m of value.matchAll(re)) {
    if (m.index > last) parts.push(text(value.slice(last, m.index)));
    if (m[1] !== undefined) {
      const slug = m[1].trim();
      if (!articleSlugs().has(slug)) {
        throw new Error(`[wikilink] 找不到文章 "${slug}"（於 ${file.path ?? '未知檔案'}）`);
      }
      parts.push({ type: 'link', url: `/article/${slug}/`, children: [text(m[2]?.trim() || slug)] });
    } else {
      parts.push({ type: 'emphasis', data: { hName: 'mark' }, children: [text(m[3])] });
    }
    last = m.index + m[0].length;
  }
  if (last < value.length) parts.push(text(value.slice(last)));
  return parts;
}
