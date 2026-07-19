// @ts-check
import fs from 'node:fs';
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import rehypeSlug from 'rehype-slug';
import rehypeExternalLinks from 'rehype-external-links';
import { transformerMetaHighlight } from '@shikijs/transformers';
import { remarkCustom } from './src/plugins/remark-custom.mjs';
import { rehypePost } from './src/plugins/rehype-post.mjs';

// 文章 frontmatter 的 updated/noindex 供 sitemap 使用（config 階段讀不到 content collection）
const articleMeta = Object.fromEntries(
  fs
    .readdirSync('./src/content/articles')
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const fm = fs.readFileSync(`./src/content/articles/${f}`, 'utf8').split(/^---$/m)[1] ?? '';
      return [
        fm.match(/^slug:\s*["']?([\w-]+)/m)?.[1] ?? f.replace(/\.md$/, ''),
        {
          updated: fm.match(/^updated:\s*(\S+)/m)?.[1],
          noindex: /^noindex:\s*true\b/m.test(fm),
        },
      ];
    }),
);
/** @param {string} url */
const articleSlugOf = (url) => url.match(/\/article\/([^/]+)\//)?.[1];

export default defineConfig({
  site: 'https://freshman.ntust.org',
  integrations: [
    sitemap({
      filter: (page) => !articleMeta[articleSlugOf(page) ?? '']?.noindex, // noindex 頁不進 sitemap
      serialize: (item) => {
        const updated = articleMeta[articleSlugOf(item.url) ?? '']?.updated;
        return updated ? { ...item, lastmod: new Date(updated).toISOString() } : item;
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkDirective, remarkCustom],
      rehypePlugins: [
        rehypeSlug,
        [rehypeExternalLinks, { target: '_blank', rel: ['noopener', 'noreferrer'] }],
        rehypePost,
      ],
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      defaultColor: false,
      transformers: [
        transformerMetaHighlight(),
        {
          name: 'code-title',
          pre(node) {
            const m = this.options.meta?.__raw?.match(/title="([^"]*)"/);
            if (m) node.properties['data-title'] = m[1];
          },
        },
        {
          name: 'line-numbers',
          pre(node) {
            if (/(^|\s)showLineNumbers(\s|$)/.test(this.options.meta?.__raw ?? '')) {
              node.properties['data-line-numbers'] = '';
            }
          },
        },
      ],
    },
  },
  vite: {
    // mermaid 預先打包，避免 dev 首次載入時 optimize dep 504
    optimizeDeps: { include: ['mermaid'] },
    // 不內聯小型 module script：CSP 只需固定 hash 一支 is:inline（dept 初始化），改碼不破 CSP
    build: { assetsInlineLimit: 0 },
  },
});
