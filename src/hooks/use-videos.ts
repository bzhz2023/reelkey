"use client";

// ============================================
// Video Hooks
// ============================================

import { useCallback, useEffect, useRef } from "react";
import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { apiClient } from "@/lib/api/dashboard-client";
import { falKeyStorage } from "@/lib/fal-key";
import { useVideosStore } from "@/stores/videos-store";
import type { VideoFilterOptions } from "@/lib/types/dashboard";

const PROCESSING_REFRESH_MAX_AGE_MS = 60 * 60 * 1000;

/**
 * Fetch videos with infinite scroll
 */
export function useVideos(filter?: VideoFilterOptions) {
  const queryClient = useQueryClient();
  const t = useTranslations("dashboard.myCreations");

  const {
    data,
    isLoading,
    isFetching,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ["videos", filter],
    queryFn: async ({ pageParam }) => {
      return apiClient.getVideos({
        limit: 20,
        cursor: pageParam,
        status:
          filter?.status && filter.status !== "all" ? filter.status : undefined,
        model:
          filter?.model && filter.model !== "all" ? filter.model : undefined,
        sortBy: filter?.sortBy,
      });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    staleTime: 30 * 1000,
  });

  // Flatten pages
  const videos = data?.pages.flatMap((page) => page.videos) || [];
  const hasMore = hasNextPage || false;

  // 删除视频
  const deleteMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return apiClient.deleteVideo(uuid);
    },
    onMutate: (uuid) => {
      // 乐观删除
      const previousVideos = queryClient.getQueryData(["videos", filter]);
      queryClient.setQueryData(["videos", filter], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            videos: page.videos.filter((v: any) => v.uuid !== uuid),
          })),
        };
      });

      return { previousVideos };
    },
    onSuccess: () => {
      toast.success(t("actions.deleteSuccess") || "Video deleted successfully");
    },
    onError: (error, variables, context) => {
      // 回滚
      if (context) {
        queryClient.setQueryData(["videos", filter], context.previousVideos);
      }
      toast.error(t("actions.deleteError") || "Failed to delete video");
    },
  });

  // 重试失败视频
  const retryMutation = useMutation({
    mutationFn: async (uuid: string) => {
      return apiClient.retryVideo(uuid);
    },
    onSuccess: () => {
      toast.success(t("actions.retrySuccess") || "Retry initiated");
      refetch();
    },
    onError: () => {
      toast.error(t("actions.retryError") || "Failed to retry");
    },
  });

  // 删除单个视频
  const deleteVideo = useCallback(
    async (uuid: string) => {
      await deleteMutation.mutateAsync(uuid);
    },
    [deleteMutation],
  );

  // 重试单个视频
  const retryVideo = useCallback(
    async (uuid: string) => {
      await retryMutation.mutateAsync(uuid);
    },
    [retryMutation],
  );

  return {
    videos,
    isLoading,
    isFetching,
    error,
    hasMore,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    deleteVideo,
    retryVideo,
    isDeleting: deleteMutation.isPending,
  };
}

/**
 * Get single video
 */
export function useVideo(uuid: string) {
  return useQuery({
    queryKey: ["video", uuid],
    queryFn: () => apiClient.getVideo(uuid),
    enabled: !!uuid,
    select: (data) => data.video,
  });
}

/**
 * Download video
 */
export function useDownloadVideo() {
  const t = useTranslations("dashboard.myCreations");

  const download = useCallback(
    async (videoUrl: string, filename: string) => {
      try {
        const response = await fetch(videoUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(t("actions.downloadSuccess") || "Download started");
      } catch (error) {
        toast.error(t("actions.downloadError") || "Failed to download video");
      }
    },
    [t],
  );

  return { download };
}

/**
 * Auto-refresh processing videos
 */
export function useRefreshProcessingVideos(
  videos: Array<{ uuid?: string; status?: string; createdAt?: string | Date }>,
  refetch: () => void,
  interval = 15000,
) {
  const isCheckingRef = useRef(false);
  const providerTimeoutCountsRef = useRef<Map<string, number>>(new Map());

  const processingVideoIds = videos
    .filter((v) => {
      const status = (v.status || "").toLowerCase();
      const createdAt = v.createdAt ? new Date(v.createdAt).getTime() : 0;
      const isFresh =
        Number.isFinite(createdAt) &&
        Date.now() - createdAt < PROCESSING_REFRESH_MAX_AGE_MS;
      const providerTimeoutCount =
        providerTimeoutCountsRef.current.get(v.uuid || "") ?? 0;
      return (
        v.uuid &&
        isFresh &&
        providerTimeoutCount < 3 &&
        (status === "generating" ||
          status === "uploading" ||
          status === "pending")
      );
    })
    .map((v) => v.uuid as string);

  useEffect(() => {
    if (processingVideoIds.length === 0) return;

    const checkProcessingVideos = async () => {
      if (document.visibilityState !== "visible") return;
      if (isCheckingRef.current) return;

      isCheckingRef.current = true;

      try {
        const idsToCheck = processingVideoIds.slice(0, 3);
        const headers: Record<string, string> = {};
        const falKey = falKeyStorage.get();
        if (falKey) {
          headers["x-fal-key"] = falKey;
        }
        const results = await Promise.allSettled(
          idsToCheck.map(async (uuid) => {
            const response = await fetch(`/api/v1/video/${uuid}/status`, {
              headers,
            });
            if (!response.ok) {
              const errorResult = await response.json().catch(() => null);
              const code = errorResult?.error?.details?.code;
              if (code === "FAL_KEY_MISSING" || code === "FAL_KEY_INVALID") {
                window.dispatchEvent(
                  new CustomEvent("fal-key-invalid", {
                    detail: { videoId: uuid },
                  }),
                );
              }
              return null;
            }
            const result = await response.json();
            return {
              uuid,
              status: result?.data?.status as string | undefined,
              error: result?.data?.error as string | undefined,
            };
          }),
        );

        for (const result of results) {
          if (result.status !== "fulfilled" || !result.value?.uuid) continue;
          const { uuid, error } = result.value;
          if (error === "PROVIDER_STATUS_TIMEOUT") {
            providerTimeoutCountsRef.current.set(
              uuid,
              (providerTimeoutCountsRef.current.get(uuid) ?? 0) + 1,
            );
          } else {
            providerTimeoutCountsRef.current.delete(uuid);
          }
        }

        const hasTerminalUpdate = results.some((result) => {
          if (result.status !== "fulfilled") return false;
          const status = (result.value?.status || "").toLowerCase();
          return status === "completed" || status === "failed";
        });

        if (hasTerminalUpdate) {
          refetch();
        }
      } finally {
        isCheckingRef.current = false;
      }
    };

    const timer = setInterval(checkProcessingVideos, interval);

    return () => clearInterval(timer);
  }, [processingVideoIds.join(","), interval, refetch]);
}
