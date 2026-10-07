import { fieldVelocityForArea, isFocusAreaKey, loadFieldVelocity } from '@/lib/field-velocity-data'

export const runtime = 'nodejs'
export const revalidate = 300

/** Read-only public feed; cross-origin simple GETs are allowed without credentials. */
export async function GET(_request: Request, { params }: { params: Promise<{ area: string }> }) {
  const { area } = await params
  const cors = { 'Access-Control-Allow-Origin': '*' }
  if (!isFocusAreaKey(area)) {
    return Response.json({ error: 'Unknown focus area' }, { status: 404, headers: cors })
  }
  const data = fieldVelocityForArea(await loadFieldVelocity(), area)
  return Response.json(data, {
    headers: { ...cors, 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' },
  })
}
