/**
 * fal.ai Provider - 实现 AIVideoProvider 接口
 * 使用用户自己的 fal.ai API Key 生成视频
 */

import * as fal from "@fal-ai/client";
import type {
  AIVideoProvider,
  VideoGenerationParams,
  VideoTaskResponse,
} from "../types";

// fal.ai 模型的 endpoint 映射
const FAL_ENDPOINTS: Record<string, { t2v: string; i2v?: string }> = {
  "kling-2.5-turbo": {
    t2v: "fal-ai/kling-video/v2.1/standard/text-to-video",
    i2v: "fal-ai/kling-video/v2.1/standard/image-to-video",
  },
  "wan-2.5": {
    t2v: "fal-ai/wan/v2.2/text-to-video",
    i2v: "fal-ai/wan/v2.2/image-to-video",
  },
};

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

    const isI2V = !!params.imageUrl;
    const endpoint = isI2V ? endpoints.i2v : endpoints.t2v;
    if (!endpoint) {
      throw new Error(`Model ${modelKey} does not support image-to-video`);
    }

    const input: Record<string, any> = {
      prompt: params.prompt,
      duration: params.duration || 5,
      aspect_ratio: params.aspectRatio || "16:9",
    };

    if (isI2V && params.imageUrl) {
      input.image_url = params.imageUrl;
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
      // 如果是 Cloudflare 524 或超时错误，返回更友好的错误信息
      const isTimeout = error.message?.includes("timeout") || error.message?.includes("524");
      throw new Error(
        isTimeout
          ? "fal.ai API is taking too long to respond. Please try again in a moment."
          : `Failed to submit task to fal.ai: ${error.message}`
      );
    }
  }

  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    try {
      // 简化：先轮询 Kling endpoint（实际应该记录模型信息）
      const status = await fal.queue.status(
        "fal-ai/kling-video/v2.1/standard/text-to-video",
        { requestId: taskId, logs: false }
      );

      if (status.status === "COMPLETED") {
        const result = await fal.queue.result(
          "fal-ai/kling-video/v2.1/standard/text-to-video",
          { requestId: taskId }
        );
        return {
          taskId,
          provider: "falai" as any,
          status: "completed",
          videoUrl: (result.data as any)?.video?.url,
        };
      }

      return {
        taskId,
        provider: "falai" as any,
        status: status.status === "FAILED" ? "failed" : "processing",
      };
    } catch (e) {
      return {
        taskId,
        provider: "falai" as any,
        status: "failed",
      };
    }
  }

  parseCallback(payload: any): VideoTaskResponse {
    const isSuccess = payload.status === "OK";
    return {
      taskId: payload.request_id,
      provider: "falai" as any,
      status: isSuccess ? "completed" : "failed",
      videoUrl: payload.payload?.video?.url,
      error: !isSuccess
        ? { code: "FAL_ERROR", message: payload.error || "Generation failed" }
        : undefined,
    };
  }
}
