import { createAiAccess } from '@/lib/ai-access'

export const dynamic = 'force-dynamic'
export function GET(request: Request) { return createAiAccess().search(request) }
