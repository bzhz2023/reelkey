"use client";

import { useEffect } from "react";

const RECOVERY_KEY_PREFIX = "reelkey_chunk_recovery:";
const RECOVERY_WINDOW_MS = 5 * 60 * 1000;

const CHUNK_ERROR_PATTERNS = [
  "ChunkLoadError",
  "Loading chunk",
  "Loading CSS chunk",
  "Load failed",
  "Failed to fetch dynamically imported module",
  "Importing a module script failed",
  "error loading dynamically imported module",
];

function getErrorMessage(error: unknown): string {
  if (!error) return "";
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return `${error.name} ${error.message}`.trim();
  }

  if (typeof error === "object") {
    const record = error as { name?: unknown; message?: unknown; reason?: unknown };
    const parts: string[] = [record.name, record.message, getErrorMessage(record.reason)]
      .filter((part): part is string => typeof part === "string" && part.length > 0);
    return parts.join(" ");
  }

  return "";
}

function isRecoverableChunkError(error: unknown) {
  const message = getErrorMessage(error);
  return CHUNK_ERROR_PATTERNS.some((pattern) => message.includes(pattern));
}

function isScriptOrStyleLoadError(event: Event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;

  if (target.tagName === "SCRIPT") return true;

  if (target.tagName === "LINK") {
    const link = target as HTMLLinkElement;
    return ["stylesheet", "preload", "modulepreload"].includes(link.rel);
  }

  return false;
}

function reloadOnce() {
  const key = `${RECOVERY_KEY_PREFIX}${window.location.pathname}`;
  const now = Date.now();

  try {
    const lastRecovery = Number(sessionStorage.getItem(key) || 0);
    if (Number.isFinite(lastRecovery) && now - lastRecovery < RECOVERY_WINDOW_MS) {
      return;
    }
    sessionStorage.setItem(key, String(now));
  } catch {
    // If storage is unavailable, still try one reload for the active page.
  }

  window.location.reload();
}

export function ChunkLoadRecovery() {
  useEffect(() => {
    const handleError = (event: ErrorEvent | Event) => {
      if (
        event instanceof ErrorEvent
          ? isRecoverableChunkError(event.error || event.message)
          : isScriptOrStyleLoadError(event)
      ) {
        reloadOnce();
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isRecoverableChunkError(event.reason)) {
        reloadOnce();
      }
    };

    window.addEventListener("error", handleError, true);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError, true);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
