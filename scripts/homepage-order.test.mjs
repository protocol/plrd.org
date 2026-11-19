import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'
import fs from 'node:fs'
import matter from 'gray-matter'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import 'next/dist/server/node-environment.js'
import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server.js'

const { default: HomePage } = source('app/page.tsx')
const { default: InsightCarousel } = source('components/InsightCarousel.tsx')
const { default: RDPipeline } = source('components/RDPipeline.tsx')
const { listedBlogPosts } = source('lib/content.ts')

test('homepage carousel links the published Introducing Neuro Atlas Blog item directly to PL Neuro', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const slug = 'introducing-neuro-atlas'
  const url = 'https://www.plneuro.xyz/insights/introducing-neuro-atlas/'
  const hero = 'https://www.plneuro.xyz/images/insights/introducing-neuro-atlas.png'
  const post = listedBlogPosts.find((post) => post.slug === slug)
  assert.ok(post, 'the published article needs a listed native Blog record')
  assert.equal(post.title, 'Introducing Neuro Atlas')
  assert.equal(new Date(post.date).toISOString().slice(0, 10), '2026-11-19')
  assert.equal(post.summary, 'An interactive resource from PL Neuro to follow technical progress, company milestones, and funding across neurotechnology.')
  assert.equal(post.external_url, url)
  assert.equal(post.coverImage, hero)
  assert.deepEqual(post.areas, ['neurotech'])
  assert.deepEqual(post.authors, [], 'do not invent a byline absent from the published article')
  assert.equal(post.html, '', 'use an external Blog stub, not a duplicate article')
  const record = matter(fs.readFileSync(`content/blog/${slug}/index.md`, 'utf8'))
  assert.equal(record.data.external_url, url)
  assert.equal(record.data.cover_image, hero)
  assert.equal(record.content.trim(), '')

  const carousel = elements(await HomePage()).find((node) => node.type === InsightCarousel)
  assert.ok(carousel)
  assert.equal(carousel.props.items.length, 8, 'retain the existing latest-eight carousel')
  assert.equal(carousel.props.items.filter((item) => item.slug === slug).length, 1)
  assert.deepEqual(carousel.props.items[0], {
    title: post.title, date: post.date, type: 'Blog', permalink: url,
    slug, areas: [], coverImage: hero,
  })
  const { document } = new JSDOM(renderToStaticMarkup(createElement(InsightCarousel, carousel.props))).window
  const card = document.querySelector(`a[href="${url}"]`)
  assert.ok(card, 'the rendered card goes to the canonical public article, not a local duplicate')
  assert.equal(card.querySelector('h4').textContent, post.title)
  assert.match(card.textContent, /Blog/)
  assert.match(card.textContent, /Nov 19, 2026/)
  assert.ok([...card.querySelectorAll('[style]')].some((node) => node.style.backgroundImage.includes(hero)), 'render the exact published hero')
})

test('the Neuro Atlas search destination redirects to the public article without changing other Blog routes', async () => {
  const { default: nextConfig } = source('../next.config.ts')
  const publicArticle = 'https://www.plneuro.xyz/insights/introducing-neuro-atlas/'
  for (const path of ['/blog/introducing-neuro-atlas', '/blog/introducing-neuro-atlas/']) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://www.plrd.org${path}?ref=search`, nextConfig })
    assert.equal(response.status, 308, path)
    assert.equal(response.headers.get('location'), `${publicArticle}?ref=search`, path)
  }
  for (const path of ['/blog/introducing-neuro-atlas-other/', '/blog/introducing-neuro-atlas/deep/', '/blog/neurotech-frontier-human-flourishing/', '/blog/transformative-power-neurotech/']) {
    const response = await unstable_getResponseFromNextConfig({ url: `https://www.plrd.org${path}`, nextConfig })
    assert.equal(response.status, 200, path)
    assert.equal(response.headers.get('location'), null, path)
  }
})

function elements(node) {
  if (Array.isArray(node)) return node.flatMap(elements)
  if (!node || typeof node !== 'object') return []
  return [node, ...elements(node.props?.children)]
}

