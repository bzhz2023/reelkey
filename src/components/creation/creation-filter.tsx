"use client";

// ============================================
// Creation Filter Component
// ============================================

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BYOK_MODE } from "@/config/byok-mode";
import { getAvailableModels } from "@/config/credits";
import type { VideoFilterOptions, VideoStatus } from "@/lib/types/dashboard";

interface CreationFilterProps {
  filter: VideoFilterOptions;
  onFilterChange: (filter: Partial<VideoFilterOptions>) => void;
  disabled?: boolean;
}

const availableModels = getAvailableModels({
  provider: BYOK_MODE ? "falai" : undefined,
}).map((model) => ({ value: model.id, label: model.name }));

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "completed", label: "Completed" },
  { value: "generating", label: "Generating" },
  { value: "failed", label: "Failed" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
];

export function CreationFilter({
  filter,
  onFilterChange,
  disabled = false,
}: CreationFilterProps) {
  const t = useTranslations("dashboard.myCreations.filter");

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Filter */}
      <Select
        value={filter.status || "all"}
        onValueChange={(value) =>
          onFilterChange({ status: value as VideoStatus | "all" })
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("allStatus")} />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.value as any)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Model Filter */}
      <Select
        value={filter.model || "all"}
        onValueChange={(value) =>
          onFilterChange({ model: value as string | "all" })
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder={t("allModels")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allModels")}</SelectItem>
          {availableModels.map((model) => (
            <SelectItem key={model.value} value={model.value}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Order */}
      <Select
        value={filter.sortBy || "newest"}
        onValueChange={(value) =>
          onFilterChange({ sortBy: value as "newest" | "oldest" })
        }
        disabled={disabled}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder={t("newest")} />
        </SelectTrigger>
        <SelectContent>
          {sortOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {t(option.value as any)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
