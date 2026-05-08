/**
 * Video History Panel
 *
 * 视频历史记录面板组件
 * - 显示最近 10 条视频记录
 * - 按时间排序：最新的在最上面
 * - 空状态：显示示例视频占位
 * - 替代现有的 ResultPanel
 */

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { VideoHistoryCard } from "./video-history-card";
import { DemoVideos } from "./demo-videos";
import type { VideoHistoryItem } from "@/lib/video-history-storage";

interface VideoHistoryPanelProps {
  historyItems: VideoHistoryItem[];
  generatingIds?: string[];
  onDelete?: (uuid: string) => void;
  className?: string;
}

export function VideoHistoryPanel({
  historyItems,
  generatingIds = [],
  onDelete,
  className,
}: VideoHistoryPanelProps) {
  const t = useTranslations("VideoHistory");
  const router = useRouter();
  // 只显示最近10个视频，最新生成的排在最上面
  const recentItems = [...historyItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const hasItems = historyItems.length > 0;

  return (
    <div
      className={cn(
        "h-full w-full rounded-2xl border border-sky-100 bg-white/80 shadow-sm backdrop-blur-md overflow-hidden flex flex-col",
        className
      )}
    >
      {/* 头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-sky-100 bg-sky-50/60 shrink-0">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Sparkles className="h-4 w-4 text-purple-500" />
          {hasItems ? t("title") : t("demoTitle")}
        </div>
        {hasItems && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("my-creations")}
            className="h-7 text-xs text-slate-500 hover:text-slate-900 hover:bg-sky-100"
          >
            More Creations
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-y-auto p-6">
        {!hasItems ? (
          // 空状态：显示示例视频
          <div className="h-full flex flex-col justify-center">
            <DemoVideos />
          </div>
        ) : (
          // 有历史记录：显示列表（最近10个）
          <div className="space-y-4">
            {recentItems.map((video) => {
              const isGenerating = generatingIds.includes(video.uuid);
              return (
                <VideoHistoryCard
                  key={video.uuid}
                  video={video}
                  isGenerating={isGenerating}
                  onDelete={() => onDelete?.(video.uuid)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
