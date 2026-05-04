"use client";

import { HeaderSimple } from "@/components/layout/header-simple";
import { Sidebar } from "@/components/layout/sidebar";
import { UpgradeModal } from "@/components/upgrade/upgrade-modal";
import { authClient } from "@/lib/auth/client";

interface DashboardLayoutContentProps {
  children?: React.ReactNode;
  lang: string;
}

export function DashboardLayoutContent({
  children,
  lang,
}: DashboardLayoutContentProps) {
  const { data: session } = authClient.useSession();
  const user = session?.user ?? null;

  return (
    <div className="min-h-screen bg-background">
      <HeaderSimple user={user} lang={lang} />

      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar lang={lang} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>

      <UpgradeModal />
    </div>
  );
}
