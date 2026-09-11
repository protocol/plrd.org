import { aiResponse, aiText, createAiAccess } from '@/lib/ai-access'
import { recordMarkdown } from '@/lib/ai-markdown'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params
  const record = createAiAccess().get(kind, slug)
  return record ? aiText(recordMarkdown(record)) : aiResponse({ error: 'Not found' }, 404)
}
