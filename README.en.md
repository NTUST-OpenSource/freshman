<div align="center">

# [NTUST Freshman Guide](https://rookie.ntust.org/)

[![License](https://img.shields.io/github/license/NTUST-OpenSource/freshman?style=for-the-badge)](LICENSE)
[![Astro](https://img.shields.io/badge/Astro-7-BC52EE?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)

[繁體中文](README.md) | **English**

</div>

## Overview

<a href="https://rookie.ntust.org/">

<img align="right" width="420" alt="NTUST Freshman Guide homepage" src=".github/assets/hero.png" />

</a>

**NTUST Freshman Guide** (臺科新生懶人包) is a guide maintained by students
It gathers course selection, housing, campus life and the other things freshmen usually get lost in
Open source, so anyone can pitch in

The site itself is written in Traditional Chinese.

### Contents

- **Course selection** — from the jargon to the tactics that actually work
- **Life** — housing, food, transport, clubs
- **Info** — campus accounts, payments, useful tools, communities
- **Misc** — freshman FAQ, NTUST trivia

### Highlights

- **Department-specific content** — advice from the seniors in your own department
- **Academic calendar** — taken from the [NTUST academic calendar](https://www.academic.ntust.edu.tw/p/404-1048-78935.php)
- **Anyone can edit** — Markdown-friendly

<br clear="right"/>

## Tech stack

| Item | Choice |
|---|---|
| Framework | Astro 7 (SSG) |
| Content | Markdown + content collections (zod strict schema) |
| Syntax extensions | remark-directive + serializer (`src/plugins/`) |
| Navigation | View Transitions (ClientRouter) |
| Deployment | Cloudflare Pages |

## Development setup

### Requirements

- Node 22.12 or newer (`.nvmrc` pins 24)
- Python 3 (optional, only to regenerate the calendar from ics)

### Running locally

```bash
git clone https://github.com/NTUST-OpenSource/freshman.git
cd freshman

npm ci
npm run dev      # dev server
npm run build    # emit the static site to dist/
npm run preview  # preview the build output
```

> After changing `astro.config.mjs`, `src/plugins/` or `src/content.config.ts`, you **must stop the dev server, clear the caches, and restart**:
>
> ```bash
> rm -rf .astro node_modules/.astro node_modules/.vite
> ```
>
> The content layer caches rendered output by content digest, and the cache lives in `node_modules/.astro`. Skip this and even `npm run build` will serve stale serializer output. Editing article content alone does not need it.

## Project structure

```
freshman/
├── src/
│   ├── content/articles/        # article bodies, one .md each, filename is the slug
│   ├── content.config.ts        # frontmatter schema (zod strict)
│   ├── pages/                   # routes: home, /article/[slug], /thanks, 404
│   ├── layouts/Base.astro       # head and SEO, header, department picker, site-wide scripts
│   ├── components/              # Calendar, PersonCard, etc.
│   ├── plugins/                 # custom Markdown serializer (directive to HTML) and post-processing
│   ├── scripts/                 # client scripts, bound to astro:page-load
│   ├── styles/                  # tokens / global / markdown / article
│   ├── lib/                     # depts (department list), contributors (fetched from GitHub at build time)
│   └── data/                    # calendar-113~115.json, credits.json
├── public/
│   ├── icons/                   # site-wide SVG icons, colored via CSS mask
│   └── images/<slug>/           # article images, always self-hosted
├── scripts/parse_ics.py         # converts the official academic calendar ics to JSON
└── docs/
    ├── spec/SPEC.md             # custom Markdown syntax spec
    └── calendar/parsed/         # hand-maintained calendar source of truth
```

## Documentation

Project docs are written in Traditional Chinese.

| File | Contents |
|---|---|
| [Contributing guide](https://rookie.ntust.org/article/contribute/) | Step-by-step for both ways to contribute, branch naming, pre-submit checklist (source in `src/content/articles/contribute.md`) |
| [`AGENTS.md`](AGENTS.md) | Top-level project rules: language, design language, content structure, Git conventions |
| [`docs/spec/SPEC.md`](docs/spec/SPEC.md) | Custom Markdown syntax spec |
| [`docs/README.md`](docs/README.md) | Content coverage status, known source-data problems, rewriting rules |
| [`TODO.md`](TODO.md) | Open tasks |

## Contributing

The full contributor list lives on the site's [credits page](https://rookie.ntust.org/thanks/).

Bug reports and content additions are welcome.

- Found a problem but unsure of the right answer, or would rather not edit it yourself: open an [Issue](https://github.com/NTUST-OpenSource/freshman/issues)
- Already know the fix (typo, dead link, outdated amount): open an [Issue](https://github.com/NTUST-OpenSource/freshman/issues), then send a Pull Request linked to it

Before submitting a PR

1. UI copy, content and docs are Traditional Chinese; code comments are English
2. Commits follow [Conventional Commits](https://www.conventionalcommits.org/)
3. Name branches `feat/your-feature` or `fix/your-fix`
4. Content changes need a source or first-hand experience; for yearly data (amounts, rates, regulation links) note the date you verified it
5. No emoji

## License

Released under the [GNU Affero General Public License v3.0](LICENSE). Third-party asset licenses are listed in [`NOTICE`](NOTICE).
