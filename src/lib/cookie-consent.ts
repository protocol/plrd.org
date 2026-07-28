// Feature flag for the analytics cookie-consent banner + footer "Cookie
// settings" link.
//
// OFF by default: no consent banner is shown and Google Analytics loads
// directly (cookies still set) whenever NEXT_PUBLIC_GA_ID is present. Set
// NEXT_PUBLIC_COOKIE_CONSENT=on to bring the consent banner back and gate
// analytics on the visitor's choice.
export const COOKIE_CONSENT_ENABLED =
  process.env.NEXT_PUBLIC_COOKIE_CONSENT === 'on'
