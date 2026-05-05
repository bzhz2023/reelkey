"use client";

import { useMemo } from "react";
import { useMobileMenu } from "@/components/layout/mobile-menu-context";
import { HeaderSimple } from "@/components/layout/header-simple";
import { Sidebar } from "@/components/layout/sidebar";
import { authClient } from "@/lib/auth/client";
import type { User } from "@/lib/auth/client";
import { sidebarNavigation } from "@/config/navigation";
import { CREDITS_CONFIG } from "@/config/credits";
import { useIdleRoutePrefetch } from "@/hooks/use-idle-route-prefetch";

interface ToolLayoutContentProps {
  children: React.ReactNode;
  lang: string;
  initialUser?: Pick<User, "name" | "image" | "email"> | null;
}

export function ToolLayoutContent({
  children,
  lang,
  initialUser = null,
}: ToolLayoutContentProps) {
  const { mobileMenuOpen, setMobileMenuOpen } = useMobileMenu();
  const { data: session } = authClient.useSession();
  const user = session?.user ?? initialUser;
  const isByokMode = CREDITS_CONFIG.BYOK_MODE;
  const prefetchHrefs = useMemo(() => {
    const toolHrefs =
      sidebarNavigation
        .find((group) => group.id === "video")
        ?.items.map((item) => `/${lang}${item.href}`) ?? [];

    if (process.env.NODE_ENV === "development") {
      return toolHrefs;
    }

    const sidebarHrefs = sidebarNavigation.flatMap((group) =>
      group.items
        .filter((item) => !(isByokMode && item.hiddenInByok))
        .map((item) => `/${lang}${item.href}`),
    );

    return [
      ...sidebarHrefs,
      `/${lang}`,
      `/${lang}/pricing`,
      `/${lang}/privacy`,
    ];
  }, [isByokMode, lang]);

  useIdleRoutePrefetch(prefetchHrefs);

  return (
    <div className="min-h-screen bg-background">
      <HeaderSimple
        user={user}
        lang={lang}
        mobileMenuOpen={mobileMenuOpen}
        onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
      />

      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar
          lang={lang}
          mobileOpen={mobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />

        <div className="flex flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
