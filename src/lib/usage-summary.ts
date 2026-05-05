import type { Video } from "@/lib/types/dashboard";

export interface UsageSummary {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  estimatedCostCents: number;
  billableVideos: Video[];
}

const PROCESSING_STATUSES = new Set(["pending", "generating", "uploading"]);

export type UsageCostState = "billed" | "not_billed" | "pending";

export function buildUsageSummary(videos: Video[]): UsageSummary {
  return videos.reduce<UsageSummary>(
    (summary, video) => {
      summary.total += 1;
      const status = normalizeVideoStatus(video.status);
      if (status === "completed") {
        summary.completed += 1;
        summary.billableVideos.push(video);
        summary.estimatedCostCents += estimateProviderCostCents(video);
      } else if (status === "failed") {
        summary.failed += 1;
      } else if (PROCESSING_STATUSES.has(status)) {
        summary.processing += 1;
      }
      return summary;
    },
    {
      total: 0,
      completed: 0,
      failed: 0,
      processing: 0,
      estimatedCostCents: 0,
      billableVideos: [],
    }
  );
}

export function normalizeVideoStatus(status: string): string {
  return status.toLowerCase();
}

export function estimateProviderCostCents(video: Video): number {
  const providerCost = getProviderCost(video);
  if (providerCost?.actualCents !== undefined) {
    return providerCost.actualCents;
  }
  if (providerCost?.estimatedCents !== undefined) {
    return providerCost.estimatedCents;
  }

  if (video.provider === "falai" && video.model === "kling-2.5-turbo") {
    return Math.max(0, video.duration || 0) * 7;
  }

  return Math.max(0, video.creditsUsed || 0);
}

function getProviderCost(video: Video): {
  actualCents?: number;
  estimatedCents?: number;
  source?: "actual" | "estimated";
} | null {
  const providerCost = video.parameters?.providerCost;
  if (!providerCost || typeof providerCost !== "object") return null;

  const cost = providerCost as Record<string, unknown>;
  return {
    actualCents:
      typeof cost.actualCents === "number" ? Math.max(0, cost.actualCents) : undefined,
    estimatedCents:
      typeof cost.estimatedCents === "number"
        ? Math.max(0, cost.estimatedCents)
        : undefined,
    source: cost.source === "actual" ? "actual" : "estimated",
  };
}

export function getUsageCostDisplay(video: Video): {
  label: string;
  state: UsageCostState;
  source?: "actual" | "estimated";
} {
  const status = normalizeVideoStatus(video.status);

  if (status === "completed") {
    const providerCost = getProviderCost(video);
    return {
      label: formatProviderCost(estimateProviderCostCents(video)),
      state: "billed",
      source: providerCost?.source ?? "estimated",
    };
  }

  if (PROCESSING_STATUSES.has(status)) {
    return {
      label: "Pending",
      state: "pending",
    };
  }

  return {
    label: "Not billed",
    state: "not_billed",
  };
}

export function formatProviderCost(costCents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.max(0, costCents) / 100);
}
