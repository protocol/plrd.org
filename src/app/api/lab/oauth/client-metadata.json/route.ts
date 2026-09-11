import { configForRequest, getLabOAuthConfig } from '@/lib/lab-oauth-config'
export const dynamic = 'force-dynamic'
export function GET(request: Request) {
  const config = configForRequest(getLabOAuthConfig(), request)
  const headers = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Access-Control-Allow-Origin': '*' }
  if (!config.metadata) {
    return Response.json({ error: 'Open Lab OAuth metadata is not configured for this origin.' }, { status: 404, headers })
  }
  return Response.json(config.metadata, { headers })
}
