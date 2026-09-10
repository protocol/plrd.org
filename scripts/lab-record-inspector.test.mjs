import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { source } from './velocity/test-source-loader.mjs'

const uri = 'at://did:plc:abcdefghijklmnopqrstuvwx/org.plresearch.lab.note/abc'
test('record share URLs preserve exact AT URI and only accept explicit Open Lab records', () => {
  assert.ok(existsSync('src/lib/lab-record-display.ts'), 'missing public record view helpers')
  const { recordPermalink, readRecordLocation } = source('lib/lab-record-display.ts')
  const link = recordPermalink('https://preview.vercel.app', uri)
  assert.equal(new URL(link).searchParams.get('uri'), uri)
  assert.deepEqual(readRecordLocation(new URL(link).search), { uri, response: null })
  for (const bad of ['at://bob.bsky.social/org.plresearch.lab.note/x', 'at://did:plc:abcdefghijklmnopqrstuvwx/app.bsky.feed.post/x', uri+'?token=x', 'https://example.org/']) {
    assert.throws(() => recordPermalink('https://preview.vercel.app', bad))
    assert.throws(() => readRecordLocation('?uri='+encodeURIComponent(bad)))
  }
  assert.throws(() => recordPermalink('https://evil.test/private', uri))
  assert.throws(() => readRecordLocation('?uri='+encodeURIComponent(uri)+'&uri='+encodeURIComponent(uri)))
})

test('PDS read adapter preserves response identity and content without calling it verified', () => {
  const m=source('lib/lab-record-display.ts')
  assert.equal(typeof m.presentPdsRecord,'function')
  const raw={uri,cid:'bafyreia',authorDid:'did:plc:abcdefghijklmnopqrstuvwx',kind:'note',data:{title:'Evidence',body:'Read the source'},pds:'https://public.example',provenance:'pds-https-unverified-signature'}
  assert.deepEqual(m.presentPdsRecord(raw),{uri,cid:'bafyreia',did:raw.authorDid,kind:'note',data:raw.data})
  assert.throws(()=>m.presentPdsRecord({...raw,authorDid:'did:plc:zzzzzzzzzzzzzzzzzzzzzzzz'}),/author/i)
})

test('untrusted public record presentation exposes only named fields, never html or control metadata', () => {
  const { displayRecord } = source('lib/lab-record-display.ts')
  const value = displayRecord({ uri, cid: 'test-cid', did: 'did:plc:abcdefghijklmnopqrstuvwx', kind:'note', data: { text: '<script>not executed</script>', postType: 'negative', field:'neurotech', oauthSession:'SECRET', evidenceUrl:'javascript:alert(1)' }, createdAt:'2026-09-01T00:00:00Z' })
  assert.equal(value.title, 'Negative result')
  assert.equal(value.rows[0].value, '<script>not executed</script>')
  assert.ok(!JSON.stringify(value).includes('SECRET'))
  assert.ok(!JSON.stringify(value).includes('javascript:'))
})
