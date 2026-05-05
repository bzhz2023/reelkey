import { VideoStatus, db, videos } from "@/db";
import { and, asc, desc, eq, gt, gte, lt, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { getStorage } from "@/lib/storage";
import { getModelConfig, calculateModelCredits } from "../config/credits";
import { getActiveByokPricingPlan } from "@/config/byok-pricing";
import {
  getProvider,
  getProviderWithKey,
  type ProviderType,
  type VideoTaskResponse,
} from "../ai";
import {
  isModelModeSupported,
  isModelSupported,
  normalizeGenerationMode,
} from "../ai/model-mapping";
import { creditService } from "./credit";
import { generateSignedCallbackUrl } from "@/ai/utils/callback-signature";
import { emitVideoEvent } from "@/lib/video-events";
import { ApiError } from "@/lib/api/error";
import { getConfiguredAIProvider } from "@/ai/provider-config";
import { FalAiProvider, parseFalAiCallback } from "@/ai/providers/falai";
import { byokEntitlementService } from "@/services/byok-entitlement";

const PROVIDER_STATUS_TIMEOUT_MS = 8000;
const FREE_MONTHLY_GENERATION_LIMIT =
  getActiveByokPricingPlan("free").monthlyGenerations ?? 5;

type VideoParameters = Record<string, unknown>;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message: string,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

function getCurrentMonthStartUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function toVideoParameters(
  parameters: typeof videos.$inferSelect.parameters,
): VideoParameters {
  if (!parameters || typeof parameters !== "object" || Array.isArray(parameters)) {
    return {};
  }
  return { ...(parameters as VideoParameters) };
}

function findNestedNumberByKey(
  input: unknown,
  keyNames: Set<string>,
): number | undefined {
  if (!input || typeof input !== "object") return undefined;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const normalizedKey = key.toLowerCase();
    if (keyNames.has(normalizedKey) && typeof value === "number") {
      return value;
    }
    if (value && typeof value === "object") {
      const nested = findNestedNumberByKey(value, keyNames);
      if (nested !== undefined) return nested;
    }
  }
  return undefined;
}

function extractActualProviderCostCents(raw: unknown): number | undefined {
  const cents = findNestedNumberByKey(
    raw,
    new Set(["cost_cents", "total_cost_cents", "amount_cents"]),
  );
  if (cents !== undefined) return Math.max(0, Math.round(cents));

  const usd = findNestedNumberByKey(
    raw,
    new Set(["cost_usd", "total_cost_usd", "price_usd"]),
  );
  if (usd !== undefined) return Math.max(0, Math.round(usd * 100));

  return undefined;
}

export interface GenerateVideoParams {
  userId: string;
  prompt: string;
  model: string; // "sora-2"
  duration?: number;
  aspectRatio?: string; // "16:9" | "9:16"
  quality?: string; // "standard" | "high"
  imageUrl?: string; // image-to-video
  imageUrls?: string[]; // image-to-video (multi-image)
  mode?: string;
  outputNumber?: number;
  generateAudio?: boolean;
  userApiKey?: string; // User's fal.ai API key (BYOK)
}

export interface VideoGenerationResult {
  videoUuid: string;
  taskId: string;
  provider: ProviderType;
  status: string;
  estimatedTime?: number;
  creditsUsed: number;
}

function normalizeVideoStatusFilter(
  status?: string,
): (typeof VideoStatus)[keyof typeof VideoStatus] | undefined {
  if (!status) return undefined;

  const trimmed = status.trim();
  if (!trimmed || trimmed.toLowerCase() === "all") return undefined;

  const normalized = trimmed.toUpperCase();
  const validStatuses = Object.values(VideoStatus);
  if (validStatuses.includes(normalized as (typeof validStatuses)[number])) {
    return normalized as (typeof VideoStatus)[keyof typeof VideoStatus];
  }

  throw new ApiError("Invalid video status filter", 400, {
    code: "INVALID_VIDEO_STATUS",
    status,
  });
}

export class VideoService {
  private callbackBaseUrl: string;

  constructor() {
    this.callbackBaseUrl = process.env.AI_CALLBACK_URL || "";
  }

