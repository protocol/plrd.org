# Science map: broad coverage, readable navigation

## Decision

Use the [OpenAlex Topics hierarchy](https://help.openalex.org/data/topics/) as a locally bundled research-literature atlas. The [official classification repository](https://github.com/ourresearch/openalex-topic-classification) links the exact source table. This snapshot contains **4 domains, 26 fields, 252 subfields, and 4,516 topics**, rather than limiting the map to PL R&D's focus areas.

The refresh script records source URL, retrieval date, checksum, hierarchy counts, and explicit classification limits. Source identifiers and parent relationships are preserved, including surprising classifications. Parent verification compared every topic name and parent against the acquired CSV. The source CSV's SHA-256 is `f1493b5448d6998b58a76e62b6829401ca2771300b713ce5d8803780ca9d47be`.

## Why this, not a globe of nodes

The interaction decision is a readable, bounded **2D branch map**, with pan/zoom/reset, breadcrumbs, a full-snapshot search, stable branch links, and a complete HTML list alternative. Phones start in list view. A 3D view would add camera control and occlusion before it adds useful navigation; it also requires graphics support the accessible path must not depend on. This is a design judgment, not a performance benchmark.

[ETO's Map of Science](https://sciencemap.eto.tech/) is a useful reference for a broad research map rather than a narrow institutional map. Its underlying corpus is different; none of its cluster data or layout is copied here. [OpenAlex's classification documentation](https://help.openalex.org/data/topics/) makes its own hierarchy, IDs, and machine-generated topic descriptions explicit, so it is the practical backbone for this preview.

## What a line means

A line means **contains**, following the source hierarchy. It does not mean “causes,” “must be learned first,” “technological prerequisite,” or measured scientific similarity. PL R&D's contextual briefs are an explicitly editorial overlay, not the extent of science and not source-authored OpenAlex mappings.

This is broad coverage of indexed research literature, not an exhaustive ontology of every concept, invention, or unpublished discovery. OpenAlex topics come from citation clusters; topic labels and descriptions are machine-generated. Keywords are source facets, not an invented fifth taxonomy level. The interface should make these distinctions available without turning every branch into a disclaimer wall.

## The next useful extension

Validate whether researchers can locate a question, inspect its source, and navigate to a neighboring branch without losing their place. Add reviewed crosslinks and topic-linked working groups only when they create a real next action. A taxonomy alone does not create community activity, prerequisite knowledge, or a reason to return daily; the [catch-up and contribution journeys](./v3-product-journeys.md) carry that part of the product.
