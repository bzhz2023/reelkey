/**
 * fal.ai Provider - 实现 AIVideoProvider 接口
 * 使用用户自己的 fal.ai API Key 生成视频
 */

import { fal } from "@fal-ai/client";
import type {
  AIVideoProvider,
  VideoGenerationParams,
  VideoTaskResponse,
} from "../types";
import { ApiError } from "@/lib/api/error";
import {
  getVideoModelEndpoint,
  getVideoModelRegistryItem,
  getVideoModelRegistryItems,
  normalizeDurationForFal,
  normalizeRegistryMode,
  normalizeResolutionForFal,
} from "@/config/video-model-registry";

const FALLBACK_STATUS_ENDPOINTS = getVideoModelRegistryItems()
  .flatMap((model) => Object.values(model.endpoints))
  .filter((endpoint): endpoint is string => Boolean(endpoint));

export class FalAiProvider implements AIVideoProvider {
  name = "falai";
  supportImageToVideo = true;

  constructor(private apiKey: string) {
    // Key 作为参数传入，不从环境变量读，不持久化
    fal.config({
      proxyUrl: "/api/fal/proxy",
      credentials: apiKey,
    });
  }

  async createTask(
    params: VideoGenerationParams
  ): Promise<VideoTaskResponse> {
    const modelKey = params.model || "kling-2.5-turbo";
    const model = getVideoModelRegistryItem(modelKey);
    if (!model) {
      throw new Error(`Unsupported model: ${modelKey}`);
    }

    const hasImage = Boolean(
      params.imageUrl || (params.imageUrls && params.imageUrls.length > 0)
    );
    const requestedMode = normalizeRegistryMode(params.mode);
    const resolvedMode =
      requestedMode === "text-to-video" && hasImage
        ? "image-to-video"
        : requestedMode;
    const endpoint = getVideoModelEndpoint(modelKey, resolvedMode);
    if (!endpoint) {
      throw new Error(`Model ${modelKey} does not support ${resolvedMode}`);
    }
    const input = buildFalInput(modelKey, resolvedMode, params);

    try {
      // 添加 60 秒超时保护
      const submitPromise = fal.queue.submit(endpoint, {
        input,
        webhookUrl: params.callbackUrl,
      });

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("fal.ai API timeout after 60s")), 60000)
      );

      const { request_id } = await Promise.race([submitPromise, timeoutPromise]);

      return {
        taskId: request_id,
        provider: "falai",
        status: "pending",
        raw: {
          endpoint,
          input,
        },
      };
    } catch (error: any) {
      const status = error?.status as number | undefined;
      const message = String(error?.message || "");
      const isTimeout = message.includes("timeout") || message.includes("524");

      if (status === 401 || status === 403) {
        throw new ApiError(
          "Your fal.ai API key is invalid or expired. Please update your key and try again.",
          401,
          { code: "FAL_KEY_INVALID" }
        );
      }

      if (status === 402) {
        throw new ApiError(
          "Insufficient fal.ai balance. Please top up your fal.ai account and try again.",
          402,
          { code: "FAL_INSUFFICIENT_BALANCE" }
        );
      }

      if (isTimeout) {
        throw new ApiError(
          "fal.ai API is taking too long to respond. Please try again in a moment.",
          504,
          { code: "FAL_TIMEOUT" }
        );
      }

      throw new Error(`Failed to submit task to fal.ai: ${message}`);
    }
  }

  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    for (const endpoint of FALLBACK_STATUS_ENDPOINTS) {
      try {
        return await this.getTaskStatusForEndpoint(taskId, endpoint);
      } catch (error: any) {
        const status = error?.status as number | undefined;
        if (status === 401 || status === 403) {
          throw new ApiError(
            "Your fal.ai API key is invalid or expired. Please update your key.",
            401,
            { code: "FAL_KEY_INVALID" },
          );
        }
        // Fall through and try the next endpoint when this one does not own
        // the request id, or when fal.ai has a transient status lookup error.
      }
    }

    return {
      taskId,
      provider: "falai",
      status: "processing",
    };
  }

  async getTaskStatusForEndpoint(
    taskId: string,
    endpoint: string
  ): Promise<VideoTaskResponse> {
    const status = await fal.queue.status(endpoint, {
      requestId: taskId,
      logs: false,
    });
    const normalizedStatus = String((status as any)?.status || "").toUpperCase();

    if (normalizedStatus === "COMPLETED") {
      const result = await fal.queue.result(endpoint, { requestId: taskId });
      const output = (result as any)?.data;
      const { videoUrl, thumbnailUrl } = extractFalOutputUrls(output);

      return {
        taskId,
        provider: "falai",
        status: "completed",
        videoUrl,
        thumbnailUrl,
        raw: result,
      };
    }

    if (normalizedStatus === "FAILED") {
      return {
        taskId,
        provider: "falai",
        status: "failed",
        error: {
          code: "FAL_ERROR",
          message: "fal.ai generation failed",
        },
        raw: status,
      };
    }

    return {
      taskId,
      provider: "falai",
      status: "processing",
      raw: status,
    };
  }

  parseCallback(payload: any): VideoTaskResponse {
    return parseFalAiCallback(payload);
  }
}

