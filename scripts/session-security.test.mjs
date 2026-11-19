import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'
import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import ts from 'typescript'

const { outputText: envModule } = ts.transpileModule(readFileSync('src/lib/env.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
})
function checkEnvironment(cookieSecret) {
  const env = { NODE_ENV: 'production' }
  if (cookieSecret !== undefined) env.COOKIE_SECRET = cookieSecret
  return spawnSync(process.execPath, ['--input-type=commonjs', '-e', envModule], {
    cwd: process.cwd(), env, encoding: 'utf8', timeout: 10_000,
  })
}

for (const [name, value] of [
  ['missing', undefined],
  ['empty', ''],
  ['short', 'too-short'],
  ['whitespace-only', ' '.repeat(40)],
  ['legacy public default', 'development-secret-at-least-32-chars!!'],
  ['example placeholder', 'your-32-character-secret-here-change-me'],
]) {
  test(`environment fails closed for a ${name} cookie secret`, () => {
    const result = checkEnvironment(value)
    assert.equal(result.error, undefined)
    assert.equal(result.signal, null)
    assert.notEqual(result.status, 0, 'unsafe configuration must not initialize')
    assert.match(result.stderr + result.stdout, /COOKIE_SECRET/)
  })
}

test('environment initializes with an explicit sufficiently long synthetic secret', () => {
  const result = checkEnvironment('synthetic-local-session-fixture-not-a-real-secret')
  assert.equal(result.error, undefined)
  assert.equal(result.status, 0, result.stderr)
})

// Synthetic local fixture only; no deployment credentials are needed by these tests.
process.env.COOKIE_SECRET = 'synthetic-local-session-fixture-not-a-real-secret'
const session = source('lib/session.ts')
const { GET } = source('app/api/status/route.ts')

test('status exposes only the public identity and login flag, never session internals', async (t) => {
  t.mock.method(session, 'getSession', async () => ({
    did: 'did:example:editor',
    handle: 'editor.example',
    displayName: 'Example Editor',
    avatar: 'https://example.invalid/avatar.png',
    oauthSession: JSON.stringify({ accessToken: 'synthetic-access', refreshToken: 'synthetic-refresh' }),
    futurePrivateField: 'synthetic-private-value',
  }))
  const response = await GET()
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), {
    did: 'did:example:editor', handle: 'editor.example', loggedIn: true,
  })
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('anonymous status uses the same minimal noncacheable response shape', async (t) => {
  t.mock.method(session, 'getSession', async () => ({}))
  const response = await GET()
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { did: null, handle: null, loggedIn: false })
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
})

test('status failures do not serialize or log raw session errors', async (t) => {
  t.mock.method(session, 'getSession', async () => { throw new Error('synthetic-private-error') })
  const errorLog = t.mock.method(console, 'error', () => {})
  const response = await GET()
  assert.equal(response.status, 500)
  assert.deepEqual(await response.json(), {})
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.doesNotMatch(JSON.stringify(errorLog.mock.calls.map(call => call.arguments)), /synthetic-private-error/)
})
