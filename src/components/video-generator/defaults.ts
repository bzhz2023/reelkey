/**
 * Default Configuration for VideoGeneratorInput
 *
 * These defaults are provided as a convenience for quick setup.
 * You can override any of these by passing your own data to the component.
 *
 * @example
 * ```tsx
 * // Use all defaults
 * <VideoGeneratorInput />
 *
 * // Override only video models
 * <VideoGeneratorInput
 *   config={{
 *     videoModels: myCustomModels,
 *     // Other configs will use defaults
 *   }}
 * />
 *
 * // Completely custom configuration
 * <VideoGeneratorInput
 *   config={myCompleteConfig}
 * />
 * ```
 */

import type {
  VideoModel,
  ImageModel,
  GeneratorMode,
  ImageStyle,
  PromptTemplate,
  GeneratorConfig,
  GeneratorDefaults,
  GeneratorTexts,
  OutputNumberOption,
} from "./types";
import {
  getDefaultImageConstraints,
  getVideoModelRegistryItems,
  isVideoModelModeSupported,
} from "@/config/video-model-registry";

// ============================================================================
// Video Models
// ============================================================================

export const DEFAULT_VIDEO_MODELS: VideoModel[] = [
  ...getVideoModelRegistryItems().map((model) => ({
    id: model.id,
    name: model.displayName,
    icon: model.icon,
    color: model.color,
    description: model.description,
    maxDuration: `${model.capabilities.durations?.at(-1) ?? "5s"}`.replace("s", " sec"),
    creditCost: model.accessTier === "free" ? 25 : 35,
    durations: model.capabilities.durations,
    aspectRatios: model.capabilities.aspectRatios,
    resolutions: model.capabilities.resolutions,
    maxImages: model.capabilities.maxImages,
    minImages: model.capabilities.minImages,
    imageConstraints: getDefaultImageConstraints(),
    supportsAudio: model.capabilities.supportsAudio,
    isPro: model.accessTier === "paid",
    metadata: {
      accessTier: model.accessTier,
      parameterSchema: model.parameterSchema,
      pricingEstimate: model.pricingEstimate,
    },
  })),
];

// ============================================================================
// Image Models (placeholder for future use)
// ============================================================================

export const DEFAULT_IMAGE_MODELS: ImageModel[] = [];

// ============================================================================
// Generation Modes
// ============================================================================

export const DEFAULT_VIDEO_MODES: GeneratorMode[] = [
  {
    id: "text-image-to-video",
    name: "Text/Image to Video",
    icon: "text",
    uploadType: "single",
    description: "Generate video from text prompt with optional reference image",
    // Supports T2V and I2V (upload image for I2V mode)
    // fal.ai BYOK models first, followed by legacy provider models.
    supportedModels: [
      ...getVideoModelRegistryItems()
        .filter((model) => isVideoModelModeSupported(model.id, "text-to-video") || isVideoModelModeSupported(model.id, "image-to-video"))
        .map((model) => model.id),
    ],
  },
  {
    id: "frames-to-video",
    name: "Frames to Video",
    icon: "frames",
    uploadType: "start-end",
    description: "Generate video from start and end frame images",
    supportedModels: getVideoModelRegistryItems()
      .filter((model) => isVideoModelModeSupported(model.id, "frames-to-video"))
      .map((model) => model.id),
    aspectRatios: ["16:9", "9:16"],
  },
  {
    id: "reference-to-video",
    name: "Reference to Video",
    icon: "reference",
    uploadType: "characters",
    description: "Generate video using character reference images or videos",
    supportedModels: getVideoModelRegistryItems()
      .filter((model) => isVideoModelModeSupported(model.id, "reference-to-video"))
      .map((model) => model.id),
    // REFERENCE mode only supports 16:9 (Veo), Wan has more options but switches dynamically
    aspectRatios: ["16:9"],
    // REFERENCE mode fixed 8s (Veo)
    durations: ["8s"],
  },
];

export const DEFAULT_IMAGE_MODES: GeneratorMode[] = [];

// ============================================================================
// Image Styles
// ============================================================================

