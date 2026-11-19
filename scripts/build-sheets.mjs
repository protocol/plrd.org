#!/usr/bin/env node
/**
 * Print the Sovereign AI program's sheets to one-page A4 PDFs, with a cover
 * plate for the shelf.
 *
 *   npm run build-sheets                          # every sheet
 *   npm run build-sheets why-sovereign-ai         # just one
 *   npm run build-sheets ~/somewhere/edition.json # a sheet kept out of this repo
 *
 * A sheet is a JSON file in src/data/fa2/sovereign-ai/ that names its layout.
 * The web edition at /areas/economies-governance/sovereign-ai/<slug>/ renders
 * the same file, so the page and the paper say the same thing. This script
 * pours the JSON into the layout of the same name below, prints it with
 * headless Chrome to public/sovereign-ai/<slug>.pdf, and renders page one of
 * that PDF to public/sovereign-ai/<slug>.webp, the plate the FA2 page stands
 * on its shelf.
 *
 * A JSON path instead of a slug prints that file to a PDF beside it and makes
 * no plate. Use it for a country edition that should not be public yet: copy
 * a sheet's JSON out of the repo, change the slug and the country's own copy,
 * and print it from there.
 *
 * Chrome prints from a local http server rather than file://, because fonts
 * loaded over file:// are blocked by CORS. The rendered HTML stays in
 * .sheets-build/ so a page can be opened and inspected. After printing, the
 * build reads the page back to report how far it had to shrink to fit, and
 * fails if the page still overflows rather than shipping a sheet with its
 * foot cut off.
 *
 * Needs Google Chrome, Python 3, and for the plates pdftoppm (poppler) and
 * magick (ImageMagick).
 */
import { spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = resolve(ROOT, 'src/data/fa2/sovereign-ai')
const BUILD = resolve(ROOT, '.sheets-build')
const OUT = resolve(ROOT, 'public/sovereign-ai')
const SITE = 'https://www.plrd.org'
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const PORT = process.env.PORT ?? '8941'

const esc = (text = '') =>
  String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** A site path becomes a full plrd.org link on paper. */
const absolute = (href) => (href.startsWith('/') ? `${SITE}${href}` : href)

/**
 * Prose, escaped, with its [label](href) links made real. The web edition
 * reads the same syntax (src/components/sovereign-ai/Rich.tsx).
 */
const rich = (text = '') =>
  String(text)
    .split(/(\[[^\]]+\]\([^)\s]+\))/g)
    .map((part) => {
      const link = part.match(/^\[([^\]]+)\]\(([^)\s]+)\)$/)
      return link ? `<a href="${esc(absolute(link[2]))}">${esc(link[1])}</a>` : esc(part)
    })
    .join('')

/** A source line, linked when it has a URL. Chrome keeps the link in the PDF. */
const source = (label, url) =>
  `<p class="src">${url ? `<a href="${esc(url)}">${esc(label)}</a>` : esc(label)}</p>`

/** The page around every layout: masthead, body, footer, and the fit script. */
function page(sheet, body, css) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${esc(sheet.title)}${sheet.subtitle ? `: ${esc(sheet.subtitle)}` : ''} · PL R&amp;D</title>
<link rel="stylesheet" href="/scripts/sheets/sheet.css">
<style>${css}</style>
</head>
<body>
<div class="sheet">
<div class="flow">
  <div class="brandline">
    <div class="brand">
      <img src="/public/images/pl_logo_mark.svg" alt="Protocol Labs">
      <span class="word">PL <span>R&amp;D</span></span>
    </div>
    <div class="filed">${esc(sheet.kicker)}<br><span class="date">${esc(sheet.date)}</span></div>
  </div>

  <section class="hero">
    <div>
      <h1>${esc(sheet.title)}</h1>
      <p class="subtitle">${esc(sheet.subtitle)}</p>
      <p class="standfirst">${rich(sheet.standfirst)}</p>
    </div>
    <div class="plate"><img src="/public${esc(sheet.image)}" alt="${esc(sheet.imageAlt)}"${sheet.imagePosition ? ` style="object-position: ${esc(sheet.imagePosition)}"` : ''}></div>
  </section>

