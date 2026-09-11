import assert from 'node:assert/strict'
import { test } from 'node:test'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const request = (query = '') => new Request(`https://www.plrd.org/api/ai/search/${query}`)
test('read-only access returns deterministic bounded search and canonical detail', async () => {
  assert.ok(existsSync('src/lib/ai-access.ts'), 'public HTTP access is required')
  const { createAiAccess } = source('lib/ai-access.ts')
  const api = createAiAccess()
  const response = api.search(request('?q=connectome&kind=publication&limit=2'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /^application\/json/)
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff')
  const result = await response.json()
  assert.equal(result.schemaVersion, '1.0')
  assert.ok(result.total > 0)
  assert.ok(result.results.length <= 2)
  assert.deepEqual(result, await api.search(request('?q=connectome&kind=publication&limit=2')).json())
  const r = result.results[0]
  const detail = await api.detail(r.kind, r.slug).json()
  assert.equal(detail.record.canonicalUrl, r.canonicalUrl)
  assert.equal(detail.record.visibility, undefined)
  assert.ok(r.markdownUrl.endsWith('/'))
  assert.ok(!('body' in r))
  assert.equal((await api.search(request('?q=zzzznomatchzzzz')).json()).total, 0)
  for (const query of ['?limit=0', '?limit=51', '?limit=1.5', '?offset=-1', '?offset=10001', '?kind=other', '?q=a&q=b', '?url=http://127.0.0.1', '?q='+ 'a'.repeat(201), '?area=bogus', '?offset=01']) {
    assert.equal(api.search(request(query)).status, 400, query)
  }
  assert.equal(api.detail('blog', 'does-not-exist').status, 404)
  assert.equal(api.detail('admin', 'account').status, 404)
  assert.equal(api.detail('blog', '../about').status, 404)
  const page1 = await api.search(request('?limit=2')).json()
  const page2 = await api.search(request('?limit=2&offset=2')).json()
  assert.equal(page1.nextOffset, 2)
  assert.ok(page1.results.every(a => !page2.results.some(b => b.id === a.id)))
  const end = await api.search(request('?offset=10000')).json()
  assert.deepEqual(end.results, [])
  assert.equal(end.nextOffset, null)
})
