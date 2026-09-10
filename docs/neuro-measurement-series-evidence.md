# Neuro measurement series — verified evidence and interpretation

Checked September 9, 2026. Canonical data: `src/data/velocity/neuro-measurement-series.json`, an array of exactly three contract objects, with 27 points: 7 tissue-volume, 9 BCI-participant, and 11 recording-hour points. These are selected global evidence, never a worldwide total. The research pass retained raw re-fetches and a machine-checked citation ledger separately; the source excerpts and URLs below provide the committed provenance.

## Historical global BCI series: actual supplement inspected

The review identifies 67 participants through December 2023, not through 2024; post-December-2023 implants are explicitly excluded. Its scope includes ECoG and endovascular devices, not just intracortical arrays.[1]

**The publisher supplement was successfully retrieved**, rather than merely searched for. Supplementary Table 2 lists participant identifiers, clinical trial identifiers, peer-reviewed/personal-communication evidence, verification, and research-group contacts. It does **not** tabulate each participant’s implantation year. Table 1’s years are explicitly **“Year of Publication”**, not implantation years. Supplementary Figure 2 describes implantation-to-publication lags but does not supply the missing patient/year table as extracted text.[22]

Accordingly, this deliverable uses the single 67-person literature/disclosure-cohort checkpoint and separate company/program tracks. No annual cumulative values were inferred from publication years, percentages, plotted pixels, aggregate totals, or trial enrollment targets. Rebuilding a valid historical trajectory would require recovering the authors’ underlying patient-year dataset or resolving the primary references/personal communications participant by participant.[1][22]

The direct Nature HTML request returned a client challenge. The Springer article extraction supplied a supplement heading but no link. An attempted `static-content.springer-cdn.com` host failed DNS; the official `static-content.springer.com` attachment worked through web extraction. The research archive retains its raw text as `supplement-attempt.txt`. This was an access-path recovery, not a missing supplement.

## Interpretation and source decisions

- **Tissue:** geometric bounding volume, imaged tissue, native pre-expansion volume, and neuropil volume have visibly separate tracks. The 2011 mouse dataset is imaged extent, not a fully mapped connectome. H01 and MICrONS remain their 2021 releases; later papers are not more tissue. FlyWire’s 2024 point is a publication checkpoint for the quoted neuropil value, not a claimed first release.[9][3][4]
- Hemibrain’s approximate dimensions yield 0.015625 mm³, rounded to 0.0156; LICONN’s native volume is 0.00095 mm³, not its expanded hydrogel volume. MaleCNS’s 0.082 mm³ image volume is paired with its project’s explicitly dated v0.9 release; later versions do not create another specimen.[2][6][7]
- **BCI:** connect only Neuralink’s compatible cumulative points. Its 21-person interpretation uses measured signals from the 20 subsequent participants after the first, not enrollment language alone. Synchron and ONWARD overlap the historical review, so are not added to it.[21][14][15]
- A new primary Paradromics company page was recovered during this task, explicitly dated June 17, 2026 and confirming the first recipient was implanted for six-year follow-up. This improves the prior research’s announcement-date caveat. The hospital independently supports the long-term study; the earlier temporary 2025 exposure is excluded.[23][16]
- **Hours:** TUSZ provides actual dated release sizes, but its accompanying poster says “The eval set is not released to the public”; these are full reported corpus totals, not wholly open download totals. Its repeated 651 and 1,074 values are real unchanged releases, not filler or incremental hours.[13]
- AJILE12’s frozen release explicitly reports 1,280 hours; JapanEEG reports 1,020 simultaneous EEG/EMG/audio hours, counted once for EEG, and an author-declared open release. Neither was independently recomputed across all files here.[10][12]
- POYO is explicitly a **training-corpus** track with a **greater-than 100** marker; it is not a newly released independent archive and must not be added to constituent sources. EEGDash’s mixed-modality headline was excluded entirely; no mixed EEG/EMG catalog total was relabeled neural hours.[11]

## Every plotted point

Dates with month/year precision use first-of-month/year solely as a coordinate. Render the declared precision, not a fictional exact January 1 event. Values with `approximate`, `at-least`, or `greater-than` need their qualifier rendered. Individual point notes are part of the contract and must remain accessible beside source links.

### Neural tissue mapped — selected datasets

| Track / point | Coordinate; precision; basis | Value (mm³) | Source |
|---|---|---:|---|
| Bock mouse V1 | 2011-01-01; year; publication | approximate 0.00819 | [9] |
| Hemibrain | 2020-01-01; year; publication | approximate 0.0156 | [2] |
| H01 first public release | 2021-06-01; day; release | approximate 1 | [3] |
| MICrONS v117 | 2021-07-01; month; release | approximate 1 | [4] |
| FlyWire whole-brain neuropil | 2024-01-01; year; publication | exact reported 0.0175 | [5] |
| LICONN native tissue | 2025-01-01; year; publication | approximate 0.00095 | [6] |
| MaleCNS v0.9 | 2025-10-03; day; release | approximate 0.082 | [8] |

