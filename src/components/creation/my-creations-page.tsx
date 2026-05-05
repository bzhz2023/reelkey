"use client";

// ============================================
// My Creations Page
// ============================================

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useVideos } from "@/hooks/use-videos";
import { useRefreshProcessingVideos } from "@/hooks/use-videos";
import { CreationCard } from "@/components/creation/creation-card";
import { CreationGrid } from "@/components/creation/creation-grid";
import { CreationFilter } from "@/components/creation/creation-filter";
import { CreationEmpty } from "@/components/creation/creation-empty";
import { CreationSkeleton } from "@/components/creation/creation-skeleton";
import { authClient } from "@/lib/auth/client";
import type { Video, VideoFilterOptions } from "@/lib/types/dashboard";
import { videoHistoryStorage } from "@/lib/video-history-storage";

const VideoDetailDialog = dynamic(
  () =>
    import("@/components/creation/video-detail-dialog").then(
      (mod) => mod.VideoDetailDialog,
    ),
  { ssr: false },
);

interface MyCreationsPageProps {
  locale: string;
}

function getFilterKey(filter: VideoFilterOptions) {
  return `${filter.status || "all"}:${filter.model || "all"}:${filter.sortBy || "newest"}`;
}

function isUnfilteredVideoList(filter: VideoFilterOptions) {
  return (
    (!filter.status || filter.status === "all") &&
    (!filter.model || filter.model === "all")
  );
}

function filterVideosLocally(videos: Video[], filter: VideoFilterOptions) {
  const status =
    filter.status && filter.status !== "all" ? filter.status : null;
  const model = filter.model && filter.model !== "all" ? filter.model : null;
  const sortBy = filter.sortBy === "oldest" ? "oldest" : "newest";

  return videos
    .filter((video) => {
      if (status && (video.status || "").toLowerCase() !== status) return false;
      if (model && video.model !== model) return false;
      return true;
    })
    .sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortBy === "oldest" ? aTime - bTime : bTime - aTime;
    });
}

export function MyCreationsPage({ locale }: MyCreationsPageProps) {
  const t = useTranslations("dashboard.myCreations");
  const { data: session } = authClient.useSession();
  const userId = session?.user?.id;

  // Filter state
  const [filter, setFilter] = useState<VideoFilterOptions>({
    status: "all",
    model: "all",
    sortBy: "newest",
  });

  // Selected video for detail dialog
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [localHistoryVideos, setLocalHistoryVideos] = useState<Video[]>([]);

  // Fetch videos
  const {
    videos,
    isLoading,
    isFetching,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    deleteVideo,
    isDeleting,
    refetch,
  } = useVideos(filter);

  // Auto-refresh processing videos
  useRefreshProcessingVideos(videos, refetch);

  useEffect(() => {
    if (!userId) {
      setLocalHistoryVideos([]);
      return;
    }

    const localVideos = videoHistoryStorage
      .getHistory(userId)
      .map((item): Video => ({
        uuid: item.uuid,
        userId: item.userId,
        prompt: item.prompt,
        model: item.model,
        provider: "",
        status: item.status,
        videoUrl: item.videoUrl ?? null,
        thumbnailUrl: item.thumbnailUrl ?? null,
        duration: item.duration ?? 0,
        aspectRatio: item.aspectRatio ?? "",
        parameters: {},
        creditsUsed: item.creditsUsed,
        errorMessage: null,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    setLocalHistoryVideos(localVideos);
  }, [userId]);

  // Infinite scroll observer
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1.0 },
    );

    const current = observerTarget.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [hasMore, isFetchingNextPage, fetchNextPage]);

  const handleFilterChange = (newFilter: Partial<VideoFilterOptions>) => {
    setFilter((prev) => ({ ...prev, ...newFilter }));
  };

  const handleVideoClick = (uuid: string) => {
    const video = videos.find((v) => v.uuid === uuid);
    if (video) {
      setSelectedVideo(video);
    }
  };

  const handleCloseDialog = () => {
    setSelectedVideo(null);
  };

  const settledFilterKeyRef = useRef(getFilterKey(filter));
  const currentFilterKey = getFilterKey(filter);
  const isFilterChanging = currentFilterKey !== settledFilterKeyRef.current;
  const isFiltering =
    isFilterChanging && isFetching && !isLoading && !isFetchingNextPage;
  const unfilteredVideosRef = useRef<Video[]>([]);

  useEffect(() => {
    if (!isFetching) {
      settledFilterKeyRef.current = currentFilterKey;
    }
  }, [currentFilterKey, isFetching]);

  useEffect(() => {
    if (!isLoading && !isFilterChanging && isUnfilteredVideoList(filter)) {
      unfilteredVideosRef.current = videos;
    }
  }, [filter, isFilterChanging, isLoading, videos]);

  const localFilterSource =
    isFilterChanging && unfilteredVideosRef.current.length > 0
      ? unfilteredVideosRef.current
      : videos;

  const locallyFilteredVideos = useMemo(
    () => filterVideosLocally(localFilterSource, filter),
    [localFilterSource, filter],
  );
  const isShowingLocalFallback = isLoading && localHistoryVideos.length > 0;
  const visibleVideos = isShowingLocalFallback
    ? filterVideosLocally(localHistoryVideos, filter)
    : isFilterChanging
      ? locallyFilteredVideos
      : videos;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("count", { count: visibleVideos.length })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isFiltering && (
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t("filtering")}
            </span>
          )}
          <CreationFilter
            filter={filter}
            onFilterChange={handleFilterChange}
            disabled={isFiltering}
          />
        </div>
      </div>

      {/* Content */}
      {isLoading && !isShowingLocalFallback ? (
        <CreationSkeleton />
      ) : visibleVideos.length === 0 ? (
        <CreationEmpty />
      ) : (
        <div className="relative">
          {isFiltering && (
            <>
              <div className="absolute -top-3 left-0 right-0 h-px overflow-hidden bg-border">
                <div className="h-full w-full animate-pulse bg-primary/60" />
              </div>
              <div
                className="absolute inset-0 z-20 cursor-wait"
                aria-hidden="true"
              />
            </>
          )}

          <CreationGrid
            className={
              isFiltering
                ? "pointer-events-none select-none opacity-70 transition-opacity duration-150"
                : "opacity-100 transition-opacity duration-150"
            }
          >
            {visibleVideos.map((video) => (
              <CreationCard
                key={video.uuid}
                video={video}
                onClick={handleVideoClick}
                onDelete={deleteVideo}
                isDeleting={isDeleting}
              />
            ))}
          </CreationGrid>

          {/* Infinite scroll sentinel */}
          {hasMore && !isShowingLocalFallback && (
            <div
              ref={observerTarget}
              className="py-4 text-center text-sm text-muted-foreground"
            >
              {isFetchingNextPage ? t("loadingMore") : ""}
            </div>
          )}
        </div>
      )}

      {/* Video Detail Dialog */}
      <VideoDetailDialog
        video={selectedVideo}
        open={!!selectedVideo}
        onClose={handleCloseDialog}
        onDelete={deleteVideo}
        isDeleting={isDeleting}
      />
    </div>
  );
}
