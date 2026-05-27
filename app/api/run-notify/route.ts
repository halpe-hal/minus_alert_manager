import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseClient } from '@/lib/supabase';
import { runNotifyForStore } from '@/lib/notify';

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseClient();
    const { data: stores } = await supabase.from('stores').select('id').order('id');

    for (const store of stores ?? []) {
      await runNotifyForStore(store.id);
    }

    return NextResponse.json({ status: 'ok', message: `${(stores ?? []).length}店舗への通知が完了しました` });
  } catch (error) {
    console.error('Notify error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
