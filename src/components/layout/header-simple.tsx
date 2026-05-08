"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Gem, Globe, Menu, Sun, Moon, Monitor } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";

import { authClient, type User } from "@/lib/auth/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/components/ui";
import { useCredits } from "@/stores/credits-store";
import { UserAvatar } from "@/components/user-avatar";
import { useSigninModal } from "@/hooks/use-signin-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { userMenuItems } from "@/config/navigation";
import { i18n, localeMap, LOCALE_COOKIE_NAME } from "@/config/i18n-config";
import { CREDITS_CONFIG } from "@/config/credits";

interface HeaderSimpleProps {
  user?: Pick<User, "name" | "image" | "email"> | null;
  lang?: string;
  mobileMenuOpen?: boolean;
  onMobileMenuToggle?: () => void;
}

export function HeaderSimple({
  user,
  lang = "en",
  mobileMenuOpen = false,
  onMobileMenuToggle,
}: HeaderSimpleProps) {
  const signInModal = useSigninModal();
  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const tCommon = useTranslations("Common");
  const tHeader = useTranslations("Header");
  const currentLocale = lang || "en";
  const [optimisticLocale, setOptimisticLocale] = useState(currentLocale);
  const [, startLocaleTransition] = useTransition();
  const isByokMode = CREDITS_CONFIG.BYOK_MODE;
  const { balance } = useCredits({ enabled: Boolean(user) && !isByokMode });
  const visibleUserMenuItems = userMenuItems.filter(
    (item) => !(isByokMode && item.hiddenInByok)
  );

  const getLocalizedPath = useCallback((nextLocale: string) => {
    const pathWithoutLocale = pathname.replace(
      new RegExp(`^/(${i18n.locales.join("|")})(?=/|$)`),
      "",
    ) || "/";
    return nextLocale === i18n.defaultLocale
      ? pathWithoutLocale
      : `/${nextLocale}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  }, [pathname]);

  useEffect(() => {
    setOptimisticLocale(currentLocale);
  }, [currentLocale]);

  useEffect(() => {
    for (const locale of i18n.locales) {
      if (locale !== currentLocale) {
        router.prefetch(getLocalizedPath(locale));
      }
    }
  }, [currentLocale, getLocalizedPath, router]);

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === currentLocale) return;
    setOptimisticLocale(nextLocale);
    startLocaleTransition(() => {
      document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=31536000; SameSite=Lax`;
      window.location.assign(getLocalizedPath(nextLocale));
    });
  };

  const menuLabelMap: Record<string, string> = {
    creations: tHeader("myCreations"),
    credits: isByokMode ? tHeader("apiUsage") : tHeader("credits"),
    settings: tHeader("settings"),
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b border-border bg-background">
      <div className="flex h-full items-center justify-between px-4">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="lg:hidden p-2 hover:bg-muted rounded-md"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href={`/${lang}`} className="flex items-center gap-2">
            <span className="text-xl font-semibold">ReelKey</span>
          </Link>
        </div>

        {/* Right: Account controls */}
        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground"
              >
                <Globe className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  {optimisticLocale.toUpperCase()}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[140px]">
              <div className="px-2 py-1 text-xs text-muted-foreground">
                {tCommon("language")}
              </div>
              {i18n.locales.map((locale) => (
                <DropdownMenuItem
                  key={locale}
                  onSelect={() => switchLocale(locale)}
                  className={cn(
                    "cursor-pointer",
                    locale === optimisticLocale && "bg-muted"
                  )}
                >
                  <span>{localeMap[locale]}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 px-0 text-muted-foreground hover:text-foreground"
                aria-label="Toggle theme"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[120px]">
              <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Credits Display - hidden in BYOK mode, original credit UI kept for non-BYOK deployments */}
          {user && !isByokMode && balance && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border">
              <Gem className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">
                {balance.availableCredits}
              </span>
            </div>
          )}

          {/* User Menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2">
                <UserAvatar
                  user={{ name: user.name ?? null, image: user.image ?? null }}
                  className="h-8 w-8"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {user.email && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    {user.email}
                  </div>
                )}
                <DropdownMenuSeparator />
                {visibleUserMenuItems.map((item) => (
                  <DropdownMenuItem key={item.id} asChild>
                    <Link href={`/${lang}${item.href}`}>
                      {menuLabelMap[item.id] ?? item.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-destructive"
                  onSelect={async () => {
                    await authClient.signOut();
                    router.push(`/${lang}`);
                    router.refresh();
                  }}
                >
                  {tCommon("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" onClick={() => signInModal.onOpen()}>
              {tCommon("login")}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
