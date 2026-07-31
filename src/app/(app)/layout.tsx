import type { ReactNode } from "react";
import { getAccess } from "@/lib/auth/access";
import { visiblePages } from "@/lib/auth/pages";
import { AppNav } from "@/components/app-nav";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const access = await getAccess();
  const pages = visiblePages(access).map(({ key, href, label }) => ({
    key,
    href,
    label,
  }));

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background lg:grid-cols-[256px_1fr] print:block print:bg-white">
      <AppNav
        pages={pages}
        role={access.role}
        name={access.name}
        email={access.email}
      />
      <main className="min-w-0 px-4 py-5 sm:px-6 sm:py-8 lg:px-10 lg:py-10 print:p-0">
        <div className="mx-auto w-full max-w-[1400px] print:max-w-none">
          {children}
        </div>
      </main>
      <Toaster />
    </div>
  );
}
