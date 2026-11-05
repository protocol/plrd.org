import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const { generateMetadata } = source('app/talks/[slug]/page.tsx')
const { talks } = source('lib/content.ts')
const { siteConfig } = source('lib/site-config.ts')
const metadataFor = (slug) => generateMetadata({ params: Promise.resolve({ slug }) })

test('YouTube shares use the embedded video thumbnail and the talk’s own copy', async () => {
  const talk = talks.find((talk) => talk.slug === 'aua-ethical-informed-ai')
  assert.ok(talk)
  const metadata = await metadataFor(talk.slug)
  const images = ['https://i.ytimg.com/vi/8a6uw3OUhtc/hqdefault.jpg']
  assert.deepEqual(metadata.openGraph.images, images)
  assert.deepEqual(metadata.twitter, {
    card: 'summary_large_image',
    site: siteConfig.twitterUser,
    title: talk.title,
    description: talk.abstract.slice(0, 160),
    images,
  })
  assert.equal(metadata.alternates.canonical, `/talks/${talk.slug}/`)
  assert.equal(metadata.openGraph.url, `/talks/${talk.slug}/`)
  assert.equal(metadata.openGraph.type, 'article')
  assert.deepEqual(metadata.openGraph.authors, talk.authors)
  assert.equal(metadata.openGraph.publishedTime, talk.date)
})

test('every current talk has matching Open Graph and X images and its own copy', async () => {
  for (const talk of talks) {
    const metadata = await metadataFor(talk.slug)
    const id = /youtube\s+([a-zA-Z0-9_-]+)/.exec(talk.html || '')?.[1]
    const expected = id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : siteConfig.avatar
    assert.deepEqual(metadata.openGraph.images, [expected], talk.slug)
    assert.deepEqual(metadata.twitter.images, [expected], talk.slug)
    assert.equal(metadata.twitter.title, talk.title, talk.slug)
    assert.equal(metadata.twitter.description, (talk.abstract || '').slice(0, 160), talk.slug)
    assert.equal(metadata.alternates.canonical, `/talks/${talk.slug}/`, talk.slug)
  }
})

test('future raw and encoded embeds select their own video, while video-less talks retain a default', async () => {
  for (const html of ['{{< youtube X0B_GWTuEFo >}}', '{{&#x3C; youtube X0B_GWTuEFo >}}', '', '{{< spotify episode/example >}}']) {
    const fixture = { slug: 'metadata-fixture', title: 'Future talk', html, abstract: '', authors: [], date: '' }
    talks.push(fixture)
    try {
      const metadata = await metadataFor(fixture.slug)
      const expected = html.includes('youtube')
        ? 'https://i.ytimg.com/vi/X0B_GWTuEFo/hqdefault.jpg'
        : siteConfig.avatar
      assert.deepEqual(metadata.openGraph.images, [expected], html)
      assert.deepEqual(metadata.twitter.images, [expected], html)
      assert.equal(metadata.twitter.description, '')
      assert.equal(metadata.openGraph.publishedTime, undefined)
    } finally {
      talks.splice(talks.indexOf(fixture), 1)
    }
  }
})

test('unknown talk slugs retain Not Found metadata', async () => {
  assert.deepEqual(await metadataFor('metadata-test-missing'), { title: 'Not Found' })
})
