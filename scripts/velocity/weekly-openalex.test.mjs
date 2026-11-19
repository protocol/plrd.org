import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// The standard npm test glob includes this file. Python fixtures are wholly
// synthetic, use temporary directories, and never acquire real source data.
test('weekly OpenAlex runner: offline Python contract + real replay/install CLI', { timeout: 120_000 }, () => {
  const cwd = fileURLToPath(new URL('../../', import.meta.url));
  const result = spawnSync('python3', ['-B', '-m', 'unittest',
    'scripts.velocity.test_weekly_openalex', 'scripts.velocity.test_openalex_refresh', '-v'],
    { cwd, encoding: 'utf8', timeout: 110_000, maxBuffer: 2_000_000 });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stderr, /Ran \d+ tests/);
  assert.match(result.stderr, /\bOK\b/);
});
