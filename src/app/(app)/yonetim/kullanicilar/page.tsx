import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/page-header";
import { AdminSubnav } from "../admin-subnav";
import { UserTable } from "./user-table";
import { UserDialog } from "./user-dialog";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_superadmin")
    .eq("id", user!.id)
    .single();
  if (profile?.role !== "admin") redirect("/");
  const isSuperadmin = profile?.is_superadmin === true;

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yönetim"
        subtitle={`${users.length} kullanıcı, rol ve erişim yönetimi.`}
      >
        {isSuperadmin ? <UserDialog isSuperadmin /> : null}
      </PageHeader>
      <AdminSubnav />
      <UserTable
        users={users}
        currentUserId={user!.id}
        isSuperadmin={isSuperadmin}
      />
    </div>
  );
}
