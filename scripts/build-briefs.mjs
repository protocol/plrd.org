#!/usr/bin/env node
/**
 * Print the FA2 briefs to one-page A4 PDFs.
 *
 *   npm run build-briefs                    # every brief
 *   npm run build-briefs why-sovereign-ai   # just one
 *
 * A brief is a JSON file in src/data/fa2/briefs/. The web edition at
 * /areas/economies-governance/briefs/<slug>/ reads the same file, so the
 * page and the paper say the same thing. This script pours the JSON into
 * scripts/briefs/template.html and prints it with headless Chrome to
 * public/briefs/<slug>.pdf, which .gitignore lets through on purpose.
 *
 * Chrome prints from a local http server rather than file://, because fonts
 * loaded over file:// are blocked by CORS and the page would fall back to
 * system faces. The rendered HTML stays in .briefs-build/ for inspection.
 */
import { spawn } from 'node:child_process'
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = resolve(ROOT, 'src/data/fa2/briefs')
const TEMPLATE = resolve(ROOT, 'scripts/briefs/template.html')
const BUILD = resolve(ROOT, '.briefs-build')
const OUT = resolve(ROOT, 'public/briefs')
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = process.env.PORT ?? '8941'

const escape = (text) =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** `{{key}}` in, string out. An unknown key is a build error, not a blank. */
function render(template, values) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`missing value: ${key}`)
    return values[key]
  })
}

function values(brief) {
  const cards = brief.reasons
    .map(
      (r, i) => `    <article class="card">
      <div><span class="k">${String(i + 1).padStart(2, '0')}</span><h3>${escape(r.title)}</h3></div>
      <p class="text">${escape(r.text)}</p>
      <div class="evidence">
        <span class="fig">${escape(r.figure)}</span>
        <p class="cap">${escape(r.caption)}</p>
        <p class="src">${escape(r.source)}</p>
      </div>
    </article>`,
    )
    .join('\n')
  const steps = brief.steps
    .map(
      (s, i) =>
        `        <li class="step"><span class="n">${i + 1}</span><p><b>${escape(s.lead)}</b> ${escape(s.text)}</p></li>`,
    )
    .join('\n')
  return {
    title: escape(brief.title),
    subtitle: escape(brief.subtitle),
    standfirst: escape(brief.standfirst),
    kicker: escape(brief.kicker),
    date: escape(brief.date),
    checked: escape(brief.checked),
    image: brief.image,
    imageAlt: escape(brief.imageAlt),
    cards,
    stepsTitle: escape(brief.stepsTitle),
    steps,
    redKicker: escape(brief.redLine.kicker),
    redTitle: escape(brief.redLine.title),
    redText: escape(brief.redLine.text),
    limitKicker: escape(brief.limit.kicker),
    limitTitle: escape(brief.limit.title),
    limitText: escape(brief.limit.text),
    sourcesNote: escape(brief.sourcesNote),
    url: escape(brief.url),
    about: escape(brief.about),
    contact: escape(brief.contact),
  }
}

const run = (cmd, args) =>
  new Promise((ok, fail) => {
    const child = spawn(cmd, args, { stdio: 'ignore' })
    // Chrome sometimes writes the PDF and then never exits; by then the file
    // is on disk, so a stuck renderer is killed rather than waited on.
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      ok()
    }, 45_000)
    child.on('error', (error) => {
      clearTimeout(timer)
      fail(error)
    })
    child.on('exit', (code) => {
      clearTimeout(timer)
      if (code === 0 || code === null) ok()
      else fail(new Error(`${cmd} exited ${code}`))
    })
  })

const wanted = process.argv.slice(2)
const slugs = readdirSync(DATA)
  .filter((f) => f.endsWith('.json'))
  .map((f) => f.replace(/\.json$/, ''))
  .filter((slug) => wanted.length === 0 || wanted.includes(slug))

if (slugs.length === 0) {
  console.error(`no such brief: ${wanted.join(', ')}`)
  process.exit(1)
}

mkdirSync(BUILD, { recursive: true })
mkdirSync(OUT, { recursive: true })
const template = readFileSync(TEMPLATE, 'utf8')

const server = spawn('python3', ['-m', 'http.server', PORT, '--directory', ROOT], { stdio: 'ignore' })
process.on('exit', () => server.kill())
await new Promise((ok) => setTimeout(ok, 1000))

try {
  for (const slug of slugs) {
    const brief = JSON.parse(readFileSync(resolve(DATA, `${slug}.json`), 'utf8'))
    writeFileSync(resolve(BUILD, `${slug}.html`), render(template, values(brief)))
    const out = resolve(OUT, `${slug}.pdf`)
    await run(CHROME, [
      '--headless',
      '--disable-gpu',
      '--no-sandbox',
      '--no-pdf-header-footer',
      // Give the web fonts and the fit script time to land before printing.
      '--virtual-time-budget=6000',
      `--print-to-pdf=${out}`,
      `http://localhost:${PORT}/.briefs-build/${slug}.html`,
    ])
    console.log(`→ ${out.replace(`${ROOT}/`, '')}`)
  }
} finally {
  server.kill()
}
