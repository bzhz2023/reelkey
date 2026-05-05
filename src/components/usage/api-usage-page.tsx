"use client";

import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  type LucideIcon,
  ReceiptText,
  Video,
} from "lucide-react";
import type React from "react";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModelDisplayName } from "@/config/credits";
import { cn } from "@/components/ui";
import { useRefreshProcessingVideos, useVideos } from "@/hooks/use-videos";
import {
  buildUsageSummary,
  formatProviderCost,
  getUsageCostDisplay,
  normalizeVideoStatus,
} from "@/lib/usage-summary";
import type { Video as DashboardVideo, VideoStatus } from "@/lib/types/dashboard";

const statusStyles: Record<VideoStatus, string> = {
  completed: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600",
  failed: "border-rose-500/20 bg-rose-500/10 text-rose-600",
  generating: "border-blue-500/20 bg-blue-500/10 text-blue-600",
  pending: "border-amber-500/20 bg-amber-500/10 text-amber-600",
  uploading: "border-violet-500/20 bg-violet-500/10 text-violet-600",
};

export function ApiUsagePage() {
  const t = useTranslations("ApiUsage");
  const {
    videos,
    isLoading,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useVideos({ sortBy: "newest", status: "all", model: "all" });

  useRefreshProcessingVideos(videos, refetch);

  const summary = useMemo(() => buildUsageSummary(videos), [videos]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a
            href="https://fal.ai/dashboard/billing"
            target="_blank"
            rel="noreferrer"
          >
            {t("openBilling")}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <UsageMetric
          icon={Video}
          label={t("metricRequests")}
          value={summary.total.toLocaleString()}
        />
        <UsageMetric
          icon={CheckCircle2}
          label={t("metricCompleted")}
          value={summary.completed.toLocaleString()}
        />
        <UsageMetric
          icon={AlertCircle}
          label={t("metricFailed")}
          value={summary.failed.toLocaleString()}
        />
        <UsageMetric
          icon={ReceiptText}
          label={t("metricEstimatedCost")}
          value={formatProviderCost(summary.estimatedCostCents)}
        />
      </div>

      <section className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold">{t("historyTitle")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("historyDescription")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("loading")}
          </div>
        ) : videos.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted">
              <ReceiptText className="h-5 w-5 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium">{t("emptyTitle")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-muted/50">
                  <tr className="text-left text-xs font-medium uppercase text-muted-foreground">
                    <th className="px-5 py-3">{t("colGeneration")}</th>
                    <th className="px-5 py-3">{t("colModel")}</th>
                    <th className="px-5 py-3">{t("colSettings")}</th>
                    <th className="px-5 py-3">{t("colStatus")}</th>
                    <th className="px-5 py-3 text-right">{t("colCost")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {videos.map((video) => (
                    <UsageRow key={video.uuid} video={video} t={t} />
                  ))}
                </tbody>
              </table>
            </div>

            {hasMore && (
              <div className="border-t border-border px-5 py-4 text-center">
                <Button
                  variant="outline"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  {t("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

interface UsageMetricProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function UsageMetric({ icon: Icon, label, value }: UsageMetricProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="mt-3 text-2xl font-semibold">{value}</div>
    </div>
  );
}

type TFunc = ReturnType<typeof useTranslations<"ApiUsage">>;

const statusKeyMap: Record<string, string> = {
  completed: "statusCompleted",
  failed: "statusFailed",
  generating: "statusGenerating",
  pending: "statusPending",
  uploading: "statusUploading",
};

function UsageRow({
  video,
  t,
}: {
  video: DashboardVideo;
  t: TFunc;
}) {
  const status = normalizeVideoStatus(video.status);
  const quality =
    typeof video.parameters?.quality === "string"
      ? video.parameters.quality
      : undefined;
  const mode =
    typeof video.parameters?.mode === "string"
      ? video.parameters.mode
      : undefined;
  const costDisplay = getUsageCostDisplay(video);

  const costLabel =
    costDisplay.state === "billed"
      ? costDisplay.label
      : costDisplay.state === "pending"
        ? t("costPending")
        : t("costNotBilled");

  const statusLabel = statusKeyMap[status]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? t(statusKeyMap[status] as any)
    : status;

  return (
    <tr className="text-sm hover:bg-muted/40">
      <td className="max-w-[320px] px-5 py-4">
        <div className="line-clamp-2 font-medium">{video.prompt}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(video.createdAt), { addSuffix: true })}
        </div>
      </td>
      <td className="px-5 py-4">
        <div className="font-medium">{getModelDisplayName(video.model)}</div>
        <div className="text-xs text-muted-foreground">{video.provider}</div>
      </td>
      <td className="px-5 py-4">
        <div className="flex flex-wrap gap-1.5">
          {mode && <SmallPill>{mode}</SmallPill>}
          {video.aspectRatio && <SmallPill>{video.aspectRatio}</SmallPill>}
          {video.duration > 0 && <SmallPill>{video.duration}s</SmallPill>}
          {quality && <SmallPill>{quality}</SmallPill>}
        </div>
      </td>
      <td className="px-5 py-4">
        <Badge
          variant="outline"
          className={cn(
            statusStyles[status as VideoStatus] || statusStyles.pending
          )}
        >
          {statusLabel}
        </Badge>
      </td>
      <td
        className={cn(
          "px-5 py-4 text-right font-medium",
          costDisplay.state !== "billed" && "text-muted-foreground"
        )}
      >
        {costLabel}
      </td>
    </tr>
  );
}

function SmallPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
      {children}
    </span>
  );
}
