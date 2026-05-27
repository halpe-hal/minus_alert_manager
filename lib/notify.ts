import { createSupabaseClient } from './supabase';
import { sendLineMessage } from './line';
import { getTodayJST, getUrgentDays } from './date';

export async function runNotifyForStore(storeId: number): Promise<void> {
  const supabase = createSupabaseClient();
  const today = getTodayJST();

  const { data: store } = await supabase
    .from('stores')
    .select('line_token')
    .eq('id', storeId)
    .single();

  const lineToken = store?.line_token ?? '';
  if (!lineToken) return;

  // 1. 提出締切リマインド
  const { data: deadlineRows } = await supabase
    .from('shift_deadline')
    .select('deadline')
    .eq('store_id', storeId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (deadlineRows && deadlineRows.length > 0) {
    const deadlineDate = new Date(`${deadlineRows[0].deadline}T00:00:00+09:00`);
    const todayDate = new Date(`${today}T00:00:00+09:00`);
    const daysLeft = Math.round(
      (deadlineDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if ([1, 2, 3].includes(daysLeft)) {
      const { data: deadlineConfig } = await supabase
        .from('store_deadline_config')
        .select('line_group_id')
        .eq('store_id', storeId)
        .single();

      if (deadlineConfig?.line_group_id) {
        const { data: groupsForDeadline } = await supabase
          .from('store_line_groups')
          .select('group_name, manager_name, temp_manager_name')
          .eq('store_id', storeId)
          .order('sort_order');

        const contacts = (groupsForDeadline ?? [])
          .filter((g) => g.manager_name || g.temp_manager_name)
          .map((g) =>
            g.temp_manager_name
              ? `${g.group_name}：${g.temp_manager_name}`
              : `${g.group_name}：${g.manager_name}店長`,
          )
          .join('\n');

        await sendLineMessage(
          lineToken,
          deadlineConfig.line_group_id,
          buildDeadlineMessage(daysLeft, contacts),
        );
      }
    }
  }

  // 2. 期限切れレコード削除
  await supabase.from('minus').delete().eq('store_id', storeId).lt('date_origin', today);

  // 3. マイナスレコード取得
  const { data: records } = await supabase
    .from('minus')
    .select('*')
    .eq('store_id', storeId)
    .gte('date_origin', today)
    .order('date_origin');

  if (!records || records.length === 0) return;

  // 4. グループ別LINE通知
  const { data: groups } = await supabase
    .from('store_line_groups')
    .select(`
      id, group_name, manager_name, line_group_id,
      store_line_group_categories(category_name)
    `)
    .eq('store_id', storeId)
    .order('sort_order');

  if (!groups) return;

  const urgentDays = getUrgentDays();

  for (const group of groups) {
    const categories = (group.store_line_group_categories as { category_name: string }[]).map(
      (c) => c.category_name,
    );
    const groupRecords = records.filter((r) => categories.includes(r.category));
    if (groupRecords.length === 0) continue;
    if (!group.line_group_id) continue;

    const catMap: Record<string, string[]> = {};
    for (const record of groupRecords) {
      const suffix = urgentDays.includes(record.date_display) ? '🆘' : '';
      catMap[record.category] = catMap[record.category] || [];
      catMap[record.category].push(
        `${record.date_display} ${record.time_range} ▲${record.minus_count}人${suffix}`,
      );
    }

    let message = '⚠️シフトご協力お願いします⚠️\n\n';
    for (const [cat, lines] of Object.entries(catMap)) {
      message += `${cat}\n`;
      for (const line of lines) message += `${line}\n`;
      message += '\n';
    }
    message += 'ーーーーーーーーー\n\n';
    message += `ヘルプ可能な方は【${group.group_name}】のグループLINEへ連絡お願いします！`;

    await sendLineMessage(lineToken, group.line_group_id, message.trim());
  }
}

function buildDeadlineMessage(daysLeft: number, contacts: string): string {
  const contactsSection = contacts
    ? `\n\n提出が遅れる方は、\n\n${contacts}\n\nまで必ず連絡ください！`
    : '';
  if (daysLeft === 3) {
    return `⚠️シフト提出締切日まで【あと3日】です！${contactsSection}`;
  } else if (daysLeft === 2) {
    return `⚠️シフト提出締切日まで【あと2日】です！${contactsSection}`;
  } else {
    return `⚠️【明日】がシフト提出締切日です！\nまだ提出していない方は提出お願いします！${contactsSection}`;
  }
}
