# Protocol Labs R&D Website

The research website for Protocol Labs, live at **https://plresearch.org**.

Built with Next.js 15.5, React 19, and Tailwind CSS 4. Content is authored in Markdown with YAML frontmatter, compiled to JSON at build time, and served through the Next.js App Router.

## Quick Start

```bash
npm install
npm run dev        # builds content + starts dev server
```

Open http://localhost:3000.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Build content from Markdown, start Next.js dev server |
| `npm run build` | Production build (content + Next.js) |
| `npm start` | Start production server |
| `npx tsc --noEmit` | Type-check without emitting files |

No ESLint or test runner is configured. Use `npx tsc --noEmit` to verify types before pushing.

## Project Structure

```
plrd-v2/
  content/                       # Markdown source files
    authors/<slug>/_index.md     #   Team member profiles (~74)
    publications/<slug>/index.md #   Research papers (~92)
    talks/<slug>/index.md        #   Conference talks (~61)
    tutorials/<slug>/_index.md   #   Tutorial series (3)
    blog/<slug>/index.md         #   Blog posts
    areas/<slug>/_index.md       #   Focus areas (4, with leads in frontmatter)
    outreach/<name>.md           #   Outreach pages (6)
    <section>/_index.md          #   Section index pages
  scripts/
    build-content.mjs            # Prebuild: Markdown -> JSON + RSS + search index
  src/
    app/                         # Next.js App Router pages
    components/                  # Shared React components
    data/
      generated/                 # Auto-generated JSON from content/ (checked into git)
      fa2/                       # Hand-curated FA2 focus area data
    lib/
      content.ts                 # Typed exports from generated JSON
      site-config.ts             # Site metadata, navigation structure
  public/
    icons/                       # SVG icons for social links, UI
    images/                      # Static images (authors, heroes, logos)
    feed.xml                     # RSS feed (auto-generated)
    search-index.json            # Client-side search index (auto-generated)
```

## Content Pipeline

All content follows the same flow:

```
content/*.md  -->  build-content.mjs  -->  src/data/generated/*.json  -->  App Router pages
```

1. **Author** -- Markdown files in `content/` with YAML frontmatter define all research content (publications, authors, talks, etc.)
2. **Build** -- `scripts/build-content.mjs` runs at build time (`prebuild` hook). It reads every Markdown file, parses frontmatter with `gray-matter`, renders the body to HTML with `remark`, and writes typed JSON arrays to `src/data/generated/`.
3. **Consume** -- `src/lib/content.ts` imports the generated JSON and exports typed arrays (`publications`, `authors`, `talks`, etc.) used by page components.
4. **Extras** -- The build script also generates `public/feed.xml` (RSS) and `public/search-index.json` (for Fuse.js client-side search).

The generated JSON files are **checked into git** because Vercel needs them at build time.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add and edit content.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, focus areas grid, recent updates |
| `/about/` | About Protocol Labs R&D |
| `/areas/` | Focus areas listing |
| `/areas/[slug]/` | Individual focus area (Markdown-driven; leads defined in frontmatter) |
| `/areas/economies-governance/` | FA2 focus area with sub-pages (impact, projects, opportunity spaces) — hardcoded, not Markdown |
| `/research/` | Research hub |
| `/publications/` | All publications, sorted by date |
| `/publications/[slug]/` | Publication detail |
| `/talks/` | All talks, sorted by date |
| `/talks/[slug]/` | Talk detail with YouTube embed |
| `/tutorials/` | Tutorial series listing |
| `/authors/` | Team grid |
| `/authors/[slug]/` | Author profile with bio, publications, talks |
| `/blog/` | Blog posts |
| `/blog/[slug]/` | Blog post detail |

All URLs use trailing slashes for Hugo compatibility.

## FA2 Data

The FA2 (Upgrade Economies & Governance) focus area has hand-curated JSON data in `src/data/fa2/`:

- **`projects.json`** -- 242 ecosystem teams/projects with metadata (name, logo, website, tier, tags, etc.)
- **`impact.json`** -- Impact dashboard data with headline metrics and initiative details
- **`opportunityspaces.json`** -- 4 opportunity spaces with descriptions, assumptions, tipping signals

These files are edited directly as JSON and consumed by hardcoded FA2 sub-pages under `/areas/economies-governance/`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `COOKIE_SECRET` | Yes | 32+ character secret for encrypting session cookies |
| `PUBLIC_URL` | No | Production URL (empty defaults to localhost) |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID (empty disables analytics) |
| `NEXT_PUBLIC_COOKIE_CONSENT` | No | `on` shows the analytics consent banner + footer link and gates analytics on consent; anything else (default) hides the banner and loads analytics directly (cookies still set) |

## Deployment

Deployed to **Vercel** from the GitHub repo `daviddao/plrd-v2`. Pushes to `main` trigger auto-deployment.

The `vercel.json` config is minimal:

```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build"
}
```

## Styling

- **Tailwind CSS 4** with `@tailwindcss/postcss`
- Theme defined in `src/app/globals.css` via `@theme` block
- Key colors: `--color-blue: #1982F4`, `--color-pink: #E51A66`, `--color-black: #131316`
- Font: Inter (Google Fonts)
- Responsive: mobile-first with `md:` and `lg:` breakpoints
- Common patterns: `max-w-4xl mx-auto px-6`, `text-gray-600`, `divide-y divide-gray-200`

## Gotchas

- `src/data/generated/` is checked into git -- Vercel needs it at build time
- `*.pdf` files are gitignored (removed to reduce repo size)
- Images must use `unoptimized: true` (configured in `next.config.ts`)
- Hugo shortcodes like `{{< youtube ID >}}` in talk Markdown are rendered as iframes at the component level
- After deleting pages, remove `.next/` to clear stale type cache before type-checking
- FA2 sub-pages (`impact/`, `projects/`, `opportunity-spaces/`) are hardcoded routes, not generated from Markdown
- The path alias `@/*` maps to `./src/*` -- always use it instead of relative imports

## Future Directions

Decentralized content publishing via ATProto (Bluesky) is being explored as a future alternative to the Markdown/git workflow for blog posts and other content.
