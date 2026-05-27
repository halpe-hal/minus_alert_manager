import { createSupabaseClient } from './supabase';
import { getTodayJST } from './date';

export type MinusRecord = {
  id: string;
  group_id: string | null;
  category: string;
  date_display: string;
  date_origin: string;
  time_range: string;
  minus_count: number;
};

export async function getShopData(storeId: number): Promise<{
  currentDeadline: string | null;
  records: MinusRecord[];
}> {
  const supabase = createSupabaseClient();
  const today = getTodayJST();

  const { data: deadlineRows } = await supabase
    .from('shift_deadline')
    .select('id, deadline, created_at')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false });

  let currentDeadline: string | null = null;

  if (deadlineRows && deadlineRows.length > 0) {
    const latest = deadlineRows[0];
    if (latest.deadline >= today) {
      currentDeadline = latest.deadline;
      const toDelete = deadlineRows.slice(1).map((r: { id: string }) => r.id);
      if (toDelete.length > 0) {
        await supabase.from('shift_deadline').delete().in('id', toDelete);
      }
    } else {
      await supabase.from('shift_deadline').delete().eq('id', latest.id);
    }
  }

  const { data: records } = await supabase
    .from('minus')
    .select('id, group_id, category, date_display, date_origin, time_range, minus_count')
    .eq('store_id', storeId)
    .gte('date_origin', today)
    .order('date_origin');

  return {
    currentDeadline,
    records: (records as MinusRecord[]) || [],
  };
}
