import { createAiAccess } from '@/lib/ai-access'

export const dynamic = 'force-static'
export function GET() { return createAiAccess().index() }