export const DEFAULT_IMAGE_STYLES: ImageStyle[] = [
  { id: "auto", name: "Auto" },
  { id: "ghibli", name: "Ghibli" },
  { id: "ultra-realism", name: "Ultra Realism" },
  { id: "pixel-art", name: "Pixel Art" },
  { id: "japanese-anime", name: "Japanese Anime" },
  { id: "3d-render", name: "3D Render" },
  { id: "steampunk", name: "Steampunk" },
  { id: "watercolor", name: "Watercolor" },
  { id: "cyberpunk", name: "Cyberpunk" },
  { id: "oil-painting", name: "Oil Painting" },
  { id: "comic-book", name: "Comic Book" },
  { id: "minimalist", name: "Minimalist" },
];

// ============================================================================
// Aspect Ratios
// ============================================================================

// Based on API docs, video models mainly support 16:9 and 9:16
export const DEFAULT_VIDEO_ASPECT_RATIOS = ["16:9", "9:16"];
export const DEFAULT_IMAGE_ASPECT_RATIOS = ["1:1", "16:9", "3:2", "2:3", "3:4", "4:3", "9:16"];

// ============================================================================
// Video Options
// ============================================================================

// Different models support different durations - common options listed here
// sora-2: 10s, 15s
// wan2.6: 5s, 10s
// veo-3.1: 8s
// seedance-1.5-pro: 4s-12s
export const DEFAULT_DURATIONS = ["4s", "5s", "6s", "8s", "10s", "12s", "15s"];
export const DEFAULT_RESOLUTIONS: string[] = [];

// ============================================================================
// Output Numbers (with Pro support)
// ============================================================================

export const DEFAULT_VIDEO_OUTPUT_NUMBERS: OutputNumberOption[] = [
  { value: 1 },
  { value: 2, isPro: true },
  { value: 3, isPro: true },
  { value: 4, isPro: true },
];

export const DEFAULT_IMAGE_OUTPUT_NUMBERS: OutputNumberOption[] = [
  { value: 1 },
  { value: 2, isPro: true },
  { value: 4, isPro: true },
  { value: 8, isPro: true },
];

// ============================================================================
// Prompt Templates
// ============================================================================

export const DEFAULT_PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: "1",
    text: "Cozy Christmas Room",
    image: "https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=100",
  },
  { id: "2", text: "workaholic" },
  {
    id: "3",
    text: "Quiet Resolve",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100",
  },
  { id: "4", text: "Cinematic Drama" },
  { id: "5", text: "Nature Documentary" },
  {
    id: "6",
    text: "Urban Street Photography",
    image: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100",
  },
  { id: "7", text: "Ethereal Fantasy World" },
  {
    id: "8",
    text: "Retro 80s Aesthetic",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=100",
  },
  { id: "9", text: "Minimalist Product Shot" },
  {
    id: "10",
    text: "Epic Landscape View",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=100",
  },
];

// ============================================================================
// Combined Default Config
// ============================================================================

/**
 * Complete default configuration
 * Use this as a starting point or reference
 */
export const DEFAULT_CONFIG: GeneratorConfig = {
  videoModels: DEFAULT_VIDEO_MODELS,
  imageModels: DEFAULT_IMAGE_MODELS,
  videoModes: DEFAULT_VIDEO_MODES,
  imageModes: DEFAULT_IMAGE_MODES,
  imageStyles: DEFAULT_IMAGE_STYLES,
  promptTemplates: DEFAULT_PROMPT_TEMPLATES,
  aspectRatios: {
    video: DEFAULT_VIDEO_ASPECT_RATIOS,
    image: DEFAULT_IMAGE_ASPECT_RATIOS,
  },
  durations: DEFAULT_DURATIONS,
  resolutions: DEFAULT_RESOLUTIONS,
  outputNumbers: {
    video: DEFAULT_VIDEO_OUTPUT_NUMBERS,
    image: DEFAULT_IMAGE_OUTPUT_NUMBERS,
  },
};

/**
 * Default initial values
 */
