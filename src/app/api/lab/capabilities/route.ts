import { configForBrowser, getLabOAuthConfig } from '@/lib/lab-oauth-config'
export const dynamic = 'force-dynamic'
export function GET(request?: Request) {
  const config = getLabOAuthConfig()
  return Response.json(request ? configForBrowser(config, new URL(request.url).origin) : config, { headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