${body}

  <div class="foot">
${sheet.notes ? `  <p class="notes">${esc(sheet.notes.label)} ${sheet.notes.items
    .map((n) => (n.url ? `<a href="${esc(n.url)}">${esc(n.label)}</a>` : esc(n.label)))
    .join(' · ')}</p>` : ''}
  <footer>
    <div class="foot-copy">
      <img src="/public/images/pl_logo_mark.svg" alt="">
      <div>
        <p><b>Protocol Labs R&amp;D</b> · ${rich(sheet.about)}</p>
        <p class="meta">© Protocol Labs, Inc. Except as noted, content licensed CC-BY 3.0.${sheet.checked ? ` Evidence checked ${esc(sheet.checked)}.` : ''}</p>
      </div>
    </div>
    ${sheet.footerCta
      ? `<a class="cta" href="${esc(sheet.footerCta.href)}">${esc(sheet.footerCta.label)}</a>`
      : `<a class="cta" href="mailto:${esc(sheet.contact)}">${esc(sheet.contact)}</a>`}
  </footer>
  </div>
</div>
</div>
<script>
/* Shrink the whole flow until it fits the page, never below a legible floor,
   and mark the page if it still overflows so a silent clip cannot ship. */
(function () {
  var FLOOR = 0.82;
  function fit() {
    var flow = document.querySelector('.flow');
    var f = 1;
    flow.style.setProperty('--fit', f);
    function over() { return flow.scrollHeight > flow.clientHeight + 1 || flow.scrollWidth > flow.clientWidth + 1; }
    while (over() && f > FLOOR) { f = Math.round((f - 0.01) * 1000) / 1000; flow.style.setProperty('--fit', f); }
    document.body.dataset.fit = String(f);
    document.body.dataset.clipped = over() ? 'true' : 'false';
  }
  fit();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
})();
</script>
</body>
</html>
`
}

/* ───────────────────────────────────────────────────────────────────────
   Blocks more than one layout shares.
   ─────────────────────────────────────────────────────────────────────── */

/** Claim cards in a row, each a claim with its evidence stacked at its foot. */
const CLAIMS_CSS = `
.props { display: grid; grid-template-columns: repeat(3, 1fr); column-gap: 3.2mm; }
.prop { display: grid; grid-template-rows: subgrid; padding: 3mm 3.2mm 2.8mm; }
.prop h2 { font-family: var(--serif); font-weight: 500; font-size: 14.5pt; line-height: 1.05; color: var(--black); margin-top: 1mm; }
.prop .promise { font-family: var(--serif); font-style: italic; font-size: 8.6pt; line-height: 1.25; color: var(--blue); margin-top: 1mm; }
.prop .text { font-size: 7pt; line-height: 1.45; color: var(--body); margin-top: 2mm; }
.ev { border-top: 0.6pt solid var(--line); padding-top: 1.8mm; margin-top: 2.2mm; }
.ev .fig { font-size: 15pt; }
.ev .cap { font-size: 6.4pt; line-height: 1.36; color: var(--ink); margin-top: 0.9mm; }
.ev .src { margin-top: 0.7mm; }
`

/**
 * Each card is a subgrid (head, claim, then one row per piece of evidence),
 * so the evidence lines up across the row.
 */
function claimCards(claims) {
  const rows = 2 + Math.max(...claims.map((c) => c.evidence.length))
  return claims
    .map(
      (c, i) => `    <article class="card prop" style="grid-row: span ${rows}">
      <div><span class="k">${String(i + 1).padStart(2, '0')}</span><h2>${esc(c.title)}</h2><p class="promise">${esc(c.promise)}</p></div>
      <p class="text">${rich(c.text)}</p>
