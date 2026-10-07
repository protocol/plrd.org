import assert from 'node:assert/strict'
import { test } from 'node:test'
import { source } from './velocity/test-source-loader.mjs'

const { generateMetadata } = source('app/blog/[slug]/page.tsx')
const { blogPosts } = source('lib/content.ts')
const { siteConfig } = source('lib/site-config.ts')
const metadataFor = (slug) => generateMetadata({ params: Promise.resolve({ slug }) })

test('every blog post supplies its own social card without changing its canonical', async () => {
  for (const post of blogPosts) {
    const metadata = await metadataFor(post.slug)
    assert.deepEqual(metadata.twitter.images, [post.coverImage || siteConfig.avatar], post.slug)
    assert.equal(metadata.twitter.title, post.title, post.slug)
    assert.equal(metadata.twitter.description, post.description || post.summary, post.slug)
    assert.equal(metadata.twitter.card, 'summary_large_image', post.slug)
    assert.equal(metadata.twitter.site, siteConfig.twitterUser, post.slug)
    assert.equal(metadata.alternates.canonical, post.external_url || `/blog/${post.slug}/`, post.slug)
  }
})

test('unknown slugs retain Not Found metadata', async () => {
  assert.deepEqual(await metadataFor('metadata-test-missing'), { title: 'Not Found' })
})

test('Neuro shares use the article hero and copy instead of inherited site defaults', async () => {
  const post = blogPosts.find((post) => post.slug === 'neurotech-frontier-human-flourishing')
  assert.ok(post)
  assert.equal(post.coverImage, '/images/blog/neurotechnology-hero.webp')
  const metadata = await metadataFor(post.slug)
  assert.deepEqual(metadata.twitter, {
    card: 'summary_large_image',
    site: siteConfig.twitterUser,
    title: post.title,
    description: post.description || post.summary,
    images: [post.coverImage],
  })
  assert.deepEqual(metadata.openGraph.images, metadata.twitter.images)
})

test('a future coverless post retains the default card image with its own copy', async () => {
  // Synthetic fixture: no content or generated records are written.
  const post = {
    slug: 'metadata-test-coverless', title: 'A future article',
    description: 'A dedicated social description', summary: 'Fallback summary',
    coverImage: '', authors: [], date: '', external_url: '', unlisted: true,
  }
  blogPosts.push(post)
  try {
    const metadata = await metadataFor(post.slug)
    assert.deepEqual(metadata.twitter.images, [siteConfig.avatar])
    assert.equal(metadata.twitter.title, post.title)
    assert.equal(metadata.twitter.description, post.description)
    assert.equal(metadata.alternates.canonical, `/blog/${post.slug}/`)
    assert.deepEqual(metadata.robots, {
      index: false, follow: false, googleBot: { index: false, follow: false },
    })
  } finally {
    blogPosts.splice(blogPosts.indexOf(post), 1)
  }
})
