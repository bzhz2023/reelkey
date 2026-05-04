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
  userId?: string;
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
  userId,
}: {
  hasLifetimeEntitlement: boolean;
  plan: ByokPricingPlan;
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

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-lg border bg-background p-6 shadow-sm",
        plan.highlight && "border-primary shadow-md",
      )}
    >
      {plan.highlight ? (
        <Badge className="absolute right-5 top-5">{t("earlyBirdBadge")}</Badge>
      ) : null}

      <div className="mb-6">
        <h3 className="text-xl font-semibold">{planTitle}</h3>
        <p className="mt-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {planSubtitle}
        </p>
      </div>

      <div className="mb-6 flex items-end gap-2">
        <span className="text-5xl font-bold tracking-normal">
          {formatPrice(plan.priceUsd)}
        </span>
        <span className="pb-2 text-sm text-muted-foreground">{billingLabel}</span>
      </div>

      <div className="mb-6 grid gap-3 text-sm">
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

      <ul className="mb-8 grid gap-3 text-sm text-muted-foreground">
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
  userId,
}: ByokLifetimePricingProps) {
  const t = useTranslations("ByokPricing");
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const plans = getByokPricingPlans();
  const localePrefix = getLocalePrefix(pathname);
  const activeUserId = userId ?? session?.user?.id;

  return (
    <div>
      <div className="mx-auto mb-12 max-w-3xl text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-sm text-muted-foreground">
          <KeyRound className="size-4" />
          {t("badge")}
        </div>
        <h2 className="text-3xl font-bold md:text-5xl">{t("title")}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((plan) => (
          <PlanCard
            hasLifetimeEntitlement={hasLifetimeEntitlement}
            key={plan.id}
            plan={plan}
            userId={activeUserId}
          />
        ))}
      </div>

      <div className="mx-auto mt-8 max-w-3xl rounded-lg border bg-muted/40 p-4 text-center text-sm text-muted-foreground">
        {t("bottomNote")}
      </div>

      <div className="mt-6 text-center text-sm text-muted-foreground">
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
