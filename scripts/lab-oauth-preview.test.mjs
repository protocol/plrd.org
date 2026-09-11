import test from 'node:test'
import assert from 'node:assert/strict'
import { source } from './velocity/test-source-loader.mjs'
const { getLabOAuthConfig, configForBrowser } = source('lib/lab-oauth-config.ts')
const alias = 'plrdorg-git-feat-open-lab-protocol.vercel.app'
const env = { VERCEL: '1', VERCEL_ENV: 'preview', VERCEL_URL: 'example-unique-team.vercel.app', VERCEL_BRANCH_URL: alias }

test('connection return route is allowed without opening external or generic redirects', () => {
  const { safeLabReturnTo } = source('lib/lab-oauth-config.ts')
  assert.equal(safeLabReturnTo('/lab/people/#bluesky-connections'), '/lab/people/#bluesky-connections')
  assert.equal(safeLabReturnTo('/lab/people/?next=https://attacker.example.org'), '/lab/')
})

test('trusted deployment branch alias is the stable exact preview OAuth identity', async () => {
  const config = getLabOAuthConfig(env)
  assert.equal(config.origin, `https://${alias}`)
  assert.equal(configForBrowser(config, `https://${alias}`).canSignIn, true)
  assert.equal(config.oauthVerified, false)
  assert.equal(configForBrowser(config, `https://${env.VERCEL_URL}`).canSignIn, false)
  assert.equal(configForBrowser(config, 'https://another-git-branch-team.vercel.app').canSignIn, false)
  const previous = { ...process.env }
  try {
    delete process.env.LAB_PUBLIC_URL
    Object.assign(process.env, env)
    const response = source('app/api/lab/oauth/client-metadata.json/route.ts').GET(new Request(config.clientId, { headers: { host: 'attacker.example.org', forwarded: 'host=attacker.example.org', 'x-forwarded-host': 'attacker.example.org' } }))
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), config.metadata)
    const caps = source('app/api/lab/capabilities/route.ts').GET(new Request(`https://${alias}/api/lab/capabilities/`))
    assert.equal((await caps.json()).canSignIn, true)
  } finally { for (const key of Object.keys(process.env)) if (!(key in previous)) delete process.env[key]; Object.assign(process.env, previous) }
})

test('explicit empty disables; inherited production and malformed branch identities fail closed', () => {
  assert.equal(getLabOAuthConfig({ ...env, LAB_PUBLIC_URL: '' }).canSignIn, false)
  assert.equal(getLabOAuthConfig({ ...env, LAB_PUBLIC_URL: 'https://www.example.org' }).canSignIn, false)
  assert.equal(getLabOAuthConfig({ ...env, LAB_PUBLIC_URL: `https://${alias}` }).canSignIn, true)
  for (const bad of ['', 'evil.example.org', 'https://branch.vercel.app', '-bad.vercel.app', 'bad-.vercel.app', 'a'.repeat(64)+'.vercel.app', 'branch.vercel.app/path', 'branch.vercel.app:443', 'branch.vercel.app\n']) {
    assert.equal(getLabOAuthConfig({ ...env, VERCEL_BRANCH_URL: bad }).canSignIn, false, JSON.stringify(bad))
  }
  assert.equal(getLabOAuthConfig({ ...env, VERCEL: undefined }).canSignIn, false)
  assert.equal(getLabOAuthConfig({ ...env, VERCEL_ENV: 'production' }).origin, `https://${env.VERCEL_URL}`)
  assert.equal(getLabOAuthConfig({ ...env, VERCEL_BRANCH_URL: undefined }).origin, `https://${env.VERCEL_URL}`)
})
