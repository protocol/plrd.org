import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const guide = readFileSync('docs/content-migration.md', 'utf8')
const receipt = JSON.parse(readFileSync('src/data/site-content/migration-receipt.json', 'utf8'))

test('public content guidance describes integrated behavior, not internal handoff directives', () => {
  for (const text of [guide, ...receipt.verification.limits]) {
    assert.doesNotMatch(text, /\bparent (?:integration|must)\b/i, 'internal integration directive in public guidance')
    assert.doesNotMatch(text, /\/opt\/(?:data|henry)\/|slack\.com\/archives\/|\bC0[A-Z0-9]{9}\b/, 'private operational reference in public guidance')
  }
  assert.match(guide, /node scripts\/site-content-history\.mjs/)
  assert.match(guide, /npm test/)
  assert.match(guide, /\.well-known\/site\.standard\.publication[^\n]*REPO_PUBLICATION_URI/)
  assert.match(guide, /(?:do not|never) (?:rewrite|update)[^\n]*initial[^\n]*receipt/i)
})
