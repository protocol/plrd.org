import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const publication = JSON.parse(readFileSync('src/data/site-content/publication.json', 'utf8'))
const { GET } = source('app/.well-known/site.standard.publication/route.ts')

test('published discovery identity comes from GitHub with no environment setting or network', async (t) => {
  delete process.env.NEXT_PUBLIC_PUBLICATION_URI
  const network = t.mock.method(globalThis, 'fetch', () => { throw new Error('No network expected') })
  const response = await GET()
  assert.equal(response.status, 200)
  assert.equal(await response.text(), publication.uri)
  assert.match(response.headers.get('content-type'), /^text\/plain/)
  assert.equal(network.mock.callCount(), 0)
})

test('deployment configuration cannot override the repository publication identity', async () => {
  process.env.NEXT_PUBLIC_PUBLICATION_URI = 'at://did:example:synthetic/site.standard.publication/fixture'
  assert.equal(await (await GET()).text(), publication.uri)
  delete process.env.NEXT_PUBLIC_PUBLICATION_URI
})
