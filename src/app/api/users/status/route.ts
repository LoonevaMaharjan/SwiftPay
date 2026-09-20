import { NextRequest, NextResponse } from 'next/server';
import { apiError, requirePrivyUser } from '@/lib/server-auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const auth = await requirePrivyUser(request);
    const { data, error } = await supabaseAdmin.from('users').select('id').eq('privy_user_id', auth.user_id).maybeSingle();
    if (error) throw new Error('Couldn’t check your SwiftPay profile.');
    return NextResponse.json({ profileComplete: Boolean(data) });
  } catch (error) {
    return apiError(error);
  }
}
