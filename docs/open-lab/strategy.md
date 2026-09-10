# Open Lab: a place for science before it’s finished

**Product proposal · September 2026 · not a launch announcement**

## The bet

PL R&D should not compete with Bluesky for another timeline. It should make a particular kind of encounter happen: someone brings an unfinished piece of science, and someone else makes it easier to finish.

The smallest useful unit is not a profile or a post. It is **work with an opening**: a question with a missing dataset, a working demo that needs a user, a claim that needs replication, or a research map with a missing source. The feed, app showcase, Atlas, and agent collaboration are different views of that same work—not four separate communities to populate.

The invitation is **“A place for science before it’s finished.”** “Breakthrough” provides ambition, but cannot be the admission requirement. Rough tools, negative results, replication attempts, and precise questions must belong here. Otherwise, this becomes a stage for polished announcements, not a place to work.

## Why somebody joins

A builder gets a legible home for a useful science app and a way to ask for a specific next contribution. A researcher gets collaborators around the problem they are working on, not an institution-shaped directory. A curious person can improve a source, test a tool, or reproduce a small result without claiming to be a principal investigator. Someone with an agent can contribute a bounded piece of work without giving a platform their account keys.

Browsing should be useful before signing in. The first session should produce something even when nobody else is online: a tool tried, an evidence note drafted, a research profile assembled, or a concrete work packet downloaded. Sign-in comes when a person wants a durable public identity and contribution record. Existing Bluesky identity is a reduction in friction, not the value proposition itself.

### A first-session loop

1. Enter through a tool or an open question, not a blank feed.
2. See what it makes possible, its source, what is unverified, and what help would matter.
3. Choose a small action: try it, add evidence, offer help, or take a work packet.
4. Use an existing AT Protocol account when ready to publish. Preview the exact public content first.
5. Return because another person used or responded to the contribution—not because an engagement counter went up.

The longer loop is **question → useful artifact → independent contribution → better artifact → new question**. The application should make those links visible.

## How the destination fits together

**The landing page** is an invitation with a window into the work. Its editorial typography and PL blue remain related to the public site, while the wider canvas and inspectable map make the transition into a working space apparent. The brochure remains the home for institutional context; Open Lab is the home for participation.

**The workbench** contains questions, findings, tools, requests for help, and negative results. The prompt can ask, “What breakthrough are you working on?” while explicitly welcoming work that has not succeeded yet. Work should carry a next action or a source, rather than reward a confident-sounding announcement.

**Apps** provide the most immediate reason to visit. Open the thing, understand what it enables, inspect its code when available, and see what its maker needs. The desired energy is “I built a weirdly useful thing over the weekend,” not procurement. But a public URL does not imply open-source licensing, safety, reproducibility, or endorsement. External apps remain external unless deliberately reviewed for integration.

**Atlas contributions** turn passive maps into answerable questions. “Add a source for this observation” is more actionable than “Contribute to the ecosystem.” A submission is proposed evidence, not an accepted change to the Atlas. Its source, target, author, and review status must remain distinct.

**Collaborate** starts with bounded work, not a theatrical “launch 10,000 agents” button. A person can inspect a task, select a role, set a budget in their own environment, and export a work packet with clear outputs and stopping conditions. A future coordinator can assign and reconcile those packets once there is a working verification method.

**My bench** is a research identity: what I am working on, what I can contribute, what I need, and links to GitHub or Google Scholar. Links should be labeled links, not implied account integrations or proof of credentials. Institutional prestige should not determine who can contribute.

**The map** is an alternate way to discover work, not decorative proof that a community exists. A point must correspond to an inspectable artifact. A line must have an explainable meaning, such as a shared topic or an explicit contribution. Topic similarity is not a collaboration relationship. A curated starter map and a live community map must not be presented as the same thing.

## Science-shaped, without counterfeit science

A light touch of humor helps: “Promising,” “Needs a second pair of eyes,” or “Worth an experiment.” Renaming a heart “Peer reviewed” would be a mistake. It turns a social gesture into a scientific assertion, even if intended as a joke.

Use separate meanings:

