import assert from "node:assert/strict";

import { getByokPricingCtaState } from "./byok-pricing";

assert.deepEqual(
  getByokPricingCtaState({
    planId: "lifetime-early-bird",
    hasLifetimeEntitlement: true,
    hasUser: true,
  }),
  {
    label: "Lifetime access active",
    disabled: true,
    action: "active",
  },
);

assert.deepEqual(
  getByokPricingCtaState({
    planId: "lifetime-early-bird",
    hasLifetimeEntitlement: false,
    hasUser: true,
  }),
  {
    label: "Get lifetime access",
    disabled: false,
    action: "checkout",
  },
);

assert.deepEqual(
  getByokPricingCtaState({
    planId: "lifetime-regular",
    hasLifetimeEntitlement: false,
    hasUser: true,
  }),
  {
    label: "After early bird",
    disabled: true,
    action: "future",
  },
);
