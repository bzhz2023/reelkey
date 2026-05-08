"use client";

// ============================================
// Settings Page (Billing Only)
// ============================================

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Calendar, Mail } from "lucide-react";
import { toast } from "sonner";
import { useBilling } from "@/hooks/use-billing";
import { UserAvatar } from "@/components/user-avatar";
import { BillingList } from "@/components/billing";
import { Card, CardContent } from "@/components/ui/card";
import { FalKeyManager } from "@/components/settings/fal-key-manager";
import { CREDITS_CONFIG } from "@/config/credits";
import { authClient } from "@/lib/auth/client";

interface SettingsPageProps {
  locale: string;
  userEmail?: string;
  userId?: string;
}

export function SettingsPage({ locale, userEmail }: SettingsPageProps) {
  const t = useTranslations("dashboard.settings");
  const searchParams = useSearchParams();
  const { data: session } = authClient.useSession();
  const isByokMode = CREDITS_CONFIG.BYOK_MODE;
  const paymentStatus = searchParams.get("payment");

  const {
    user,
    invoices,
    hasMore,
    fetchNextPage,
    isLoading,
  } = useBilling({ enabled: !isByokMode });

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 }
    );

    const current = observerTarget.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasMore, isLoading, fetchNextPage]);

  useEffect(() => {
    if (paymentStatus !== "success") return;

    toast.success(t("paymentSuccess.title"), {
      id: "byok-payment-success",
      description: t("paymentSuccess.description"),
    });
  }, [paymentStatus, t]);

  // Use data from hook if available, otherwise use props
  const displayEmail = user?.email || session?.user?.email || userEmail;
  const displayName = user?.name || session?.user?.name || displayEmail || t("guest");
  const displayImage = session?.user?.image || null;
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt)
    : session?.user?.createdAt
      ? new Date(session.user.createdAt)
      : null;
  const joinedDateText = joinedDate
    ? new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(joinedDate)
    : null;

  return (
    <div className="min-w-0 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
      </div>

      {/* Account Info Card */}
      <Card className="max-w-full overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
            {/* Avatar */}
            <div className="relative w-fit shrink-0">
              <UserAvatar
                user={{ name: displayName, image: displayImage }}
                className="h-14 w-14 text-lg sm:h-16 sm:w-16 sm:text-xl"
              />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1 space-y-4">
              <div>
                <div className="mb-1 text-sm text-muted-foreground">{t("name")}</div>
                <h2 className="break-all text-lg font-semibold">{displayName}</h2>
              </div>

              <div className="space-y-3">
                {/* Email */}
                {displayEmail && (
                  <div className="flex min-w-0 items-start gap-3 text-sm">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
                      <span className="text-muted-foreground">{t("email")}:</span>
                      <span className="min-w-0 break-all font-medium">{displayEmail}</span>
                    </div>
                  </div>
                )}

                {/* Joined Date */}
                {joinedDateText && (
                  <div className="flex min-w-0 items-start gap-3 text-sm">
                    <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1">
                      <span className="text-muted-foreground">{t("joined")}:</span>
                      <span className="min-w-0 font-medium">
                        {joinedDateText}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <FalKeyManager />

      {/* Billing History */}
      {!isByokMode && (
        <BillingList
          invoices={invoices}
          hasMore={hasMore}
          onLoadMore={() => fetchNextPage()}
        />
      )}

      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={observerTarget} className="py-4" />}
    </div>
  );
}
