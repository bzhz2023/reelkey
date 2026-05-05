import { NextRequest } from "next/server";
import { videoService } from "@/services/video";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { ApiError } from "@/lib/api/error";
import { z } from "zod";
// Import proxy configuration for fetch requests
import "@/lib/proxy-config";

const CREEM_API_BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.creem.io"
    : "https://test-api.creem.io";

async function moderatePrompt(prompt: string, userId: string): Promise<void> {
  const apiKey = process.env.CREEM_API_KEY;
  if (!apiKey) {
    console.warn("[Moderation] CREEM_API_KEY not set, skipping moderation");
    return;
  }

  console.log(`[Moderation] Calling Creem Moderation API | user=${userId} | prompt="${prompt.slice(0, 80)}..."`);

  let decision: string;
  let moderationId: string | undefined;
  try {
    const res = await fetch(`${CREEM_API_BASE}/v1/moderation/prompt`, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({ prompt, external_id: `user_${userId}` }),
      signal: AbortSignal.timeout(8000),
    });
    const data = await res.json() as { id?: string; decision?: string };
    decision = data.decision ?? "deny";
    moderationId = data.id;
    console.log(`[Moderation] Result: decision=${decision} | id=${moderationId} | user=${userId}`);
  } catch (err) {
    console.error(`[Moderation] API call failed | user=${userId} | error=${String(err)}`);
    // Fail closed: if moderation is unreachable, block generation
    throw new ApiError(
      "Content moderation service unavailable. Please try again.",
      503,
      { code: "MODERATION_UNAVAILABLE" }
    );
  }

  if (decision !== "allow") {
    console.warn(`[Moderation] Prompt rejected | decision=${decision} | id=${moderationId} | user=${userId}`);
    throw new ApiError(
      "Your prompt was rejected by our content policy. Please revise and try again.",
      400,
      { code: "PROMPT_REJECTED" }
    );
  }
}

const generateSchema = z.object({
  prompt: z.string().min(1).max(5000),
  model: z.string().min(1),
  duration: z.number().optional(),
  aspectRatio: z.string().optional(),
  quality: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageUrls: z.array(z.string().url()).optional(),
  mode: z.string().optional(),
  outputNumber: z.number().int().min(1).optional().default(1),
  generateAudio: z.boolean().optional(),
});

// 增加超时时间到 60 秒
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const data = generateSchema.parse(body);

    // Extract user's fal.ai API key from header (BYOK mode)
    const userApiKey = request.headers.get("x-fal-key") || undefined;
    if (!userApiKey) {
      throw new ApiError(
        "Please set your fal.ai API key before generating videos.",
        400,
        { code: "FAL_KEY_MISSING" }
      );
    }

    // Screen prompt before generation (Creem Moderation API requirement)
    await moderatePrompt(data.prompt, user.id);

    const result = await videoService.generate({
      userId: user.id,
      prompt: data.prompt,
      model: data.model,
      duration: data.duration,
      aspectRatio: data.aspectRatio,
      quality: data.quality,
      imageUrl: data.imageUrl,
      imageUrls: data.imageUrls,
      mode: data.mode,
      outputNumber: data.outputNumber,
      generateAudio: data.generateAudio,
      userApiKey,
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