**Bock mouse V1:** Source: “Reconstruction encompasses 450 X 350 X 52 um volume of tissue.” Derived geometric volume: 450 × 350 × 52 / 10⁹ = 0.00819 mm³. Publication-year checkpoint; first release date not established. Dense reconstruction of every neurite is not asserted.[9]

**Hemibrain:** Source: “The hemibrain sample is roughly 250 × 250 × 250 μm.” Geometric product 0.015625 mm³, displayed approximately 0.0156; not acquired voxel-mask volume. Publication year, not exact release date.[2]

**H01 first public release:** Source: “roughly one cubic millimeter of brain tissue.” Announcement dated June 1, 2021. Automated segmentation and annotated synapses; only selected cells proofread. Later 1.05-mm³ compression-corrected paper estimate is not new tissue.[3]

**MICrONS v117:** Source: “first public data released on the cubic millimeter dataset in July 2021.” Approximate nominal sample scale, not an exact valid segmentation mask. July precision; 2025 paper is later analysis of this specimen.[4]

**FlyWire whole-brain neuropil:** Source: “The whole brain contains 0.0175 mm³ of neuropil volume.” Publication-year checkpoint for this reported value; the reconstruction reuses FAFB imagery and is not new tissue acquired in 2024.[5]

**LICONN native tissue:** Figure 1: “0.95 × 10⁶ µm³ before” expansion, equivalent to 0.00095 mm³. Native volume, not expanded hydrogel; automated dense reconstruction with synaptic molecular predictions and selected traced validation regions. Publication-year checkpoint, first final-dataset release not established.[6]

**MaleCNS v0.9:** Preprint: “0.082 mm3 total volume” (160 teravoxels at 8-nm isotropic resolution). Release date independently verified at https://male-cns.janelia.org/ : “2025-10-03 - MaleCNS v0.9 released”. Later v1.0 and 2026 publication reuse this specimen; not all synapses have proofread partners.[8]

### Implanted BCI participants — selected cohorts

| Track / point | Coordinate; precision; basis | Value (participants) | Source |
|---|---|---:|---|
| Review cohort through Dec 2023 | 2023-12-01; month; observation | exact reported 67 | [1] |
| Neuralink first participant | 2024-01-01; month; observation | exact reported 1 | [17] |
| Neuralink second participant | 2024-07-01; month; observation | exact reported 2 | [18] |
| Neuralink three participants | 2025-02-05; day; disclosure | exact reported 3 | [19] |
| Neuralink five participants | 2025-06-02; day; disclosure | exact reported 5 | [20] |
| Neuralink 21 participants | 2026-01-28; day; disclosure | exact reported 21 | [21] |
| Synchron ten recipients | 2025-11-06; day; disclosure | exact reported 10 | [14] |
| ONWARD seven participants | 2026-01-22; day; disclosure | exact reported 7 | [15] |
| Paradromics first long-term participant | 2026-06-17; day; disclosure | at-least 1 | [23] |

**Review cohort through Dec 2023:** Source: “These groups have implanted a total of 67 participants”; data collection ended December 2023 and later implants are excluded. Includes ECoG and endovascular systems, not only intracortical. Only 31 were active at cutoff. Supplement Table 2 identifies participants but does not supply implantation-year columns; no annual points invented.[1]

**Neuralink first participant:** April 12, 2024 disclosure: “In January, we conducted the first human implantation.” January is the implantation month, not an exact surgery day.[17]

**Neuralink second participant:** August 21, 2024 disclosure: “Last month, Alex ... the second participant ... received his Neuralink implant.” July implantation month; cumulative two recipients.[18]

**Neuralink three participants:** Source: “Today, there are three people with Telepathy: Noland, Alex, and Brad.” Disclosure date, not all three surgery dates.[19]

**Neuralink five participants:** Source: “Five individuals with severe paralysis are now using Neuralink to control digital and physical devices with their thoughts.” Post-implant use supports receipt, not mere enrollment.[20]

**Neuralink 21 participants:** Company headline says “21 Neuralnauts enrolled”; implantation interpretation also requires body: “higher signal quality across 18 of the subsequent 20 participants” after the first recipient. Company-reported cumulative checkpoint, not independently audited current active users. Page release date Jan 28; last modification Feb 2 is not the checkpoint.[21]

**Synchron ten recipients:** Issuer: “Stentrode BCIs have been placed in 10 patients with paralysis to date, across clinical trials in the U.S. and Australia.” Includes four Australian and six US recipients; do not add those subsets or add this to review baseline.[14]

