"use client";

import type { User } from "@/lib/auth/client";
import type { ToolPageConfig } from "@/config/tool-pages";
import { ToolPageLayout } from "@/components/tool/tool-page-layout";

interface ToolPageLoaderProps {
  config: ToolPageConfig;
  toolRoute: string;
  locale: string;
  hasLifetimeAccess?: boolean;
  initialUser?: Pick<User, "id" | "name" | "image" | "email"> | null;
}

export function ToolPageLoader(props: ToolPageLoaderProps) {
  return <ToolPageLayout {...props} />;
}