  /**
   * Parse insufficient credits error and convert to structured ApiError
   */
  private toInsufficientCreditsApiError(
    error: unknown,
    fallbackRequiredCredits: number,
  ): ApiError | null {
    const message = error instanceof Error ? error.message : String(error);
    const match = message.match(
      /Insufficient credits\.\s*Required:\s*(\d+)(?:,\s*Available:\s*(\d+))?/i,
    );
    if (!match) return null;

    const requiredCredits =
      Number.parseInt(match[1] || "", 10) || fallbackRequiredCredits;
    const availableCredits = match[2]
      ? Number.parseInt(match[2], 10)
      : undefined;

    return new ApiError("Insufficient credits", 402, {
      code: "INSUFFICIENT_CREDITS",
      requiredCredits,
      availableCredits,
    });
  }

  private async getFalAiTaskStatus(
    provider: ReturnType<typeof getProviderWithKey>,
    externalTaskId: string,
    parameters: typeof videos.$inferSelect.parameters,
  ) {
    const falEndpoint =
      parameters &&
      typeof parameters === "object" &&
      "falEndpoint" in parameters &&
      typeof parameters.falEndpoint === "string"
        ? parameters.falEndpoint
        : undefined;

    if (falEndpoint) {
      if (provider instanceof FalAiProvider) {
        return provider.getTaskStatusForEndpoint(externalTaskId, falEndpoint);
      }
    }

    return provider.getTaskStatus(externalTaskId);
  }

  private async assertFreeMonthlyLimit(userId: string): Promise<void> {
    const monthStart = getCurrentMonthStartUtc();
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(videos)
      .where(
        and(
          eq(videos.userId, userId),
          eq(videos.isDeleted, false),
          gte(videos.createdAt, monthStart),
          sql`${videos.status} <> ${VideoStatus.FAILED}`,
        ),
      );

    const used = row?.count ?? 0;
    if (used >= FREE_MONTHLY_GENERATION_LIMIT) {
      throw new ApiError(
        `Free plan allows ${FREE_MONTHLY_GENERATION_LIMIT} generations per month. Upgrade to Lifetime for unlimited generation.`,
        403,
        {
          code: "FREE_MONTHLY_LIMIT_REACHED",
          limit: FREE_MONTHLY_GENERATION_LIMIT,
          used,
        },
      );
    }
  }

