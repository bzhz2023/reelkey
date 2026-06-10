"use client";

import { useEffect } from "react";

interface ToolErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const RECOVERY_KEY_PREFIX = "reelkey_tool_error_recovery:";
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

function isChunkLoadError(error: Error) {
  const message = `${error.name} ${error.message}`;
  return [
    "ChunkLoadError",
    "Loading chunk",
    "Loading CSS chunk",
    "Load failed",
    "Failed to fetch dynamically imported module",
    "Importing a module script failed",
    "error loading dynamically imported module",
  ].some((pattern) => message.includes(pattern));
}

export default function ToolError({ error, reset }: ToolErrorProps) {
  useEffect(() => {
    if (!isChunkLoadError(error)) return;

    const key = `${RECOVERY_KEY_PREFIX}${window.location.pathname}`;
    const now = Date.now();

    try {
      const lastRecovery = Number(sessionStorage.getItem(key) || 0);
      if (Number.isFinite(lastRecovery) && now - lastRecovery < RECOVERY_WINDOW_MS) {
        return;
      }
      sessionStorage.setItem(key, String(now));
    } catch {
      // Continue with the reload fallback below.
    }

    window.location.reload();
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
        <h2 className="text-lg font-semibold text-foreground">
          页面加载失败
        </h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          当前页面资源加载不完整，请重试。如果刚刚更新过版本，刷新后通常可以恢复。
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          重试
        </button>
      </div>
    </div>
  );
}
