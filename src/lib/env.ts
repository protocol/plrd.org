import { cleanEnv, makeValidator, str } from 'envalid'

const cookieSecret = makeValidator<string>((value) => {
  if (value.trim().length < 32 ||
      value === 'development-secret-at-least-32-chars!!' ||
      value === 'your-32-character-secret-here-change-me') {
    throw new Error('Must be an explicitly configured secret of at least 32 characters, not a public default or placeholder')
  }
  return value
})

export const env = cleanEnv(process.env, {
  COOKIE_SECRET: cookieSecret(),
  PUBLIC_URL: str({ default: '' }),
  ATPROTO_JWK_PRIVATE: str({ default: '' }),
  ATPROTO_HANDLE: str({ default: '' }),
  ATPROTO_PASSWORD: str({ default: '' }),
})

// Port is read separately as it may not be available in all Next.js contexts
export const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000
