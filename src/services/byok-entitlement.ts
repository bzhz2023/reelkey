import { and, eq } from "drizzle-orm";

import { byokEntitlements, db, type ByokEntitlement } from "@/db";

export type ByokEntitlementStatus = "active" | "revoked";
export type ByokEntitlementTier = "lifetime";

export interface ByokEntitlementGrantInput {
  userId: string;
  productId: string;
  productName?: string;
  orderId?: string;
  checkoutId?: string;
  customerId?: string;
  source?: "creem" | "manual";
  metadata?: Record<string, unknown>;
}

interface LifetimeCheckoutCheckInput {
  productId?: string | null;
  configuredProductId?: string | null;
  configuredProductIds?: string[] | null;
  metadata?: Record<string, unknown> | null;
}

interface CreemGrantBuildInput {
  productId: string;
  productName?: string;
  metadata?: Record<string, unknown> | null;
  order?: string | { id?: string | null } | null;
  checkoutId?: string | null;
  customerId?: string | null;
  webhookId?: string | null;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function getConfiguredByokLifetimeProductId(): string {
  return getConfiguredByokLifetimeProductIds()[0] ?? "";
}

export function getConfiguredByokLifetimeProductIdsFromEnv(
  env: Record<string, string | undefined>
): string[] {
  const ids = [
    env.CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID,
    env.CREEM_LIFETIME_PRODUCT_ID,
    env.CREEM_LIFETIME_REGULAR_PRODUCT_ID,
    env.NEXT_PUBLIC_CREEM_LIFETIME_EARLY_BIRD_PRODUCT_ID,
    env.NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID,
    env.NEXT_PUBLIC_CREEM_LIFETIME_REGULAR_PRODUCT_ID,
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => !!value);

  return [...new Set(ids)];
}

export function getConfiguredByokLifetimeProductIds(): string[] {
  return getConfiguredByokLifetimeProductIdsFromEnv(process.env);
}

export function isByokLifetimeCheckout({
  productId,
  configuredProductId = getConfiguredByokLifetimeProductId(),
  configuredProductIds,
  metadata,
}: LifetimeCheckoutCheckInput): boolean {
  const normalizedProductId = productId?.trim() ?? "";
  const normalizedConfiguredProductIds =
    configuredProductIds?.map((id) => id.trim()).filter(Boolean) ??
    (configuredProductId?.trim() ? [configuredProductId.trim()] : []);

  if (normalizedConfiguredProductIds.length > 0) {
    return normalizedConfiguredProductIds.includes(normalizedProductId);
  }

  return (
    getString(metadata?.plan)?.startsWith("lifetime-") === true &&
    getString(metadata?.billingKind) === "lifetime"
  );
}

export function buildByokEntitlementGrantInput({
  productId,
  productName,
  metadata,
  order,
  checkoutId,
  customerId,
  webhookId,
}: CreemGrantBuildInput): ByokEntitlementGrantInput {
  const userId = getString(metadata?.referenceId);
  if (!userId) {
    throw new Error("Missing referenceId for BYOK lifetime entitlement");
  }

  const orderId =
    typeof order === "string" ? getString(order) : getString(order?.id);
  const normalizedMetadata = {
    ...(metadata ?? {}),
    ...(webhookId ? { webhookId } : {}),
  };

  return {
    userId,
    productId,
    ...(productName ? { productName } : {}),
    ...(orderId ? { orderId } : {}),
    ...(getString(checkoutId) ? { checkoutId: getString(checkoutId) } : {}),
    ...(getString(customerId) ? { customerId: getString(customerId) } : {}),
    source: "creem",
    metadata: normalizedMetadata,
  };
}

async function findByOrderId(orderId: string): Promise<ByokEntitlement | null> {
  const [entitlement] = await db
    .select()
    .from(byokEntitlements)
    .where(eq(byokEntitlements.orderId, orderId))
    .limit(1);

  return entitlement ?? null;
}

export const byokEntitlementService = {
  async hasLifetime(userId: string): Promise<boolean> {
    const [entitlement] = await db
      .select({ id: byokEntitlements.id })
      .from(byokEntitlements)
      .where(
        and(
          eq(byokEntitlements.userId, userId),
          eq(byokEntitlements.tier, "lifetime"),
          eq(byokEntitlements.status, "active")
        )
      )
      .limit(1);

    return !!entitlement;
  },

  async getLifetime(userId: string): Promise<ByokEntitlement | null> {
    const [entitlement] = await db
      .select()
      .from(byokEntitlements)
      .where(
        and(
          eq(byokEntitlements.userId, userId),
          eq(byokEntitlements.tier, "lifetime"),
          eq(byokEntitlements.status, "active")
        )
      )
      .limit(1);

    return entitlement ?? null;
  },

  async grantLifetime(
    input: ByokEntitlementGrantInput
  ): Promise<ByokEntitlement> {
    if (input.orderId) {
      const existingOrder = await findByOrderId(input.orderId);
      if (existingOrder) return existingOrder;
    }

    const now = new Date();
    const values = {
      userId: input.userId,
      tier: "lifetime",
      status: "active",
      source: input.source ?? "creem",
      productId: input.productId,
      productName: input.productName,
      orderId: input.orderId,
      checkoutId: input.checkoutId,
      customerId: input.customerId,
      metadata: input.metadata,
      purchasedAt: now,
      revokedAt: null,
      updatedAt: now,
    };

    const [entitlement] = await db
      .insert(byokEntitlements)
      .values(values)
      .onConflictDoUpdate({
        target: byokEntitlements.userId,
        set: {
          tier: "lifetime",
          status: "active",
          source: values.source,
          productId: values.productId,
          productName: values.productName,
          orderId: values.orderId,
          checkoutId: values.checkoutId,
          customerId: values.customerId,
          metadata: values.metadata,
          purchasedAt: values.purchasedAt,
          revokedAt: null,
          updatedAt: values.updatedAt,
        },
      })
      .returning();

    return entitlement;
  },
};
