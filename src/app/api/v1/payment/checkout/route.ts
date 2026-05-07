import { NextRequest } from "next/server";
import { Creem } from "creem";
import { CreemError } from "creem/models/errors";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";

const checkoutSchema = z.object({
  productId: z.string().trim().min(1),
  successUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

function parseCreemErrorMessage(error: CreemError): string {
  try {
    const body = JSON.parse(error.body) as { message?: unknown };
    const message = body.message;
    if (Array.isArray(message)) {
      return message.filter((item) => typeof item === "string").join("; ");
    }
    if (typeof message === "string") {
      return message;
    }
  } catch {
    // Fall through to the SDK message below.
  }

  return error.message || "Creem checkout failed.";
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = checkoutSchema.parse(body);

    const apiKey = process.env.CREEM_API_KEY;
    if (!apiKey) {
      throw new ApiError("Creem API key not configured.", 500);
    }

    const serverURL = apiKey.startsWith("creem_test_")
      ? "https://test-api.creem.io"
      : "https://api.creem.io";

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
    if (error instanceof CreemError) {
      console.error("[Checkout] Creem checkout failed", {
        statusCode: error.statusCode,
        message: parseCreemErrorMessage(error),
      });
      return handleApiError(
        new ApiError(`Creem checkout failed: ${parseCreemErrorMessage(error)}`, 502)
      );
    }

    return handleApiError(error);
  }
}
