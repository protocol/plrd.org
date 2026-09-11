# Open Lab: make progress worth returning for

## Product decision
Open Lab should be the place to **notice changed work, choose a useful contribution, and bring back evidence**. It should not replace a researcher's editor, GitHub, notebook environment, or agent. A catalog gives an app context and credible evidence; the app itself runs at its own destination.

These are concrete product hypotheses and implemented review-preview journeys, not findings from interviews or evidence of adoption. The existing prototype's demo activity is illustrative; local drafts and subscriptions are not shared collaboration infrastructure.

## Journey 1 — a methods reviewer with ten minutes
**Problem:** “Which of the projects I care about changed, and is there something I can actually help with?” The reviewer does not need to reread a chronological wall of discussion.

They return to **Catch up**, narrow to following or work that needs a hand, and see concise updates with a recognizable artifact, contribution request, and status. Opening a row reveals its exact source and evidence. For example, a split-before-fit experiment needs a second pair of eyes on whether held-out observations leaked into preprocessing. The reviewer saves the specific test to **My bench**, investigates, and returns a lower score or a failure just as readily as a positive result. They mark only the visible updates caught up; a changed result should become new again.

The return value is a finite, actionable queue and a persistent next step—not an endless feed or an invented “peer reviewed” reaction. The first visit must explain that there is no earlier catch-up baseline. In demo mode, “new” means unseen sample/version in this browser, not a claim about today's real activity.

## Journey 2 — a researcher finding an instrument
**Problem:** “Someone has probably built the tool I need. What does it do, can I inspect it, and what should I trust?”

They open **Find tools**, search by capability or field, and open a listing rather than a simulator. The listing exposes the actual project destination, code/license where available, a concise preview or description, limitations, and evidence/reviews with clear provenance. A useful local review names what was attempted, on which artifact/version, what happened, and what remains uncertain. An empty review section stays empty; ratings and endorsements are never manufactured. The researcher can follow/save the idea, draft a contribution, and open the tool on the publisher's site.

The return value is maintained discovery plus evidence from use. Local review drafting and editorial starter listings are a prototype of the experience, not a claim that an indexed UGC marketplace or shared review service is live.

## Journey 3 — a contributor working with an agent
**Problem:** “I can help, but my work happens in GitHub or with my own agent. How do I avoid losing the original question and deliver something reviewable?”

From the exact work item's detail, the contributor saves a bounded task and prepares a portable work brief. The brief carries the source identity, question, expected artifact, evidence requirements, constraints, and stop condition. They can copy/download it for their agent or prepare a GitHub handoff. Merely opening a draft or downloading a brief does not create an issue, run an agent, spend tokens, notify a teammate, or reserve work. User-entered repository links are validated and never fetched server-side as trusted execution instructions.

After doing the work elsewhere, they return the artifact URL and result to the same task on **My bench**. A negative or inconclusive result is useful. A later collaborator should be able to inspect exactly what changed and where the evidence lives.

The return value is continuity across tools and a reviewable result, rather than another isolated conversation. Automatic GitHub/agent synchronization is a separate integration; manual source-bound handoff must not pretend to be one.

## Journey 4 — a curious researcher outside PL R&D
**Problem:** “Where does my question sit in science, and can I find related branches without already knowing PL's focus areas?”

They open the **tech tree**, browse a broad research-literature hierarchy or search it globally, and drill from domain to field to subfield to specific topic. Breadcrumbs, deep links, back/forward, zoom/reset, and an accessible list prevent getting lost. PL R&D's focus is an overlay on this larger map. A narrow project map cannot stand in for humanity's science.

The initial data backbone is the [OpenAlex Topics hierarchy](https://help.openalex.org/data/topics/) linked from its [official classification repository](https://github.com/ourresearch/openalex-topic-classification). Its machine-generated topic labels describe citation clusters, not settled ontology or technological prerequisites. Explicitly separate hierarchical containment, keyword overlap, and any future expert-curated dependency edges. A readable 2D neighborhood with semantic zoom is the default; 3D is not useful if the only way to read a label is to orbit around another one.

## Habit and collaboration: what must be validated after the preview
A returning-user interface is not yet a returning-user product. The decisive next validation is with a small real working group using the same research problem: does someone discover a useful change, accept a bounded contribution, bring back inspectable evidence, and receive a useful response? Measure completed evidence loops and time-to-useful-action, not page views, post volume, fictional engagement, or time in app. Any metrics collection requires an explicit privacy and data plan; this document does not add tracking.

Before a public launch, the remaining shared-system work is substantial: verified account roundtrip; published schemas and indexing; cross-user activity/review synchronization; moderation/reporting; source/license handling; and transparent freshness. Keep those gates visible rather than filling empty states with simulated success.
