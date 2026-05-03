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
