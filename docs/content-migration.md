# GitHub-owned website content

## Editing

Website content is reviewed in `protocol/plrd.org` and published through its normal PR/deployment workflow. GitHub Markdown/JSON are the authoring source; website login and browser-based CMS publishing are retired. See `AGENTS.md` and `docs/github-editing-retirement.md` for repository and route guidance. Do not run historical PDS seed/sync/publishing commands to edit website content.

| Content | Edit here |
| --- | --- |
| Previously CMS-owned page sections | `src/data/site-content/pages.json` — find `pageId`, then `sections[].sectionId` |
| Economies & Governance's four active opportunity cards and direct detail pages | `src/data/site-content/opportunities.json` — `areaSlug: economies-governance` |
| About | **Keep** `src/data/about.json`; never restore the historical PDS About record |
| AI & Robotics, Digital Human Rights, Neurotech overviews/details | Existing `content/areas/`, generated content pipeline, and their `src/data/fa2/*-opportunityspaces.json` loaders; the archived CMS versions do not override them |
| Blog bodies, metadata, listing/visibility | Existing `content/blog/<slug>/index.md`; regenerate with the existing content builder and commit its outputs |
| Publication discovery identity | `src/data/site-content/publication.json`; `REPO_PUBLICATION_URI` is exported by `src/lib/indexer.ts` |

Keep record IDs, slugs, section IDs, and published URLs stable. Existing renderer fallbacks remain repository-owned and unchanged. Null/absent section fields intentionally retain those fallback decisions; don't populate them from stale seeds merely because the CMS is gone. Update a working record's `updatedAt` for a substantive edit, without rewriting historical snapshot timestamps.

**Collaboration:** its `hero` and `collaborations` sections now belong together under `collaborate` in `pages.json`. The unchanged Collaboration renderer still requests `fetchPage('about')`; the adapter supplies a narrow compatibility projection containing **only** this collaborate-owned section. It cannot return the historical About hero/body and does not power `/about/`. `fetchAllPages()` lists the 15 non-About pages, not this compatibility projection.

**Economies & Governance:** retain currently rendered titles, including “Programmable Capital Allocation” and “Computational Coordination and Governance.” The older `src/data/fa2/opportunityspaces.json` has different titles; blindly swapping it in changes output. That existing file still owns local image precedence, strategy labels, static route generation, fallback data, and the separate legacy opportunity-space views. This migration intentionally does not unify those surfaces or rename their URLs. All 15 CMS opportunity records are retained by the read adapter; only four currently power public content. The other 11 do not supersede approved repository detail loaders.

## Migration evidence — November 19, 2026

`src/data/site-content/provenance/2026-11-19/` is an immutable **public-record** capture, completed at **19:07:24.561 UTC**:

- PDS: **16 pages, 15 opportunities, 3 standard.site documents, 1 publication, 3 Hypercert activity claims**, and **0 legacy `org.plresearch.post` records**.
- Every PDS collection was traversed forward and backward with cursors to exhaustion. Identity/CID sets must agree. The PDS has no collection total, so these two independent traversals are reconciled rather than inventing a total field.
- The indexer independently returned **16 pages, 15 opportunities, and 6 edit events**. Cursor exhaustion and `totalCount` must agree; all projected page/opportunity fields also match the PDS by URI. Any partial/error/duplicate/unstable set aborts capture before an archive is written.
- `public-records.json` retains complete parsed record envelopes and actual pagination responses, including unknown fields, original URIs/CIDs/timestamps, Leaflet bodies/facets, and media CID references. `manifest.json` pins archive bytes and per-record value hashes. It is not a wire-byte HTTP capture or a binary-media/entire-account backup.
- Original external records, blobs, accounts, and shared services were **not** mutated or deleted. No credentials or signed-in API were used.

`migration-receipt.json` inventories **85 active page-field reads**: **68** use nonempty captured values and **17** keep existing renderer fallbacks. The initial parity checks compared every retained page/opportunity field to the snapshot and actual server-renderer trees/props for all **16** CMS-content routes against the archived indexer data, including four opportunity metadata/detail outputs. Those checks remain reproducible against the pinned initial Git tree with the optional historical command below; ongoing tests compare runtime reads/rendering with current JSON instead. EG image precedence is unchanged. Historical About and superseded area content stay archived rather than silently becoming authoritative again. A separate cross-check against 16 captured production HTTP baselines found 67 nonempty page fields in the visible DOM, all six parsed Collaboration cards, and 133 EG detail text values. The remaining nonempty field is the inactive Team Advisors blurb: present in transferred props, not the initially selected Leadership tab; the renderer-props test preserves it.

