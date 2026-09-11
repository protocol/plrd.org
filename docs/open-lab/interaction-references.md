# LessWrong → Open Lab: five interaction mechanics worth borrowing

**Research date:** 11 September 2026. **Scope:** five primary-authored LessWrong documents plus two first-party source-code spot-checks; not a visual audit or comprehensive community assessment.

**Recommendation:** borrow the structures that make contributions accumulate, not the discussion feed, cultural branding, or karma economy. For Open Lab, the central loop should remain **find an artifact → take a bounded test/build task → My bench → return evidence → improve the artifact**. The recommendations and explanations below are product hypotheses, not measured effects of LessWrong's design.

## 1. Make topics durable workspaces, not disposable hashtags

**Published mechanic.** The Wiki-Tag FAQ describes concept explanations linked to collections of posts, relevance voting that orders those collections, and topic filters that increase or decrease exposure in the frontpage feed.[2] Its stated goal is longevity: “we want users to read the best and most relevant content to them – whenever it was written.”[2]

**Borrow/adapt.** Clicking a discipline or idea should open a durable page with a short explanation, notable artifacts, open tests, and recent evidence. Keep broad disciplines in the left rail and more specific idea links on artifacts. Let members suggest relevant links, with a maintainer able to merge duplicate concepts. Show *why this artifact belongs here*, not merely its popularity.

**Avoid.** A sprawling taxonomy or an AI-heavy engagement ranking that crowds out other disciplines. Start with a maintained topic set; do not copy karma-weighted authority over categorization. **Hypothesis to test:** people can find and extend prior work rather than repeatedly starting equivalent discussions.

## 2. Allocate attention deliberately; distinguish discovery from endorsement

**Published mechanic.** The June 2024 frontpage announcement describes an Enriched list mixing recent posts with personalized recommendations from older material; it also offers explicit following and bookmarking views.[3] Crucially, the author says “this feature direction is still experimental and could turn out to be a bad idea.”[3] Separately, the FAQ describes editorial curation of material considered “well-written, insightful, instructive, or otherwise important.”[5]

**Borrow/adapt.** Give Open Lab a compact default view of **work worth joining**, with clear alternatives such as Following and Recent evidence. Resurface older artifacts when a test remains open or new evidence changes their status. A small editor-selected “Worth building on” section should say *why selected*. Recommendation reasons should be plain: “You follow materials science” or “Needs your measurement skill.”

**Avoid.** Copying the published mixing ratio, opaque personalization, endless feed tuning, or treating “featured” as scientifically validated. Begin with explicit follows and simple task/status filters; sophisticated recommendations need not precede a useful collaboration loop.

## 3. Put contribution norms at the point of contribution

**Documented mechanic.** LessWrong's source defines frontpage/default comment guidance including “Try to offer concrete models and predictions,” alongside explanation rather than persuasion, curiosity about disagreement, and willingness to change one's mind.[7] The FAQ also describes author-specific moderation guidelines displayed with comment areas.[5]

**Borrow/adapt.** Put one short, contextual prompt in the response composer: **What did you try? What happened? What would distinguish the competing explanations?** Offer response types such as Question, Test result, Build update, and Correction. For a test result, ask for method, evidence attachment/link, and limitations; do not impose those fields on a simple question. Make the artifact's maintainer and discussion expectations visible.

**Avoid.** Copying insider vocabulary, making fluency in a canon an entry requirement, or confusing agreement with contribution quality. Do not let maintainers silently erase adverse test results: preserve evidence history and provide a moderation escalation path. **Hypothesis to test:** more replies change the artifact or the next experiment, rather than merely expressing approval.

## 4. Separate exploratory notes from focused collaboration—and preserve the result

**Published/source mechanic.** The dialogue announcement calls a dialogue “a space for a few invited people to speak with each other,” with consent-based invitations, shared drafting, and publication of the exchange.[1] The checked Shortform component separately exposes a “New quick take” entry point; this establishes a distinct format in source, not its effect on participation.[6]

**Borrow/adapt.** Allow lightweight **bench notes** without presenting them as achievements. From an artifact, let someone accept a concrete task or invite a consenting collaborator to a focused working thread. Keep its question, deliverable, evidence requirements, and participants attached to the same artifact. Put accepted work in My bench; the completion action is **Return evidence**, not “Post update.” Publish a concise result with contributor credit and remaining uncertainty, rather than requiring readers to reconstruct a chat.

