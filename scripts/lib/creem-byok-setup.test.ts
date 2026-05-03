import assert from "node:assert/strict";

import {
  buildByokProductPayload,
  buildByokProducts,
  buildWebhookUrl,
  upsertEnvContent,
} from "./creem-byok-setup";

assert.deepEqual(
  buildByokProductPayload({
    appUrl: "https://reelkey.app/",
    currency: "usd",
    description: "Lifetime BYOK access",
    name: "ReelKey Lifetime Early Bird",
    priceUsd: 29,
    taxMode: "exclusive",
  }),
  {
    name: "ReelKey Lifetime Early Bird",
    description: "Lifetime BYOK access",
    price: 2900,
    currency: "USD",
    billing_type: "onetime",
    tax_mode: "exclusive",
    tax_category: "saas",
    default_success_url: "https://reelkey.app/settings?payment=success",
  },
);

assert.deepEqual(
  buildByokProducts({
    appUrl: "https://reelkey.app",
    currency: "USD",
    taxMode: "exclusive",
  }).map(({ key, payload }) => ({
    key,
    name: payload.name,
    price: payload.price,
  })),
  [
    {
      key: "earlyBird",
      name: "ReelKey Lifetime Early Bird",
      price: 2900,
    },
    {
      key: "regular",
      name: "ReelKey Lifetime Regular",
      price: 4900,
    },
  ],
);

assert.equal(
  buildWebhookUrl("https://reelkey.app/"),
  "https://reelkey.app/api/auth/creem/webhook",
);

assert.equal(
  upsertEnvContent("NEXT_PUBLIC_APP_URL=http://localhost:3010\n", {
    CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID: "prod_123",
    CREEM_LIFETIME_PRODUCT_ID: "prod_123",
    CREEM_LIFETIME_REGULAR_PRODUCT_ID: "prod_456",
    NEXT_PUBLIC_CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID: "prod_123",
    NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID: "prod_123",
    NEXT_PUBLIC_CREEM_LIFETIME_REGULAR_PRODUCT_ID: "prod_456",
  }),
  "NEXT_PUBLIC_APP_URL=http://localhost:3010\nCREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID=\"prod_123\"\nCREEM_LIFETIME_PRODUCT_ID=\"prod_123\"\nCREEM_LIFETIME_REGULAR_PRODUCT_ID=\"prod_456\"\nNEXT_PUBLIC_CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID=\"prod_123\"\nNEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID=\"prod_123\"\nNEXT_PUBLIC_CREEM_LIFETIME_REGULAR_PRODUCT_ID=\"prod_456\"\n",
);

assert.equal(
  upsertEnvContent(
    "CREEM_LIFETIME_PRODUCT_ID=\"old\"\nNEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID=\"old\"\n",
    {
      CREEM_LIFETIME_PRODUCT_ID: "prod_new",
      NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID: "prod_new",
    },
  ),
  "CREEM_LIFETIME_PRODUCT_ID=\"prod_new\"\nNEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID=\"prod_new\"\n",
);
