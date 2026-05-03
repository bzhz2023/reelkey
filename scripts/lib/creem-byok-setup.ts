export type CreemTaxMode = "exclusive" | "inclusive";

export interface ByokProductOptions {
  appUrl: string;
  currency: string;
  description: string;
  name: string;
  priceUsd: number;
  taxMode: CreemTaxMode;
}

export interface CreemProductPayload {
  name: string;
  description: string;
  price: number;
  currency: string;
  billing_type: "onetime";
  tax_mode: CreemTaxMode;
  tax_category: "saas";
  default_success_url: string;
}

export interface ByokProductsOptions {
  appUrl: string;
  currency: string;
  taxMode: CreemTaxMode;
}

export type ByokProductKey = "earlyBird" | "regular";

export interface ByokProductDefinition {
  key: ByokProductKey;
  payload: CreemProductPayload;
}

export function normalizeBaseUrl(url: string): string {
  const normalized = url.trim().replace(/\/+$/, "");
  if (!normalized) {
    throw new Error("NEXT_PUBLIC_APP_URL is required");
  }
  if (!normalized.startsWith("https://") && !normalized.startsWith("http://")) {
    throw new Error("NEXT_PUBLIC_APP_URL must start with http:// or https://");
  }
  return normalized;
}

export function buildWebhookUrl(appUrl: string): string {
  return `${normalizeBaseUrl(appUrl)}/api/auth/creem/webhook`;
}

export function buildByokProductPayload({
  appUrl,
  currency,
  description,
  name,
  priceUsd,
  taxMode,
}: ByokProductOptions): CreemProductPayload {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) {
    throw new Error("CREEM_BYOK_PRICE_USD must be a positive number");
  }

  return {
    name,
    description,
    price: Math.round(priceUsd * 100),
    currency: currency.trim().toUpperCase(),
    billing_type: "onetime",
    tax_mode: taxMode,
    tax_category: "saas",
    default_success_url: `${normalizeBaseUrl(appUrl)}/settings?payment=success`,
  };
}

export function buildByokProducts({
  appUrl,
  currency,
  taxMode,
}: ByokProductsOptions): ByokProductDefinition[] {
  return [
    {
      key: "earlyBird",
      payload: buildByokProductPayload({
        appUrl,
        currency,
        description:
          "One-time lifetime access to ReelKey BYOK workspace at early-bird pricing.",
        name: "ReelKey Lifetime Early Bird",
        priceUsd: 29,
        taxMode,
      }),
    },
    {
      key: "regular",
      payload: buildByokProductPayload({
        appUrl,
        currency,
        description:
          "One-time lifetime access to ReelKey BYOK workspace at regular pricing.",
        name: "ReelKey Lifetime Regular",
        priceUsd: 49,
        taxMode,
      }),
    },
  ];
}

export function getCreemApiBaseUrl(apiKey: string): string {
  return apiKey.startsWith("creem_test_")
    ? "https://test-api.creem.io/v1"
    : "https://api.creem.io/v1";
}

export function extractProductId(response: unknown): string {
  if (!response || typeof response !== "object") {
    throw new Error("Creem product response is not an object");
  }

  const record = response as Record<string, unknown>;
  const id = record.id ?? (record.product as Record<string, unknown> | undefined)?.id;

  if (typeof id !== "string" || !id.trim()) {
    throw new Error("Creem product response did not include a product id");
  }

  return id.trim();
}

function quoteEnvValue(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function upsertEnvContent(
  content: string,
  updates: Record<string, string>,
): string {
  const lines = content.length ? content.replace(/\n$/, "").split(/\n/) : [];
  const seen = new Set<string>();
  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/);
    if (!match) return line;

    const key = match[1];
    if (!(key in updates)) return line;

    seen.add(key);
    return `${key}=${quoteEnvValue(updates[key])}`;
  });

  for (const [key, value] of Object.entries(updates)) {
    if (!seen.has(key)) {
      nextLines.push(`${key}=${quoteEnvValue(value)}`);
    }
  }

  return `${nextLines.filter((line, index, arr) => {
    return !(line === "" && index === arr.length - 1);
  }).join("\n")}\n`;
}
