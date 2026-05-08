/**
 * 自定义 Creem Webhook 处理器
 *
 * 替代 @creem_io/better-auth 插件的 /api/auth/creem/webhook 端点。
 * 原因：插件的 onCheckoutCompleted 回调没有被 await，在 Vercel serverless
 * 环境中函数返回 200 后执行上下文即被冻结，导致数据库写入无法完成。
 *
 * 本端点在返回 200 之前 await 所有操作，确保可靠写入。
 */

import { createHmac } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  buildByokEntitlementGrantInput,
  byokEntitlementService,
  getConfiguredByokLifetimeProductIds,
  isByokLifetimeCheckout,
} from "@/services/byok-entitlement";

// ---- 签名校验（与插件逻辑相同：HMAC-SHA256） ----
function generateSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

// ---- Webhook payload 类型（只取我们需要的字段） ----
interface CreemWebhookEvent {
  eventType: string;
  id: string;
  created_at: number;
  object: {
    id?: string;
    metadata?: Record<string, unknown>;
    product?: {
      id: string;
      name?: string;
      billing_type?: string;
    };
    customer?: { id?: string } | string;
    order?: { id?: string } | string;
  };
}

export async function POST(request: NextRequest) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[CreemWebhook] CREEM_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  // 读取原始 body（签名校验必须在 body 被 parse 之前完成）
  const buf = await request.text();
  const signature = request.headers.get("creem-signature") ?? "";
  const expected = generateSignature(buf, secret);

  if (expected !== signature) {
    console.warn("[CreemWebhook] Invalid signature, rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: CreemWebhookEvent;
  try {
    event = JSON.parse(buf) as CreemWebhookEvent;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log(`[CreemWebhook] Received event: ${event.eventType} | id=${event.id}`);

  // ---- 只处理 checkout.completed（一次性买断） ----
  if (event.eventType === "checkout.completed") {
    await handleCheckoutCompleted(event);
  } else {
    console.log(`[CreemWebhook] Ignoring event type: ${event.eventType}`);
  }

  // 所有 await 完成后再返回 200，避免 Vercel 提前冻结函数
  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(event: CreemWebhookEvent) {
  const checkout = event.object;
  const product = checkout.product;

  if (!product) {
    console.error("[CreemWebhook] checkout.completed: no product in payload");
    return;
  }

  // 只处理一次性购买（billing_type: onetime 或 one-time）
  const billingType = product.billing_type ?? "";
  if (billingType !== "onetime" && billingType !== "one-time") {
    console.log(`[CreemWebhook] Skipping non-onetime product: billing_type=${billingType}`);
    return;
  }

  const metadata = (checkout.metadata ?? {}) as Record<string, unknown>;
  const configuredProductIds = getConfiguredByokLifetimeProductIds();

  if (!isByokLifetimeCheckout({ productId: product.id, configuredProductIds, metadata })) {
    console.log(`[CreemWebhook] Product ${product.id} is not a configured BYOK lifetime product`);
    return;
  }

  const customerId =
    typeof checkout.customer === "object"
      ? checkout.customer?.id
      : checkout.customer;

  try {
    const granted = await byokEntitlementService.grantLifetime(
      buildByokEntitlementGrantInput({
        productId: product.id,
        productName: product.name,
        metadata,
        order: checkout.order,
        checkoutId: checkout.id,
        customerId,
        webhookId: event.id,
      })
    );
    console.log(
      `[CreemWebhook] BYOK lifetime granted: userId=${granted.userId} product=${product.id} orderId=${granted.orderId}`
    );
  } catch (err) {
    // referenceId 缺失等情况：记录日志但返回 200，避免 Creem 无限重试
    console.error("[CreemWebhook] Failed to grant BYOK lifetime entitlement:", err);
  }
}
