import { cmsRetiredResponse } from '@/lib/cms-retired'

export const dynamic = 'force-dynamic'

export async function GET() { return cmsRetiredResponse() }
export async function PUT() { return cmsRetiredResponse() }
