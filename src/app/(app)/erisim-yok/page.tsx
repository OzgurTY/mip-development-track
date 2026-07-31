import { Lock } from "lucide-react";
import { getAccess } from "@/lib/auth/access";
import { firstVisibleHref } from "@/lib/auth/pages";
import { redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";

/**
 * Hicbir sayfaya erisimi olmayan kullanicinin dustugu ekran. Erisimi olan
 * biri buraya gelirse ilk gorunur sayfaya geri gonderilir.
 */
export default async function NoAccessPage() {
  const access = await getAccess();
  const target = firstVisibleHref(access);
  if (target) redirect(target);

  return (
    <div className="bento p-2">
      <EmptyState
        icon={Lock}
        title="Görüntüleyebileceğiniz bir sayfa yok"
        description="Hesabınıza henüz sayfa erişimi tanımlanmamış. Yöneticinizle görüşün."
      />
    </div>
  );
}