- **Interest:** I want to follow this, try it, or save it. Not scientific validation.
- **Evidence:** here is an observation, source, run, or counterexample.
- **Review:** a named person checked a stated part of the work, with a linked record of what they checked.
- **Replication:** a specified procedure was rerun, with its result and limitations.

A result should not graduate through those stages by accumulating votes. Negative findings and useful corrections should be first-class contributions. No reputation score is needed at the start.

## Pool work, not credentials

The motivating OpenAI example is real as an announcement: its [September 8 report](https://openai.com/index/navier-stokes-solution/) describes a proposed Navier–Stokes solution from a group on the order of 10,000 concurrent agents, about 88 hours, and a further Lean formalization/verification phase. It also says the research used an internal model more capable than the publicly available Astra model. That is not evidence that a pile of interchangeable consumer tokens produces the same result, or that independent mathematical acceptance is already complete.

Nothing fundamental prevents people from contributing separately funded agent work to a common project. The difficult parts are making the work decomposable, preventing duplicated effort, checking outputs cheaply, and combining useful intermediate results. Provider tokens are not a common currency: models, context limits, tools, prices, licenses, and account terms differ.

The right first experiment is narrow. For example: audit a small source packet for a public research map. Each task names a claim and source; the worker returns an exact quote/location, a judgment of support, and limitations. A different contributor reviews it. This tests the coordination loop before asking it to discover new mathematics.

A later execution service needs task leases, idempotency, checkpointed artifacts, provenance, a review queue, contributor-controlled spending limits, and defenses against malicious instructions in source material. Downloading a work packet is not execution. Publishing an intent is not a reserved task. Uploading a result is not verification. Keep these boundaries visible.

**Bring your agent. Keep your keys.** Contributors run tools in their own controlled environment. Open Lab does not collect model-provider credentials, pool subscriptions, debit a card, or execute arbitrary submitted code. Human acceptance and automated checks are separate records.

## A launch that can learn something

Do not open with an empty public network and hope the graph fills in. Start with a deliberately small, consented founding cohort: builders of useful science tools, researchers with answerable asks, and people willing to reproduce or review. These are proposed roles, not recruited participants.

Before inviting that cohort:

- Seed a small source-checked editorial collection, visibly separate from members’ contributions.
- Obtain permission from featured makers before describing them as participants or using their names as social proof.
- Have an accountable curator and an explicit weekly time allocation. A feed is not a substitute for facilitation.
- Put a small next action on every founding project. Avoid giant unsplittable challenges.
- Run one complete contribution cycle through independent acceptance and correction.
- Establish public-content, moderation, reporting, deletion, and appeals expectations. Public AT Protocol records can be copied by others; deleting a local view cannot promise universal deletion.
- Instrument completed useful contributions, not just sign-ins. Do not infer membership from an imported Bluesky post.

**Primary proposed metric:** weekly artifacts improved by a contribution from someone other than the original author. Keep the denominator and acceptance criterion visible. Supporting measures are visitor-to-first-useful-action, time to first qualified response, and contributors who return to complete another piece of work.

**A proposed six-week decision:** continue only if people independently bring new work and other people improve it without the curator manufacturing every interaction. If people enjoy browsing apps but do not collaborate, narrow into a genuinely good science-tool directory. If agent runs generate volumes of unverifiable text, stop expanding compute and repair the task/evaluation design. If contributors use Bluesky for the whole loop and Open Lab adds no artifact-level value, keep the useful views and drop the new destination ambition.

## What this PR should prove—and what it cannot

The first PR should let someone experience the invitation, explore real source-labeled work, try a small actual app, draft contributions, prepare a research profile, and export a concrete agent work packet. It should contain a genuine AT Protocol implementation rather than an email-signup façade, with readiness and unverified deployment steps stated precisely in its technical notes.

It cannot manufacture a community, confer peer review, promise scientific breakthroughs, or make new record types globally discoverable merely by writing them to a personal data server. Global discovery, moderation operations, and evidence acceptance are explicit launch work. The interactive PR is a product bet to evaluate—not an announcement that those systems already exist.
