import test from 'node:test';
import assert from 'node:assert/strict';
import { source } from './velocity/test-source-loader.mjs';
const { safeLabReturnTo } = source('lib/lab-oauth-config.ts');
const uri = 'at://did:plc:aaaaaaaaaaaaaaaaaaaaaaaa/org.plresearch.lab.note/one';
test('safe return preserves encoded exact record links and bounded editor context without URL normalization', () => {
  for (const path of [
    `/lab/record/?uri=${encodeURIComponent(uri)}&response=${encodeURIComponent(uri)}`,
    '/lab/feed/?q=open%20science&type=question&field=neurotech#draft',
    '/lab/bottlenecks/?case=reproducibility', '/lab/onboarding/?field=cross-field',
    '/lab/demo/?thread=demo-one&person=demo-person', '/lab/efforts/',
    '/lab/explorations/', '/lab/explorations/arcade/', '/lab/explorations/observatory/',
  ]) assert.equal(safeLabReturnTo(path), path);
  for (const path of [
    '//evil.org/lab/', '/lab/../lab/feed/', '/lab/%66eed/', '/lab/feed%2f/',
    '/lab/oauth/return/', '/lab/feed/?next=/lab/', '/lab/feed/?q=%zz',
    '/lab/feed/?q=%0a', '/lab/feed/?q=%5c', '/lab/feed/?field=not-a-field',
    '/lab/demo/?person=../admin', '/lab/record/?uri='+encodeURIComponent(uri+' '),
    '/lab/record/?uri='+encodeURIComponent(uri.replace('one','..')),
    '/lab/record/?uri='+encodeURIComponent(uri.replace('did:plc:aaaaaaaaaaaaaaaaaaaaaaaa','alice.example.org')),
    '/lab/record/?uri='+encodeURIComponent(uri.replace('one','%6fne')),
    '/lab/record/?uri='+encodeURIComponent(uri)+'&uri='+encodeURIComponent(uri),
    '/lab/record/?response='+encodeURIComponent(uri), '/lab/feed/?q='+('a'.repeat(201)),
  ]) assert.equal(safeLabReturnTo(path), '/lab/', path);
});
