import { supabaseAdmin } from '@/lib/supabase-admin'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const privy_user_id = request.nextUrl.searchParams.get('privy_user_id')

  if (!privy_user_id) {
    return NextResponse.json({ error: 'privy_user_id is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('username, email, wallet_address')
    .eq('privy_user_id', privy_user_id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: data })
}