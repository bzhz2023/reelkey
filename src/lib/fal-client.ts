/**
 * fal.ai 客户端配置和 Key 验证工具
 */

import { fal } from "@fal-ai/client";
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
  const normalizedKey = key.trim();

  if (!normalizedKey) {
    return { valid: false, error: "Missing API key" };
  }

  try {
    const response = await fetch("/api/v1/fal/validate-key", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fal-key": normalizedKey,
      },
      cache: "no-store",
    });

    const result = await response.json().catch(() => null);

    if (response.ok && result?.valid === true) {
      return { valid: true };
    }

    return {
      valid: false,
      error: result?.error || "Invalid API key",
    };
  } catch {
    return {
      valid: false,
      error: "Unable to validate API key",
    };
  }
}
