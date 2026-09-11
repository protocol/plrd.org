# Public AI context

This is additive read-only access, not a chatbot, crawler, embeddings service or permission grant. The human entry point is `/ai/`; the footer and HTML `rel="describedby"` link lead to it or `/llms.txt`.

## Content contract

`content/` → existing `scripts/build-content.mjs` mappers → checked-in generated JSON → `src/lib/content.ts` → `src/lib/ai-content.ts` → text and JSON route handlers. There is no second content catalog, runtime Markdown parser, arbitrary-file route, CMS dump or URL-fetching API. Build-time `readable-markdown.mjs` uses the already-installed jsdom package to turn the same native HTML body into readable Markdown. Source folder/file IDs are preserved exactly, including historical mixed-case IDs.

Covered:

- Native blog articles: source text and attribution. CSS/scripts and interactive widgets are omitted; images and diagrams use supplied descriptions. Existing disclosures remain part of the text.
- External blog entries: the local summary and byline only. `canonicalKind: external` and `canonicalUrl` identify the original article; `sourceUrl` identifies the local metadata page. External full text is not fetched or republished.
- Publications: abstracts, named authors, dates, venue, publication types, DOI/PDF/source links. No full-paper claim.
- Talks: source summaries, venue metadata and available recording links. No transcripts, generated or otherwise.
- Tutorials: top-level text when present, otherwise metadata. Nested tutorial lessons are not included.
- Authors: exact display names and profile metadata. Slugs resolve exactly; exact unique display names can also resolve. Unmatched strings remain unchanged and unlinked. No fuzzy identity matching or inferred affiliations.
- Four public focus areas: the shared `FOCUS_AREA_DESCRIPTIONS` strings and navigation titles, plus current page links. No full overview-body export.

Not covered: landing/About body copy, live ATProto posts or edits, interactive dashboards/data, nested lessons, unpublished material, non-discoverable routes, repository documentation/source, or operational interfaces. This is an explicit allowlist, not a recursive site dump. A short topic list reflects source tagging, not the amount of research in that field.

### Snapshot versus live pages

The generic area template currently renders repository content, while the special Economies & Governance page, landing page and About page also read live indexer sections with hardcoded fallbacks. They do not share one full-page loader. The export deliberately does not serialize seed files or stale Markdown overview bodies as live copy: it uses the same short shared descriptors and links readers to the rendered pages. This keeps static exports reproducible and avoids importing unrestricted live CMS records. The scope appears in the guide, index, complete text, focused resources and record coverage fields.

Dates are source publication dates, not export or last-modified timestamps. Undated records and descriptor-only area records have null dates. Coverage reports the actual included counts and source date range. No new license is asserted; original terms and exceptions remain in force.

## HTTP interface (schema 1.0)

- `GET /llms.txt`: compact plain-text entry index.
- `GET /llms-full.txt`: downloadable plain-text covered context.
- `GET /ai/index.json`: metadata for all covered records, counts, dates, limits and resource links. Bodies are excluded from this index.
- `GET /api/ai/search/?q=connectome&kind=publication&limit=5`: bounded JSON search.
- `GET /ai/records/{kind}/{slug}/`: a covered record as JSON.
- `GET /ai/markdown/{kind}/{slug}/`: the same record as `text/markdown`.
- `GET /ai/topics/{area}/`: descriptor and focused resource links as `text/markdown`.

Every route works with plain HTTP GET. Internal page/dynamic-resource URLs require trailing slashes; file-like `/llms.txt`, `/llms-full.txt` and `/ai/index.json` do not. GET is the only defined method (Next supplies HEAD/OPTIONS and rejects mutation methods). No credentialed CORS or runtime upstream requests are added. Success responses are public-cacheable for 300 seconds with nosniff; errors use no-store. Static files are generated with the deployment, while search/details reapply the visibility gate on the same repository snapshot.

Search accepts only `q`, `kind`, `area`, `limit`, `offset`, once each. q is at most 200 characters with no control characters. kind is area/author/blog/publication/talk/tutorial. area is a covered focus-area slug. limit defaults to 10 and must be an integer 1–50; offset defaults to 0 and must be an integer 0–10000. Matching is case-insensitive AND substrings across title, summary, covered body and author names; ordering is stable ID ascending, never a relevance or quality score. `total` is the number of matches, `nextOffset` is null at the end. Valid searches without matches return 200 with an empty list. Unknown, malformed or duplicate parameters return 400. Unknown or denied detail/topic resources return an indistinguishable 404.

## Visibility and verification

Every shared mapper retains normalized visibility (version, denied flag, source not-before date). Hidden, draft, unlisted, preview, unaffiliated, private, noindex/robots metadata, nonpublic statuses, future dates and malformed dates are denied. Unsupported visibility versions fail closed. Only six explicit collections and four approved area descriptors can enter the export. Reserved operational paths, nonpublic paths, credential-bearing URLs and repository-document links are not export sources. Discovery and direct details use the same filtered view; guessing an ID does not bypass it. Existing HTML publishing behavior is not changed by the AI access layer.

`npm test` includes the AI behavioral suite. It exercises native-source equality, collection coverage, exact bylines/canonicals, source-ID preservation, deterministic real mapper builds with synthetic hidden frontmatter, hidden data at discovery/detail boundaries, query bounds/pagination/errors, text MIME/headers, route wiring and server-rendered guide discovery. No browser checks are implied by these tests. Run `node_modules/.bin/tsc --noEmit` and the normal production build as well. Install dependencies with pnpm 10 and the frozen lockfile; no dependency or lockfile change is needed for this feature.
