import assert from "node:assert/strict";
import {
  BYOK_PRICING_PLANS,
  getActiveByokPricingPlan,
  getByokPricingPlans,
} from "./byok-pricing";

const plans = getByokPricingPlans();

assert.deepEqual(
  plans.map((plan) => plan.id),
  ["free", "lifetime-early-bird", "lifetime-regular"],
);

const freePlan = getActiveByokPricingPlan("free");
assert.equal(freePlan.priceUsd, 0);
assert.equal(freePlan.monthlyGenerations, 10);
assert.equal(freePlan.modelAccess, "2 models");
assert.equal(freePlan.historyRetentionDays, 7);

const earlyBirdPlan = getActiveByokPricingPlan("lifetime-early-bird");
assert.equal(earlyBirdPlan.priceUsd, 29);
assert.equal(earlyBirdPlan.billingKind, "lifetime");
assert.equal(earlyBirdPlan.monthlyGenerations, null);
assert.equal(earlyBirdPlan.modelAccess, "all models");
assert.equal(earlyBirdPlan.includesCloudStorage, true);
assert.equal(earlyBirdPlan.highlight, true);

const regularPlan = getActiveByokPricingPlan("lifetime-regular");
assert.equal(regularPlan.priceUsd, 49);
assert.equal(regularPlan.billingKind, "lifetime");
assert.equal(regularPlan.availability, "after_early_bird");

assert.equal(
  BYOK_PRICING_PLANS.some((plan) =>
    `${plan.title} ${plan.subtitle} ${plan.features.join(" ")}`.match(
      /credits|subscription/i,
    ),
  ),
  false,
);
