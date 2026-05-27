'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createSupabaseClient } from '@/lib/supabase';
import { ADMIN_EMAILS } from '@/lib/permissions';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/');
  }
  return createSupabaseClient();
}

export async function updateStoreToken(storeId: number, lineToken: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('stores')
    .update({ line_token: lineToken })
    .eq('id', storeId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function upsertDeadlineConfig(storeId: number, lineGroupId: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from('store_deadline_config')
    .upsert({ store_id: storeId, line_group_id: lineGroupId, contacts: '' });
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function addLineGroup(
  storeId: number,
  groupName: string,
  managerName: string,
  tempManagerName: string,
  lineGroupId: string,
  sortOrder: number,
) {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from('store_line_groups')
    .insert({
      store_id: storeId,
      group_name: groupName,
      manager_name: managerName,
      temp_manager_name: tempManagerName,
      line_group_id: lineGroupId,
      sort_order: sortOrder,
    })
    .select()
    .single();
  revalidatePath('/admin');
  return data;
}

export async function updateLineGroup(
  groupId: string,
  groupName: string,
  managerName: string,
  tempManagerName: string,
  lineGroupId: string,
) {
  const supabase = await requireAdmin();
  await supabase
    .from('store_line_groups')
    .update({ group_name: groupName, manager_name: managerName, temp_manager_name: tempManagerName, line_group_id: lineGroupId })
    .eq('id', groupId);
  revalidatePath('/admin');
}

export async function deleteLineGroup(groupId: string) {
  const supabase = await requireAdmin();
  await supabase.from('store_line_groups').delete().eq('id', groupId);
  revalidatePath('/admin');
}

export async function addCategory(
  groupId: string,
  categoryName: string,
  categoryColor: string,
  sortOrder: number,
) {
  const supabase = await requireAdmin();
  await supabase
    .from('store_line_group_categories')
    .insert({ group_id: groupId, category_name: categoryName, category_color: categoryColor, sort_order: sortOrder });
  revalidatePath('/admin');
}

export async function updateCategory(
  categoryId: string,
  categoryName: string,
  categoryColor: string,
) {
  const supabase = await requireAdmin();
  await supabase
    .from('store_line_group_categories')
    .update({ category_name: categoryName, category_color: categoryColor })
    .eq('id', categoryId);
  revalidatePath('/admin');
}

export async function deleteCategory(categoryId: string) {
  const supabase = await requireAdmin();
  await supabase.from('store_line_group_categories').delete().eq('id', categoryId);
  revalidatePath('/admin');
}
