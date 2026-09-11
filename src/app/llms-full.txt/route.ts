import { aiText } from '@/lib/ai-access'
import { fullMarkdown } from '@/lib/ai-markdown'

export const dynamic = 'force-static'
export function GET() { return aiText(fullMarkdown(), 'text/plain; charset=utf-8', 'plrd-context.txt') }
