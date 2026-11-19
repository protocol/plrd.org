import { cmsRetiredResponse } from '@/lib/cms-retired'

export const dynamic = 'force-dynamic'

export async function POST() { return cmsRetiredResponse() }
