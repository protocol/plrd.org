/** Editorial illustrations, not documentary or scientific evidence.
 * Kept separate from program records so artwork cannot change publication or stage.
 * New catalog entries without commissioned artwork retain their text-first card.
 */
const ART_SLUGS = new Set([
  'sovereign-ai',
  'evaluation-commons',
  'broad-listening',
  'ai4pg',
  'ai4cop',
  'evidence-research',
  'compute-alliance',
  'eg-fellowship',
  'connectomics-benchmark',
  'macaque-projectome',
  'discovery-challenge',
  'mouse-connectome',
  'neuroai-commons',
  'virtual-neuro',
  'neuroai-fellows',
])

export function interventionArt(slug: string) {
  return ART_SLUGS.has(slug)
    ? { src: `/images/interventions/${slug}.webp`, thumbnail: `/images/interventions/${slug}-thumb.webp` }
    : undefined
}
