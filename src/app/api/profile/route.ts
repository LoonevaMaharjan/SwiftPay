import { NextRequest, NextResponse } from 'next/server'
import { apiError, requireAppUser } from '@/lib/server-auth'

export async function GET(request: NextRequest) {
  try { return NextResponse.json({ user: await requireAppUser(request) }) }
  catch (error) { return apiError(error) }
}
