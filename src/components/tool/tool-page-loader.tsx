"use client";

import dynamic from "next/dynamic";
import type { ToolPageConfig } from "@/config/tool-pages";

interface ToolPageLoaderProps {
  config: ToolPageConfig;
  toolRoute: string;
  locale: string;
}

const ToolPageLayout = dynamic(
  () => import("@/components/tool/tool-page-layout").then((mod) => mod.ToolPageLayout),
  {
    loading: () => (
      <div className="flex flex-1 flex-col h-full overflow-hidden p-4 lg:p-4 gap-6 bg-background">
        <div className="grid min-h-0 h-fit max-h-[calc(100svh-120px)] grid-cols-1 lg:grid-cols-[380px_minmax(0,1.2fr)] gap-5">
          <div className="h-full min-h-[520px] rounded-2xl bg-card/70 p-3">
            <div className="h-full rounded-xl bg-muted/30 animate-pulse" />
          </div>
          <div className="hidden lg:block h-full min-h-[520px] rounded-2xl border border-zinc-800 bg-zinc-900/70" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

export function ToolPageLoader(props: ToolPageLoaderProps) {
  return <ToolPageLayout {...props} />;
}
