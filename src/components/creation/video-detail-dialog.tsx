"use client";

// ============================================
// Video Detail Dialog Component
// ============================================

import { useEffect, useRef, useState } from "react";
import { X, Download, Pause, Play, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/components/ui";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getModelDisplayName } from "@/config/credits";
import { formatRelativeTime } from "@/lib/format-relative-time";
import { getUsageCostDisplay } from "@/lib/usage-summary";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Video } from "@/lib/types/dashboard";

interface VideoDetailDialogProps {
  video: Video | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (uuid: string) => void;
  isDeleting?: boolean;
}

export function VideoDetailDialog({
  video,
  open,
  onClose,
  onDelete,
  isDeleting,
}: VideoDetailDialogProps) {
  const t = useTranslations("dashboard.myCreations");
  const locale = useLocale();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [open, video?.uuid]);

  // Pause video when dialog closes
  useEffect(() => {
    if (!open && videoRef.current) {
      videoRef.current.pause();
    }
  }, [open]);

  if (!video) return null;

  const handleDelete = async () => {
    await onDelete?.(video.uuid);
    setShowDeleteDialog(false);
    onClose();
  };

  const handleDownload = () => {
    if (video.videoUrl) {
      const link = document.createElement("a");
      link.href = video.videoUrl;
      link.download = `reelkey-${video.uuid}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t("actions.downloadSuccess"));
    }
  };

  const normalizedStatus = (video.status || "pending").toLowerCase();
  const statusLabel =
    t(`status.${normalizedStatus}` as "status.completed") ||
    t("status.processing");
  const costDisplay = getUsageCostDisplay(video);
  const providerCostLabel =
    costDisplay.state === "billed"
      ? costDisplay.label
      : costDisplay.state === "pending"
        ? t("detail.costPending")
        : t("detail.costNotCharged");
  const costSourceLabel =
    costDisplay.state === "billed" && costDisplay.source === "actual"
      ? t("detail.costActual")
      : costDisplay.state === "billed" && costDisplay.source === "estimated"
        ? t("detail.costEstimated")
        : null;

  const handleTogglePlayback = async () => {
    const player = videoRef.current;
    if (!player) return;

    if (player.paused) {
      await player.play().catch(() => setIsPlaying(false));
    } else {
      player.pause();
    }
  };

  const handleSeek = (value: string) => {
    const player = videoRef.current;
    if (!player) return;

    const nextTime = Number(value);
    player.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent
          className="p-0 overflow-hidden"
          style={{
            width: "75vw",
            maxWidth: "85vw",
            height: "80vh",
          }}
        >
          <DialogTitle className="sr-only">{t("title")}</DialogTitle>
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground bg-background"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t("actions.close")}</span>
          </button>

          <div className="flex flex-col lg:flex-row h-full">
            {/* Left: Video Player (~65% for better 16:9 display) */}
            <div className="lg:w-[65%] h-[60vh] lg:h-full bg-slate-950 flex items-center justify-center">
              {video.videoUrl ? (
                <div className="group relative h-full w-full bg-slate-950">
                  <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className="h-full w-full object-contain"
                    playsInline
                    preload="metadata"
                    poster={video.thumbnailUrl || undefined}
                    onLoadedMetadata={(event) => {
                      const nextDuration = event.currentTarget.duration;
                      setDuration(Number.isFinite(nextDuration) ? nextDuration : 0);
                    }}
                    onTimeUpdate={(event) =>
                      setCurrentTime(event.currentTarget.currentTime)
                    }
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onEnded={() => setIsPlaying(false)}
                  />
                  <button
                    type="button"
                    onClick={handleTogglePlayback}
                    className={cn(
                      "absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-950 shadow-lg transition hover:bg-white",
                      isPlaying
                        ? "opacity-0 group-hover:opacity-100"
                        : "opacity-100"
                    )}
                    aria-label={
                      isPlaying ? t("actions.pause") : t("actions.play")
                    }
                  >
                    {isPlaying ? (
                      <Pause className="h-7 w-7" />
                    ) : (
                      <Play className="ml-1 h-7 w-7" />
                    )}
                  </button>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent px-5 pb-4 pt-12 text-white">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleTogglePlayback}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
                        aria-label={
                          isPlaying ? t("actions.pause") : t("actions.play")
                        }
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="ml-0.5 h-4 w-4" />
                        )}
                      </button>
                      <span className="w-24 shrink-0 text-xs tabular-nums text-white/80">
                        {formatVideoTime(currentTime)} /{" "}
                        {duration > 0 ? formatVideoTime(duration) : "--:--"}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        step="0.1"
                        value={Math.min(currentTime, duration || currentTime)}
                        onChange={(event) => handleSeek(event.target.value)}
                        className="h-1 w-full cursor-pointer accent-sky-400"
                        aria-label={t("detail.progress")}
                        disabled={duration <= 0}
                      />
                    </div>
                  </div>
                </div>
              ) : video.thumbnailUrl ? (
                <img
                  src={video.thumbnailUrl}
                  alt={video.prompt}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-muted-foreground">
                  {t("detail.noVideo")}
                </div>
              )}
            </div>

            {/* Right: Video Info (~35%) */}
            <div className="lg:w-[35%] h-[40vh] lg:h-full p-8 space-y-6 overflow-y-auto">
              {/* Status badge */}
              <div>
                <Badge
                  className={
                    normalizedStatus === "completed"
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      : normalizedStatus === "failed"
                        ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                        : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                  }
                  variant="outline"
                >
                  {statusLabel}
                </Badge>
              </div>

              {/* Model info */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {t("detail.model")}
                  </div>
                  <div className="font-medium">
                    {getModelDisplayName(video.model)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {t("detail.duration")}
                    </div>
                    <div className="font-medium">{video.duration}s</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">
                      {t("detail.aspectRatio")}
                    </div>
                    <div className="font-medium">{video.aspectRatio}</div>
                  </div>
                </div>
              </div>

              <div className="border-t border-border" />

              {/* Prompt */}
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  {t("detail.prompt")}
                </div>
                <p className="text-sm leading-relaxed">{video.prompt}</p>
              </div>

              <div className="border-t border-border" />

              {/* Metadata */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("detail.createdAt")}
                  </span>
                  <span className="font-medium">
                    {formatRelativeTime(video.createdAt, locale)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {t("detail.providerCost")}
                  </span>
                  <span className="font-medium">
                    {providerCostLabel}
                    {costSourceLabel ? (
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        {costSourceLabel}
                      </span>
                    ) : null}
                  </span>
                </div>
              </div>

              {/* Actions */}
              {normalizedStatus === "completed" && (
                <>
                  <div className="border-t border-border" />
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleDownload}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {t("actions.download")}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                      disabled={isDeleting}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("actions.delete")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.message")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function formatVideoTime(value: number): string {
  const safeValue = Math.max(0, Math.floor(value));
  const minutes = Math.floor(safeValue / 60);
  const seconds = safeValue % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