${c.evidence
  .map(
    (e) => `      <div class="ev"><span class="fig">${esc(e.figure)}</span><p class="cap">${rich(e.caption)}</p>${source(e.source, e.url)}</div>`,
  )
  .join('\n')}
    </article>`,
    )
    .join('\n')
}

/* ───────────────────────────────────────────────────────────────────────
   Layout: three propositions.

   Why sovereign AI. Three upside propositions as cards, each a claim with
   two pieces of evidence at its foot; then institutional innovation, three
   things AI lets an institution do differently, beside a worked example on
   the FA2 cream panel; then the honest limit beside where to start.
   ─────────────────────────────────────────────────────────────────────── */

const WHY_CSS = `${CLAIMS_CSS}
.innov { display: grid; grid-template-columns: repeat(3, 1fr) 1.15fr; gap: 3.2mm; align-items: stretch; }
.mode { border-top: 1pt solid var(--black); padding-top: 1.8mm; }
.mode h3 { font-family: var(--serif); font-weight: 500; font-size: 11pt; line-height: 1.1; color: var(--black); }
.mode h3 i { font-style: italic; color: var(--blue); }
.mode p { font-size: 6.8pt; line-height: 1.42; color: var(--body); margin-top: 1.2mm; }
.mode p.src { font-size: 5.6pt; line-height: 1.4; color: var(--muted); margin-top: 1mm; }
.example { background: var(--cream); border-radius: 2.6mm; padding: 2.8mm 3.2mm; }
.example h3 { font-family: var(--serif); font-weight: 500; font-size: 10.6pt; line-height: 1.12; color: var(--black); margin-top: 1mm; }
.example p { font-size: 6.7pt; line-height: 1.42; color: var(--ink); margin-top: 1.2mm; }

.close { display: grid; grid-template-columns: 1fr 1fr; gap: 3.2mm; align-items: stretch; }
.limit { border-left: 1.2pt solid var(--line); padding: 0.4mm 0 0.4mm 3.2mm; }
.start { background: var(--surface); border-radius: 2.6mm; padding: 2.6mm 3.2mm; }
.close .k { display: block; }
.limit .k { color: var(--muted); }
.close h3 { font-family: var(--serif); font-weight: 500; font-size: 10.6pt; line-height: 1.12; color: var(--black); margin-top: 1mm; }
.close p { font-size: 6.8pt; line-height: 1.42; color: var(--body); margin-top: 1.1mm; }
.close p b { color: var(--black); font-weight: 600; }
`

function renderThreePropositions(b) {
  const modes = b.innovation.modes
    .map(
      (m) => `      <div class="mode"><h3>Act more <i>${esc(m.word)}</i></h3><p>${rich(m.text)}</p>${m.source ? source(m.source, m.url) : ''}</div>`,
    )
    .join('\n')

  const ex = b.innovation.example
  const body = `  <section>
    <div class="label-row"><p class="label">${esc(b.propositionsLabel)}</p><p class="aside">${esc(b.propositionsAside)}</p></div>
    <div class="props">
${claimCards(b.propositions)}
    </div>
  </section>

  <section>
    <div class="label-row"><p class="label">${esc(b.innovation.label)}</p><p class="aside">${esc(b.innovation.aside)}</p></div>
    <div class="innov">
${modes}
      <div class="example"><span class="k">${esc(ex.kicker)}</span><h3>${esc(ex.title)}</h3><p>${rich(ex.text)}</p></div>
    </div>
  </section>

  <section class="close">
    <div class="limit"><span class="k">${esc(b.limit.kicker)}</span><h3>${esc(b.limit.title)}</h3><p>${rich(b.limit.text)}</p></div>
    <div class="start"><span class="k">${esc(b.start.kicker)}</span><h3>${esc(b.start.title)}</h3><p>${rich(b.start.text)} <b>${rich(b.start.next)}</b></p></div>
  </section>`
  return page(b, body, WHY_CSS)
}

/* ───────────────────────────────────────────────────────────────────────
   Layout: partnership.

   Sovereign AI government pilot partnership. The opportunity beside the one
   figure that shows the demand; the four things PL R&D brings; the four
   steps of a pilot with the bar it has to clear; where a pilot can start
   beside why PL R&D; and what a partner government is asked for beside the
   way in.
   ─────────────────────────────────────────────────────────────────────── */

const PARTNER_CSS = `
.gap { display: grid; grid-template-columns: 1.55fr 1fr; gap: 3.2mm; align-items: stretch; }
.gap .lead { border-left: 1.2pt solid var(--black); padding: 0.4mm 0 0.4mm 3.2mm; }
.gap .lead p { font-size: 7.6pt; line-height: 1.5; color: var(--body); }
.gap .lead p + p { margin-top: 1.4mm; }
.gap .lead b { color: var(--black); font-weight: 600; }
.gap .figcard { padding: 2.6mm 3.2mm; display: flex; flex-direction: column; justify-content: center; }
.gap .fig { font-size: 19pt; color: var(--blue); }
.gap .cap { font-size: 6.6pt; line-height: 1.38; color: var(--ink); margin-top: 1.2mm; }
.gap .src { margin-top: 0.9mm; }

