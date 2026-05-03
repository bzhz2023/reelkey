#!/usr/bin/env tsx

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

import {
  buildByokProducts,
  buildWebhookUrl,
  extractProductId,
  getCreemApiBaseUrl,
  upsertEnvContent,
  type ByokProductKey,
  type CreemProductPayload,
} from "./lib/creem-byok-setup";

const projectRoot = resolve(import.meta.dirname, "..");
const envPath = resolve(projectRoot, ".env.local");

config({ path: envPath });

function readRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

async function createCreemProduct({
  apiKey,
  payload,
}: {
  apiKey: string;
  payload: CreemProductPayload;
}): Promise<string> {
  const response = await fetch(`${getCreemApiBaseUrl(apiKey)}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  const bodyText = await response.text();
  const body = bodyText ? JSON.parse(bodyText) : {};

  if (!response.ok) {
    throw new Error(
      `Creem product creation failed (${response.status}): ${bodyText}`
    );
  }

  return extractProductId(body);
}

function buildEnvUpdates(productIds: Record<ByokProductKey, string>) {
  return {
    NEXT_PUBLIC_BILLING_PROVIDER: "creem",
    CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID: productIds.earlyBird,
    CREEM_LIFETIME_PRODUCT_ID: productIds.earlyBird,
    CREEM_LIFETIME_REGULAR_PRODUCT_ID: productIds.regular,
    NEXT_PUBLIC_CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID: productIds.earlyBird,
    NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID: productIds.earlyBird,
    NEXT_PUBLIC_CREEM_LIFETIME_REGULAR_PRODUCT_ID: productIds.regular,
  };
}

async function main() {
  const apiKey = readRequiredEnv("CREEM_API_KEY");
  const appUrl = readRequiredEnv("NEXT_PUBLIC_APP_URL");
  const currency = process.env.CREEM_BYOK_CURRENCY?.trim() || "USD";
  const taxMode =
    process.env.CREEM_BYOK_TAX_MODE?.trim() === "inclusive"
      ? "inclusive"
      : "exclusive";
  const dryRun = process.argv.includes("--dry-run");

  console.log("Creem BYOK setup");
  console.log(`Mode: ${apiKey.startsWith("creem_test_") ? "test" : "live"}`);
  console.log(`App URL: ${appUrl}`);
  console.log(`Webhook URL: ${buildWebhookUrl(appUrl)}`);
  console.log("");

  const products = buildByokProducts({ appUrl, currency, taxMode });
  const productIds: Partial<Record<ByokProductKey, string>> = {};

  for (const product of products) {
    console.log(
      `${dryRun ? "Would create" : "Creating"}: ${product.payload.name} ($${product.payload.price / 100})`
    );

    if (dryRun) {
      console.log(JSON.stringify(product.payload, null, 2));
      productIds[product.key] = `dry_run_${product.key}`;
      continue;
    }

    productIds[product.key] = await createCreemProduct({
      apiKey,
      payload: product.payload,
    });
    console.log(`  Product ID: ${productIds[product.key]}`);
  }

  if (!productIds.earlyBird || !productIds.regular) {
    throw new Error("Missing Creem product IDs");
  }

  const currentEnv = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const nextEnv = upsertEnvContent(
    currentEnv,
    buildEnvUpdates({
      earlyBird: productIds.earlyBird,
      regular: productIds.regular,
    })
  );

  if (dryRun) {
    console.log("");
    console.log("Dry run: .env.local was not changed.");
  } else {
    writeFileSync(envPath, nextEnv);
    console.log("");
    console.log(`Updated ${envPath}`);
  }

  console.log("");
  console.log("Next manual step in Creem Dashboard:");
  console.log(`1. Add webhook endpoint: ${buildWebhookUrl(appUrl)}`);
  console.log("2. Select event: checkout.completed");
  console.log("3. Copy the webhook secret into CREEM_WEBHOOK_SECRET");
  console.log("");
  console.log("Then restart Next.js and run:");
  console.log("  pnpm db:migrate");
  console.log("  pnpm exec next dev -p 3010");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
