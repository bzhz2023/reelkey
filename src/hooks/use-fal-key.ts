"use client";

import { useState, useEffect } from "react";
import { falKeyStorage } from "@/lib/fal-key";
import { validateFalKey } from "@/lib/fal-client";

export type FalKeyStatus = "missing" | "validating" | "valid" | "invalid";

/**
 * 管理 fal.ai API Key 状态的 React Hook
 */
export function useFalKey() {
  const [status, setStatus] = useState<FalKeyStatus>("missing");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);

  // 初始化时从 localStorage 读取
  useEffect(() => {
    let active = true;

    const stored = falKeyStorage.get();
    if (stored) {
      setMaskedKey(maskKey(stored));
      setStatus("validating");
      validateFalKey(stored).then((result) => {
        if (!active) return;

        if (result.valid) {
          setStatus("valid");
          return;
        }

        falKeyStorage.remove();
        setMaskedKey(null);
        setStatus("invalid");
      });
    }

    return () => {
      active = false;
    };
  }, []);

  /**
   * 保存并验证新的 API Key
   */
  const saveKey = async (newKey: string): Promise<boolean> => {
    setStatus("validating");

    const normalizedKey = newKey.trim();
    const result = await validateFalKey(normalizedKey);

    if (result.valid) {
      falKeyStorage.set(normalizedKey);
      setStatus("valid");
      setMaskedKey(maskKey(normalizedKey));
      return true;
    }

    setStatus("invalid");
    return false;
  };

  /**
   * 删除存储的 API Key
   */
  const removeKey = () => {
    falKeyStorage.remove();
    setStatus("missing");
    setMaskedKey(null);
  };

  return { status, maskedKey, saveKey, removeKey };
}

/**
 * 脱敏显示 API Key
 */
function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 6)}...${key.slice(-4)}`;
}
