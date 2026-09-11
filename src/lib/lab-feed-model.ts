import { artifacts } from '@/lib/lab-data'
import { DEMO_PEOPLE, DEMO_PROPOSALS, DEMO_THREADS, type DemoState } from '@/lib/lab-demo'
import type { FollowingState } from '@/lib/lab-following'
import type { InventionUpdate } from '@/lib/lab-inventions'
import type { SocialDraft } from '@/lib/lab-social'
export const CASE_DISCIPLINES: Record<string, string[]> = {
  reproducibility: ['ai-robotics', 'cross-field', 'math'],
  'neural-measurement': ['neurotech', 'math', 'cross-field'],
  'open-artifacts': ['digital-human-rights', 'economies-governance', 'cross-field'],
}
export type FeedRow = {
  id: string; ideaId: string; authorId?: string; author: string; title: string; text: string;
  kind: string; disciplines: string[]; origin: 'demo' | 'editorial' | 'local';
  artifactId?: string; threadId?: string; messageId?: string; draftSlot?: string;
  artifact: string; artifactUrl?: string; request: string; stage: string; action: string
}
const featured = ['r5', 'n3', 'o4', 'r6', 'n4']
const prototypeNames: Record<string,string> = {'split-check':'Split-before-fit inspector','duration-note':'Recording-hour calculator','reuse-receipt':'Artifact reuse checker'}
export function buildFeedRows({ isDemo, demo, drafts, updates = [] }: { isDemo: boolean; demo: DemoState; drafts: SocialDraft[]; updates?: InventionUpdate[] }): FeedRow[] {
  const story: FeedRow[] = isDemo ? featured.map(id => {
    const thread = DEMO_THREADS.find(t => t.messages.some(m => m.id === id))!
    const message = thread.messages.find(m => m.id === id)!, proposal = DEMO_PROPOSALS.find(p=>p.id===thread.proposalId)!
    return { id: `message:${id}`, ideaId: thread.id, threadId: thread.id, messageId: id, authorId: message.authorId,
      author: DEMO_PEOPLE.find(p => p.id === message.authorId)!.name, title: prototypeNames[proposal.id],
      text: message.kind==='uncertain'?proposal.outcome:message.kind==='help'?proposal.help:proposal.revision,
      kind: message.kind === 'uncertain' ? 'Evidence gap' : message.kind === 'help' ? 'Help wanted' : 'Prototype specification', disciplines: CASE_DISCIPLINES[thread.caseId], origin: 'demo',
      artifact: proposal.artifact, request: proposal.test, stage: 'Illustrative design · not a working release', action:message.kind==='help'?'Help build':'Take a test' }
  }) : []
  const editorial: FeedRow[] = ['marimo', 'cadcad', 'connectome'].map(id => {
    const a = artifacts.find(a => a.id === id)!
    return { id: `artifact:${id}`, ideaId: `artifact:${id}`, artifactId: id, author: a.source, title: a.title, text: a.description, kind: a.type === 'tool' ? 'Tool' : 'Research question', disciplines: [a.field], origin: 'editorial', artifact:a.codeUrl?'Code + documentation':'Research perspective',artifactUrl:a.url,request:a.prompt,stage:a.type==='tool'?'Public tool · inspect its limits':'Idea · not an achieved invention',action:a.type==='tool'?'Try prototype':'Help build' }
  })
  const additions: FeedRow[] = isDemo ? [...demo.replies].reverse().map(r => {
    const thread = DEMO_THREADS.find(t => t.id === r.threadId)!, proposal=DEMO_PROPOSALS.find(p=>p.id===thread.proposalId)!
    return { id: r.id, ideaId: thread.id, threadId: thread.id, author: 'Your local demo note', authorId: 'demo-visitor', title: prototypeNames[proposal.id], text: r.text, kind: 'Contribution', disciplines: CASE_DISCIPLINES[thread.caseId], origin: 'demo',artifact:proposal.artifact,request:proposal.test,stage:'Local note · not validated',action:'Take a test' }
  }) : drafts.filter(d => d.kind === 'note').map(d => ({ id: `draft:${d.slot}`, ideaId: `draft:${d.slot}`, draftSlot: d.slot, author: 'Your local draft', title: 'An idea on your bench', text: String(d.data.text || ''), kind: 'Local idea', disciplines: [String(d.data.field || 'cross-field')], origin: 'local',artifact:'Unpublished idea draft',request:'Turn this idea into a bounded build or test.',stage:'Idea',action:'Help build' }))
  const making:FeedRow[]=updates.map(u=>({id:`invention:${u.id}`,ideaId:`invention:${u.id}`,author:isDemo?'Your local demo build':'Your local build',title:u.title,text:u.summary,kind:u.kind,disciplines:u.disciplines,origin:'local',artifact:u.artifactUrl?'Linked artifact':'Artifact not linked yet',artifactUrl:u.artifactUrl,request:u.request,stage:`${u.stage} · self-reported, not externally validated`,action:'Share what worked'}))
  return [...making,...additions, ...(isDemo ? [story[0], editorial[0], story[1], story[2], editorial[1], story[3], editorial[2], story[4]] : editorial)]
}
/** OR within disciplines and across subscriptions; AND with text search and curated view. */
export function filterFeedRows(rows: FeedRow[], prefs: FollowingState, query: string): FeedRow[] {
  const seen = new Set<string>(), needle = query.trim().toLocaleLowerCase()
  return rows.filter(row => {
    if (seen.has(row.id)) return false
    seen.add(row.id)
    const tags = prefs.ideaTags[row.ideaId] ?? row.disciplines
    const subscribed = prefs.ideas.includes(row.ideaId) || (!!row.authorId && prefs.people.includes(row.authorId)) || tags.some(t => prefs.disciplines.includes(t))
    return (prefs.filter.feed !== 'following' || subscribed) && (!prefs.filter.disciplines.length || tags.some(t => prefs.filter.disciplines.includes(t))) &&
      (!needle || `${row.title} ${row.text} ${row.author} ${row.kind} ${row.request} ${row.artifact}`.toLocaleLowerCase().includes(needle))
  })
}
