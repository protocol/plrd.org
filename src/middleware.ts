import { NextResponse, type NextRequest } from 'next/server'
import { COOKIE_CONSENT_ENABLED } from '@/lib/cookie-consent'

// Countries where prior consent is legally required before setting non-essential
// (analytics) cookies: the EU/EEA under the ePrivacy Directive + GDPR, and the
// UK under PECR + UK GDPR. Everywhere else follows an opt-out model, so we skip
// the banner there (and let visitors opt out via the footer "Cookie settings").
const CONSENT_REQUIRED_COUNTRIES = new Set([
  // EU member states
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  // EEA (non-EU)
  'IS', 'LI', 'NO',
  // United Kingdom
  'GB',
])

const REGION_COOKIE = 'pl-consent-region'

export function middleware(req: NextRequest) {
  if (/^\/neuro-atlas(?:\/|$)/i.test(req.nextUrl.pathname)) {
    // A separate deployment does not need PLRD session or consent cookies.
    // Keep Authorization intact: Atlas's existing hosted Basic gate still applies.
    const headers = new Headers(req.headers)
    headers.delete('cookie')
    const response = NextResponse.next({ request: { headers } })
    // Applied before the external rewrite, including upstream Basic-auth 401s.
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }
  const res0 = NextResponse.next()
  // Consent banner disabled: no need to detect the region or set its cookie.
  if (!COOKIE_CONSENT_ENABLED) return res0

  // Vercel injects the visitor's country here at the edge.
  const country = (req.headers.get('x-vercel-ip-country') || '').toUpperCase()

  // Fail safe toward privacy: if geo is unknown (e.g. local dev), require consent.
  const required = country === '' || CONSENT_REQUIRED_COUNTRIES.has(country)

  const res = NextResponse.next()
  res.cookies.set(REGION_COOKIE, required ? 'required' : 'open', {
    path: '/',
    sameSite: 'lax',
    httpOnly: false, // must be readable by the client consent component
    maxAge: 60 * 60 * 24, // refresh daily
  })
  return res
}

export const config = {
  // Next external rewrites are case-insensitive, including static assets.
  // Mirror that namespace here without broadening ordinary PLRD matching.
  matcher: ['/:atlas([nN][eE][uU][rR][oO]-[aA][tT][lL][aA][sS])/:path*', '/((?!api|_next/static|_next/image|favicon.ico|.*\\.[\\w]+$).*)'],
}
