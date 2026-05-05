"use client";

// ============================================
// Creation Card Component
// ============================================

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Play, Clock, AlertCircle, MoreHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getModelDisplayName } from "@/config/credits";
import { formatRelativeTime } from "@/lib/format-relative-time";
import type { Video } from "@/lib/types/dashboard";

const CreationCardActions = dynamic(
  () =>
    import("@/components/creation/creation-card-actions").then(
      (mod) => mod.CreationCardActions,
    ),
  { ssr: false },
);

interface CreationCardProps {
  video: Video;
  onClick: (uuid: string) => void;
  onDelete?: (uuid: string) => void;
  isDeleting?: boolean;
}

const statusConfig = {
  completed: {
    icon: Play,
    iconBg: "bg-primary",
    labelKey: "status.completed",
    labelColor: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  pending: {
    icon: Clock,
    iconBg: "bg-muted",
    labelKey: "status.pending",
    labelColor: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  generating: {
    icon: Clock,
    iconBg: "bg-muted",
    labelKey: "status.generating",
    labelColor: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  uploading: {
    icon: Clock,
    iconBg: "bg-muted",
    labelKey: "status.uploading",
    labelColor: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  },
  failed: {
    icon: AlertCircle,
    iconBg: "bg-destructive/10",
    labelKey: "status.failed",
    labelColor: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  },
};

export function CreationCard({
  video,
  onClick,
  onDelete,
  isDeleting,
}: CreationCardProps) {
  const t = useTranslations("dashboard.myCreations");
  const locale = useLocale();
  const [isMenuLoaded, setIsMenuLoaded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const normalizedStatus = (
    video.status || "pending"
  ).toLowerCase() as keyof typeof statusConfig;
  const config = statusConfig[normalizedStatus] ?? statusConfig.pending;
  const StatusIcon = config.icon;
  const statusLabel = t(config.labelKey as "status.completed");

  const isProcessing =
    normalizedStatus === "pending" ||
    normalizedStatus === "generating" ||
    normalizedStatus === "uploading";
  const isFailed = normalizedStatus === "failed";
  const isCompleted = normalizedStatus === "completed";
  const mediaSrc = video.thumbnailUrl;

  const handleDelete = async () => {
    await onDelete?.(video.uuid);
  };

  const handlePreviewStart = () => {
    if (!isCompleted || !video.videoUrl) return;
    const element = videoRef.current;
    if (!element) return;
    element.currentTime = 0;
    element.play().catch(() => {});
  };

  const handlePreviewStop = () => {
    const element = videoRef.current;
    if (!element) return;
    element.pause();
    element.currentTime = 0;
  };

  return (
    <>
      <div
        className={cn(
          "group relative overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg cursor-pointer",
          isDeleting && "opacity-50 pointer-events-none",
        )}
        onClick={() => onClick(video.uuid)}
        onMouseEnter={handlePreviewStart}
        onMouseLeave={handlePreviewStop}
      >
        {/* Thumbnail / Preview */}
        <div className="relative aspect-video w-full overflow-hidden bg-muted">
          {mediaSrc && (
            <img
              src={mediaSrc}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 h-full w-full scale-110 object-cover opacity-25 blur-xl"
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/10" />

          {isCompleted && video.videoUrl ? (
            <video
              ref={videoRef}
              src={video.videoUrl}
              poster={video.thumbnailUrl || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              className="relative z-10 h-full w-full object-contain"
            />
          ) : video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.prompt}
              className="relative z-10 h-full w-full object-contain"
            />
          ) : (
            <div className="relative z-10 flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center">
              <StatusIcon className="h-12 w-12 text-muted-foreground" />
              {isFailed && video.errorMessage && (
                <p className="text-[11px] text-destructive line-clamp-3">
                  {(() => {
                    try {
                      const parsed = JSON.parse(video.errorMessage);
                      return (
                        parsed.error?.message ||
                        parsed.message ||
                        video.errorMessage
                      );
                    } catch {
                      return video.errorMessage;
                    }
                  })()}
                </p>
              )}
            </div>
          )}

          {/* Overlay for completed videos */}
          {isCompleted && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
              <div className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2 z-30">
            <Badge className={config.labelColor} variant="outline">
              {statusLabel}
            </Badge>
          </div>

          {/* Duration badge (completed only) */}
          {isCompleted && video.duration > 0 && (
            <div className="absolute bottom-2 right-2 z-30">
              <Badge
                variant="secondary"
                className="bg-black/70 text-white border-0"
              >
                {Math.floor(video.duration)}s
              </Badge>
            </div>
          )}

          {/* Action menu */}
          <div className="absolute top-2 right-2 z-30">
            {isMenuLoaded ? (
              <CreationCardActions
                isCompleted={isCompleted}
                onDelete={handleDelete}
                open={isMenuOpen}
                onOpenChange={setIsMenuOpen}
                videoUrl={video.videoUrl}
                videoUuid={video.uuid}
              />
            ) : (
              <Button
                onClick={(event) => {
                  event.stopPropagation();
                  setIsMenuLoaded(true);
                  setIsMenuOpen(true);
                }}
                variant="secondary"
                size="icon"
                className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Card info */}
        <div className="space-y-1.5 p-3">
          {/* Model & Aspect Ratio */}
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span className="min-w-0 truncate font-medium">
              {getModelDisplayName(video.model)}
            </span>
            <span className="shrink-0">{video.aspectRatio}</span>
          </div>

          {/* Prompt */}
          <div className="min-h-[32px] text-xs leading-4 text-foreground/90 line-clamp-2">
            {video.prompt}
          </div>

          {/* Date */}
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(video.createdAt, locale)}
          </div>

          {/* Error is displayed in the preview area for failed videos */}
        </div>
      </div>
    </>
  );
}