  /**
   * Create video generation task
   */
  async generate(params: GenerateVideoParams): Promise<VideoGenerationResult> {
    const modelConfig = getModelConfig(params.model);
    if (!modelConfig) {
      throw new ApiError(`Unsupported model: ${params.model}`, 400, {
        code: "UNSUPPORTED_MODEL",
        model: params.model,
      });
    }

    const hasLifetime = await byokEntitlementService.hasLifetime(params.userId);

    if (params.userApiKey && modelConfig.accessTier === "paid") {
      if (!hasLifetime) {
        throw new ApiError(
          "This model is available with ReelKey Lifetime access.",
          403,
          {
            code: "MODEL_REQUIRES_LIFETIME",
            model: params.model,
          }
        );
      }
    }

    if (params.userApiKey && !hasLifetime) {
      await this.assertFreeMonthlyLimit(params.userId);
    }

    const effectiveDuration = params.duration || modelConfig.durations[0] || 5;

    const outputNumber = Math.max(1, params.outputNumber ?? 1);
    const creditsRequired =
      calculateModelCredits(params.model, {
        duration: effectiveDuration,
        quality: params.quality,
      }) * outputNumber;

    const hasImageInput =
      (params.imageUrls && params.imageUrls.length > 0) ||
      Boolean(params.imageUrl);
    const resolvedMode = normalizeGenerationMode(params.mode, hasImageInput);

    if (
      (resolvedMode === "image-to-video" ||
        resolvedMode === "reference-to-video" ||
        resolvedMode === "frames-to-video") &&
      !hasImageInput
    ) {
      throw new ApiError(
        `Mode ${resolvedMode} requires uploaded input media`,
        400,
        {
          code: "MISSING_INPUT_MEDIA",
          mode: resolvedMode,
          model: params.model,
        },
      );
    }

    if (hasImageInput && !modelConfig.supportImageToVideo) {
      throw new ApiError(
        `Model ${params.model} does not support image-to-video`,
        400,
        {
          code: "IMAGE_TO_VIDEO_NOT_SUPPORTED",
          model: params.model,
        },
      );
    }

    const configuredProvider = getConfiguredAIProvider();
    const isByokFalFlow = Boolean(params.userApiKey);

    // In BYOK flow, always route generation to falai and ignore DEFAULT_AI_PROVIDER.
    const providerForValidation = isByokFalFlow
      ? ("falai" as ProviderType)
      : configuredProvider;
    if (
      providerForValidation &&
      !isModelSupported(params.model, providerForValidation)
    ) {
      throw new ApiError(
        `Model ${params.model} is not available for provider ${providerForValidation}`,
        400,
        {
          code: "MODEL_NOT_AVAILABLE_FOR_PROVIDER",
          model: params.model,
          provider: providerForValidation,
        },
      );
    }

    const actualProvider = isByokFalFlow
      ? ("falai" as ProviderType)
      : configuredProvider || modelConfig.provider;
    if (!isModelModeSupported(params.model, actualProvider, resolvedMode)) {
      throw new ApiError(
        `Mode ${resolvedMode} is not supported for model ${params.model} on provider ${actualProvider}`,
        400,
        {
          code: "MODE_NOT_SUPPORTED",
          model: params.model,
          mode: resolvedMode,
          provider: actualProvider,
        },
      );
    }

    const videoUuid = `vid_${nanoid(21)}`;

    const [videoResult] = await db
      .insert(videos)
      .values({
        uuid: videoUuid,
        userId: params.userId,
        prompt: params.prompt,
        model: params.model,
        parameters: {
          duration: params.duration,
          aspectRatio: params.aspectRatio,
          quality: params.quality,
          outputNumber,
          mode: resolvedMode,
          imageUrl: params.imageUrl,
          imageUrls: params.imageUrls,
          generateAudio: params.generateAudio,
          providerCost: {
            estimatedCents: creditsRequired,
            source: "estimated",
          },
        },
        status: VideoStatus.PENDING,
        startImageUrl: params.imageUrls?.[0] || params.imageUrl || null,
        creditsUsed: creditsRequired,
        duration: effectiveDuration,
        aspectRatio: params.aspectRatio || null,
        provider: actualProvider,
        updatedAt: new Date(),
      })
      .returning({ uuid: videos.uuid, id: videos.id });

    if (!videoResult) {
      throw new Error("Failed to create video record");
    }

    // BYOK mode: skip credit check if user provides their own API key
    let freezeResult: { success: boolean; holdId: number } | null = null;
    if (!params.userApiKey) {
      try {
        freezeResult = await creditService.freeze({
          userId: params.userId,
          credits: creditsRequired,
          videoUuid: videoResult.uuid,
        });
      } catch (error) {
        await db
          .update(videos)
          .set({
            status: VideoStatus.FAILED,
            errorMessage: String(error),
            updatedAt: new Date(),
          })
          .where(eq(videos.uuid, videoResult.uuid));

        const insufficientCreditsError = this.toInsufficientCreditsApiError(
          error,
          creditsRequired,
        );
        if (insufficientCreditsError) {
          throw insufficientCreditsError;
        }
        throw error;
      }

      if (!freezeResult.success) {
        await db
          .update(videos)
          .set({
            status: VideoStatus.FAILED,
            errorMessage: `Insufficient credits. Required: ${creditsRequired}`,
            updatedAt: new Date(),
          })
          .where(eq(videos.uuid, videoResult.uuid));
        throw new ApiError("Insufficient credits", 402, {
          code: "INSUFFICIENT_CREDITS",
          requiredCredits: creditsRequired,
        });
      }
    }

    const provider = params.userApiKey
      ? getProviderWithKey(actualProvider, params.userApiKey)
      : getProvider(actualProvider);

    const callbackUrl = this.callbackBaseUrl
      ? generateSignedCallbackUrl(
          `${this.callbackBaseUrl}/${actualProvider}`,
          videoResult.uuid,
        )
      : undefined;

    try {
      const result = await provider.createTask({
        model: params.model,
        prompt: params.prompt,
        duration: effectiveDuration, // ✅ 使用计算后的时长
        aspectRatio: params.aspectRatio,
        quality: params.quality,
        imageUrl: params.imageUrl,
        imageUrls: params.imageUrls,
        mode: resolvedMode,
        outputNumber,
        generateAudio: params.generateAudio,
        callbackUrl,
      });

      await db
        .update(videos)
        .set({
          parameters: {
            duration: params.duration,
            aspectRatio: params.aspectRatio,
            quality: params.quality,
            outputNumber,
            mode: resolvedMode,
            imageUrl: params.imageUrl,
            imageUrls: params.imageUrls,
            generateAudio: params.generateAudio,
            providerCost: {
              estimatedCents: creditsRequired,
              source: "estimated",
            },
            falEndpoint:
              actualProvider === "falai"
                ? (result.raw as { endpoint?: string } | undefined)?.endpoint
                : undefined,
          },
          status: VideoStatus.GENERATING,
          externalTaskId: result.taskId,
          provider: actualProvider,
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));

      return {
        videoUuid: videoResult.uuid,
        taskId: result.taskId,
        provider: actualProvider,
        status: "GENERATING",
        estimatedTime: result.estimatedTime,
        creditsUsed: creditsRequired,
      };
    } catch (error) {
      // BYOK 模式下没有冻结积分，无需释放
      if (freezeResult) {
        await creditService.release(videoResult.uuid);
      }

      await db
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: String(error),
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoResult.uuid));
      throw error;
    }
  }

  /**
   * Handle AI Callback
   */
  async handleCallback(
    providerType: ProviderType,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: any,
    videoUuid: string,
  ): Promise<void> {
    const result =
      providerType === "falai"
        ? parseFalAiCallback(payload)
        : getProvider(providerType).parseCallback(payload);

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, videoUuid))
      .limit(1);

    if (!video) {
      console.error(`Video not found: ${videoUuid}`);
      return;
    }

    if (
      video.externalTaskId &&
      result.taskId &&
      video.externalTaskId !== result.taskId
    ) {
      console.error(
        `Task ID mismatch: expected ${video.externalTaskId}, got ${result.taskId}`,
      );
      return;
    }

    if (result.status === "completed" && result.videoUrl) {
      await this.tryCompleteGeneration(video.uuid, result);
    } else if (result.status === "failed") {
      await this.tryFailGeneration(video.uuid, result.error?.message);
    }
  }

  /**
   * Get task status (for frontend polling)
   */
  async refreshStatus(
    videoUuid: string,
    userId: string,
    userApiKey?: string,
  ): Promise<{
    status: string;
    videoUrl?: string;
    error?: string;
  }> {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.uuid, videoUuid), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    if (
      video.status === VideoStatus.COMPLETED ||
      video.status === VideoStatus.FAILED
    ) {
      return {
        status: video.status,
        videoUrl: video.videoUrl || undefined,
        error: video.errorMessage || undefined,
      };
    }

    if (video.externalTaskId && video.provider) {
      try {
        const providerType = video.provider as ProviderType;

        // BYOK 模式：必须提供 userApiKey 才能查询 fal.ai 状态
        if (providerType === "falai" && !userApiKey) {
          console.warn(
            `[refreshStatus] falai provider requires userApiKey for video ${videoUuid}`,
          );
          return { status: video.status };
        }

        const provider =
          providerType === "falai" && userApiKey
            ? getProviderWithKey(providerType, userApiKey)
            : getProvider(providerType);

        const statusPromise =
          providerType === "falai"
            ? this.getFalAiTaskStatus(
                provider as ReturnType<typeof getProviderWithKey>,
                video.externalTaskId,
                video.parameters,
              )
            : provider.getTaskStatus(video.externalTaskId);
        const result = await withTimeout(
          statusPromise,
          PROVIDER_STATUS_TIMEOUT_MS,
          `Provider status timed out after ${PROVIDER_STATUS_TIMEOUT_MS}ms`,
        );

        if (result.status === "completed" && result.videoUrl) {
          const updated = await this.tryCompleteGeneration(video.uuid, result);
          return {
            status: updated.status,
            videoUrl: updated.videoUrl || undefined,
          };
        }

        if (result.status === "failed") {
          if (result.error?.code === "FAL_KEY_INVALID") {
            throw new ApiError(
              "Your fal.ai API key is invalid or expired. Please update your key and retry status refresh.",
              401,
              { code: "FAL_KEY_INVALID" },
            );
          }
          const updated = await this.tryFailGeneration(
            video.uuid,
            result.error?.message,
          );
          return {
            status: updated.status,
            error: updated.errorMessage || undefined,
          };
        }
        if (
          result.status === "processing" &&
          video.status === VideoStatus.PENDING
        ) {
          await db
            .update(videos)
            .set({
              status: VideoStatus.GENERATING,
              updatedAt: new Date(),
            })
            .where(eq(videos.uuid, video.uuid));
          return { status: VideoStatus.GENERATING };
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (message.includes("Provider status timed out")) {
          console.warn(`[refreshStatus] ${message} for video ${videoUuid}`);
          return {
            status: video.status,
            error: "PROVIDER_STATUS_TIMEOUT",
          };
        }
        if (
          error instanceof ApiError &&
          (error.details as { code?: string } | undefined)?.code ===
            "FAL_KEY_INVALID"
        ) {
          throw error;
        }
        console.error("Failed to refresh status from provider:", error);
      }
    }

    return { status: video.status };
  }

  /**
   * Refresh status by external task id
   */
  async refreshStatusByTaskId(taskId: string, userId: string) {
    const [video] = await db
      .select()
      .from(videos)
      .where(and(eq(videos.externalTaskId, taskId), eq(videos.userId, userId)))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    return this.refreshStatus(video.uuid, userId);
  }

  /**
   * Try to complete generation (transaction + optimistic lock)
   */
  async tryCompleteGeneration(
    videoUuid: string,
    result: VideoTaskResponse,
  ): Promise<{ status: string; videoUrl?: string | null }> {
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, videoUuid))
      .limit(1);

    if (!video) {
      throw new Error("Video not found");
    }

    if (video.status === VideoStatus.COMPLETED) {
      return { status: video.status, videoUrl: video.videoUrl };
    }
    if (video.status === VideoStatus.FAILED) {
      return { status: video.status, videoUrl: null };
    }

    if (
      video.status !== VideoStatus.GENERATING &&
      video.status !== VideoStatus.UPLOADING
    ) {
      return { status: video.status, videoUrl: video.videoUrl };
    }

    await db
      .update(videos)
      .set({
        status: VideoStatus.UPLOADING,
        originalVideoUrl: result.videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(videos.uuid, videoUuid));

    const hasLifetime = await byokEntitlementService.hasLifetime(video.userId);
    const parameters = toVideoParameters(video.parameters);
    const actualCostCents = extractActualProviderCostCents(result.raw);
    const providerCost: VideoParameters = {
      estimatedCents:
        typeof (parameters.providerCost as { estimatedCents?: unknown } | undefined)
          ?.estimatedCents === "number"
          ? (parameters.providerCost as { estimatedCents: number }).estimatedCents
          : video.creditsUsed,
      source: actualCostCents === undefined ? "estimated" : "actual",
    };
    if (actualCostCents !== undefined) {
      providerCost.actualCents = actualCostCents;
    }
    let finalVideoUrl = result.videoUrl!;
    let storageMetadata: VideoParameters;

    if (hasLifetime) {
      const key = `videos/${videoUuid}/${Date.now()}.mp4`;
      try {
        const uploaded = await getStorage().downloadAndUpload({
          sourceUrl: result.videoUrl!,
          key,
          contentType: "video/mp4",
        });
        finalVideoUrl = uploaded.url;
        storageMetadata = {
          status: "uploaded",
          provider: "r2",
          key,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[tryCompleteGeneration] R2 upload failed for ${videoUuid}:`, error);
        storageMetadata = {
          status: "upload_failed",
          provider: "falai",
          attemptedProvider: "r2",
          error: message,
        };
      }
    } else {
      storageMetadata = {
        status: "provider_temporary",
        provider: "falai",
        reason: "free_plan",
      };
    }

    await creditService.settle(videoUuid);

    await db
      .update(videos)
      .set({
        status: VideoStatus.COMPLETED,
        videoUrl: finalVideoUrl,
        thumbnailUrl: result.thumbnailUrl || null,
        parameters: {
          ...parameters,
          providerCost,
          storage: storageMetadata,
        },
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(videos.uuid, videoUuid));

    emitVideoEvent({
      userId: video.userId,
      videoUuid,
      status: "COMPLETED",
      videoUrl: finalVideoUrl,
      thumbnailUrl: result.thumbnailUrl || null,
    });

    return { status: VideoStatus.COMPLETED, videoUrl: finalVideoUrl };
  }

  /**
   * Try to mark as failed (transaction + optimistic lock)
   */
  private async tryFailGeneration(
    videoUuid: string,
    errorMessage?: string,
  ): Promise<{ status: string; errorMessage?: string | null }> {
    return db.transaction(async (trx) => {
      const [video] = await trx
        .select()
        .from(videos)
        .where(eq(videos.uuid, videoUuid))
        .limit(1);

      if (!video) {
        throw new Error("Video not found");
      }

      if (
        video.status === VideoStatus.COMPLETED ||
        video.status === VideoStatus.FAILED
      ) {
        return { status: video.status, errorMessage: video.errorMessage };
      }

      await creditService.release(videoUuid);

      await trx
        .update(videos)
        .set({
          status: VideoStatus.FAILED,
          errorMessage: errorMessage || "Generation failed",
          updatedAt: new Date(),
        })
        .where(eq(videos.uuid, videoUuid));

      emitVideoEvent({
        userId: video.userId,
        videoUuid,
        status: "FAILED",
        error: errorMessage || "Generation failed",
      });

      return {
        status: VideoStatus.FAILED,
        errorMessage: errorMessage || "Generation failed",
      };
    });
  }

  /**
   * Get video details
   */
  async getVideo(uuid: string, userId: string) {
    const [video] = await db
      .select()
      .from(videos)
      .where(
        and(
          eq(videos.uuid, uuid),
          eq(videos.userId, userId),
          eq(videos.isDeleted, false),
        ),
      )
      .limit(1);
    return video ?? null;
  }

  /**
   * Get user video list
   */
  async listVideos(
    userId: string,
    options?: {
      limit?: number;
      cursor?: string;
      status?: string;
      model?: string;
      sortBy?: string;
    },
  ) {
    const limit = options?.limit || 20;
    const sortBy = options?.sortBy === "oldest" ? "oldest" : "newest";

    const conditions = [eq(videos.userId, userId), eq(videos.isDeleted, false)];

    const statusFilter = normalizeVideoStatusFilter(options?.status);
    if (statusFilter) {
      conditions.push(eq(videos.status, statusFilter));
    }

    if (options?.model) {
      conditions.push(eq(videos.model, options.model));
    }

    if (options?.cursor) {
      const [cursorVideo] = await db
        .select({ createdAt: videos.createdAt })
        .from(videos)
        .where(eq(videos.uuid, options.cursor))
        .limit(1);

      if (cursorVideo) {
        conditions.push(
          sortBy === "oldest"
            ? gt(videos.createdAt, cursorVideo.createdAt)
            : lt(videos.createdAt, cursorVideo.createdAt),
        );
      }
    }

    const list = await db
      .select()
      .from(videos)
      .where(and(...conditions))
      .orderBy(
        sortBy === "oldest" ? asc(videos.createdAt) : desc(videos.createdAt),
      )
      .limit(limit + 1);

    const hasMore = list.length > limit;
    if (hasMore) list.pop();

    return {
      videos: list,
      nextCursor: hasMore ? list[list.length - 1]?.uuid : undefined,
    };
  }

  /**
   * Delete video (soft delete)
   */
  async deleteVideo(uuid: string, userId: string): Promise<void> {
    await db
      .update(videos)
      .set({ isDeleted: true, updatedAt: new Date() })
      .where(and(eq(videos.uuid, uuid), eq(videos.userId, userId)));
  }
}

export const videoService = new VideoService();
