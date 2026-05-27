import { cache } from "react";
import { createSupabaseClient } from "@/lib/supabase";

export type LineGroupCategory = {
  id: string;
  group_id: string;
  category_name: string;
  category_color: string;
  sort_order: number;
};

export type LineGroup = {
  id: string;
  store_id: number;
  group_name: string;
  manager_name: string;
  temp_manager_name: string;
  line_group_id: string;
  sort_order: number;
  categories: LineGroupCategory[];
};

export type DeadlineConfig = {
  store_id: number;
  line_group_id: string;
  contacts: string;
};

export type ShopConfig = {
  id: number;
  name: string;
  line_token: string;
  groups: LineGroup[];
  deadlineConfig: DeadlineConfig | null;
};

export const getShopConfig = cache(async (storeId: number): Promise<ShopConfig | null> => {
  const supabase = createSupabaseClient();

  const { data: store } = await supabase
    .from("stores")
    .select("id, name, line_token")
    .eq("id", storeId)
    .single();

  if (!store) return null;

  const { data: groupsRaw } = await supabase
    .from("store_line_groups")
    .select(`
      id, store_id, group_name, manager_name, temp_manager_name, line_group_id, sort_order,
      store_line_group_categories(id, group_id, category_name, category_color, sort_order)
    `)
    .eq("store_id", storeId)
    .order("sort_order");

  const { data: deadlineConfig } = await supabase
    .from("store_deadline_config")
    .select("store_id, line_group_id, contacts")
    .eq("store_id", storeId)
    .maybeSingle();

  type RawGroup = Omit<LineGroup, "categories"> & {
    store_line_group_categories: LineGroupCategory[];
  };

  const groups: LineGroup[] = ((groupsRaw ?? []) as unknown as RawGroup[]).map((g) => ({
    ...g,
    categories: (g.store_line_group_categories ?? []).sort((a, b) => a.sort_order - b.sort_order),
  }));

  return {
    id: store.id as number,
    name: store.name as string,
    line_token: (store.line_token ?? '') as string,
    groups,
    deadlineConfig: (deadlineConfig ?? null) as DeadlineConfig | null,
  };
});
