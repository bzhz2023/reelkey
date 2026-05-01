/**
 * fal.ai 客户端配置和 Key 验证工具
 */

import * as fal from "@fal-ai/client";
import { falKeyStorage } from "./fal-key";

/**
 * 配置 fal 客户端
 * @param key - 可选的 API Key，如果不提供则从 localStorage 读取
 */
export function configureFalClient(key?: string) {
  fal.config({
    proxyUrl: "/api/fal/proxy",
    credentials: key || falKeyStorage.get() || undefined,
  });
}

/**
 * 验证 fal.ai API Key 是否有效
 * @param key - 要验证的 API Key
 * @returns 验证结果对象
 */
export async function validateFalKey(key: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    configureFalClient(key);

    // 尝试查询一个任务状态（会返回 404，但 Key 有效时不会返回 401/403）
    await fal.queue.status("fal-ai/kling-video/v2.1/standard/text-to-video", {
      requestId: "validation-test",
      logs: false,
    });

    return { valid: true };
  } catch (e: any) {
    // 401/403 表示 Key 无效
    if (e?.status === 401 || e?.status === 403) {
      return { valid: false, error: "Invalid API key" };
    }

    // 其他错误（如 404）说明 Key 本身有效，只是请求参数有问题
    return { valid: true };
  }
}
