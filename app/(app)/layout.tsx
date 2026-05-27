import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ADMIN_EMAILS, getPermittedShops } from "@/lib/permissions";
import { logout } from "@/app/actions/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const permittedShops = await getPermittedShops();
  const isAdmin = ADMIN_EMAILS.includes(user.email ?? "");

  if (!isAdmin && permittedShops.length === 0) redirect("/auth/signout");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{user.email}</span>
          {isAdmin && (
            <Link href="/admin" className="text-sm text-[#006a38] hover:underline">
              設定
            </Link>
          )}
        </div>
        <form action={logout}>
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-700 underline">
            ログアウト
          </button>
        </form>
      </header>
      {children}
    </div>
  );
}
