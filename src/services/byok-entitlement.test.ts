import assert from "node:assert/strict";

import {
  buildByokEntitlementGrantInput,
  isByokLifetimeCheckout,
} from "./byok-entitlement";

const productId = "prod_lifetime_test";

assert.equal(
  isByokLifetimeCheckout({
    productId,
    configuredProductId: productId,
    metadata: {},
  }),
  true,
);

assert.equal(
  isByokLifetimeCheckout({
    productId: "prod_other",
    configuredProductId: productId,
    metadata: {
      plan: "lifetime-early-bird",
      billingKind: "lifetime",
    },
  }),
  false,
);

assert.equal(
  isByokLifetimeCheckout({
    productId: "prod_lifetime_from_metadata",
    configuredProductId: "",
    metadata: {
      plan: "lifetime-early-bird",
      billingKind: "lifetime",
    },
  }),
  true,
);

const grantInput = buildByokEntitlementGrantInput({
  productId,
  productName: "ReelKey Lifetime",
  metadata: {
    referenceId: "user_123",
    plan: "lifetime-early-bird",
    billingKind: "lifetime",
  },
  order: { id: "order_123" },
  checkoutId: "checkout_123",
  customerId: "cust_123",
  webhookId: "evt_123",
});

assert.deepEqual(grantInput, {
  userId: "user_123",
  productId,
  productName: "ReelKey Lifetime",
  orderId: "order_123",
  checkoutId: "checkout_123",
  customerId: "cust_123",
  source: "creem",
  metadata: {
    referenceId: "user_123",
    plan: "lifetime-early-bird",
    billingKind: "lifetime",
    webhookId: "evt_123",
  },
});

assert.throws(
  () =>
    buildByokEntitlementGrantInput({
      productId,
      productName: "ReelKey Lifetime",
      metadata: {},
      order: "order_123",
    }),
  /referenceId/,
);
