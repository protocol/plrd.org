import { aiText } from '@/lib/ai-access'
import { llmsIndex } from '@/lib/ai-markdown'

export const dynamic = 'force-static'
export function GET() { return aiText(llmsIndex(), 'text/plain; charset=utf-8') }
