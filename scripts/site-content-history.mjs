// Optional one-time parity check. Never compares today's mutable copy to the migration receipt.
// This immutable Git tree contains the initial working JSON, blog sources/HTML, receipt,
// archive, adapter, renderers, and the original 29 parity/capture tests reviewed together.
import { spawnSync } from 'node:child_process'
import { mkdtempSync, realpathSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

const initialMigration = '503060e7287f3bd4c1537544fe57962f9d96b6fb'
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { maxBuffer: 64 * 1024 * 1024, ...options })
  if (result.error || result.status !== 0) {
    throw new Error(`${command} failed: ${result.error?.message || result.stderr?.toString() || result.status}`)
  }
  return result
}
const directory = mkdtempSync(path.join(tmpdir(), 'plrd-initial-content-'))
try {
  // No checkout/ref changes and no reads from live CMS services.
  run('git', ['cat-file', '-e', `${initialMigration}^{commit}`])
  const archive = run('git', ['archive', initialMigration, 'src', 'scripts', 'content/blog', 'package.json', 'tsconfig.json'])
  run('tar', ['-xf', '-', '-C', directory], { input: archive.stdout })
  symlinkSync(realpathSync('node_modules'), path.join(directory, 'node_modules'), 'dir')
  console.log(`Historical content parity at immutable migration tree ${initialMigration}`)
  const result = spawnSync(process.execPath, ['--test',
    'scripts/site-content.test.mjs', 'scripts/site-content-data.test.mjs',
    'scripts/site-content-render.test.mjs', 'scripts/site-content-snapshot.test.mjs',
  ], { cwd: directory, stdio: 'inherit', timeout: 120_000 })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
} finally {
  rmSync(directory, { recursive: true, force: true })
}
