#!/usr/bin/env node
/**
 * Snapshot the "Full Takeoff Model" (FTM) series from Bayes Market
 * (futarchy.ai) into a committed JSON for the AI & Robotics market-signal
 * instrument.
 *
 * Bayes Market is a live Bayesian belief network over AI futures (900+ linked
 * markets). The FTM backbone is a structured, Monte-Carlo-calibrated family of
 * year-by-year markets — AGI arrival, full automation of the economy and of
 * R&D, task automation, largest training run, hardware price-performance,
 * software efficiency, compute investment share, GWP growth. Each is a
 * probability-over-time curve: a field-level "market signal" (and, read as a
 * cost/performance trajectory, a performance curve) for AI & Robotics.
 *
 * Play-money, model-derived priors — treat as an external forecast instrument,
 * not a settled outcome and not a deep real-money market. We snapshot rather
 * than live-hit: the project is early and gives no uptime guarantee, and a
 * committed curve is diffable and reviewable.
 *
 * Reads the public, CORS-open API — no auth:
 *   GET https://api.futarchy.ai/v1/net/markets
 *
 * Writes src/data/velocity/ftm-takeoff.json (committed).
 *
 * Refresh ad-hoc:  node scripts/velocity/ftm_takeoff_snapshot.mjs
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const OUT = join(ROOT, 'src/data/velocity/ftm-takeoff.json')
const API = 'https://api.futarchy.ai/v1/net/markets'

// The FTM families we keep, in display order, with a human label. Keyed by the
// stable `ftm_<slug>_..._by_<year>` variableId prefix (the part before `_by_`,
// with any trailing `_t<n>` phase marker stripped).
const FAMILIES = [
  { key: 'ftm_agi', label: 'AGI arrives' },
  { key: 'ftm_full_auto_rnd', label: 'Full automation of R&D' },
  { key: 'ftm_full_auto', label: 'Full automation of the economy' },
  { key: 'ftm_auto_rnd', label: 'AI automates 5% of R&D tasks' },
  { key: 'ftm_auto_goods', label: 'AI automates 5% of goods-and-services tasks' },
  { key: 'ftm_train_run', label: 'Largest training run threshold' },
  { key: 'ftm_hw_ratio', label: 'Hardware price-performance threshold' },
  { key: 'ftm_sw_ratio', label: 'Software efficiency threshold' },
  { key: 'ftm_gwp_compute', label: 'Compute investment share threshold' },
  { key: 'ftm_gwp_growth', label: 'GWP growth threshold' },
]

/** Longest matching family prefix for a variableId (so ftm_full_auto_rnd wins
 *  over ftm_full_auto). Returns the family key or null. */
function familyOf(variableId) {
  let best = null
  for (const f of FAMILIES) {
    const pref = `${f.key}_`
    if (variableId.startsWith(pref) && (!best || f.key.length > best.length)) best = f.key
  }
  return best
}

function yearOf(variableId) {
  const m = variableId.match(/_by_(\d{4})/)
  return m ? Number(m[1]) : null
}

async function main() {
  const res = await fetch(API, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`futarchy ${API} -> HTTP ${res.status}`)
  const body = await res.json()
  const nodes = Array.isArray(body) ? body : (body.markets ?? [])
  if (!nodes.length) throw new Error('futarchy returned no markets')

  const byFamily = new Map(FAMILIES.map((f) => [f.key, []]))
  for (const n of nodes) {
    const vid = n.variableId
    const yes = n?.marginals?.yes
    if (!vid || typeof yes !== 'number') continue
    const fam = familyOf(vid)
    if (!fam) continue
    const year = yearOf(vid)
    if (year == null) continue
    byFamily.get(fam).push({ year, prob: Number(yes.toFixed(4)), id: n.id ?? null })
  }

  const series = FAMILIES.map((f) => {
    const points = (byFamily.get(f.key) ?? []).sort((a, b) => a.year - b.year)
    return { key: f.key, label: f.label, points }
  }).filter((s) => s.points.length > 1)

  if (!series.length) throw new Error('no FTM series matched — the API schema may have changed')

  const out = {
    _provenance: {
      source: 'Bayes Market (futarchy.ai) — Full Takeoff Model belief network',
      api: API,
      note: 'Play-money, Monte-Carlo-calibrated priors. External forecast instrument, not a settled outcome or a deep real-money market.',
      generatedAt: new Date().toISOString(),
      nodeCount: nodes.length,
    },
    series,
  }

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, JSON.stringify(out, null, 2) + '\n')
  const total = series.reduce((s, x) => s + x.points.length, 0)
  console.log(`Wrote ${series.length} FTM series (${total} points) → ${OUT}`)
  for (const s of series) {
    const last = s.points[s.points.length - 1]
    console.log(`  ${s.key.padEnd(20)} ${s.points.length} pts · ${last.year}: ${Math.round(last.prob * 100)}%`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
