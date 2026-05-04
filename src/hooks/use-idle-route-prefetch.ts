"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface IdleRoutePrefetchOptions {
  enabled?: boolean;
  initialDelayMs?: number;
  staggerMs?: number;
}

const warmedDevRoutes = new Set<string>();
let devRoutePrewarmQueue = Promise.resolve();

function prewarmDevRoute(href: string) {
  if (warmedDevRoutes.has(href)) return;
  warmedDevRoutes.add(href);

  devRoutePrewarmQueue = devRoutePrewarmQueue
    .catch(() => undefined)
    .then(async () => {
      await fetch(href, {
        credentials: "same-origin",
        headers: {
          "x-reelkey-route-prewarm": "1",
        },
        priority: "low",
      } as RequestInit & { priority?: "low" | "high" | "auto" });
    })
    .catch((error) => {
      warmedDevRoutes.delete(href);
      console.warn(`[perf] route prewarm failed for ${href}`, error);
    });
}

export function useIdleRoutePrefetch(
  hrefs: string[],
  {
    enabled = true,
    initialDelayMs = 300,
    staggerMs = 350,
  }: IdleRoutePrefetchOptions = {}
) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled || hrefs.length === 0) return;

    const uniqueHrefs = Array.from(new Set(hrefs));
    const timeoutIds: number[] = [];
    const idleIds: number[] = [];
    let cancelled = false;

    const prefetchRoute = (href: string) => {
      if (cancelled) return;

      try {
        if (process.env.NODE_ENV === "development") {
          prewarmDevRoute(href);
          return;
        }

        router.prefetch(href);
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn(`[perf] route prefetch failed for ${href}`, error);
        }
      }
    };

    const schedulePrefetches = () => {
      uniqueHrefs.forEach((href, index) => {
        const timeoutId = window.setTimeout(() => {
          if ("requestIdleCallback" in window) {
            const idleId = window.requestIdleCallback(
              () => prefetchRoute(href),
              { timeout: 1500 }
            );
            idleIds.push(idleId);
            return;
          }

          prefetchRoute(href);
        }, index * staggerMs);

        timeoutIds.push(timeoutId);
      });
    };

    const initialTimeoutId = window.setTimeout(schedulePrefetches, initialDelayMs);
    timeoutIds.push(initialTimeoutId);

    return () => {
      cancelled = true;
      timeoutIds.forEach((id) => window.clearTimeout(id));
      idleIds.forEach((id) => window.cancelIdleCallback(id));
    };
  }, [enabled, hrefs, initialDelayMs, router, staggerMs]);
}