### Blog and publication reconciliation

All three public documents have exactly one existing repository counterpart, at their existing `/blog/.../` URL. They are **Leaflet** records (`pub.leaflet.content`), not the custom Markdown shape the old indexer adapter expected. The captured default indexer actually rejects its generic `records` query. That failure is archived explicitly; it is not treated as proof that no documents exist.

| Repository article | Remote text-block comparison |
| --- | --- |
| `neurotech-frontier-human-flourishing` | 101 of 102 blocks match normalized repository prose; the extra is the syndication byline |
| `better-economies-governance-systems` | 139 of 141 match; extras are the syndication byline and an existing remote-only dashboard CTA |
| `how-pl-rd-accelerates-breakthroughs` | 82 of 83 match after normalizing visual case-study labels; the extra is the syndication byline |

These are **not byte-identical documents**: layout, media representations, links, and syndication wrappers differ. The receipt records unmatched blocks, link differences, metadata equality, repository source/HTML hashes, and visibility. Four EG numbered visual labels also differ in textual representation. Complete originals remain in the archive and on the PDS. No approved repository body, image, summary, metadata, or `unlisted` flag is overwritten; no duplicate card or newly visible post is added. `fetchAtproPosts()` consequently returns no extra entries. New articles continue through the existing repository blog pipeline, not this legacy append-only adapter.

The full public publication envelope is also repository-owned. Its existing discovery URI is preserved exactly:

```text
at://did:plc:pgwr6hkosgznfl5nz7egajei/site.standard.publication/3mi3mlkepmk2q
```

The `.well-known/site.standard.publication` route reads `REPO_PUBLICATION_URI` from the repository adapter. It no longer uses a deployment environment setting or contacts the CMS.

## Contract and retained integrations

`src/lib/indexer.ts` retains its exported types, async function signatures, helper semantics, null/empty behavior for unknown IDs, and opportunity ordering. Reads return fresh clones so caller mutation cannot change shared content. Its CMS read path has **no fetch, CMS URL, environment override, or remote fallback**. Audit reads use the six frozen public indexer events; new content history lives in Git, not a live CMS audit feed.

Public Hypercert claims/community evidence, DID/PDS/profile reads used by those features, Simocracy, GainForest, Glow, FtC, and other metric providers are unchanged. In particular, FtC still uses the shared PL Research indexer; retiring CMS reads is **not** permission to shut it down or remove its configuration. The snapshot's Hypercert records are inventory/provenance, not a replacement source for the live integration.

## Verification

```sh
npm test
# Focused content contracts only:
node --test scripts/site-content*.test.mjs
node_modules/.bin/tsc --noEmit --incremental false
```

The main test command includes the evergreen content contracts. They validate current authoring JSON, unique record/section identities and URI references, adapter clone isolation/order/null behavior, renderer fallbacks, offline operation, and current article visibility/no-duplicate policies. Editorial controls exercise ordinary page and opportunity prose/timestamp edits and an existing blog-body edit in memory. Malformed/duplicate data, remote fallback, and unlisted leakage are negative controls.

A later editorial PR changes working Markdown/JSON and any generated outputs, not historical provenance. **Do not update the initial migration receipt**, original capture timestamps/CIDs/hashes, or archived responses to accommodate new copy. Current blog metadata/body/visibility are checked against current repository data, not against the initial remote publication.

To reproduce the one-time migration parity evidence separately:

```sh
node scripts/site-content-history.mjs
```

This optional command requires the original Git object `503060e7287f3bd4c1537544fe57962f9d96b6fb` and installed dependencies. It extracts that pinned tree to a disposable directory and runs its original **29** parity/capture tests, including initial page-field hashes, all 16 renderer comparisons, and initial blog-source/HTML/metadata reconciliation. It never compares today's editable content to the initial receipt, changes a branch/ref, or contacts the live CMS. The historical command is not in the `npm test` evergreen glob.

To take a separate fresh public-source capture for investigation:

```sh
node scripts/site-content-snapshot.mjs src/data/site-content/provenance/NEW_CAPTURE_ID
```

This only reads public sources, refuses existing capture directories, and does not overwrite authoring data. It is not a recurring sync or publishing command.

Legacy editor routes now provide GitHub contribution guidance and former authoring APIs return retired-route responses. Repository tests cover publication discovery and authoring retirement alongside the content contracts. The receipt's original test/build results remain a historical record, not a statement of the current suite's results. No merge, deployment, or production UI verification is implied by local tests.
