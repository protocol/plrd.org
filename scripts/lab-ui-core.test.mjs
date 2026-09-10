import { test } from "node:test";
import assert from "node:assert/strict";
import { source } from "./velocity/test-source-loader.mjs";

test("client adapter fails closed on missing public backend and absent SDK identity; rejects unsafe URLs", async () => {
  const { createLabClient, safeUrl } = source("lib/lab-client.ts");
  const offline = createLabClient(
    async () => new Response("missing", { status: 404 }),
  );
  assert.equal((await offline.capabilities()).canPublish, false);
  assert.equal((await offline.feed()).status, "unavailable");
  await assert.rejects(
    offline.publish("note", { text: "hi" }),
    /Sign in with your Open Lab identity/i,
  );
  const malformed = createLabClient(async () => Response.json({ ok: true }));
  // HTTP receipts cannot substitute for an injected SDK identity. Exact SDK receipt
  // validation is exercised by lab-integration-client and lab-protocol-writes.
  await assert.rejects(malformed.publish("note", { text: "hi" }), /Sign in with your Open Lab identity/i);
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,test",
    "http://localhost/a",
    "https://x.com@evil.test/",
  ])
    assert.equal(safeUrl(url), null);
  assert.equal(safeUrl("https://marimo.io/"), "https://marimo.io/");
});

test("public adapter preserves source provenance; notebook requires an explicit DID", async () => {
  const { createLabClient } = source("lib/lab-client.ts");
  const post = { uri: "at://did:plc:fixture/app.bsky.feed.post/one", text: "Fixture post", author: { did: "did:plc:fixture", handle: "fixture.test", displayName: { invalid: true } }, url: "https://bsky.app/profile/fixture.test/post/one", createdAt: "2026-09-10T12:00:00Z" };
  const c = createLabClient(async () => Response.json({ items: [post], sourceLabel: "Fixture source", sourceUrl: "https://bsky.app/profile/fixture.test/feed/science", status: "live", fetchedAt: "2026-09-10T12:00:00Z" }));
  const feed = await c.feed();
  assert.equal(feed.sourceUrl, "https://bsky.app/profile/fixture.test/feed/science");
  assert.equal(feed.items[0].author.displayName, undefined);
  const malformed = createLabClient(async () => Response.json({ profile: { workingOn: "Fixture", interests: {}, lookingFor: "" }, records: [] }));
  await assert.rejects(malformed.records(), /explicit Open Lab DID/i);
});

test("HTTP client never substitutes for the dedicated SDK identity", async () => {
  let calls = 0;
  const client = source("lib/lab-client.ts").createLabClient(async () => {
    calls++;
    return Response.json({ redirectUrl: "https://example.org/oauth" });
  });
  await assert.rejects(client.login("fixture.bsky.social", "/lab/profile/"), /unavailable|integrat/i);
  assert.equal(calls, 0);
});

