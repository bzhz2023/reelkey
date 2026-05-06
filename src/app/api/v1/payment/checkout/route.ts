import { NextRequest } from "next/server";
import { Creem } from "creem";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

const checkoutSchema = z.object({
  productId: z.string().min(1),
  successUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const apiKey = process.env.CREEM_API_KEY;
    if (!apiKey) {
      throw new ApiError("Creem API key not configured.", 500);
    }

    const isProduction = process.env.NODE_ENV === "production";
    const serverURL = isProduction
      ? "https://api.creem.io"
      : "https://test-api.creem.io";

    const creem = new Creem({ serverURL });

    const checkout = await creem.createCheckout({
      xApiKey: apiKey,
      createCheckoutRequest: {
        productId: data.productId,
        successUrl: data.successUrl,
        metadata: {
          ...(data.metadata ?? {}),
          referenceId: user.id,
        },
      },
    });

    console.log(`[Checkout] user=${user.id} product=${data.productId} checkoutUrl=${checkout.checkoutUrl}`);

    if (!checkout.checkoutUrl) {
      throw new ApiError("Failed to get checkout URL from Creem.", 502);
    }

    return apiSuccess({ url: checkout.checkoutUrl });
  } catch (error) {
    return handleApiError(error);
  }
}
