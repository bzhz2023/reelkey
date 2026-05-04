export function createServerTimer(label: string) {
  const startedAt = Date.now();
  let lastStepAt = startedAt;
  const steps: string[] = [];

  const debugPerf = process.env.NEXT_PUBLIC_DEBUG_PERF === "true";
  const slowRequestMs = Number(process.env.PERF_SLOW_REQUEST_MS ?? 1000);

  return {
    mark(step: string) {
      if (process.env.NODE_ENV !== "development" && !debugPerf) return;
      const now = Date.now();
      const elapsed = now - startedAt;
      const delta = now - lastStepAt;
      lastStepAt = now;
      steps.push(`${step}=+${delta}ms/${elapsed}ms`);
      if (debugPerf) {
        console.info(`[perf] ${label} ${step}: +${delta}ms (${elapsed}ms)`);
      }
    },
    done() {
      if (process.env.NODE_ENV !== "development" && !debugPerf) return;
      const totalMs = Date.now() - startedAt;
      if (debugPerf || totalMs >= slowRequestMs) {
        console.info(
          `[perf] ${label} slow: ${totalMs}ms${steps.length ? ` (${steps.join(", ")})` : ""}`
        );
      }
    },
  };
}
