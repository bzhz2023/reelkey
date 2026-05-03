import assert from "node:assert/strict";

import { shouldShowCreditBalanceInHeader } from "./header-visibility";

assert.equal(
  shouldShowCreditBalanceInHeader({ isByokMode: true, hasUser: true }),
  false,
  "BYOK mode should hide the legacy credit balance in the marketing header"
);

assert.equal(
  shouldShowCreditBalanceInHeader({ isByokMode: false, hasUser: true }),
  true,
  "non-BYOK deployments should keep showing the credit balance for logged-in users"
);

assert.equal(
  shouldShowCreditBalanceInHeader({ isByokMode: false, hasUser: false }),
  false,
  "logged-out users should not see a credit balance"
);