function text(node) {
  if (Array.isArray(node)) return node.map(text).join('')
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  return node && typeof node === 'object' ? text(node.props?.children) : ''
}

test('homepage places the existing latest carousel between focus areas and the innovation-chasm graphic', async (t) => {
  // Only the remote editable-copy boundary is mocked; render the real homepage.
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await HomePage())
  const carousel = nodes.filter((node) => node.type === InsightCarousel)
  const pipeline = nodes.filter((node) => node.type === RDPipeline)
  assert.equal(carousel.length, 1, 'keep exactly one carousel')
  const insightSection = nodes.find((node) => node.props?.id === 'latest-insights')
  assert.ok(insightSection, 'provide a stable deep-link to the existing carousel section')
  assert.ok(elements(insightSection).includes(carousel[0]), 'the anchor owns the actual carousel')
  assert.match(insightSection.props.className, /(?:^|\s)scroll-mt-24(?:\s|$)/, 'clear the sticky site header when following the deep-link')
  assert.equal(pipeline.length, 1, 'keep exactly one pipeline graphic')
  assert.equal(carousel[0].props.items.length, 8, 'preserve the latest-eight feed')
  const focusIndex = nodes.findIndex((node) => node.props?.id === 'focus-areas')
  const latestIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Latest from PL R&D')
  const chasmIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'PL R&D helps promising research cross the innovation chasm')
  const teamIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Team')
  assert.ok(focusIndex >= 0 && latestIndex > focusIndex, 'latest stays below focus areas')
  assert.ok(nodes.indexOf(carousel[0]) > latestIndex, 'carousel follows its heading')
  assert.ok(chasmIndex > nodes.indexOf(carousel[0]), 'latest carousel must precede the innovation-chasm heading')
  assert.ok(nodes.indexOf(pipeline[0]) > chasmIndex, 'graphic stays with its heading')
  assert.ok(teamIndex > nodes.indexOf(pipeline[0]), 'team remains below both sections')
})

test('homepage previews the three field-building steps under the four focus areas', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => Response.json({
    data: { orgPlresearchPage: { edges: [] } },
  }))
  const nodes = elements(await HomePage())
  const isLink = (node) => node.type === 'a' || node.type?.render?.name === 'LinkComponent'
  const invitations = nodes.filter((node) => isLink(node) && text(node).includes('How we build fields'))
  assert.equal(invitations.length, 1, 'one methodology invitation, not a second hero tease')
  const invitation = invitations[0]
  assert.equal(invitation.props.href, '/methodology/')
  const copy = text(invitation)
  assert.equal(copy.includes('Explore how we build fields'), false, 'the serif headline is gone; the steps carry the content')
  assert.equal(copy.includes('Read the methodology'), false)
  const ordered = ['How we build fields', '01Diagnose', '02Intervene', '03Learn', 'Learn about our methodology →']
  let at = -1
  for (const part of ordered) {
    const next = copy.indexOf(part, at + 1)
    assert.ok(next > at, `${part} follows the previous layer`)
    at = next
  }
  assert.ok(copy.includes('Name the binding constraint.'))
  const label = elements(invitation).find((node) => node.type === 'p' && text(node) === 'How we build fields')
  assert.equal(label.props.className.includes('text-[12px]'), true)
  assert.equal(label.props.className.includes('text-dark-blue'), true, '12px label uses the contrast-safe token')
  const link = elements(invitation).find((node) => node.type === 'span' && text(node) === 'Learn about our methodology →')
  const steps = elements(invitation).find((node) => node.type === 'ol')
  assert.ok(elements(invitation).indexOf(link) > elements(invitation).indexOf(steps), 'the link sits under the steps')
  const focusIndex = nodes.findIndex((node) => node.props?.id === 'focus-areas')
  const latestIndex = nodes.findIndex((node) => node.type === 'h2' && text(node) === 'Latest from PL R&D')
  const heroIndex = nodes.findIndex((node) => node.type === 'h1')
  const invitationIndex = nodes.indexOf(invitation)
  assert.ok(invitationIndex > focusIndex && focusIndex > heroIndex, 'invitation sits under the four focus areas')
  assert.ok(latestIndex > invitationIndex, 'news stays below the methodology band')
})