**ONWARD seven participants:** Source: “Seven study participants have now received ARC-BCI Therapy.” Two additional people bring total to seven. Some historical CEA/WIMAGINE participants overlap the review; exact crosswalk unresolved.[15]

**Paradromics first long-term participant:** June 17, 2026 issuer release: “The first participant ... was enrolled and implanted ... and will be followed and evaluated over the next six years.” Exact disclosure date, not surgery date. At least one long-term participant; earlier temporary 2025 epilepsy implantation is excluded.[23]

### Neural recording hours — selected datasets

| Track / point | Coordinate; precision; basis | Value (hours) | Source |
|---|---|---:|---|
| TUSZ v1.0.0 | 2017-04-17; day; release | exact reported 170 | [13] |
| TUSZ v1.1.0 | 2017-08-04; day; release | exact reported 425 | [13] |
| TUSZ v1.2.0 | 2018-04-15; day; release | exact reported 504 | [13] |
| TUSZ v1.3.0 | 2018-08-16; day; release | exact reported 651 | [13] |
| TUSZ v1.4.0 | 2018-11-14; day; release | exact reported 651 | [13] |
| TUSZ v1.5.0 | 2019-07-22; day; release | exact reported 1074 | [13] |
| TUSZ v1.5.1 | 2020-04-23; day; release | exact reported 1074 | [13] |
| TUSZ v1.5.2 | 2020-05-09; day; release | exact reported 1074 | [13] |
| AJILE12 frozen release | 2022-01-27; day; release | exact reported 1280 | [10] |
| POYO-1 training corpus | 2023-10-24; day; publication | greater-than 100 | [11] |
| JapanEEG descriptor | 2026-05-31; day; publication | exact reported 1020 | [12] |

**TUSZ:** Table 1 release rows carry the exact dates and total-duration values above. The evidence ledger attaches each complete source row separately, including adjacent seizure-duration values to expose column confusion.[13]

**AJILE12 frozen release:** Release metadata: “Neural recordings are available at 500 Hz from at least 64 electrodes per participant, for a total of 1280 hours.” datePublished January 27, 2022. Reported duration, not electrode-multiplied time; gaps/preprocessing mean nominal and QC-valid hours differ.[10]

**POYO-1 training corpus:** Abstract: “over 100 hours of recordings” from seven nonhuman primates and over 158 sessions. Strict lower-bound marker, not exactly 100. Existing datasets reused for training; no new-data or wholly open-corpus claim.[11]

**JapanEEG descriptor:** Abstract: “1020 hours of simultaneously recorded scalp electroencephalography (EEG), facial electromyography (EMG), and speech audio”; authors say released through OpenNeuro under CC0. Descriptor submission date, not verified archive upload date. Count once, not three modalities; full manifest not enumerated.[12]

## Verification and fresh-skeptical review

**Verdict: PASS for the contracted selected-evidence dataset, not for an exhaustive worldwide census.** Objective checks cover exactly three IDs, expected instruments, positive finite numeric values, valid calendar coordinates, allowed temporal enums and qualifiers, source URLs, nonempty notes, sorted points, and unique track/date keys. No inferred zero origins, interpolation, added overlapping totals, or estimated annual patient series are present.

Located weaknesses and corrections:

1. **BCI historical track:** supplement retrieval succeeded but did not supply implant-year columns. Rejected publication-year substitution; retained only the supported 67-person cutoff.
2. **Paradromics point:** prior institutional extraction lacked a date header. Recovered issuer page with explicit June 17, 2026 date and updated point to exact disclosure day, while leaving surgery day unknown.
3. **TUSZ track:** headline hours include withheld evaluation; labeling is full corpus size, never unrestricted open supply. No new current-version estimate is extrapolated.
4. **Tissue tracks:** inconsistent volume bases cannot form a world-record curve. Approximate dimensional volumes preserve approximation; H01/MICrONS/FlyWire versions are not duplicate new-tissue increments.
5. **POYO track:** `greater-than` is semantically necessary. If a renderer cannot distinguish the qualifier and training-corpus definition, omit the POYO track rather than display an exact public-release count.

Remaining limits: scoped selection rather than census; no full archive manifest/duration recomputation; no participant-level reconciliation with later company cohorts; no proof of current active-user totals. Several publication checkpoints intentionally preserve only year precision. Some primary paper extracts were capped at 50,000 characters; plotted values were found in the retained text, not inferred from omitted sections. No repository, PR, external record, or outreach was changed.

## Sources

[1] https://www.nature.com/articles/s44222-024-00239-5
    > "These groups have implanted a total of 67 participants"
[2] https://elifesciences.org/articles/57443
    > "The hemibrain sample is roughly 250 × 250 × 250 μm"