**Avoid.** A separate microblog feed that becomes the product, premature real-time co-editing, compulsory public drafting, or dialogue as spectacle. Use small working threads to finish things. Open Lab's proposed Question mode is an adaptation; LessWrong's current dedicated Questions UI was not verified.

## 5. Revisit claims after use; promote demonstrated value rather than launch excitement

**Published mechanic.** The 2024 Review announcement, published in December 2025, separates nomination, written review, and final voting.[4] Review prompts include “Is there a subclaim of this post that you can test?” and ask about effects on thinking/actions and useful follow-up work.[4] The described final-vote UI requires at least a brief skim of reviews; editorial judgment remains part of selection.[4]

**Borrow/adapt.** After a test or build completes, ask an identified reviewer what held up, what failed, and what changed. Periodically revisit promising artifacts, not only new submissions. Keep **featured**, **tested**, and **independently reproduced** separate, with linked evidence, dates, versions, and scope. Credit the tester and the person who found a failure, not just the original inventor.

**Avoid.** An annual voting ceremony, quadratic voting, or a popularity-derived “validated” badge. Start with lightweight review on returned evidence; add scheduled retrospectives once there is enough completed work to revisit.

## What this means for the current compact layout

**Proposed allocation:** left rail = disciplines, followed ideas/people, My bench; center = artifacts with one legible next action; right details = what exists, evidence/status, contributors, and bounded tasks. Show enough context to decide whether to help without expanding every discussion. Keep conversation subordinate to the artifact and its next test.

**Success measures to test:** time to first useful contribution; accepted tasks that return evidence; artifacts improved by another person; evidence reused across disciplines; and corrections/reproductions that change artifact status. Do not use session length, comment volume, or raw upvotes as substitutes.

## Evidence and limitations

- Article bodies were retrieved through LessWrong's documented public GraphQL API (`https://www.lesswrong.com/graphql`, read-only queries, HTTP 200). GreaterWrong copies helped discover the documents but are **not the final cited authority**.
- The homepage and `/faq` extraction returned only `x`; the parent reported an organizational browser allowlist block. No browser bypass was attempted. **Homepage pixels, current default navigation, and signed-in interaction behavior remain unverified.** The article-form FAQ was retrieved instead.[5]
- Sources [1]–[5] are live-retrieved text, but publication dates span 2019–2025. In particular, the 2024 Enriched announcement is design history, **not confirmation of today's default**.[3] The FAQ mixes historical instructions and later updates; its exact thresholds and UI instructions should not be copied.[5]
- Code references are pinned to `f9a60450f7533c019d7734e12e8c08fcd21d1576`, the public `lw-deploy` head returned during inspection, dated 19 December 2025. Source existence is not proof of current deployment or feature exposure.[6][7]
- These sources establish published intent, described workflows, and source-level affordances. This reconnaissance did **not** measure participation quality, onboarding success, moderation fairness, or causal effectiveness. LessWrong is evidence for design possibilities, not proof that those possibilities will produce Open Lab's desired outcomes.

## Sources

[1] https://www.lesswrong.com/posts/kQuSZG8ibfW6fJYmo/announcing-dialogues-1 — Announcing Dialogues
[2] https://www.lesswrong.com/posts/E6CF8JCQAWqqhg7ZA/wiki-tag-faq — Wiki-Tag FAQ
[3] https://www.lesswrong.com/posts/TDMKch5qzuaac5LFF/enriched-tab-is-now-the-default-lw-frontpage-experience-for — Enriched tab is now the default LW Frontpage experience for logged-in users
[4] https://www.lesswrong.com/posts/ZpRzTr5QBT6C3Faor/the-2024-lesswrong-review — The 2024 LessWrong Review
[5] https://www.lesswrong.com/posts/2rWKkWuPrgTMpLRbp/lesswrong-faq — LessWrong FAQ
[6] https://raw.githubusercontent.com/ForumMagnum/ForumMagnum/f9a60450f7533c019d7734e12e8c08fcd21d1576/packages/lesswrong/components/shortform/ShortformSubmitForm.tsx — ShortformSubmitForm.tsx — ForumMagnum lw-deploy source
[7] https://raw.githubusercontent.com/ForumMagnum/ForumMagnum/f9a60450f7533c019d7734e12e8c08fcd21d1576/packages/lesswrong/components/comments/ModerationGuidelines/LWModerationGuidelinesContent.ts — LWModerationGuidelinesContent.ts — ForumMagnum lw-deploy source
