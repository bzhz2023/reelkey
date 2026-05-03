export type ByokPricingPlanId =
  | "free"
  | "lifetime-early-bird"
  | "lifetime-regular";

export type ByokBillingKind = "free" | "lifetime";

export type ByokPlanAvailability = "available" | "after_early_bird";

export interface ByokPricingPlan {
  id: ByokPricingPlanId;
  title: string;
  subtitle: string;
  priceUsd: number;
  billingKind: ByokBillingKind;
  availability: ByokPlanAvailability;
  monthlyGenerations: number | null;
  modelAccess: string;
  historyRetentionDays: number | null;
  includesCloudStorage: boolean;
  highlight?: boolean;
  productId?: string;
  ctaLabel: string;
  features: string[];
}

const lifetimeProductId =
  process.env.NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID ?? "";

export const BYOK_PRICING_PLANS: ByokPricingPlan[] = [
  {
    id: "free",
    title: "Free",
    subtitle: "Try ReelKey with your own fal.ai key",
    priceUsd: 0,
    billingKind: "free",
    availability: "available",
    monthlyGenerations: 10,
    modelAccess: "2 models",
    historyRetentionDays: 7,
    includesCloudStorage: false,
    ctaLabel: "Start free",
    features: [
      "10 generations per month",
      "Access to 2 starter models",
      "7-day generation history",
      "Use your own fal.ai billing",
    ],
  },
  {
    id: "lifetime-early-bird",
    title: "Lifetime Early Bird",
    subtitle: "One-time access for early users",
    priceUsd: 29,
    billingKind: "lifetime",
    availability: "available",
    monthlyGenerations: null,
    modelAccess: "all models",
    historyRetentionDays: null,
    includesCloudStorage: true,
    highlight: true,
    productId: lifetimeProductId,
    ctaLabel: "Get lifetime access",
    features: [
      "Unlimited generations through your API key",
      "Access to every supported video model",
      "Permanent cloud storage for completed videos",
      "Future model additions included",
    ],
  },
  {
    id: "lifetime-regular",
    title: "Lifetime Regular",
    subtitle: "Available after the early-bird window",
    priceUsd: 49,
    billingKind: "lifetime",
    availability: "after_early_bird",
    monthlyGenerations: null,
    modelAccess: "all models",
    historyRetentionDays: null,
    includesCloudStorage: true,
    ctaLabel: "After early bird",
    features: [
      "Unlimited generations through your API key",
      "Access to every supported video model",
      "Permanent cloud storage for completed videos",
      "Same lifetime access after launch pricing",
    ],
  },
];

export function getByokPricingPlans(): ByokPricingPlan[] {
  return BYOK_PRICING_PLANS;
}

export function getActiveByokPricingPlan(
  planId: ByokPricingPlanId,
): ByokPricingPlan {
  const plan = BYOK_PRICING_PLANS.find((item) => item.id === planId);

  if (!plan) {
    throw new Error(`Unknown BYOK pricing plan: ${planId}`);
  }

  return plan;
}
