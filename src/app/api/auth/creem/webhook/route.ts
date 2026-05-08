import { validateWebhookSignature } from "@creem_io/better-auth/server";
import { NextResponse, type NextRequest } from "next/server";

import {
  buildByokEntitlementGrantInput,
  byokEntitlementService,
  getConfiguredByokLifetimeProductIds,
  isByokLifetimeCheckout,
} from "@/services/byok-entitlement";

function getRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function getEventType(event: Record<string, unknown>): string | undefined {
  return getString(event.eventType) ?? getString(event.event_type);
}

function getEventCreatedAt(event: Record<string, unknown>): unknown {
  return event.created_at ?? event.createdAt;
}

async function grantByokLifetimeFromCheckout(payload: string): Promise<boolean> {
  const event = JSON.parse(payload) as Record<string, unknown>;

  if (getEventType(event) !== "checkout.completed") return false;

  const checkout = getRecord(event.object);
  const product = getRecord(checkout?.product);
  const metadata = getRecord(checkout?.metadata) ?? {};
  const productId = getString(product?.id);

  if (!productId) {
    console.warn("[Creem] checkout.completed missing product id", {
      webhookId: getString(event.id),
    });
    return false;
  }

  const configuredProductIds = getConfiguredByokLifetimeProductIds();
  const isLifetime = isByokLifetimeCheckout({
    productId,
    configuredProductIds,
    metadata,
  });

  if (!isLifetime) {
    console.log("[Creem] checkout.completed is not a BYOK lifetime product", {
      productId,
      configuredProductIds,
      webhookId: getString(event.id),
    });
    return false;
  }

  const customer = getRecord(checkout?.customer);
  const customerId = getString(customer?.id) ?? getString(checkout?.customer);

  await byokEntitlementService.grantLifetime(
    buildByokEntitlementGrantInput({
      productId,
      productName: getString(product?.name),
      metadata,
      order: getRecord(checkout?.order) ?? getString(checkout?.order),
      checkoutId: getString(checkout?.id),
      customerId,
      webhookId: getString(event.id),
    })
  );

  console.log(`[Creem] BYOK lifetime entitlement granted for product ${productId}`, {
    webhookId: getString(event.id),
    webhookCreatedAt: getEventCreatedAt(event),
    checkoutId: getString(checkout?.id),
    customerId,
  });

  return true;
}

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature =
    request.headers.get("creem-signature") ??
    request.headers.get("x-creem-signature");
  const webhookSecret = process.env.CREEM_WEBHOOK_SECRET;

  if (
    !webhookSecret ||
    !validateWebhookSignature(payload, signature, webhookSecret)
  ) {
    console.warn("[Creem] Invalid webhook signature", {
      hasWebhookSecret: Boolean(webhookSecret),
      hasSignature: Boolean(signature),
      headerNames: Array.from(request.headers.keys()),
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    const granted = await grantByokLifetimeFromCheckout(payload);
    if (!granted) {
      console.log("[Creem] Webhook received without BYOK lifetime grant");
    }
  } catch (error) {
    console.error("[Creem] Failed to process BYOK lifetime webhook", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Webhook received" });
}
