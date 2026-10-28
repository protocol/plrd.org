# OpenAlex chart refresh — October 28, 2026

The four regenerated CSVs retain their frozen queries, 80-work/50-reference caps,
cluster bootstrap (500 iterations, seed 42), and reliability cutoff. All fetches
finished successfully before any CSV was replaced. Sources are live OpenAlex
responses captured on October 28; this is not interpolated or fabricated data.

| Area | Annual rows | Latest reliable median reference age |
|---|---:|---|
| digital-human-rights | 22 | 7 years (2023) |
| economies-governance | 22 | 7.0 years (2023) |
| ai-robotics | 22 | 3.0 years (2023) |
| neurotech | 27 | 8.0 years (2023) |

Total: 93 annual rows. Three cohorts span 2005–2026; Neurotech spans 2000–2026.
2024–2026 remain explicitly **under-indexed**. Headline values/directions use the
reliable window ending in 2023, not the newest incomplete row. This is a refreshed
snapshot, not evidence of a change in field performance since the prior retrieval.
The medians and directions can change as OpenAlex coverage/sampling changes.

The CSVs also contain existing corpus-size/share columns consumed by the revealed-
commitments reading. Those columns are refreshed with the same queries; no new
metric, query, or model is introduced. First-time-author values remain blank.
E&G's older header omitted the existing bootstrap description; the current
generator now emits it consistently. The sampling settings did not change.

`manifest.json` records exact CSV SHA-256s, retrieval times, row counts and latest
reliable source rows. `results.json` is the actual native-browser receipt for all
four areas × two requested groups × 1440/390/320 px. All 24 cases passed, including
rendered chart counts, exact source-table values, units, under-indexing markers,
source links, flips, chart URLs, Escape/focus restoration and bounds. The five
populated requested plots are four Idea vintage charts and DHR latency; the three
other latency groups are **explicit evidence gaps**, not completed charts.

The screenshots are unaltered local captures from runtime source/data commit
`83d23175bc10e2d34263f306c05b66914eff328c`. This evidence-only addition changes no
runtime source or data. It is not evidence of a hosted preview or production
release. The latency/code change is separately reviewed; see the parent README.
