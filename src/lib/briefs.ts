import whySovereignAi from '@/data/fa2/briefs/why-sovereign-ai.json'

/**
 * FA2 briefs: one-page arguments with their evidence, published twice from
 * one JSON file in src/data/fa2/briefs/. The web edition renders it at
 * /areas/economies-governance/briefs/<slug>/, and `npm run build-briefs`
 * prints the same file to public/briefs/<slug>.pdf. Add a brief by adding
 * its JSON here.
 */
export type Brief = typeof whySovereignAi

export const briefs: Brief[] = [whySovereignAi]

export function briefHref(slug: string) {
  return `/areas/economies-governance/briefs/${slug}/`
}