[3] https://research.google/blog/a-browsable-petascale-reconstruction-of-the-human-cortex
    > "roughly one cubic millimeter of brain tissue"
[4] https://microns-explorer.org/manifests/mm3-v117
    > "first public data released on the cubic millimeter dataset in July 2021"
[5] https://www.nature.com/articles/s41586-024-07558-y
    > "The whole brain contains 0.0175 mm^3^ of neuropil volume"
[6] https://www.nature.com/articles/s41586-025-08985-1
    > "0.95 × 10^6^ µm^3^ before"
[7] https://male-cns.janelia.org
    > "**2025-10-03** - [MaleCNS v0.9 released](release/)!"
[8] https://biorxiv.org/content/10.1101/2025.10.09.680999v2.full
    > "0.082 mm3 total volume"
[9] https://cellimagelibrary.org/images/40263
    > "Reconstruction encompasses 450 X 350 X 52 um volume of tissue"
[10] https://api.dandiarchive.org/api/dandisets/000055/versions/0.220127.0436
    > "Neural recordings are available at 500 Hz from at least 64 electrodes per participant, for a total of 1280 hours."
[11] https://arxiv.org/abs/2310.16046
    > "over 100 hours of recordings"
[12] https://arxiv.org/abs/2606.01264
    > "1020 hours of simultaneously recorded scalp electroencephalography (EEG), facial electromyography (EMG), and speech audio"
[13] https://isip.piconepress.com/conferences/ieee_spmb/2020/papers/p01_10.pdf
    > "Total 
Duration 

(Hours)"
    > "v1.0.0 – 04/17/2017 
114 
510 
2,013 
291 
328 
170 
4.9"
    > "v1.1.0 – 08/04/2017 
246 
686 
2,489 
423 
3,582 
425 
28.9"
    > "v1.2.0 – 04/15/2018 
315 
822 
3,064 
642 
1,951 
504 
36.75"
    > "v1.3.0 – 08/16/2018 
364 
970 
4,023 
942 
2,465 
651 
52.6"
    > "v1.4.0 – 11/14/2018 
364 
969 
4,020 
949 
2,548 
651 
53.0"
    > "v1.5.0 – 07/22/2019 
692 
1,661 
6,633 
1,399 
3,591 
1,074 
74.6"
    > "v1.5.1 – 04/23/2020 
692 
1,575 
6,633 
1.382 
3,554 
1,074 
73.5"
    > "v1.5.2 – 05/09/2020 
692 
2,608 
6,635 
1,384 
3,561 
1,074 
73.9"
[14] https://www.businesswire.com/news/home/20251106150841/en/Synchron-Raises-%24200-Million-Series-D-to-Advance-Brain-Computer-Interface-Technology
    > "Stentrode BCIs have been placed in 10 patients with paralysis to date, across clinical trials in the U.S. and Australia."
[15] https://kommunikasjon.ntb.no/pressemelding/18780443/onward-medical-completes-two-additional-brain-computer-interface-implants-paired-with-spinal-cord-stimulation-technology-to-restore-thought-driven-movement?lang=en&publisherId=4954260
    > "Seven study participants have now received ARC-BCI Therapy to restore movement of their own paralyzed limbs"
[16] https://www.michiganmedicine.org/news-release/university-michigan-implants-first-human-paradromics-wireless-brain-computer-interface-designed
    > "The participant will be followed for six years following the BCI implant."
[17] https://neuralink.com/updates/prime-study-progress-update
    > "we conducted the first human implantation of our brain-computer interface (BCI)."
[18] https://neuralink.com/updates/prime-study-progress-update-second-participant
    > "the second participant in our PRIME Study,** received his Neuralink implant (Link)."
[19] https://neuralink.com/updates/a-year-of-telepathy
    > "Today, there are three people with Telepathy: Noland, Alex, and Brad."
[20] https://neuralink.com/updates/neuralink-raises-650m-series-e
    > "Five individuals with severe paralysis are now using Neuralink to control digital and physical devices with their thoughts"
[21] https://neuralink.com/updates/two-years-of-telepathy
    > "we have since seen higher signal quality across 18 of the subsequent 20 participants."
[22] https://static-content.springer.com/esm/art%3A10.1038%2Fs44222-024-00239-5/MediaObjects/44222_2024_239_MOESM1_ESM.pdf
    > "Supplementary table 2| List of implanted participants."
[23] https://paradromics.com/news/paradromics-completes-first-human-brain-computer-interface-bci-implantation
    > "The first participant, a Michigan woman who has difficulty speaking due to motor neuron disease, was enrolled and implanted by Paradromics, the University of Michigan, and Dr. Willsey, and will be followed and evaluated over the next six years."
