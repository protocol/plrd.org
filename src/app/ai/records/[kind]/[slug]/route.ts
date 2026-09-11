import { createAiAccess } from '@/lib/ai-access'

export const dynamic = 'force-dynamic'
export async function GET(_request: Request, { params }: { params: Promise<{ kind: string; slug: string }> }) {
  const { kind, slug } = await params
  return createAiAccess().detail(kind, slug)
}
