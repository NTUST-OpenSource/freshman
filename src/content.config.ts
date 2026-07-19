import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const CATEGORIES = {
  course: { label: '選課', color: 'course' },
  life: { label: '生活', color: 'life' },
  info: { label: '資訊', color: 'info' },
  misc: { label: '其他', color: 'misc' },
} as const;

const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z
    .object({
      title: z.string(),
      slug: z.string().regex(/^[a-z0-9-]+$/, 'slug 僅允許小寫英數與連字號'),
      category: z.enum(['course', 'life', 'info', 'misc']),
      tags: z.array(z.string()).default([]),
      description: z.string(),
      contributors: z
        .array(z.object({ name: z.string(), email: z.email() }))
        .default([]),
      order: z.number().default(99),
      updated: z.coerce.date(),
      draft: z.boolean().default(false),
      noindex: z.boolean().default(false), // 上線但不進搜尋引擎（meta robots；sitemap 一併排除）
    })
    .strict(), // 未知欄位直接 build 失敗：darft 之類的筆誤不再靜默失效
});

export const collections = { articles };
