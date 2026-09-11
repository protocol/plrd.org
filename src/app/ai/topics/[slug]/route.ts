import { aiResponse, aiText } from '@/lib/ai-access'
import { topicMarkdown } from '@/lib/ai-markdown'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const markdown = topicMarkdown(slug)
  return markdown ? aiText(markdown) : aiResponse({ error: 'Not found' }, 404)
}
