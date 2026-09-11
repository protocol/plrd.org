import test from 'node:test';
import assert from 'node:assert/strict';
import { source } from './velocity/test-source-loader.mjs';
const did = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';
const cid = 'bafyreie5nqv6kd3qnfjuprw2scvucpip4llntfhthpcwhlwuewpghmfesa';
const origin = 'https://lab.example.org';
test('client publication uses official Agent with injected SDK transport, never a CMS endpoint', async () => {
  globalThis.window = { location: { origin } };
  let stored; const calls = [];
  const session = { sub: did, did, getTokenInfo: async () => ({ sub: did, scope: 'atproto repo:org.plresearch.lab.note?action=create', aud: 'https://pds.example.org' }), fetchHandler: async (path, init) => {
    calls.push(path);
    if (path.includes('createRecord')) { const body = await new Response(init.body).json(); stored = { uri: `at://${did}/${body.collection}/${body.rkey}`, cid, value: body.record }; return Response.json({ uri: stored.uri, cid }); }
    return Response.json(stored);
  } };
  const config = source('lib/lab-oauth-config.ts').getLabOAuthConfig({ LAB_PUBLIC_URL: origin, LAB_ENABLE_PUBLISH: 'true' });
  const client = source('lib/lab-client.ts').createLabClient(async () => { throw Error('Ghost HTTP endpoint called'); }, { session, loadConfig: async () => config });
  const receipt = await client.publish('note', { text: 'Transport fixture only', postType: 'question', field: 'neurotech' }, { public: true, experimental: true, did, action: 'create' });
  assert.equal(receipt.cid, cid); assert.equal(receipt.verification, 'pds-readback');
  assert.equal(calls.length, 2); assert.match(calls[0], /createRecord/); assert.match(calls[1], /getRecord/);
  await assert.rejects(() => source('lib/lab-client.ts').createLabClient().publish('note', {}, {}), /sign in/i);
});


test('notebook reads explicit DID collection pages, exposes truncation, and never uses a server records API', async () => {
  const calls = [];
  const client = source('lib/lab-client.ts').createLabClient(async () => { throw Error('Ghost API'); }, { listRecords: async (owner, kind, options) => {
    calls.push({ owner, kind, options });
    return { authorDid: owner, kind, records: [], cursor: kind === 'note' ? 'next-page' : undefined };
  } });
  const notebook = await client.records(did);
  assert.equal(calls.length, 5); assert.ok(calls.every(c => c.owner === did && c.options.limit === 30));
  assert.equal(notebook.hasMore, true); assert.equal(notebook.limit, 30); assert.deepEqual(notebook.cursors, { note: 'next-page' });
  assert.equal(notebook.profileRecord, null);
  await assert.rejects(() => client.records(), /DID|identity/i);
});