test("editorial starter search relates artifacts by topic, never member metrics", () => {
  const { artifacts, filterArtifacts, relatedArtifacts } =
    source("lib/lab-data.ts");
  assert.ok(artifacts.length >= 6);
  assert.equal(
    filterArtifacts(artifacts, {
      query: "MARIMO",
      field: "all",
      type: "all",
    })[0].id,
    "marimo",
  );
  assert.equal(
    filterArtifacts(artifacts, {
      query: "",
      field: "neurotech",
      type: "all",
    }).every((a) => a.field === "neurotech"),
    true,
  );
  const related = relatedArtifacts("neuromatch");
  assert.ok(related.some((a) => a.field === "neurotech"));
  for (const a of artifacts) {
    assert.match(a.url, /^https:\/\//);
    assert.ok(a.source);
    assert.equal(a.followers, undefined);
  }
});

test("bounded work packet contains source provenance, output schema and no dispatch fiction", () => {
  const { buildWorkPacket, packetMarkdown } = source("lib/lab-packets.ts");
  const p = buildWorkPacket("reference-audit", "review", 25);
  assert.equal(p.taskId, "flywire-source-audit-v1");
  assert.equal(p.budgetHintMinutes, 25);
  assert.ok(p.sourceUrls.length > 0);
  assert.ok(p.stopConditions.length > 2);
  assert.ok(p.outputSchema);
  assert.match(packetMarkdown(p), /Human acceptance/);
  assert.throws(
    () => buildWorkPacket("reference-audit", "review", -1),
    /budget/i,
  );
});

test("paired audit packets hold one exact claim/source and parent-compatible independent return templates", () => {
  const { buildPairedWorkPackets, packetMarkdown, buildWorkPacket } = source("lib/lab-packets.ts");
  assert.equal(typeof buildPairedWorkPackets, "function");
  const [research, review] = buildPairedWorkPackets(30);
  assert.equal(research.taskId, "flywire-source-audit-v1");
  assert.equal(research.claim, review.claim);
  assert.equal(research.sourceUrl, "https://www.nih.gov/news-events/nih-research-matters/complete-wiring-map-adult-fruit-fly-brain");
  assert.equal(review.sourceUrl, research.sourceUrl);
  assert.equal(research.returnTemplate.role, "research");
  assert.equal(review.returnTemplate.role, "review");
  assert.deepEqual(Object.keys(review.returnTemplate).sort(), ["schemaVersion", "taskId", "sourceUrl", "role", "contributor", "runner", "quote", "location", "assessment", "limitation"].sort());
  assert.match(review.instructions, /before reading a research return/);
  assert.match(packetMarkdown(review), /Return template/);
  assert.match(packetMarkdown(review), /FlyWire/);
  assert.throws(() => buildWorkPacket("reference-audit", "reproduce", 30), /research or review/);
  assert.throws(() => buildPairedWorkPackets(5.5), /whole/);
});

test("synthetic signal is deterministic, sampling changes measurements, reset parameters reproduce output", () => {
  const { sampleSignal } = source("lib/lab-signal.ts");
  const a = sampleSignal(5, 40, 0);
  const b = sampleSignal(5, 10, 0);
  assert.deepEqual(a, sampleSignal(5, 40, 0));
  assert.equal(a.length, 41);
  assert.equal(b.length, 11);
  assert.ok(Math.abs(a[2].value - 1) < 1e-9);
  assert.throws(() => sampleSignal(5, 0, 0), /sample/i);
});

test("signal experiment export preserves the exact model, configuration, aliasing lesson, and result", () => {
  const { buildSignalExperiment, sampleSignal } = source("lib/lab-signal.ts");
  assert.equal(typeof buildSignalExperiment, "function", "export a reproducible experiment, not just anonymous points");
  const e = buildSignalExperiment(12, 16, 0);
  assert.equal(e.version, 1);
  assert.equal(e.configuration.frequencyHz, 12);
  assert.equal(e.result.foldedFrequencyHz, 4);
  assert.equal(e.result.samplingRisk, "aliasing");
  assert.match(e.model.noise, /127\.1/);
  assert.deepEqual(e.samples, sampleSignal(12, 16, 0));
  assert.deepEqual(e, JSON.parse(JSON.stringify(buildSignalExperiment(12, 16, 0))));
  assert.ok(e.samples.every(p => Math.abs(p.value + Math.sin(2 * Math.PI * 4 * p.time)) < 1e-12));
  assert.equal(buildSignalExperiment(5, 10, 0).result.samplingRisk, "nyquist-boundary");
  assert.equal(buildSignalExperiment(5, 40, 0).result.samplingRisk, "above-nyquist");
  assert.match(e.limitation, /synthetic/i);
});

test("record editor validates source URLs and required content, serializes profile interests", () => {
  const { validateEntry, entryPayload } = source("lib/lab-entry.ts");
  assert.ok(
    validateEntry("app", {
      title: "A",
      url: "javascript:1",
      description: "Use",
      field: "neurotech",
    }).url,
  );
  assert.ok(
    validateEntry("note", {
      text: "",
      postType: "question",
      field: "cross-field",
    }).text,
  );
  assert.deepEqual(
    entryPayload("profile", {
      workingOn: "A",
      interests: "neural maps, open tools",
      lookingFor: "review",
    }).interests,
    ["neural maps", "open tools"],
  );
  assert.equal(
    Object.keys(
      validateEntry("contribution", {
        targetUrl: "https://example.org/",
        observation: "A correction",
        evidenceUrl: "https://example.org/evidence",
        field: "neurotech",
      }),
    ).length,
    0,
  );
});

test("drafts round-trip by kind and owner, reject corruption, and report blocked storage", () => {
  const { saveDraft, loadDraft, draftKey } = source("lib/lab-drafts.ts");
  const store = new Map();
  const storage = {
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => store.set(k, v),
    removeItem: (k) => store.delete(k),
  };
  assert.equal(
    saveDraft(storage, "note", "guest", { text: "An unfinished question" }).ok,
    true,
  );
  assert.deepEqual(loadDraft(storage, "note", "guest").data, {
    text: "An unfinished question",
  });
  assert.equal(loadDraft(storage, "note", "did:plc:other").data, null);
  store.set(draftKey("note", "guest"), "{broken");
  assert.equal(loadDraft(storage, "note", "guest").status, "corrupt");
  assert.equal(
    saveDraft(
      {
        setItem() {
          throw Error("quota");
        },
      },
      "note",
      "guest",
      {},
    ).ok,
    false,
  );
});
