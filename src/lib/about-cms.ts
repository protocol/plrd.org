import { ABOUT_CONTENT_URL } from '@/lib/about'
import { cmsRetiredResponse } from '@/lib/cms-retired'

export function aboutCmsRetiredResponse() {
  return cmsRetiredResponse(ABOUT_CONTENT_URL)
}
