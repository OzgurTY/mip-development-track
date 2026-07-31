import { listUsers } from "@/lib/users/queries";
import { PageHeader } from "@/components/page-header";
import { AdminSubnav } from "../admin-subnav";
import { UserTable } from "./user-table";
import { UserDialog } from "./user-dialog";
import { requirePage } from "@/lib/auth/access";

export default async function UsersPage() {
  const access = await requirePage("yonetim");
  const isSuperadmin = access.isSuperadmin;

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
        currentUserId={access.userId}
        isSuperadmin={isSuperadmin}
      />
    </div>
  );
}
