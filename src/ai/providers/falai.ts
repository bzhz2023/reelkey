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

// fal.ai 模型的 endpoint 映射
const FAL_ENDPOINTS: Record<string, { t2v: string; i2v?: string }> = {
  "kling-2.5-turbo": {
    // Source: fal.ai model docs (Kling 2.5 Turbo Pro/Standard)
    t2v: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    i2v: "fal-ai/kling-video/v2.5-turbo/standard/image-to-video",
  },
  "wan-2.5": {
    // Source: fal.ai model docs (Wan 2.5 preview)
    t2v: "fal-ai/wan-25-preview/text-to-video",
    i2v: "fal-ai/wan-25-preview/image-to-video",
  },
};

const FALLBACK_STATUS_ENDPOINTS = [
  "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
  "fal-ai/kling-video/v2.5-turbo/standard/image-to-video",
  "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
  "fal-ai/wan-25-preview/text-to-video",
  "fal-ai/wan-25-preview/image-to-video",
] as const;

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
    const endpoints = FAL_ENDPOINTS[modelKey];
    if (!endpoints) {
      throw new Error(`Unsupported model: ${modelKey}`);
    }

    const hasImage = Boolean(
      params.imageUrl || (params.imageUrls && params.imageUrls.length > 0)
    );
    const isI2V = hasImage;
    const endpoint = isI2V ? endpoints.i2v : endpoints.t2v;
    if (!endpoint) {
      throw new Error(`Model ${modelKey} does not support image-to-video`);
    }

    const input: Record<string, any> = {
      prompt: params.prompt,
      duration: params.duration || 5,
      aspect_ratio: params.aspectRatio || "16:9",
    };

    const imageUrl = params.imageUrl || params.imageUrls?.[0];
    if (isI2V && imageUrl) {
      input.image_url = imageUrl;
    }

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
        provider: "falai" as any,
        status: "pending",
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
        const status = await fal.queue.status(endpoint, {
          requestId: taskId,
          logs: false,
        });
        const normalizedStatus = String((status as any)?.status || "").toUpperCase();

        if (normalizedStatus === "COMPLETED") {
          const result = await fal.queue.result(endpoint, { requestId: taskId });
          const output = (result as any)?.data;
          const videoUrl =
            output?.video?.url ||
            output?.video_url ||
            output?.output?.video?.url ||
            output?.output?.url;
          const thumbnailUrl =
            output?.thumbnail?.url ||
            output?.thumbnail_url ||
            output?.output?.thumbnail?.url;

          return {
            taskId,
            provider: "falai",
            status: "completed",
            videoUrl,
            thumbnailUrl,
            raw: result,
          };
        }

        return {
          taskId,
          provider: "falai",
          status: normalizedStatus === "FAILED" ? "failed" : "processing",
          raw: status,
        };
      } catch (error: any) {
        const status = error?.status as number | undefined;
        if (status === 401 || status === 403) {
          return {
            taskId,
            provider: "falai",
            status: "failed",
            error: {
              code: "FAL_KEY_INVALID",
              message:
                "Your fal.ai API key is invalid or expired. Please update your key.",
            },
          };
        }
        // Try next endpoint when this endpoint doesn't own the request id.
        if (status === 404 || status === 410) {
          continue;
        }
      }
    }

    return {
      taskId,
      provider: "falai",
      status: "processing",
    };
  }

  parseCallback(payload: any): VideoTaskResponse {
    return parseFalAiCallback(payload);
  }
}

export function parseFalAiCallback(payload: any): VideoTaskResponse {
  const rawStatus = String(payload?.status || "").toUpperCase();
  const isSuccess =
    rawStatus === "OK" || rawStatus === "COMPLETED" || rawStatus === "SUCCESS";
  return {
    taskId: payload.request_id,
    provider: "falai",
    status: isSuccess ? "completed" : "failed",
    videoUrl:
      payload?.payload?.video?.url ||
      payload?.video?.url ||
      payload?.data?.video?.url ||
      payload?.video_url,
    thumbnailUrl:
      payload?.payload?.thumbnail?.url ||
      payload?.thumbnail?.url ||
      payload?.data?.thumbnail?.url ||
      payload?.thumbnail_url,
    error: !isSuccess
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