.bring { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3.2mm; }
.bring .card { padding: 2.8mm 3mm; }
.bring h3 { font-family: var(--serif); font-weight: 500; font-size: 11pt; line-height: 1.1; color: var(--black); margin-top: 1mm; }
.bring p { font-size: 6.8pt; line-height: 1.42; color: var(--body); margin-top: 1.3mm; }

.steps { display: grid; grid-template-columns: repeat(4, 1fr); gap: 3.2mm; position: relative; }
.step { position: relative; padding-top: 1mm; }
.step .n {
  display: inline-flex; align-items: center; justify-content: center;
  width: 5.6mm; height: 5.6mm; border-radius: 50%; background: var(--blue); color: #fff;
  font-family: var(--serif); font-weight: 500; font-size: 8.4pt; position: relative; z-index: 1;
}
.step::before { content: ""; position: absolute; top: 3.8mm; left: 5.6mm; right: -3.2mm; height: 0.75pt; background: #C3E1FF; }
.step:last-child::before { display: none; }
.step h3 { font-family: var(--serif); font-weight: 500; font-size: 10.4pt; line-height: 1.12; color: var(--black); margin-top: 1.6mm; }
.step p { font-size: 6.8pt; line-height: 1.42; color: var(--body); margin-top: 1mm; }
.bar { margin-top: 2.6mm; background: var(--surface); border-radius: 2mm; padding: 1.8mm 3mm; font-size: 6.9pt; line-height: 1.4; color: var(--ink); }
.bar b { color: var(--black); font-weight: 600; }

.pair { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; align-items: start; }
.list { list-style: none; display: flex; flex-direction: column; }
.list li { padding: 1.3mm 0; border-top: 0.6pt solid var(--line-soft); font-size: 6.9pt; line-height: 1.42; color: var(--body); }
.list li:first-child { border-top: 0; padding-top: 0; }
.list li b { color: var(--black); font-weight: 600; }
.list .src { display: inline; }

.ask { display: grid; grid-template-columns: 1.3fr 1fr; gap: 3.2mm; align-items: stretch; }
.ask ol { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 4mm; counter-reset: ask; }
.ask ol li { counter-increment: ask; display: grid; grid-template-columns: auto 1fr; column-gap: 2mm; align-items: baseline; font-size: 6.9pt; line-height: 1.4; color: var(--body); }
.ask ol li::before { content: counter(ask); font-family: var(--serif); font-weight: 500; font-size: 10pt; color: var(--blue); }
.ask ol li b { color: var(--black); font-weight: 600; }
.way-in { background: var(--black); color: #fff; border-radius: 2.6mm; padding: 2.8mm 3.4mm; display: flex; flex-direction: column; justify-content: center; }
.way-in .k { color: #ff7aa8; }
.way-in h3 { font-family: var(--serif); font-weight: 500; font-size: 12pt; line-height: 1.1; color: #fff; margin-top: 1mm; }
.way-in p { font-size: 6.8pt; line-height: 1.42; color: #d4d6de; margin-top: 1.2mm; }
.way-in .mail { color: #fff; font-weight: 600; }
`

/* Blocks the partnership, explainer and summary layouts share. */

/** A labelled row of numbered cards, such as what PL R&D brings. */
const cardsSection = (block) => `  <section>
    <div class="label-row"><p class="label">${esc(block.label)}</p><p class="aside">${esc(block.aside)}</p></div>
    <div class="bring">
${block.items
  .map((x, i) => `      <div class="card"><span class="k">${String(i + 1).padStart(2, '0')}</span><h3>${esc(x.title)}</h3><p>${rich(x.text)}</p></div>`)
  .join('\n')}
    </div>
  </section>`

/** How a pilot or a round runs: numbered steps on a thread, and the bar under them. */
const stepsSection = (steps) => `  <section>
    <div class="label-row"><p class="label">${esc(steps.label)}</p><p class="aside">${esc(steps.aside)}</p></div>
    <div class="steps">
${steps.items
  .map((x, i) => `      <div class="step"><span class="n">${i + 1}</span><h3>${esc(x.title)}</h3><p>${rich(x.text)}</p></div>`)
  .join('\n')}
    </div>
    <p class="bar"><b>${esc(steps.barLead)}</b> ${rich(steps.bar)}</p>
  </section>`

/** A labelled list of lead-ins, each with an optional source after it. */
const leadList = (block) => `    <div>
      <p class="label" style="margin-bottom: 2mm">${esc(block.label)}</p>
      <ul class="list">
${block.items
  .map(
    (x) => `        <li><b>${esc(x.lead)}</b> ${rich(x.text)}${x.source ? ` <span class="src">${x.url ? `<a href="${esc(x.url)}">${esc(x.source)}</a>` : esc(x.source)}</span>` : ''}</li>`,
  )
  .join('\n')}
      </ul>
    </div>`

/** The black box with the way in. */
const wayInBox = (b) =>
  `<div class="way-in"><span class="k">${esc(b.wayIn.kicker)}</span><h3>${esc(b.wayIn.title)}</h3><p>${rich(b.wayIn.text)} <a class="mail" href="mailto:${esc(b.contact)}">${esc(b.contact)}</a></p><p>${rich(b.wayIn.people)}</p></div>`

/** The honest limit beside the way in, closing the explainer and summary layouts. */
const CLOSE_CSS = `
.close { display: grid; grid-template-columns: 1fr 1fr; gap: 3.2mm; align-items: stretch; }
.limit { border-left: 1.2pt solid var(--line); padding: 0.4mm 0 0.4mm 3.2mm; align-self: center; }
.limit .k { display: block; color: var(--muted); }
.limit h3 { font-family: var(--serif); font-weight: 500; font-size: 10.6pt; line-height: 1.12; color: var(--black); margin-top: 1mm; }
.limit p { font-size: 6.8pt; line-height: 1.42; color: var(--body); margin-top: 1.1mm; }
`

const closeSection = (b) => `  <section class="close">
    <div class="limit"><span class="k">${esc(b.limit.kicker)}</span><h3>${esc(b.limit.title)}</h3><p>${rich(b.limit.text)}</p></div>
    ${wayInBox(b)}
  </section>`

function renderPartnership(b) {
  const asks = b.ask.items.map((x) => `        <li><span><b>${esc(x.lead)}</b> ${rich(x.text)}</span></li>`).join('\n')

  const body = `  <section class="gap">
    <div class="lead">
${b.gap.paragraphs.map((p) => `      <p>${rich(p)}</p>`).join('\n')}
    </div>
    <div class="card figcard"><span class="fig">${esc(b.gap.figure)}</span><p class="cap">${rich(b.gap.caption)}</p>${source(b.gap.source, b.gap.url)}</div>
  </section>

${cardsSection(b.bring)}

${stepsSection(b.steps)}

  <section class="pair">
${leadList(b.starts)}
${leadList(b.why)}
  </section>

  <section class="ask">
    <div>
      <p class="label" style="margin-bottom: 2mm">${esc(b.ask.label)}</p>
      <ol>
${asks}
      </ol>
    </div>
    ${wayInBox(b)}
  </section>`
  return page(b, body, PARTNER_CSS)
}

/* ───────────────────────────────────────────────────────────────────────
   Layout: explainer.

   Broad Listening & Simocracy, Hypercerts. Two tools as cards, each a claim
   with two pieces of evidence side by side at its foot; how a round runs,
   with the rule under it; where the tools have run beside where a
   government can use them; the honest limit beside the way in. Built from
   the partnership layout's steps, lists and way in, so it shares their
   rules too.
   ─────────────────────────────────────────────────────────────────────── */

const EXPLAINER_CSS = `${PARTNER_CSS}
.tools { display: grid; grid-template-columns: 1fr 1fr; column-gap: 3.2mm; }
.tool { display: grid; grid-template-rows: subgrid; grid-row: span 3; padding: 3mm 3.4mm 2.8mm; }
.tool h2 { font-family: var(--serif); font-weight: 500; font-size: 15pt; line-height: 1.05; color: var(--black); margin-top: 1mm; }
.tool .promise { font-family: var(--serif); font-style: italic; font-size: 8.8pt; line-height: 1.25; color: var(--blue); margin-top: 1mm; }
.tool .text { font-size: 7.2pt; line-height: 1.45; color: var(--body); margin-top: 2mm; }
.tool .evs { display: grid; grid-template-columns: 1fr 1fr; column-gap: 3.2mm; border-top: 0.6pt solid var(--line); padding-top: 1.8mm; margin-top: 2.2mm; }
.tool .fig { font-size: 15pt; }
.tool .cap { font-size: 6.4pt; line-height: 1.36; color: var(--ink); margin-top: 0.9mm; }
.tool .src { margin-top: 0.7mm; }
${CLOSE_CSS}`

function renderExplainer(b) {
  const tools = b.tools
    .map(
      (t, i) => `    <article class="card tool">
      <div><span class="k">${String(i + 1).padStart(2, '0')}</span><h2>${esc(t.title)}</h2><p class="promise">${esc(t.promise)}</p></div>
      <p class="text">${rich(t.text)}</p>
      <div class="evs">
${t.evidence
  .map((e) => `        <div class="ev"><span class="fig">${esc(e.figure)}</span><p class="cap">${rich(e.caption)}</p>${source(e.source, e.url)}</div>`)
  .join('\n')}
      </div>
    </article>`,
    )
    .join('\n')

  const body = `  <section>
    <div class="label-row"><p class="label">${esc(b.toolsLabel)}</p><p class="aside">${esc(b.toolsAside)}</p></div>
    <div class="tools">
${tools}
    </div>
  </section>

${stepsSection(b.steps)}

  <section class="pair">
${leadList(b.ran)}
${leadList(b.uses)}
  </section>

${closeSection(b)}`
  return page(b, body, EXPLAINER_CSS)
}

/* ───────────────────────────────────────────────────────────────────────
   Layout: summary.

   Sovereign AI for funders. The program summed up for one audience: the
   reasons to care as claim cards, each with its evidence; what the funding
   pays for; how the program runs, with what every funder gets under it;
   how to take part beside why PL R&D; the honest limit beside the way in.
   Built from the blocks the other layouts share.
   ─────────────────────────────────────────────────────────────────────── */

const SUMMARY_CSS = `${PARTNER_CSS}${CLAIMS_CSS}${CLOSE_CSS}`

function renderSummary(b) {
  const body = `  <section>
    <div class="label-row"><p class="label">${esc(b.reasons.label)}</p><p class="aside">${esc(b.reasons.aside)}</p></div>
    <div class="props">
${claimCards(b.reasons.items)}
    </div>
  </section>

${cardsSection(b.funding)}

${stepsSection(b.steps)}

  <section class="pair">
${leadList(b.takePart)}
${leadList(b.why)}
  </section>

${closeSection(b)}`
  return page(b, body, SUMMARY_CSS)
}

const LAYOUTS = {
  'three-propositions': renderThreePropositions,
  partnership: renderPartnership,
  explainer: renderExplainer,
  summary: renderSummary,
}

/* ─── build ─── */

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

/** Page one of the printed PDF, as the plate the shelf shows. */
function plate(pdf, out) {
  const stem = resolve(tmpdir(), `sheet-plate-${process.pid}`)
  const pages = spawnSync('pdftoppm', ['-png', '-f', '1', '-l', '1', '-r', '100', '-singlefile', pdf, stem])
  if (pages.error || pages.status !== 0) throw new Error('pdftoppm failed; install poppler (brew install poppler)')
  const webp = spawnSync('magick', [`${stem}.png`, '-resize', '640x', '-quality', '88', out])
  rmSync(`${stem}.png`, { force: true })
  if (webp.error || webp.status !== 0) throw new Error('magick failed; install ImageMagick (brew install imagemagick)')
}

// A bare slug is a sheet in src/data/fa2/sovereign-ai/; a path to a .json file is
// a sheet kept elsewhere, printed beside itself.
const wanted = process.argv.slice(2)
const files = wanted.filter((arg) => arg.endsWith('.json')).map((arg) => resolve(arg))
const slugs = wanted.filter((arg) => !arg.endsWith('.json'))
const jobs = [
  ...readdirSync(DATA)
    .filter((f) => f.endsWith('.json'))
    .map((f) => f.replace(/\.json$/, ''))
    .filter((slug) => (wanted.length === 0 ? true : slugs.includes(slug)))
    .map((slug) => ({ json: resolve(DATA, `${slug}.json`), pdf: resolve(OUT, `${slug}.pdf`), cover: resolve(OUT, `${slug}.webp`) })),
  ...files.map((json) => ({ json, pdf: resolve(dirname(json), `${basename(json, '.json')}.pdf`), cover: null })),
]
const missing = [...slugs.filter((slug) => !existsSync(resolve(DATA, `${slug}.json`))), ...files.filter((f) => !existsSync(f))]
if (missing.length > 0 || jobs.length === 0) {
  console.error(`no such sheet: ${missing.join(', ') || wanted.join(', ')}`)
  process.exit(1)
}

mkdirSync(BUILD, { recursive: true })
mkdirSync(OUT, { recursive: true })

const server = spawn('python3', ['-m', 'http.server', PORT, '--bind', '127.0.0.1', '--directory', ROOT], { stdio: 'ignore' })
process.on('exit', () => server.kill())
await new Promise((ok) => setTimeout(ok, 1000))

let failed = false
try {
  for (const job of jobs) {
    const sheet = JSON.parse(readFileSync(job.json, 'utf8'))
    const render = LAYOUTS[sheet.layout]
    if (!render) throw new Error(`${sheet.slug}: unknown layout ${sheet.layout}`)
    writeFileSync(resolve(BUILD, `${sheet.slug}.html`), render(sheet))
    const url = `http://127.0.0.1:${PORT}/.sheets-build/${sheet.slug}.html`
    const flags = ['--headless', '--disable-gpu', '--no-sandbox', '--virtual-time-budget=6000']
    await run(CHROME, [...flags, '--no-pdf-header-footer', `--print-to-pdf=${job.pdf}`, url])

    // Read the laid-out page back for the fit the script settled on.
    const dom = spawnSync(CHROME, [...flags, '--dump-dom', url], { encoding: 'utf8', timeout: 45_000 }).stdout ?? ''
    const fit = dom.match(/data-fit="([\d.]+)"/)?.[1] ?? '?'
    const clipped = dom.match(/data-clipped="(\w+)"/)?.[1] === 'true'
    if (job.cover) plate(job.pdf, job.cover)
    const shown = (path) => path.replace(`${ROOT}/`, '')
    console.log(`→ ${shown(job.pdf)}${job.cover ? ` + ${basename(job.cover)}` : ''}  (fit ${fit}${clipped ? ', CLIPPED' : ''})`)
    if (clipped) failed = true
  }
} finally {
  server.kill()
}
if (failed) {
  console.error('A page still overflows at the legibility floor. Shorten it.')
  process.exit(1)
}
