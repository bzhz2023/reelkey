"use client";

/**
 * Generator Panel Component - Pollo.ai Style
 *
 * Tool page generator panel with dark theme design
 * Design inspired by https://pollo.ai
 * - Dark theme (#1A1A1A background)
 * - Uppercase labels for sections
 * - Purple accent color (#6D28D9)
 * - Dashed border upload area
 */

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/components/ui";
import { DEFAULT_VIDEO_MODELS } from "@/components/video-generator/defaults";
import { isVideoModelModeSupported } from "@/config/video-model-registry";
import {
  CREDITS_CONFIG,
  getAvailableModels,
  calculateModelCredits,
} from "@/config/credits";
import {
  ChevronDown,
  X,
  Sparkles,
  Image as ImageIcon,
  Clock,
  Check,
  Volume2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";

// ============================================================================
// Types
// ============================================================================

interface SectionLabelProps {
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

const PANEL_TEXT = {
  en: {
    title: {
      "image-to-video": "IMAGE TO VIDEO",
      "text-to-video": "TEXT TO VIDEO",
      "frames-to-video": "FIRST/LAST FRAME TO VIDEO",
      "reference-to-video": "REFERENCE TO VIDEO",
      fallback: "AI GENERATOR",
    },
    noModels:
      "No models are currently available for this tool under the active AI provider configuration.",
    model: "MODEL",
    videoModels: "Video Models",
    prompt: "PROMPT",
    promptPlaceholder:
      "Describe the video you want to create, e.g., A cat playing in a sunny garden with natural lighting and fresh atmosphere...",
    referenceImage: "REFERENCE IMAGE",
    imageSource: "IMAGE SOURCE",
    images: "IMAGES",
    addImage: "Add image",
    imageCount: "Images",
    multiImageHint: "Upload a start and end image for models that support two-image motion.",
    firstFrame: "FIRST FRAME",
    lastFrame: "LAST FRAME",
    uploadImage: "Upload image",
    uploadHint: "JPG, PNG, WEBP • Max 10MB",
    aspectRatio: "ASPECT RATIO",
    videoLength: "VIDEO LENGTH",
    resolution: "RESOLUTION",
    providerBilling: "Estimated cost:",
    totalCredits: "Total Credits:",
    falAccount: "fal.ai estimated",
    billedByFal: "Billed by fal.ai",
    generateAudio: "Generate Audio",
    generateAudioDesc: "Add natural-sounding audio",
    upToDuration: "Up to",
    credits: "credits",
    generating: "Generating...",
    generateVideo: "Generate Video",
  },
  zh: {
    title: {
      "image-to-video": "图片生成视频",
      "text-to-video": "文字生成视频",
      "frames-to-video": "首尾帧生成视频",
      "reference-to-video": "参考视频",
      fallback: "AI 生成器",
    },
    noModels: "当前 AI 服务配置下暂无可用于此工具的模型。",
    model: "模型",
    videoModels: "视频模型",
    prompt: "提示词",
    promptPlaceholder:
      "描述你想生成的视频，例如：一只猫在阳光明媚的花园里玩耍，自然光照，氛围清新...",
    referenceImage: "参考图片",
    imageSource: "图片来源",
    images: "图片",
    addImage: "添加图片",
    imageCount: "图片",
    multiImageHint: "支持双图的模型可上传起始图和结束图。",
    firstFrame: "起始帧",
    lastFrame: "结束帧",
    uploadImage: "上传图片",
    uploadHint: "JPG、PNG、WEBP • 最大 10MB",
    aspectRatio: "画面比例",
    videoLength: "视频时长",
    resolution: "分辨率",
    providerBilling: "预估费用：",
    totalCredits: "总积分：",
    falAccount: "fal.ai 预估",
    billedByFal: "由 fal.ai 计费",
    generateAudio: "生成音频",
    generateAudioDesc: "添加自然音效",
    upToDuration: "最长",
    credits: "积分",
    generating: "生成中...",
    generateVideo: "生成视频",
  },
} as const;

function SectionLabel({ children, required, className }: SectionLabelProps) {
  return (
    <div
      className={cn(
        "text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2 block",
        className,
      )}
    >
      {children}
      {required && <span className="text-destructive ml-1">*</span>}
    </div>
  );
}

function getAspectRatioLabel(ratio: string, locale?: string) {
  if (ratio === "auto") return locale === "zh" ? "自动" : "Auto";
  if (ratio === "21:9") return locale === "zh" ? "21:9 宽屏" : "21:9 Wide";
  return ratio;
}

function AspectRatioIcon({
  ratio,
  selected,
}: {
  ratio: string;
  selected: boolean;
}) {
  if (ratio === "auto") {
    return (
      <Sparkles
        className={cn(
          "h-5 w-5",
          selected ? "text-primary" : "text-muted-foreground/60",
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "border-2 rounded-sm",
        selected ? "border-primary" : "border-muted-foreground/50",
        ratio === "21:9" && "w-9 h-3",
        ratio === "16:9" && "w-8 h-4",
        ratio === "9:16" && "w-4 h-8",
        ratio === "1:1" && "w-6 h-6",
        ratio === "4:3" && "w-6 h-4",
        ratio === "3:4" && "w-4 h-6",
      )}
    />
  );
}

type ToolGenerationType =
  | "image-to-video"
  | "text-to-video"
  | "frames-to-video"
  | "reference-to-video";

interface GeneratorPanelProps {
  toolType: ToolGenerationType;
  isLoading?: boolean;
  onSubmit?: (data: GeneratorData) => void;
  availableModelIds?: string[];
  defaultModelId?: string;
  initialPrompt?: string;
  initialModelId?: string;
  initialDuration?: number;
  initialAspectRatio?: string;
  initialQuality?: string;
  initialImageUrl?: string;
  isPro?: boolean;
  onProFeatureClick?: (feature: string) => void;
}

interface UploadedInputImage {
  id: string;
  file?: File;
  url?: string;
  previewUrl: string;
  name: string;
}

export interface GeneratorData {
  toolType: string;
  mode?: string;
  model: string;
  prompt: string;
  duration: number;
  aspectRatio: string;
  quality?: string;
  outputNumber?: number;
  generateAudio?: boolean;
  imageFile?: File;
  imageFiles?: File[];
  imageUrl?: string;
  imageUrls?: string[];
  estimatedCredits: number;
}

export function GeneratorPanel({
  toolType,
  isLoading = false,
  onSubmit,
  availableModelIds,
  defaultModelId,
  initialPrompt,
  initialModelId,
  initialDuration,
  initialAspectRatio,
  initialQuality,
  initialImageUrl,
  isPro = false,
  onProFeatureClick,
}: GeneratorPanelProps) {
  const locale = useLocale();
  const text = locale === "zh" ? PANEL_TEXT.zh : PANEL_TEXT.en;
  const models = getAvailableModels();
  const [prompt, setPrompt] = useState(initialPrompt || "");
  const [selectedModel, setSelectedModel] = useState(
    initialModelId || defaultModelId || models[0]?.id || "",
  );
  const [duration, setDuration] = useState(initialDuration || 10);
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio || "16:9");
  const [quality, setQuality] = useState(initialQuality || "standard");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(
    initialImageUrl || null,
  );
  const [imageInputs, setImageInputs] = useState<UploadedInputImage[]>(
    initialImageUrl
      ? [
          {
            id: "initial-image",
            url: initialImageUrl,
            previewUrl: initialImageUrl,
            name: "Initial image",
          },
        ]
      : [],
  );
  const [endImageFile, setEndImageFile] = useState<File | null>(null);
  const [endImageUrl, setEndImageUrl] = useState<string | null>(null);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(true);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  // Filter models based on tool type
  const availableModels = useMemo(() => {
    const allowList =
      Array.isArray(availableModelIds) && availableModelIds.length > 0;
    let filtered = allowList
      ? models.filter((m) => availableModelIds!.includes(m.id))
      : models;
    if (toolType !== "text-to-video") {
      filtered = filtered.filter((m) => m.supportImageToVideo);
    }
    return filtered;
  }, [toolType, models, availableModelIds]);

  const currentModel = useMemo(
    () =>
      availableModels.find(
        (m) =>
          m.id === selectedModel &&
          (isPro || m.accessTier !== "paid"),
      ) ||
      availableModels.find((m) => isPro || m.accessTier !== "paid") ||
      availableModels[0],
    [selectedModel, availableModels, isPro],
  );
  const hasAvailableModels = availableModels.length > 0;

  useEffect(() => {
    if (!currentModel) return;
    if (selectedModel !== currentModel.id) {
      setSelectedModel(currentModel.id);
    }
  }, [currentModel, selectedModel]);

  const modelMetadata = useMemo(() => {
    return new Map(DEFAULT_VIDEO_MODELS.map((model) => [model.id, model]));
  }, []);

  const getModelIcon = (modelId: string, fallbackName: string) => {
    const meta = modelMetadata.get(modelId);
    return meta?.icon ?? fallbackName.charAt(0).toUpperCase();
  };

  const getModelColor = (modelId: string) => {
    const meta = modelMetadata.get(modelId);
    return meta?.color ?? "#71717a";
  };

  const renderModelIcon = (
    modelId: string,
    name: string,
    size: "sm" | "md" = "sm",
  ) => {
    const icon = getModelIcon(modelId, name);
    const color = getModelColor(modelId);
    const sizeClass = size === "sm" ? "w-4 h-4 text-xs" : "w-6 h-6 text-xs";

    if (
      typeof icon === "string" &&
      (icon.startsWith("http://") ||
        icon.startsWith("https://") ||
        icon.startsWith("/"))
    ) {
      return (
        <img
          src={icon}
          alt={name}
          className={cn(sizeClass, "rounded object-cover")}
        />
      );
    }

    return (
      <span
        className={cn(
          sizeClass,
          "rounded flex items-center justify-center font-bold",
        )}
        style={{ backgroundColor: color, color: "#fff" }}
      >
        {typeof icon === "string" ? icon : name.charAt(0).toUpperCase()}
      </span>
    );
  };

  useEffect(() => {
    if (!currentModel) return;

    if (currentModel.durations && !currentModel.durations.includes(duration)) {
      setDuration(currentModel.durations[0] || duration);
    }

    if (
      currentModel.aspectRatios &&
      !currentModel.aspectRatios.includes(aspectRatio)
    ) {
      setAspectRatio(currentModel.aspectRatios[0] || aspectRatio);
    }

    if (currentModel.qualities) {
      if (!currentModel.qualities.includes(quality)) {
        setQuality(currentModel.qualities[0] || quality);
      }
    }
  }, [currentModel, duration, aspectRatio, quality]);

  useEffect(() => {
    if (!availableModels.length) return;
    if (selectedModel && availableModels.some((m) => m.id === selectedModel)) {
      return;
    }
    const fallback =
      defaultModelId && availableModels.some((m) => m.id === defaultModelId)
        ? defaultModelId
        : availableModels[0]?.id;
    if (fallback) {
      setSelectedModel(fallback);
    }
  }, [availableModels, selectedModel, defaultModelId]);

  useEffect(() => {
    if (initialPrompt && !prompt) {
      setPrompt(initialPrompt);
    }
    if (initialImageUrl && !imageFile && !imageUrl) {
      setImageUrl(initialImageUrl);
    }
  }, [initialPrompt, initialImageUrl, prompt, imageFile, imageUrl]);

  useEffect(() => {
    if (!currentModel) return;
    if (initialDuration && currentModel.durations?.includes(initialDuration)) {
      setDuration(initialDuration);
    }
    if (
      initialAspectRatio &&
      currentModel.aspectRatios?.includes(initialAspectRatio)
    ) {
      setAspectRatio(initialAspectRatio);
    }
    if (initialQuality && currentModel.qualities?.includes(initialQuality)) {
      setQuality(initialQuality);
    }
  }, [currentModel, initialDuration, initialAspectRatio, initialQuality]);

  const estimatedCredits = useMemo(() => {
    if (!selectedModel) return 0;
    return calculateModelCredits(selectedModel, {
      duration,
      quality: currentModel?.qualities?.includes(quality) ? quality : undefined,
    });
  }, [selectedModel, duration, quality, currentModel]);
  const isByokMode = CREDITS_CONFIG.BYOK_MODE;
  const hasDurationOptions = Boolean(currentModel?.durations?.length);
  const hasQualityOptions = Boolean(currentModel?.qualities?.length);
  const modelSupportsAudio = currentModel?.supportsAudio === true;
  const imageInputLimit = useMemo(() => {
    if (!currentModel || toolType !== "image-to-video") return 1;
    return isVideoModelModeSupported(currentModel.id, "frames-to-video")
      ? 2
      : 1;
  }, [currentModel, toolType]);
  const supportsMultipleImages = imageInputLimit > 1;
  const estimatedCostLabel = useMemo(() => {
    if (!isByokMode) return `${estimatedCredits} ${text.credits}`;

    const amountInDollars = estimatedCredits / 100;
    return `$${amountInDollars.toFixed(2)}`;
  }, [estimatedCredits, isByokMode, text.credits]);

  const handleSubmit = useCallback(() => {
    if (!currentModel) return;
    if (currentModel.accessTier === "paid" && !isPro) {
      onProFeatureClick?.(`model_${currentModel.id}`);
      return;
    }
    const hasPrompt = prompt.trim().length > 0;
    const requiresImage = toolType !== "text-to-video";
    const hasImage =
      toolType === "image-to-video"
        ? imageInputs.length > 0
        : Boolean(imageFile || imageUrl);
    const hasEndFrame = Boolean(endImageFile || endImageUrl);
    if (!hasPrompt || isLoading) return;
    if (requiresImage && !hasImage) return;
    if (toolType === "frames-to-video" && !hasEndFrame) return;

    const galleryImages =
      toolType === "image-to-video"
        ? imageInputs.slice(0, imageInputLimit)
        : [];
    const imageFiles =
      toolType === "image-to-video"
        ? galleryImages
            .map((image) => image.file)
            .filter((file): file is File => Boolean(file))
        : [imageFile, endImageFile].filter((file): file is File =>
            Boolean(file),
          );
    const imageUrls =
      toolType === "image-to-video"
        ? galleryImages
            .map((image) => image.url)
            .filter((url): url is string => Boolean(url))
        : [imageUrl, endImageUrl].filter((url): url is string => Boolean(url));
    const submittedMode =
      toolType === "image-to-video" &&
      galleryImages.length > 1 &&
      isVideoModelModeSupported(selectedModel, "frames-to-video")
        ? "frames-to-video"
        : toolType;

    const data: GeneratorData = {
      toolType,
      mode: submittedMode,
      model: selectedModel,
      prompt: prompt.trim(),
      duration,
      aspectRatio,
      quality: currentModel?.qualities?.includes(quality) ? quality : undefined,
      outputNumber: 1,
      generateAudio: modelSupportsAudio ? generateAudio : undefined,
      imageFile: imageFiles[0],
      imageUrl: imageUrls[0],
      imageFiles: imageFiles.length > 0 ? imageFiles : undefined,
      imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
      estimatedCredits,
    };

    onSubmit?.(data);
  }, [
    prompt,
    selectedModel,
    duration,
    aspectRatio,
    quality,
    imageFile,
    imageUrl,
    imageInputs,
    imageInputLimit,
    endImageFile,
    endImageUrl,
    estimatedCredits,
    generateAudio,
    modelSupportsAudio,
    isLoading,
    toolType,
    onSubmit,
    currentModel,
    isPro,
    onProFeatureClick,
  ]);

  const revokeObjectUrl = useCallback((previewUrl?: string) => {
    if (previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
      objectUrlsRef.current.delete(previewUrl);
    }
  }, []);

  useEffect(() => {
    return () => {
      objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      objectUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (toolType !== "image-to-video") return;
    setImageInputs((prev) => {
      if (prev.length <= imageInputLimit) return prev;
      prev.slice(imageInputLimit).forEach((image) =>
        revokeObjectUrl(image.previewUrl),
      );
      return prev.slice(0, imageInputLimit);
    });
  }, [imageInputLimit, revokeObjectUrl, toolType]);

  const handleImageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: "start" | "end" = "start",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (slot === "end") {
        setEndImageFile(file);
        setEndImageUrl(null);
        return;
      }

      setImageFile(file);
      setImageUrl(null);
    }
  };

  const handleRemoveImage = (slot: "start" | "end" = "start") => {
    if (slot === "end") {
      setEndImageFile(null);
      setEndImageUrl(null);
      return;
    }

    setImageFile(null);
    setImageUrl(null);
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files ?? []);
    if (selectedFiles.length > 0) {
      const nextImages = selectedFiles.map((file) => {
        const previewUrl = URL.createObjectURL(file);
        objectUrlsRef.current.add(previewUrl);
        return {
          id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
          file,
          previewUrl,
          name: file.name,
        };
      });

      setImageInputs((prev) => {
        const availableSlots = Math.max(0, imageInputLimit - prev.length);
        const accepted = nextImages.slice(0, availableSlots);
        nextImages.slice(availableSlots).forEach((image) =>
          revokeObjectUrl(image.previewUrl),
        );
        return [...prev, ...accepted];
      });
    }
    e.target.value = "";
  };

  const handleRemoveGalleryImage = (imageId: string) => {
    setImageInputs((prev) => {
      const image = prev.find((item) => item.id === imageId);
      revokeObjectUrl(image?.previewUrl);
      return prev.filter((item) => item.id !== imageId);
    });
  };

  const hasStartFrame =
    toolType === "image-to-video"
      ? imageInputs.length > 0
      : Boolean(imageFile || imageUrl);
  const hasEndFrame = Boolean(endImageFile || endImageUrl);
  const canSubmit =
    hasAvailableModels &&
    Boolean(currentModel) &&
    prompt.trim().length > 0 &&
    !(toolType !== "text-to-video" && !hasStartFrame) &&
    !(toolType === "frames-to-video" && !hasEndFrame) &&
    !isLoading;

  const renderImageGalleryUpload = () => {
    const canAddMore = imageInputs.length < imageInputLimit;
    return (
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <SectionLabel required className="mb-0">
            {supportsMultipleImages ? text.images : text.imageSource}
          </SectionLabel>
          <span className="text-xs text-muted-foreground">
            {text.imageCount} {imageInputs.length}/{imageInputLimit}
          </span>
        </div>
        {supportsMultipleImages && (
          <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
            {text.multiImageHint}
          </p>
        )}
        <div className="grid grid-cols-3 gap-3">
          {imageInputs.map((image, index) => (
            <div
              key={image.id}
              className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted/40"
              title={image.name}
            >
              <img
                src={image.previewUrl}
                alt={image.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
                {index + 1}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveGalleryImage(image.id)}
                className="absolute right-1.5 top-1.5 rounded-full bg-black/65 p-1 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
                aria-label={`Remove ${image.name}`}
                disabled={isLoading}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {canAddMore && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary">
              <ImageIcon className="h-6 w-6" />
              <span className="mt-2 text-xs font-medium">
                {imageInputs.length === 0 ? text.uploadImage : text.addImage}
              </span>
              <span className="mt-1 px-2 text-center text-[10px] leading-tight text-muted-foreground/70">
                {text.uploadHint}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple={supportsMultipleImages}
                onChange={handleGalleryImageChange}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          )}
        </div>
      </div>
    );
  };

  // Get page title
  const getPageTitle = () => {
    return text.title[toolType] ?? text.title.fallback;
  };

  const renderImageUpload = ({
    label,
    required,
    slot = "start",
  }: {
    label: string;
    required?: boolean;
    slot?: "start" | "end";
  }) => {
    const selectedFile = slot === "end" ? endImageFile : imageFile;
    const selectedUrl = slot === "end" ? endImageUrl : imageUrl;

    return (
      <div>
        <SectionLabel required={required}>{label}</SectionLabel>
        {selectedFile || selectedUrl ? (
          <div className="relative group h-32 rounded-lg overflow-hidden border-2 border-zinc-700">
            {selectedUrl ? (
              <img
                src={selectedUrl}
                alt={label}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center p-3">
                <span className="text-xs font-medium truncate bg-background/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-border">
                  {selectedFile?.name}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={() => handleRemoveImage(slot)}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-muted/80 hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5 text-foreground" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors group">
            <div className="w-12 h-12 rounded-full flex items-center justify-center bg-muted/60 group-hover:bg-muted transition-colors">
              <ImageIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mt-3">
              {text.uploadImage}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {text.uploadHint}
            </p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleImageChange(event, slot)}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Main Card - Pollo.ai Style */}
      <div className="flex-1 flex flex-col rounded-xl bg-card border border-border overflow-hidden text-foreground">
        {/* Header Bar */}
        <div className="px-5 py-3 bg-muted/40 border-b border-border shrink-0">
          <h2 className="text-sm text-muted-foreground font-medium uppercase tracking-wide">
            {getPageTitle()}
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
          {!hasAvailableModels && (
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              {text.noModels}
            </div>
          )}

          {hasAvailableModels && (
            <>
              {/* Model Selection */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  {text.model}
                </span>
                {currentModel && (
                  <DropdownMenu
                    open={isModelDropdownOpen}
                    onOpenChange={setIsModelDropdownOpen}
                  >
                    <DropdownMenuTrigger asChild disabled={isLoading}>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50 px-3 py-1.5 text-sm text-slate-800 shadow-sm transition-colors hover:bg-sky-100"
                      >
                        {renderModelIcon(
                          currentModel.id,
                          currentModel.name,
                          "sm",
                        )}
                        <span>{currentModel.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 max-h-[400px] overflow-y-scroll custom-scrollbar border-sky-100 bg-white/95 shadow-xl backdrop-blur-md">
                      <DropdownMenuLabel className="text-slate-500 text-xs">
                        {text.videoModels}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-100" />
                      {availableModels.map((model) => (
                        <DropdownMenuItem
                          key={model.id}
                          data-model-id={model.id}
                          onClick={() => {
                            if (model.accessTier === "paid" && !isPro) {
                              onProFeatureClick?.(`model_${model.id}`);
                              return;
                            }
                            setSelectedModel(model.id);
                          }}
                          className={cn(
                            "flex flex-col items-start rounded-md py-3 text-slate-800 transition-colors hover:bg-sky-50 focus:bg-sky-50",
                            model.accessTier === "paid" &&
                              !isPro &&
                              "opacity-70",
                          )}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {renderModelIcon(model.id, model.name, "md")}
                              <span className="font-medium">{model.name}</span>
                              {model.accessTier === "paid" && !isPro && (
                                <span className="text-[9px] px-1 py-0.5 rounded bg-amber-100 text-amber-700">
                                  PRO
                                </span>
                              )}
                            </div>
                            {selectedModel === model.id && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          {model.description && (
                            <div className="text-xs text-slate-500 mt-1 ml-8">
                              {model.description}
                            </div>
                          )}
                          <div className="text-xs text-slate-500 mt-1 ml-8 flex items-center gap-2">
                            {model.maxDuration && (
                              <>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {text.upToDuration} {model.maxDuration}s
                                </span>
                                <span>•</span>
                              </>
                            )}
                            <span>
                              {isByokMode
                                ? text.billedByFal
                                : `${model.creditCost?.base ?? ""} ${text.credits}`}
                            </span>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              {/* Prompt Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <SectionLabel className="mb-0">{text.prompt}</SectionLabel>
                </div>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={text.promptPlaceholder}
                  disabled={isLoading}
                  className="w-full min-h-[100px] max-h-[200px] px-4 py-3 rounded-lg bg-muted/40 border border-border text-foreground placeholder:text-muted-foreground/70 resize-none focus:outline-none focus:border-primary transition-colors text-sm leading-relaxed"
                  rows={4}
                  maxLength={2000}
                />
              </div>

              {toolType === "frames-to-video" &&
                currentModel?.supportImageToVideo && (
                  <div className="space-y-4">
                    {renderImageUpload({
                      label: text.firstFrame,
                      required: true,
                    })}
                    {renderImageUpload({
                      label: text.lastFrame,
                      required: true,
                      slot: "end",
                    })}
                  </div>
                )}

              {(toolType === "image-to-video" ||
                toolType === "reference-to-video") &&
                currentModel?.supportImageToVideo &&
                (toolType === "image-to-video"
                  ? renderImageGalleryUpload()
                  : renderImageUpload({
                      label: text.referenceImage,
                      required: false,
                    }))}

              {/* Settings Group */}
              <div className="space-y-5">
                {/* Aspect Ratio */}
                {currentModel?.aspectRatios && (
                  <div>
                    <SectionLabel>{text.aspectRatio}</SectionLabel>
                    <div className="grid grid-cols-3 gap-3">
                      {currentModel.aspectRatios.map((ar) => (
                        <button
                          key={ar}
                          type="button"
                          onClick={() => setAspectRatio(ar)}
                          title={getAspectRatioLabel(ar, locale)}
                          disabled={isLoading}
                          className={cn(
                            "aspect-square w-full rounded-lg text-xs font-medium transition-all border flex items-center justify-center",
                            aspectRatio === ar
                              ? "bg-primary/10 text-foreground border-primary"
                              : "bg-muted/40 text-muted-foreground border-border hover:border-muted-foreground/40",
                          )}
                        >
                          <div className="flex flex-col items-center gap-2">
                            <AspectRatioIcon
                              ratio={ar}
                              selected={aspectRatio === ar}
                            />
                            <span>{getAspectRatioLabel(ar, locale)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Duration & Quality */}
                {(hasDurationOptions || hasQualityOptions) && (
                  <div
                    className={cn(
                      "grid gap-4",
                      hasDurationOptions && hasQualityOptions
                        ? "grid-cols-2"
                        : "grid-cols-1",
                    )}
                  >
                    {hasDurationOptions && (
                      <div>
                        <SectionLabel>{text.videoLength}</SectionLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {currentModel.durations?.map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setDuration(d)}
                              disabled={isLoading}
                              className={cn(
                                "h-10 rounded-lg text-sm font-medium transition-all",
                                duration === d
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                              )}
                            >
                              {d}s
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {hasQualityOptions && (
                      <div>
                        <SectionLabel>{text.resolution}</SectionLabel>
                        <div className="grid grid-cols-3 gap-2">
                          {currentModel.qualities?.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setQuality(q)}
                              disabled={isLoading}
                              className={cn(
                                "h-10 rounded-lg text-sm font-medium transition-all capitalize",
                                quality === q
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted/40 text-muted-foreground hover:bg-muted/60",
                              )}
                            >
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {modelSupportsAudio && (
                  <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-foreground">
                          {text.generateAudio}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {text.generateAudioDesc}
                        </div>
                      </div>
                    </div>
                    <Switch
                      checked={generateAudio}
                      disabled={isLoading}
                      onCheckedChange={setGenerateAudio}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Bottom Section - Billing + Generate Button */}
        <div className="px-5 py-4 bg-muted/40 border-t border-border space-y-4 shrink-0">
          {/* Credit display is preserved for non-BYOK deployments. */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {isByokMode ? text.providerBilling : text.totalCredits}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span className="text-foreground font-medium">
                {estimatedCostLabel}
              </span>
            </div>
          </div>

          {/* Generate Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-all",
              canSubmit
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                {text.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {text.generateVideo}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
