# Protocol Labs R&D Website

The research website for Protocol Labs, live at **https://www.plrd.org/**. The canonical repository is **https://github.com/protocol/plrd.org**.

Built with Next.js 15.5, React 19, and Tailwind CSS 4. Research content is authored in Markdown with YAML frontmatter and compiled to JSON; page sections and opportunity overrides are repository JSON. All website editing goes through GitHub, not a website login or ATProto writer. See [the content-source map](docs/content-migration.md).

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
| `npm run build-sheets` | Print the Sovereign AI sheets in `src/data/fa2/sovereign-ai/` to `public/sovereign-ai/*.pdf`, with a cover plate each (needs local Chrome, poppler and ImageMagick) |

Run `npm test`, `npx tsc --noEmit`, and `npm run build` before submitting a PR. Node `node:test` is the standard test runner. Production installs use pnpm 10 with `pnpm install --frozen-lockfile`; keep `package-lock.json` synchronized for npm users.

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

Markdown-backed research content follows this flow; directly authored page/opportunity JSON follows the separate [content-source map](docs/content-migration.md):

```
content/*.md  -->  build-content.mjs  -->  src/data/generated/*.json  -->  App Router pages
```

1. **Author** -- Markdown files in `content/` with YAML frontmatter define all research content (publications, authors, talks, etc.)
2. **Build** -- `scripts/build-content.mjs` runs at build time (`prebuild` hook). It reads every Markdown file, parses frontmatter with `gray-matter`, renders the body to HTML with `remark`, and writes typed JSON arrays to `src/data/generated/`.
3. **Consume** -- `src/lib/content.ts` imports the generated JSON and exports typed arrays (`publications`, `authors`, `talks`, etc.) used by page components.
4. **Extras** -- The build script also generates `public/feed.xml` (RSS) and `public/search-index.json` (for Fuse.js client-side search).

The generated JSON files are **checked into git** because Vercel needs them at build time.

See [CONTRIBUTING.md](./CONTRIBUTING.md) for how to add and edit content.

### Insights Radar

The Radar on `/insights/` uses repository content only: the newest talks, publications, and listed blog posts from `src/lib/content.ts`, plus one hand-picked field signal from `src/lib/radar-signals.ts`. It selects up to six items by recency, displays PL R&D content before the field signal, and labels the edition with the newest selected item's month. The existing collapsible/swipeable UI is unchanged.

There is no external Radar feed fetch or Curator configuration. External story links in the local content remain links, not ingestion. Former CMS copy is repository-owned as part of the GitHub content migration; there is no website editor.

Run `node --test scripts/radar-local.test.mjs` for the Radar regression tests; they also run with `npm test` or `pnpm test`.

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with hero, focus areas grid, recent updates |
| `/about/` | About Protocol Labs R&D |
| `/areas/` | Focus areas listing |
| `/areas/[slug]/` | Individual focus area (Markdown-driven; leads defined in frontmatter) |
| `/areas/economies-governance/` | FA2 focus area with sub-pages (impact, projects, opportunity spaces) — hardcoded, not Markdown |
| `/areas/economies-governance/sovereign-ai/[slug]/` | The Sovereign AI program's one-page sheets, each with a printed A4 PDF at `/sovereign-ai/<slug>.pdf`; the FA2 page lists them in its Sovereign AI flagship box (`#flagship-program`, also reached by `#sovereign-ai`), and `/sovereign-ai/` links there. Old `/briefs/` and `/programs/` links redirect here |
| `/research/` | Research hub |
| `/publications/` | All publications, sorted by date |
| `/publications/[slug]/` | Publication detail |
| `/talks/` | All talks, sorted by date |
| `/talks/[slug]/` | Talk detail with YouTube embed |
| `/tutorials/` | Tutorial series listing |
| `/team/` | Team grid (`/authors` and `/authors/` permanently redirect here) |
| `/authors/[slug]/` | Author profile with bio, publications, talks |
| `/blog/` | Blog posts |
| `/blog/[slug]/` | Blog post detail |

All URLs use trailing slashes for Hugo compatibility.

## FA2 Data

The FA2 (Upgrade Economies & Governance) focus area has hand-curated JSON data in `src/data/fa2/`:

- **`projects.json`** -- 242 ecosystem teams/projects with metadata (name, logo, website, tier, tags, etc.)
- **`impact.json`** -- Impact dashboard data with headline metrics and initiative details
- **`opportunityspaces.json`** -- local image precedence, route generation, fallback fields, and legacy opportunity-space views. Active EG overview/detail prose is in `src/data/site-content/opportunities.json`, not this older fallback.
- **`sovereign-ai/<slug>.json`** -- the Sovereign AI program's one-page sheets for governments and funders: every word, figure and source. The web edition renders the JSON; `npm run build-sheets` prints it to `public/sovereign-ai/<slug>.pdf` and a cover plate, both committed. See AGENTS.md §7

These files are edited directly as JSON and consumed by hardcoded FA2 sub-pages under `/areas/economies-governance/`.

## GitHub-only editing

Website login, CMS editing, browser publishing, and local community deletion are retired. Use GitHub pull requests for Markdown/JSON content changes. Legacy editor links explain the workflow; old auth/write APIs return `410` with `Cache-Control: no-store`, and status is always anonymous. Public Hypercert, community, profile, DID, and metric reads remain.

See [the exact legacy route and canonical-source map](docs/github-editing-retirement.md). This retirement must be integrated with the companion repository snapshot migration; it does not delete public records or source accounts.

## Environment Variables

No cookie secret, OAuth/JWK, or ATProto app-password configuration is needed to build or run the website. Analytics and optional read-only metric configuration are separate.


| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID (empty disables analytics) |
| `NEXT_PUBLIC_COOKIE_CONSENT` | No | `off` hides the analytics consent banner + footer link and loads analytics directly; anything else (default) shows the consent banner |

## Deployment

Deployed to **Vercel** from the GitHub repo `protocol/plrd.org`. Pushes to `main` trigger auto-deployment.

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
- `*.pdf` files are gitignored (removed to reduce repo size), except the Sovereign AI sheets in `public/sovereign-ai/`
- Images must use `unoptimized: true` (configured in `next.config.ts`)
- Hugo shortcodes like `{{< youtube ID >}}` in talk Markdown are rendered as iframes at the component level
- After deleting pages, remove `.next/` to clear stale type cache before type-checking
- FA2 sub-pages (`impact/`, `projects/`, `opportunity-spaces/`) are hardcoded routes, not generated from Markdown
- The path alias `@/*` maps to `./src/*` -- always use it instead of relative imports

## Future Directions

Website editing and publishing are GitHub-only. Public read-only ATProto integrations remain separate from content ownership; do not reintroduce OAuth or credential-based website publishing.
