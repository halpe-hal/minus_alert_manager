'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseClient } from '@/lib/supabase';
import { sendLineMessage } from '@/lib/line';
import { getTodayJST, getUrgentDays } from '@/lib/date';

export async function insertMinus(
  storeId: number,
  groupId: string,
  category: string,
  dateDisplay: string,
  dateOrigin: string,
  timeRange: string,
  minusCount: number,
) {
  const supabase = createSupabaseClient();
  await supabase.from('minus').insert([{
    store_id: storeId,
    group_id: groupId,
    category,
    date_display: dateDisplay,
    date_origin: dateOrigin,
    time_range: timeRange,
    minus_count: minusCount,
  }]);
  revalidatePath(`/shop/${storeId}`);
}

export async function updateMinus(storeId: number, id: string, newCount: number) {
  const supabase = createSupabaseClient();
  if (newCount <= 0) {
    await supabase.from('minus').delete().eq('id', id);
  } else {
    await supabase.from('minus').update({ minus_count: newCount }).eq('id', id);
  }
  revalidatePath(`/shop/${storeId}`);
}

export async function updateDeadline(storeId: number, dateStr: string) {
  const supabase = createSupabaseClient();
  await supabase.from('shift_deadline').delete().eq('store_id', storeId);
  await supabase.from('shift_deadline').insert([{ store_id: storeId, deadline: dateStr }]);
  revalidatePath(`/shop/${storeId}`);
}

export async function notifyDeadline(storeId: number, deadlineDate: string) {
  const supabase = createSupabaseClient();

  const [{ data: store }, { data: config }, { data: groups }] = await Promise.all([
    supabase.from('stores').select('line_token').eq('id', storeId).single(),
    supabase.from('store_deadline_config').select('line_group_id').eq('store_id', storeId).single(),
    supabase.from('store_line_groups').select('group_name, manager_name, temp_manager_name').eq('store_id', storeId).order('sort_order'),
  ]);

  if (!store?.line_token || !config?.line_group_id) return;

  const contacts = (groups ?? [])
    .filter((g) => g.manager_name || g.temp_manager_name)
    .map((g) =>
      g.temp_manager_name
        ? `${g.group_name}：${g.temp_manager_name}`
        : `${g.group_name}：${g.manager_name}店長`,
    )
    .join('\n');

  const [, mm, dd] = deadlineDate.split('-');
  const m = Number(mm);
  const day = Number(dd);

  const contactsLine = contacts ? `\n\n提出が遅れる方は、\n\n${contacts}\n\nまで必ず連絡ください！` : '';
  const message = `⚠️シフト提出締切日は\n【${m}/${day}】です！\n提出遅れないようにお願いします！${contactsLine}`;
  await sendLineMessage(store.line_token, config.line_group_id, message);
}

export async function notifyGroup(groupId: string) {
  const supabase = createSupabaseClient();

  const { data: group } = await supabase
    .from('store_line_groups')
    .select(`
      store_id, group_name, line_group_id,
      store_line_group_categories(category_name)
    `)
    .eq('id', groupId)
    .single();

  if (!group?.line_group_id) return;

  const { data: store } = await supabase
    .from('stores')
    .select('line_token')
    .eq('id', group.store_id)
    .single();

  if (!store?.line_token) return;

  const today = getTodayJST();
  const urgentDays = getUrgentDays();

  const { data: records } = await supabase
    .from('minus')
    .select('*')
    .eq('group_id', groupId)
    .gte('date_origin', today)
    .order('date_origin');

  if (!records || records.length === 0) return;

  const catMap: Record<string, string[]> = {};
  for (const record of records) {
    const suffix = urgentDays.includes(record.date_display) ? '🆘' : '';
    catMap[record.category] = catMap[record.category] || [];
    catMap[record.category].push(
      `${record.date_display} ${record.time_range} ▲${record.minus_count}人${suffix}`,
    );
  }

  let message = '🆘シフトご協力お願いします🆘\n\n';
  for (const [cat, lines] of Object.entries(catMap).sort()) {
    message += `${cat}\n`;
    for (const line of lines.sort()) message += `${line}\n`;
    message += '\n';
  }
  message += 'ーーーーーーーーー\n\n';
  message += `ヘルプ可能な方は【${group.group_name}】のグループLINEへ連絡お願いします！`;

  await sendLineMessage(store.line_token, group.line_group_id, message.trim());
}
