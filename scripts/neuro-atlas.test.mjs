import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const { default: config } = source('../next.config.ts')

function atlasEnv(t, values = {}) {
  for (const key of ['NEURO_ATLAS_ORIGIN', 'NEURO_ATLAS_LOCAL_QA', 'VERCEL', 'VERCEL_ENV', 'VERCEL_URL']) {
    const original = process.env[key]
    delete process.env[key]
    if (values[key] !== undefined) process.env[key] = values[key]
    t.after(() => {
      if (original === undefined) delete process.env[key]
      else process.env[key] = original
    })
  }
}

test('configured Atlas origins are strict HTTPS origins, never paths or credentials', async (t) => {
  atlasEnv(t, { NEURO_ATLAS_ORIGIN: 'https://atlas-preview.example:8443/' })
  assert.equal((await config.rewrites())[1].destination, 'https://atlas-preview.example:8443/neuro-atlas/:path*')
  for (const invalid of [
    '', 'not-a-url', 'http://atlas.example', '//atlas.example',
    'https://user:secret@atlas.example', 'https://atlas.example/neuro-atlas',
    'https://atlas.example/?token=secret', 'https://atlas.example/#fragment',
    'https://atlas.example?', 'https://atlas.example#',
    'https://atlas.example/..', ' https://atlas.example', 'https://atlas.example\\n',
    'https://atlas.example\\\\other', 'ftp://atlas.example',
  ]) {
    process.env.NEURO_ATLAS_ORIGIN = invalid
    await assert.rejects(config.rewrites(), /NEURO_ATLAS_ORIGIN/, invalid)
  }
})

test('loopback is opt-in local QA even for production builds, never hosted or remote HTTP', async (t) => {
  atlasEnv(t)
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  t.after(() => { if (previous === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous })
  for (const origin of ['http://127.0.0.1:3491', 'http://localhost:3491', 'http://[::1]:3491', 'https://localhost:3491']) {
    process.env.NEURO_ATLAS_ORIGIN = origin
    delete process.env.NEURO_ATLAS_LOCAL_QA
    await assert.rejects(config.rewrites(), /NEURO_ATLAS_ORIGIN/)
    process.env.NEURO_ATLAS_LOCAL_QA = '1'
    assert.equal((await config.rewrites())[0].destination, `${origin}/neuro-atlas`)
    for (const key of ['VERCEL', 'VERCEL_ENV', 'VERCEL_URL']) {
      process.env[key] = key === 'VERCEL' ? '1' : 'preview'
      await assert.rejects(config.rewrites(), /NEURO_ATLAS_ORIGIN/)
      delete process.env[key]
    }
  }
  for (const origin of ['http://atlas.example', 'http://localhost.example', 'http://0.0.0.0:3491', 'http://127.1:3491']) {
    process.env.NEURO_ATLAS_ORIGIN = origin
    await assert.rejects(config.rewrites(), /NEURO_ATLAS_ORIGIN/)
  }
})

test('Atlas rewrites only its root and descendants, retaining the exclusive namespace', async (t) => {
  atlasEnv(t)
  assert.equal(typeof config.rewrites, 'function', 'Atlas must have scoped rewrites')
  assert.deepEqual(await config.rewrites(), [
    { source: '/neuro-atlas', destination: 'https://neuro-atlas-app.vercel.app/neuro-atlas' },
    { source: '/neuro-atlas/:path*', destination: 'https://neuro-atlas-app.vercel.app/neuro-atlas/:path*' },
  ])
})