function buildFalInput(
  modelId: string,
  mode: string,
  params: VideoGenerationParams
): Record<string, any> {
  const imageUrls = Array.isArray(params.imageUrls)
    ? params.imageUrls
    : params.imageUrl
      ? [params.imageUrl]
      : [];
  const duration = normalizeDurationForFal(params.duration);
  const resolution = normalizeResolutionForFal(params.quality);
  const base: Record<string, any> = {
    prompt: params.prompt,
  };

  if (duration !== undefined) base.duration = duration;
  if (params.aspectRatio) base.aspect_ratio = params.aspectRatio;
  if (resolution) base.resolution = resolution;
  if (params.generateAudio !== undefined) {
    base.generate_audio = params.generateAudio;
  }

  if (mode === "image-to-video" && imageUrls[0]) {
    base.image_url = imageUrls[0];
  }
  if (mode === "frames-to-video") {
    if (modelId === "veo-3.1-fast") {
      if (imageUrls[0]) base.first_frame_url = imageUrls[0];
      if (imageUrls[1]) base.last_frame_url = imageUrls[1];
    } else {
      if (imageUrls[0]) base.start_image_url = imageUrls[0];
      if (imageUrls[1]) base.end_image_url = imageUrls[1];
    }
  }
  if (mode === "reference-to-video" && imageUrls.length > 0) {
    base.video_urls = imageUrls;
  }

  if (modelId === "sora-2") {
    base.delete_video = false;
  }
  if (modelId === "hailuo-02-standard") {
    base.prompt_optimizer = true;
  }

  return removeUndefined(base);
}

function removeUndefined(input: Record<string, any>): Record<string, any> {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined)
  );
}

function extractFalOutputUrls(output: any): {
  videoUrl?: string;
  thumbnailUrl?: string;
} {
  return {
    videoUrl:
      output?.video?.url ||
      output?.video_url ||
      output?.output?.video?.url ||
      output?.output?.url ||
      output?.data?.video?.url ||
      output?.data?.video_url,
    thumbnailUrl:
      output?.thumbnail?.url ||
      output?.thumbnail_url ||
      output?.output?.thumbnail?.url ||
      output?.data?.thumbnail?.url ||
      output?.data?.thumbnail_url,
  };
}

export function parseFalAiCallback(payload: any): VideoTaskResponse {
  const rawStatus = String(
    payload?.status ||
      payload?.payload?.status ||
      payload?.data?.status ||
      payload?.output?.status ||
      ""
  ).toUpperCase();
  const isSuccess =
    rawStatus === "OK" || rawStatus === "COMPLETED" || rawStatus === "SUCCESS";
  const isFailure =
    rawStatus === "FAILED" || rawStatus === "ERROR" || rawStatus === "CANCELLED";
  const output = payload?.payload || payload?.data || payload?.output || payload;
  const { videoUrl, thumbnailUrl } = extractFalOutputUrls(output);

  return {
    taskId:
      payload?.request_id ||
      payload?.requestId ||
      payload?.id ||
      payload?.payload?.request_id ||
      payload?.payload?.requestId ||
      payload?.data?.request_id ||
      payload?.data?.requestId ||
      "",
    provider: "falai",
    status: isSuccess || videoUrl ? "completed" : isFailure ? "failed" : "processing",
    videoUrl,
    thumbnailUrl,
    error: isFailure
      ? {
        code: "FAL_ERROR",
        message:
          payload?.error?.message ||
          payload?.error ||
          payload?.message ||
          "Generation failed",
      }
      : undefined,
    raw: payload,
  };
}
