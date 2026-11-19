# Contributing to the PL Research Website

This guide explains how focus area leads and contributors can add and edit content on the Protocol Labs R&D website (https://plresearch.org).

> **Publishing a post?** See [docs/analytics.md](docs/analytics.md) for how to build UTM-tagged links for the social/newsletter push so campaign attribution stays clean.

## About page

The About page is maintained through pull requests, not ATProto. Edit `src/data/about.json` for the hero, history, collaborations, future and quotes. Body values support Markdown; use `\n\n` for a paragraph break. The existing focus-area cards still use `src/lib/focus-area-descriptions.ts`, and author cards use the normal author content pipeline.

Preview with `npm run dev` at `/about/`. Run `node --test scripts/about-page.test.mjs`, `npm test`, `npx tsc --noEmit` and `npm run build` before submitting a PR. Approved changes publish through the normal merge/deployment process. `/about/` no longer reads the historical About CMS record, and its website CMS editor/API is retired. The separate `/outreach/collaboration/` page still reads that record’s collaborations section directly from the indexer; this dependency is unchanged, so About PRs do not update that page. Keep the historical record intact; do not sync it as part of an About edit.

## Focus Area Pages

Three focus areas are fully managed through Markdown: **Digital Human Rights**, **AI & Robotics**, and **Neurotech**. Each focus area lead can update their page by editing a single file.

> **Note:** The Upgrade Economies & Governance focus area is managed separately — see [FA2 Data](#fa2-data-upgrade-economies--governance) below.

### File Locations

| Focus Area | File | Lead |
|------------|------|------|
| Digital Human Rights | `content/areas/digital-human-rights/_index.md` | Will Scott |
| AI & Robotics | `content/areas/ai-robotics/_index.md` | Molly Mackinlay |
| Neurotech | `content/areas/neurotech/_index.md` | Sean Escola |

### Frontmatter Fields

Each file starts with a YAML frontmatter block between `---` markers. Here is what each field does:

```yaml
---
title: "Neurotech"
date: 2024-03-15
summary: "Accelerate neurotechnologies to benefit humanity, focusing on breakthroughs in brain-computer interfaces (BCI)."
leads:
  - sean-escola
---
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | The page heading. Displayed prominently at the top of the area page. Any `FA1:` / `FA2:` prefix is automatically stripped for display. |
| `date` | Yes | Date in `YYYY-MM-DD` format. Used for metadata and ordering. Not shown on the page. |
| `summary` | Yes | One or two sentences shown as the subtitle below the heading. Also used as the page's meta description for search engines. |
| `leads` | Yes | List of author slugs (folder names from `content/authors/`). Each lead is displayed as a card with their name, role, and avatar. Use `leads: []` if there are no designated leads. |

### Page Body (Markdown)

Everything below the closing `---` is the page body. It is rendered as HTML and displayed as the main content section. Standard Markdown is supported:

- `## Heading` for section headers
- `**bold**` and `*italic*` for emphasis
- `- item` for bullet lists
- `[link text](url)` for links
- Code blocks with triple backticks

The page also automatically shows up to 8 recent publications and 6 recent talks that are tagged with the area's slug in their `areas:` frontmatter.

### Example: Updating Your Focus Area

Say you are the Neurotech lead and want to update the summary and add a paragraph:

1. Open `content/areas/neurotech/_index.md`
2. Edit the `summary:` value and add text below the `---`
3. Preview locally:
   ```bash
   npm run dev
   # open http://localhost:3000/areas/neurotech/
   ```
4. Commit and push:
   ```bash
   git checkout -b update-neurotech-summary
   git add content/areas/neurotech/_index.md
   git commit -m "🔧 Update neurotech summary and description"
   git push -u origin update-neurotech-summary
   ```
5. Open a pull request. Once merged to `main`, Vercel auto-deploys.

### Adding or Changing a Lead

The `leads` field references author slugs. Each slug must match a folder in `content/authors/`. To add a new lead:

1. Ensure the person has an author profile (see [Add a Team Member](#add-a-team-member) below)
2. Add their slug to the `leads` list:
   ```yaml
   leads:
     - sean-escola
     - new-lead-slug
   ```

---

## How Content Works

All website content lives in the `content/` directory as Markdown files with YAML frontmatter. When the site builds, a script converts these files into JSON that the website reads:

```
You edit:          content/publications/my-paper/index.md
                        |
Build script:      scripts/build-content.mjs  (runs automatically)
                        |
Generates:         src/data/generated/publications.json
                        |
Displayed at:      https://plresearch.org/publications/my-paper/
```

You only need to create or edit Markdown files in `content/`. Everything else is automatic.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm (comes with Node.js)
- Git
- A text editor (VS Code recommended)

## Local Setup

```bash
git clone https://github.com/daviddao/plrd-v2.git
cd plrd-v2
npm install
npm run dev
```

Open http://localhost:3000 to preview the site. Changes to `content/` files require restarting the dev server (Ctrl+C, then `npm run dev` again).

---

## Adding Content

### Add a Team Member

Create a folder in `content/authors/` using a lowercase-hyphenated slug (e.g., `jane-smith`), with an `_index.md` file inside.

**File:** `content/authors/jane-smith/_index.md`

```yaml
---
# Display name (required)
name: Jane Smith

# Must match the folder name (required)
authors:
  - jane-smith

# Role/position (required)
role: Research Scientist

# Organizations (required)
groups:
  - 'Protocol Labs'

# One of: Leads, Researchers, Alumni (required)
user_groups:
  - Researchers

# Avatar image reference (see below for where to place the file)
resources:
  - name: avatar
    src: avatar.jpg

# Research interests (optional, displayed on profile)
interests:
  - Distributed Systems
  - Consensus Protocols
  - Formal Verification

# Education (optional)
education:
  courses:
    - course: PhD in Computer Science
      institution: MIT
      year: 2022
    - course: BSc in Mathematics
      institution: Stanford University
      year: 2017

# Social links (optional). Icon must match a file in public/icons/
# Available icons: twitter, linkedin, google-scholar, github-footer,
#   globe, arxiv, dblp, researchgate, stackoverflow, envelope
social:
  - icon: twitter
    link: https://twitter.com/janesmith
  - icon: linkedin
    link: https://www.linkedin.com/in/janesmith/
  - icon: google-scholar
    link: https://scholar.google.com/citations?user=XXXXXXX

# Quote displayed at the top of the profile page (optional)
quote: "Building reliable distributed systems for the next generation of the web."
---
Jane is a **Research Scientist** at Protocol Labs working on consensus protocols
and formal verification of distributed systems.

Her recent work focuses on Byzantine fault tolerance in heterogeneous networks.
She previously held research positions at EPFL and the Max Planck Institute.
```

**Avatar image:** Place the photo at `public/images/authors/jane-smith/avatar.jpg`. The filename must start with `avatar` (e.g., `avatar.jpg`, `avatar.png`, `avatar.webp`). Recommended size: 400x400px, square crop.

### Add a Publication

Create a folder in `content/publications/` using a slug (typically `lastnameYYYY`), with an `index.md` file inside.

**File:** `content/publications/smith2025/index.md`

```yaml
---
# Paper title (required)
title: "Scalable Byzantine Agreement with Adaptive Adversaries"

# Publication date, format YYYY-MM-DD (required)
date: 2025-01-15

# Venue name (optional)
venue: "ACM CCS 2025"

# Venue location (optional)
venue_location: "Salt Lake City, UT, USA"

# Venue date if different from publication date (optional, format YYYY-MM-DD)
venue_date: 2025-11-10

# DOI if available (optional)
doi: "10.1145/1234567.1234568"

# Publication type -- pick one (required):
#   conference-paper, journal-article, report, preprint, book-chapter
publication_types:
  - conference-paper

# Authors (required)
# For PL team members: use their folder slug (e.g., jane-smith)
# For external authors: use their full name in quotes (e.g., "Alice Johnson")
authors:
  - jane-smith
  - "Alice Johnson"
  - "Bob Williams"

# Focus areas -- use folder slugs from content/areas/ (optional)
areas:
  - distributed-systems

# Research groups (optional)
groups:
  - consensuslab

# Set to true for papers without PL affiliation that should only
# appear on the author's profile, not in the main publications list
unaffiliated: false

# External links (optional)
url_pdf: ""
url_source: "https://eprint.iacr.org/2025/001"
---
We present a new protocol for Byzantine agreement that scales to thousands
of participants while maintaining security against adaptive adversaries.
Our approach combines threshold signatures with a novel view-change mechanism
that reduces communication complexity from O(n^3) to O(n log n).
```

The body text below the `---` becomes the abstract/description on the publication page. It supports full Markdown (bold, links, lists, etc.).

**PDF files:** If you have a PDF, name it the same as the folder (e.g., `smith2025.pdf`) and place it in the folder. Note that `*.pdf` files are gitignored, so PDFs should be hosted externally and linked via `url_pdf`.

### Add a Talk

Create a folder in `content/talks/` with an `index.md` file.

**File:** `content/talks/smith-ccs2025/index.md`

```yaml
---
# Talk title (required)
title: "Scalable Byzantine Agreement with Adaptive Adversaries"

# Date of the talk, format YYYY-MM-DD (required)
date: 2025-11-10

# Venue name (required)
venue: "ACM CCS 2025"

# Venue URL (optional)
venue_url: "https://www.sigsac.org/ccs/CCS2025/"

# Venue date if different from date (optional, format YYYY-MM-DD)
venue_date: 2025-11-10

# Venue location (optional)
venue_location: "Salt Lake City, UT, USA"

# Speakers -- same rules as publication authors (required)
authors:
  - jane-smith

# Focus areas (optional)
areas:
  - distributed-systems

# Research groups (optional)
groups:
  - consensuslab

# Cover image (optional). Place a file named featured.jpg or featured.png in the folder
resources:
  - title: featured-image
    src: featured.jpg

# Short description (optional)
abstract: "Jane Smith presents a new scalable Byzantine agreement protocol at ACM CCS 2025."
---
A brief overview of the talk content.

{{< youtube dQw4w9WgXcQ >}}
```

**YouTube videos:** Use the Hugo shortcode `{{< youtube VIDEO_ID >}}` in the body to embed a video. Extract the video ID from the YouTube URL (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ` -> `dQw4w9WgXcQ`).

**Spotify episodes:** Use the shortcode `{{< spotify episode/EPISODE_ID >}}` in the body to embed a podcast episode. Extract the episode ID from the Spotify URL (e.g., `https://open.spotify.com/episode/4h2YB73QuiwO1lqsRsCcw8` -> `4h2YB73QuiwO1lqsRsCcw8`).

**Cover image:** Place a `featured.jpg` or `featured.png` in the talk folder and reference it in the `resources` frontmatter.

### Add a Blog Post

Create a folder in `content/blog/` with an `index.md` file.

**File:** `content/blog/my-post/index.md`

```yaml
---
# Post title (required)
title: "My Blog Post"

# Publication date, format YYYY-MM-DD (required)
date: 2025-06-01

# Short description shown in the blog listing (required)
summary: "A brief summary of what this post is about."

# Authors -- use author folder slugs (required)
authors:
  - jane-smith
---
The full blog post content goes here. Standard Markdown is supported:
headings, bold, italic, links, lists, code blocks, etc.
```

The post will appear at `/blog/my-post/` and in the blog listing at `/blog/`.

### Edit an Existing Page

Find the Markdown file in `content/` and edit it directly. Common tasks:

- **Update your bio:** Edit `content/authors/<your-slug>/_index.md`
- **Fix a publication title:** Edit `content/publications/<slug>/index.md`
- **Update a talk abstract:** Edit `content/talks/<slug>/index.md`
- **Update a blog post:** Edit `content/blog/<slug>/index.md`
- **Change your avatar:** Replace the image at `public/images/authors/<your-slug>/avatar.jpg`

---

## FA2 Data (Upgrade Economies & Governance)

The FA2 focus area has additional hand-curated data in `src/data/fa2/`. These are JSON files, not Markdown.

### Projects (`src/data/fa2/projects.json`)

Array of project objects. To add a project:

```json
{
  "uid": "unique-id",
  "name": "Project Name",
  "logo": "https://example.com/logo.png",
  "website": "https://example.com",
  "description": "One-line description.",
  "longDescription": "Longer description for the detail view.",
  "tier": "Tier 1",
  "tags": ["governance", "public-goods"]
}
```

### Impact Data (`src/data/fa2/impact.json`)

Contains headline metrics and initiative details for the impact dashboard. Edit the `highlights` array for top-level stats and the `initiatives` array for individual program metrics.

### Opportunity Spaces (`src/data/fa2/opportunityspaces.json`)

Contains the 4 opportunity spaces (Sovereign DPI, Climate Infrastructure, Public Goods Funding, Governance & Democracy) with descriptions, key assumptions, and tipping signals.

---

## File Naming Conventions

| Rule | Example |
|------|---------|
| Folder slugs are lowercase, hyphen-separated | `jane-smith`, `smith2025`, `ai-robotics` |
| Author profiles use `_index.md` (with underscore) | `content/authors/jane-smith/_index.md` |
| Publications and talks use `index.md` (no underscore) | `content/publications/smith2025/index.md` |
| Section index pages use `_index.md` | `content/research/_index.md` |
| Standalone pages use `<name>.md` | `content/outreach/grants.md` |

The **slug** (folder name) determines the URL. For example, `content/publications/smith2025/index.md` becomes `/publications/smith2025/`.

## Author References

When listing authors in a publication or talk, there are two formats:

- **PL team members:** Use the folder slug (no quotes). This creates a link to their profile.
  ```yaml
  authors:
    - jane-smith
    - david-dao
  ```
- **External collaborators:** Use their full name in quotes. Displayed as plain text.
  ```yaml
  authors:
    - jane-smith
    - "Alice Johnson"
    - "Bob Williams"
  ```

## Markdown Body

The text below the closing `---` of the frontmatter is the body. It supports:

- Standard Markdown: **bold**, *italic*, [links](url), lists, headings, code blocks
- Raw HTML (not sanitized)
- Hugo shortcodes: `{{< youtube VIDEO_ID >}}` for YouTube embeds

The body is rendered to HTML and displayed on the detail page. For publications, this is typically the abstract. For authors, this is the bio.

---

## Verifying Your Changes

Before submitting, always verify locally:

```bash
# 1. Start the dev server (rebuilds content automatically)
npm run dev

# 2. Check the relevant page in your browser at http://localhost:3000

# 3. Type-check (catches broken imports, missing fields, etc.)
npx tsc --noEmit

# 4. Full production build (catches build-time errors)
npm run build
```

If the dev server is already running, you need to restart it (Ctrl+C, `npm run dev`) to pick up content changes -- the Markdown build step only runs at startup.

## Submitting Changes

### Branch Naming

Use lowercase hyphenated names:

```
add-jane-smith-profile
update-smith2025-abstract
fix-talk-venue-typo
```

### Commit Messages

Follow the emoji-prefix format:

```
✨ Add jane-smith author profile
🔧 Update smith2025 publication metadata
🐛 Fix typo in talk abstract
```

Common prefixes:
- `✨` Add new content
- `🔧` Update/edit existing content
- `🐛` Fix an error
- `♻️` Reorganize or refactor

### Pull Request Workflow

1. Create a branch from `main`
2. Make your changes
3. Verify locally (`npm run dev`, `npx tsc --noEmit`)
4. Commit and push
5. Open a pull request on GitHub
6. Once merged to `main`, Vercel auto-deploys to https://plresearch.org

---

## How the Build Works (Technical Details)

For those who want to understand the internals:

The prebuild script `scripts/build-content.mjs` runs before every `dev` and `build` command. It:

1. **Scans** each content directory (`publications/`, `authors/`, `talks/`, etc.)
2. **Discovers** Markdown files by looking for subdirectories containing `index.md` or `_index.md`, and standalone `.md` files (excluding `_index.md` at the directory level)
3. **Parses** each file with `gray-matter` to extract YAML frontmatter and Markdown body
4. **Renders** the Markdown body to HTML using `remark` + `remark-html` (with `sanitize: false` to allow raw HTML)
5. **Writes** 8 JSON files to `src/data/generated/`:
   - `publications.json` -- Sorted by date descending, excludes `unaffiliated: true`
   - `authors.json` -- Sorted by name alphabetically
   - `talks.json` -- Sorted by date descending
   - `tutorials.json` -- Top-level tutorials only
   - `outreach.json` -- Sorted by `weight` field
   - `blog.json` -- Sorted by date descending
   - `areas.json` -- All focus areas
   - `sections.json` -- Section index metadata (research, contact, outreach)
6. **Generates** two public files:
   - `public/feed.xml` -- RSS feed from the latest 20 publications + 10 talks
   - `public/search-index.json` -- Flat array for Fuse.js client-side search

The generated JSON is then imported by `src/lib/content.ts`, which exports typed arrays consumed by the App Router page components. This means **no filesystem access happens at runtime** -- all content is pre-compiled into static JSON.

### Discovery Rules

| Content Type | Location | File Pattern | Sorting |
|-------------|----------|-------------|---------|
| Publications | `content/publications/<slug>/` | `index.md` | Date descending |
| Authors | `content/authors/<slug>/` | `_index.md` | Name A-Z |
| Talks | `content/talks/<slug>/` | `index.md` | Date descending |
| Tutorials | `content/tutorials/<slug>/` | `_index.md` | None (insertion order) |
| Blog | `content/blog/<slug>/` | `index.md` | Date descending |
| Areas | `content/areas/<slug>/` | `_index.md` | None (insertion order) |
| Outreach | `content/outreach/` | `<name>.md` | Weight ascending |
| Sections | `content/<name>/` | `_index.md` | N/A (keyed object) |

### Avatar Resolution

Author avatars are resolved at build time by checking `public/images/authors/<slug>/` for any file starting with `avatar`. The first match is used. If no file is found, `avatarPath` is `null` and a placeholder is shown.
