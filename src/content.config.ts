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
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    category: z.enum(['course', 'life', 'info', 'misc']),
    tags: z.array(z.string()).default([]),
    description: z.string(),
    contributors: z
      .array(z.object({ name: z.string(), email: z.string() }))
      .default([]),
    order: z.number().default(99),
    updated: z.coerce.date(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
