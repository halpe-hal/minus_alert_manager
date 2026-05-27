import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export const ADMIN_EMAILS = ["admin@kklia.com"];

export type Store = { id: number; name: string };

export const getPermittedShops = cache(async (): Promise<Store[]> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  if (ADMIN_EMAILS.includes(user.email ?? "")) {
    const { data } = await supabase.from("stores").select("id, name").order("id");
    return (data ?? []) as Store[];
  }

  const { data } = await supabase
    .from("user_store_permissions")
    .select("store_id, stores(id, name)")
    .eq("user_id", user.id);

  return ((data ?? []) as unknown as { stores: Store }[])
    .map((r) => r.stores)
    .sort((a, b) => a.id - b.id);
});
