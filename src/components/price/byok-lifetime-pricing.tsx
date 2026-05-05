"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTransition } from "react";
import {
  Check,
  Cloud,
  Infinity as InfinityIcon,
  KeyRound,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/components/ui";
import {
  getByokPricingPlans,
  getByokPricingCtaState,
  type ByokPricingPlan,
} from "@/config/byok-pricing";
import { useSigninModal } from "@/hooks/use-signin-modal";
import { authClient } from "@/lib/auth/client";

interface ByokLifetimePricingProps {
  hasLifetimeEntitlement?: boolean;
  showHeader?: boolean;
  userId?: string;
  variant?: "page" | "modal";
}

function formatPrice(priceUsd: number): string {
  return priceUsd === 0 ? "$0" : `$${priceUsd}`;
}

function getLocalePrefix(pathname: string): string {
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment === "zh" || segment === "en" ? `/${segment}` : "";
}

function PlanCard({
  hasLifetimeEntitlement,
  plan,
  variant = "page",
  userId,
}: {
  hasLifetimeEntitlement: boolean;
  plan: ByokPricingPlan;
  variant?: "page" | "modal";
  userId?: string;
}) {
  const t = useTranslations("ByokPricing");
  const pathname = usePathname();
  const signInModal = useSigninModal();
  const [isPending, startTransition] = useTransition();
  const localePrefix = getLocalePrefix(pathname);
  const isCheckoutPlan = plan.id === "lifetime-early-bird";
  const activeUserId = userId;
  const ctaState = getByokPricingCtaState({
    planId: plan.id,
    hasLifetimeEntitlement,
    hasUser: !!activeUserId,
  });

  // Resolve CTA label from i18n; "active" state uses a shared key
  const ctaLabel =
    ctaState.action === "active"
      ? t("ctaActive")
      : t(`plans.${plan.id}.ctaLabel` as Parameters<typeof t>[0]);

  const handleClick = () => {
    if (ctaState.action === "active" || ctaState.action === "future") return;

    if (plan.id === "free") {
      if (!activeUserId) {
        signInModal.onOpen();
        return;
      }
      window.location.href = `${localePrefix}/text-to-video`;
      return;
    }

    if (!isCheckoutPlan) return;

    if (!activeUserId) {
      signInModal.onOpen();
      return;
    }

    const productId = plan.productId;

    if (!productId) {
      import("sonner").then(({ toast }) => {
        toast.error("Checkout is not configured yet", {
          description:
            "Add NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID after creating the Creem lifetime product.",
        });
      });
      return;
    }

    startTransition(async () => {
      const [{ creem }, { toast }] = await Promise.all([
        import("@/lib/auth/client"),
        import("sonner"),
      ]);
      const origin = window.location.origin;
      const successUrl = `${origin}${localePrefix}/settings?payment=success`;

      const { data, error } = await creem.createCheckout({
        productId,
        successUrl,
        metadata: {
          plan: plan.id,
          billingKind: plan.billingKind,
        },
      });

      if (error) {
        toast.error("Checkout error", {
          description: error.message ?? "Failed to create checkout session.",
        });
        return;
      }

      if (!data || !("url" in data) || !data.url) {
        toast.error("Checkout error", {
          description: "Missing checkout URL from Creem.",
        });
        return;
      }

      window.location.href = data.url;
    });
  };

  const planTitle = t(`plans.${plan.id}.title` as Parameters<typeof t>[0]);
  const planSubtitle = t(`plans.${plan.id}.subtitle` as Parameters<typeof t>[0]);
  const planModelAccess = t(`plans.${plan.id}.modelAccess` as Parameters<typeof t>[0]);
  const planFeatures = t.raw(`plans.${plan.id}.features` as Parameters<typeof t>[0]) as string[];
  const billingLabel =
    plan.billingKind === "lifetime" ? t("billingLifetime") : t("billingFree");
  const isModal = variant === "modal";

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-lg border bg-background shadow-sm",
        isModal ? "p-4" : "p-6",
        plan.highlight && "border-primary shadow-md",
      )}
    >
      {plan.highlight ? (
        <Badge className="absolute right-4 top-4">{t("earlyBirdBadge")}</Badge>
      ) : null}

      <div className={cn(isModal ? "mb-4 pr-16" : "mb-6")}>
        <h3 className={cn("font-semibold", isModal ? "text-lg" : "text-xl")}>
          {planTitle}
        </h3>
        <p
          className={cn(
            "mt-2 text-sm leading-5 text-muted-foreground",
            !isModal && "min-h-10",
          )}
        >
          {planSubtitle}
        </p>
      </div>

      <div className={cn("flex items-end gap-2", isModal ? "mb-4" : "mb-6")}>
        <span
          className={cn(
            "font-bold tracking-normal",
            isModal ? "text-4xl" : "text-5xl",
          )}
        >
          {formatPrice(plan.priceUsd)}
        </span>
        <span className="pb-2 text-sm text-muted-foreground">{billingLabel}</span>
      </div>

      <div className={cn("grid gap-3 text-sm", isModal ? "mb-4" : "mb-6")}>
        <div className="flex items-center gap-2">
          <InfinityIcon className="size-4 text-primary" />
          <span>
            {plan.monthlyGenerations === null
              ? t("unlimited")
              : t("generationsPerMonth", { count: plan.monthlyGenerations })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span>{planModelAccess}</span>
        </div>
        <div className="flex items-center gap-2">
          <Cloud className="size-4 text-primary" />
          <span>
            {plan.includesCloudStorage
              ? t("cloudStorage")
              : t("historyDays", { days: plan.historyRetentionDays ?? 0 })}
          </span>
        </div>
      </div>

      <ul
        className={cn(
          "grid gap-3 text-sm text-muted-foreground",
          isModal ? "mb-5" : "mb-8",
        )}
      >
        {planFeatures.map((feature) => (
          <li className="flex gap-2" key={feature}>
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-auto w-full"
        disabled={isPending || ctaState.disabled}
        onClick={handleClick}
        variant={plan.highlight ? "default" : "outline"}
      >
        {isPending ? <Loader2 className="animate-spin" /> : null}
        {ctaLabel}
      </Button>
    </div>
  );
}

export function ByokLifetimePricing({
  hasLifetimeEntitlement = false,
  showHeader = true,
  variant = "page",
  userId,
}: ByokLifetimePricingProps) {
  const t = useTranslations("ByokPricing");
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const plans = getByokPricingPlans();
  const localePrefix = getLocalePrefix(pathname);
  const activeUserId = userId ?? session?.user?.id;
  const isModal = variant === "modal";

  return (
    <div>
      {showHeader ? (
        <div
          className={cn(
            "mx-auto max-w-3xl text-center",
            isModal ? "mb-6" : "mb-12",
          )}
        >
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
            <KeyRound className="size-4" />
            {t("badge")}
          </div>
          <h2
            className={cn(
              "font-bold tracking-normal",
              isModal ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl",
            )}
          >
            {t("title")}
          </h2>
          <p
            className={cn(
              "mx-auto mt-3 max-w-2xl text-muted-foreground",
              isModal ? "text-sm leading-6" : "text-lg",
            )}
          >
            {t("subtitle")}
          </p>
        </div>
      ) : null}

      <div className={cn("grid gap-4", isModal ? "md:grid-cols-3" : "lg:grid-cols-3")}>
        {plans.map((plan) => (
          <PlanCard
            hasLifetimeEntitlement={hasLifetimeEntitlement}
            key={plan.id}
            plan={plan}
            variant={variant}
            userId={activeUserId}
          />
        ))}
      </div>

      <div
        className={cn(
          "mx-auto max-w-3xl rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground",
          isModal ? "mt-5" : "mt-8",
        )}
      >
        {t("bottomNote")}
      </div>

      <div className={cn("text-center text-sm text-muted-foreground", isModal ? "mt-4" : "mt-6")}>
        {t.rich("manageKey", {
          link: (chunks) => (
            <Link
              className="text-primary hover:underline"
              href={`${localePrefix}/settings`}
            >
              {chunks}
            </Link>
          ),
        })}
      </div>
    </div>
  );
}
