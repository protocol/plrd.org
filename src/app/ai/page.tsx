import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumb from '@/components/Breadcrumb'
import AiStarterPrompt from '@/components/AiStarterPrompt'
import { AI_STARTER_PROMPT, AI_SCOPE, AI_RIGHTS } from '@/lib/ai-content'
import { createAiAccess, coverage } from '@/lib/ai-access'

export const metadata: Metadata = {
  title: 'Use PL R&D with AI',
  description: 'Source-linked research context, focused Markdown and read-only search for AI-assisted work.',
  alternates: { canonical: '/ai/' },
}

export default function AiGuide() {
  const records = createAiAccess().records()
  const info = coverage(records)
  return <div className="max-w-6xl mx-auto px-6 pt-8 pb-16">
    <Breadcrumb items={[{ label: 'Use with AI' }]} />
    <div className="max-w-3xl mt-10">
      <p className="text-xs uppercase tracking-widest text-gray-500 mb-4">Research, with sources attached</p>
      <h1 className="text-[32px] sm:text-[44px] font-semibold tracking-tight leading-tight mb-6">Use PL R&amp;D with AI</h1>
      <p className="text-base text-gray-600 leading-relaxed mb-8">Ask your assistant to explore our research, compare approaches, or find a paper. Start with a small index, fetch only what you need, and keep the original sources in the answer. No account, chatbot or special integration required.</p>
      <AiStarterPrompt prompt={AI_STARTER_PROMPT} />
      <section className="mt-12" aria-labelledby="choose-context">
        <h2 id="choose-context" className="text-[24px] font-semibold mb-5">Choose your context</h2>
        <div className="divide-y divide-gray-200 border-y border-gray-200">
          {[
            ['/llms.txt', 'Start small · llms.txt', 'A compact map of the available context and its limits. Point an agent here first.'],
            ['/llms-full.txt', 'Download covered context', 'One readable text file containing all covered records. Upload it to an assistant when URL fetching is unavailable.'],
            ['/ai/index.json', 'JSON index', 'All record metadata, canonical and source URLs, coverage counts, source dates, and links to individual Markdown resources.'],
          ].map(([url, title, description]) => <div key={url} className="py-5">
            <a href={url} className="text-base font-medium text-blue hover:underline">{title}</a>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{description}</p>
          </div>)}
        </div>
      </section>
      <section className="mt-12" aria-labelledby="focused-resources">
        <h2 id="focused-resources" className="text-[24px] font-semibold mb-5">Follow a focus area</h2>
        <p className="text-sm text-gray-600 mb-5">Each resource has a shared descriptor and links to the articles, papers and talks tagged to that area—not a duplicate of its live overview page.</p>
        <ul className="grid sm:grid-cols-2 gap-3 list-none p-0">
          {records.filter(r => r.kind === 'area').map(r => <li key={r.id} className="border border-gray-200 p-5">
            <a href={`/ai/topics/${r.slug}/`} className="text-base text-blue hover:underline">{r.title} · Markdown</a>
            <p className="text-sm text-gray-600 leading-relaxed mt-2">{r.summary}</p>
            <Link href={`/areas/${r.slug}/`} className="text-sm text-blue hover:underline inline-block mt-3">Current area page →</Link>
          </li>)}
        </ul>
      </section>
      <section className="mt-12" aria-labelledby="search-context">
        <h2 id="search-context" className="text-[24px] font-semibold mb-5">Search without a model</h2>
        <p className="text-sm text-gray-600 leading-relaxed">A read-only JSON endpoint searches titles, summaries, covered bodies and author display names. Results are deterministic: case-insensitive AND substring matching, ordered by stable record ID—not relevance or scientific quality.</p>
        <a href="/api/ai/search/?q=connectome&kind=publication&limit=5" className="block break-all text-sm text-blue hover:underline border border-gray-200 p-4 my-5">/api/ai/search/?q=connectome&amp;kind=publication&amp;limit=5</a>
        <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 text-sm">
          <dt className="font-semibold">q</dt><dd>Up to 200 characters. Omit for browsing.</dd>
          <dt className="font-semibold">kind</dt><dd className="break-words">area, author, blog, publication, talk, tutorial</dd>
          <dt className="font-semibold">area</dt><dd>One of the focus-area slugs in the JSON index. Untagged records will not match an area filter.</dd>
          <dt className="font-semibold">limit / offset</dt><dd>Default 10 / 0. Limit 1–50; offset 0–10000. Follow nextOffset until null.</dd>
        </dl>
        <p className="text-sm text-gray-600 mt-5">Invalid, repeated or unknown parameters return 400. Unknown resources return 404. JSON results contain stable jsonUrl and markdownUrl links for detail. Every resource works with a plain HTTP GET; no JavaScript is needed to fetch the data.</p>
      </section>
      <section className="mt-12 border-t border-gray-200 pt-8" aria-labelledby="coverage">
        <h2 id="coverage" className="text-[24px] font-semibold mb-5">Know what the snapshot covers</h2>
        <p className="text-sm text-gray-600 leading-relaxed">{AI_SCOPE}</p>
        <p className="text-sm text-gray-600 leading-relaxed mt-4">This snapshot contains {info.total} records: {Object.entries(info.counts).map(([kind, count]) => `${count} ${kind}`).join(', ')}. Source publication dates range from {info.dates.earliest?.slice(0, 10)} to {info.dates.latest?.slice(0, 10)}. These are data dates, not a claim that every page was updated then. Undated records have a null date.</p>
        <p className="text-sm text-gray-600 leading-relaxed mt-4">Use the <Link href="/" className="text-blue hover:underline">current homepage</Link> and <Link href="/about/" className="text-blue hover:underline">About page</Link> for live overview copy. External articles retain their original canonical URLs; local summaries are not full-text republications. A listed author profile is not a guarantee of current employment.</p>
        <p className="text-sm text-gray-600 leading-relaxed mt-4">{AI_RIGHTS}</p>
      </section>
    </div>
  </div>
}
