import { redirect } from "next/navigation";
import { getPermittedShops } from "@/lib/permissions";

export default async function HomePage() {
  const permittedShops = await getPermittedShops();

  if (permittedShops.length === 0) redirect("/auth/signout");
  redirect(`/shop/${permittedShops[0].id}`);
}