export const DEFAULT_DEFAULTS: GeneratorDefaults = {
  generationType: "video",
  videoModel: "kling-2.5-turbo",
  imageModel: "flux-pro",
  videoMode: "text-image-to-video",
  imageMode: "text-to-image",
  videoAspectRatio: "16:9",
  imageAspectRatio: "1:1",
  duration: "5s",
  resolution: "720P",    // default for models with resolution support
  videoOutputNumber: 1,
  imageOutputNumber: 1,
  imageStyle: "auto",
};

/**
 * Default video quality options
 */
export const DEFAULT_QUALITIES = ["standard", "high"];

/**
 * Default English texts
 */
export const DEFAULT_TEXTS_EN: GeneratorTexts = {
  videoPlaceholder: "Enter your idea to generate video",
  imagePlaceholder: "Enter your idea to generate image",
  aiVideo: "AI Video",
  aiImage: "AI Image",
  credits: "Credits",
  videoModels: "Video Models",
  imageModels: "Image Models",
  selectStyle: "Select Style",
  aspectRatio: "Aspect Ratio",
  videoLength: "Video Length",
  resolution: "Resolution",
  outputNumber: "Output Number",
  numberOfImages: "Number of Images",
  promptTooLong: "Prompt too long. Please shorten it.",
  start: "Start",
  end: "End",
  optional: "(Opt)",
};

/**
 * Default Chinese texts
 */
export const DEFAULT_TEXTS_ZH: GeneratorTexts = {
  videoPlaceholder: "输入你的想法来生成视频",
  imagePlaceholder: "输入你的想法来生成图片",
  aiVideo: "AI 视频",
  aiImage: "AI 图片",
  credits: "积分",
  videoModels: "视频模型",
  imageModels: "图片模型",
  selectStyle: "选择风格",
  aspectRatio: "宽高比",
  videoLength: "视频时长",
  resolution: "分辨率",
  outputNumber: "输出数量",
  numberOfImages: "图片数量",
  promptTooLong: "提示词过长，请缩短",
  start: "起始",
  end: "结束",
  optional: "(可选)",
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Merge user config with defaults
 * User config takes priority
 */
export function mergeConfig(userConfig?: GeneratorConfig): GeneratorConfig {
  if (!userConfig) return DEFAULT_CONFIG;

  return {
    videoModels: userConfig.videoModels ?? DEFAULT_CONFIG.videoModels,
    imageModels: userConfig.imageModels ?? DEFAULT_CONFIG.imageModels,
    videoModes: userConfig.videoModes ?? DEFAULT_CONFIG.videoModes,
    imageModes: userConfig.imageModes ?? DEFAULT_CONFIG.imageModes,
    imageStyles: userConfig.imageStyles ?? DEFAULT_CONFIG.imageStyles,
    promptTemplates: userConfig.promptTemplates ?? DEFAULT_CONFIG.promptTemplates,
    aspectRatios: {
      video: userConfig.aspectRatios?.video ?? DEFAULT_CONFIG.aspectRatios?.video,
      image: userConfig.aspectRatios?.image ?? DEFAULT_CONFIG.aspectRatios?.image,
    },
    durations: userConfig.durations ?? DEFAULT_CONFIG.durations,
    resolutions: userConfig.resolutions ?? DEFAULT_CONFIG.resolutions,
    outputNumbers: {
      video: userConfig.outputNumbers?.video ?? DEFAULT_CONFIG.outputNumbers?.video,
      image: userConfig.outputNumbers?.image ?? DEFAULT_CONFIG.outputNumbers?.image,
    },
  };
}

/**
 * Merge user defaults with system defaults
 */
export function mergeDefaults(userDefaults?: GeneratorDefaults): GeneratorDefaults {
  if (!userDefaults) return DEFAULT_DEFAULTS;

  return {
    ...DEFAULT_DEFAULTS,
    ...userDefaults,
  };
}

/**
 * Get texts for a locale
 */
export function getTexts(locale?: string, customTexts?: GeneratorTexts): GeneratorTexts {
  const baseTexts = locale === "zh" ? DEFAULT_TEXTS_ZH : DEFAULT_TEXTS_EN;

  if (!customTexts) return baseTexts;

  return {
    ...baseTexts,
    ...customTexts,
  };
}
