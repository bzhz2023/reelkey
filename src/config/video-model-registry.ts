export type VideoModelAccessTier = "free" | "paid";

export type VideoModelMode =
  | "text-to-video"
  | "image-to-video"
  | "reference-to-video"
  | "frames-to-video"
  | "first-last-frame"
  | "extend-video"
  | "video-to-video";

export type VideoModelParameterType =
  | "string"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "file"
  | "file-list";

export interface VideoModelParameterSchemaItem {
  key: string;
  type: VideoModelParameterType;
  required?: boolean;
  default?: string | number | boolean;
  options?: Array<string | number>;
  modes?: VideoModelMode[];
}

export interface VideoModelRegistryItem {
  id: string;
  displayName: string;
  provider: "falai";
  description: string;
  accessTier: VideoModelAccessTier;
  color: string;
  icon?: string;
  endpoints: Partial<Record<VideoModelMode, string>>;
  capabilities: {
    inputModes: VideoModelMode[];
    durations?: string[];
    aspectRatios?: string[];
    resolutions?: string[];
    maxImages?: number;
    minImages?: number;
    supportsAudio?: boolean;
    supportsNegativePrompt?: boolean;
    supportsSeed?: boolean;
  };
  parameterSchema: VideoModelParameterSchemaItem[];
  pricingEstimate: {
    unit: "per-second" | "per-generation" | "manual";
    note: string;
  };
}

const IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"];

export const VIDEO_MODEL_REGISTRY: Record<string, VideoModelRegistryItem> = {
  "kling-2.5-turbo": {
    id: "kling-2.5-turbo",
    displayName: "Kling 2.5 Turbo Pro",
    provider: "falai",
    description: "Fast, cinematic fal.ai model for text and image to video.",
    accessTier: "free",
    color: "#38bdf8",
    icon: "K",
    endpoints: {
      "text-to-video": "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
      "image-to-video": "fal-ai/kling-video/v2.5-turbo/standard/image-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video"],
      durations: ["5s", "10s"],
      aspectRatios: ["16:9", "9:16", "1:1"],
      resolutions: ["720P", "1080P"],
      maxImages: 1,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "duration", type: "select", default: "5s", options: ["5s", "10s"] },
      { key: "aspect_ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "1:1"] },
      { key: "image_url", type: "file", modes: ["image-to-video"] },
    ],
    pricingEstimate: {
      unit: "per-second",
      note: "$0.07/s estimate; 5s is about $0.35.",
    },
  },
  "wan-2.5": {
    id: "wan-2.5",
    displayName: "Wan 2.5",
    provider: "falai",
    description: "Cost-effective fal.ai model for simple text/image video generation.",
    accessTier: "free",
    color: "#84cc16",
    icon: "W",
    endpoints: {
      "text-to-video": "fal-ai/wan-25-preview/text-to-video",
      "image-to-video": "fal-ai/wan-25-preview/image-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video"],
      durations: ["5s"],
      aspectRatios: ["16:9", "9:16", "1:1"],
      resolutions: ["480P", "720P", "1080P"],
      maxImages: 1,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "duration", type: "select", default: "5s", options: ["5s"] },
      { key: "aspect_ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "1:1"] },
      { key: "image_url", type: "file", modes: ["image-to-video"] },
    ],
    pricingEstimate: {
      unit: "per-second",
      note: "$0.05/s estimate; 5s is about $0.25.",
    },
  },
  "seedance-2.0-fast": {
    id: "seedance-2.0-fast",
    displayName: "Seedance 2.0 Fast",
    provider: "falai",
    description: "Fast ByteDance model with text, image, reference video, and audio options.",
    accessTier: "paid",
    color: "#10b981",
    icon: "S",
    endpoints: {
      "text-to-video": "bytedance/seedance-2.0/fast/text-to-video",
      "image-to-video": "bytedance/seedance-2.0/fast/image-to-video",
      "reference-to-video": "bytedance/seedance-2.0/fast/reference-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video", "reference-to-video"],
      durations: ["auto", "4s", "5s", "6s", "8s", "10s", "12s", "15s"],
      aspectRatios: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"],
      resolutions: ["480P", "720P"],
      maxImages: 1,
      supportsAudio: true,
      supportsSeed: true,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "resolution", type: "select", default: "720p", options: ["480p", "720p"] },
      { key: "duration", type: "select", default: "auto", options: ["auto", 4, 5, 6, 8, 10, 12, 15] },
      { key: "aspect_ratio", type: "select", default: "auto", options: ["auto", "21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] },
      { key: "generate_audio", type: "boolean", default: true },
      { key: "seed", type: "number" },
      { key: "image_url", type: "file", modes: ["image-to-video"] },
      { key: "video_urls", type: "file-list", modes: ["reference-to-video"] },
    ],
    pricingEstimate: {
      unit: "manual",
      note: "Depends on duration, resolution, mode, and audio.",
    },
  },
  "kling-3.0-pro": {
    id: "kling-3.0-pro",
    displayName: "Kling 3.0 Pro",
    provider: "falai",
    description: "High-quality Kling model with negative prompt, audio, and frame controls.",
    accessTier: "paid",
    color: "#f59e0b",
    icon: "K",
    endpoints: {
      "text-to-video": "fal-ai/kling-video/v3/pro/text-to-video",
      "image-to-video": "fal-ai/kling-video/v3/pro/image-to-video",
      "frames-to-video": "fal-ai/kling-video/v3/pro/image-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video", "frames-to-video"],
      durations: ["3s", "5s", "10s", "15s"],
      aspectRatios: ["16:9", "9:16", "1:1"],
      maxImages: 2,
      supportsAudio: true,
      supportsNegativePrompt: true,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "duration", type: "select", default: "5s", options: [3, 5, 10, 15] },
      { key: "aspect_ratio", type: "select", default: "16:9", options: ["16:9", "9:16", "1:1"] },
      { key: "generate_audio", type: "boolean", default: true },
      { key: "negative_prompt", type: "string" },
      { key: "cfg_scale", type: "number", default: 0.5 },
      { key: "start_image_url", type: "file", modes: ["image-to-video", "frames-to-video"] },
      { key: "end_image_url", type: "file", modes: ["frames-to-video"] },
    ],
    pricingEstimate: {
      unit: "manual",
      note: "Depends on selected duration and mode.",
    },
  },
  "veo-3.1-fast": {
    id: "veo-3.1-fast",
    displayName: "Veo 3.1 Fast",
    provider: "falai",
    description: "Google Veo fast model with text, image, first/last frame, and extend modes.",
    accessTier: "paid",
    color: "#4285f4",
    icon: "V",
    endpoints: {
      "text-to-video": "fal-ai/veo3.1/fast",
      "image-to-video": "fal-ai/veo3.1/fast/image-to-video",
      "frames-to-video": "fal-ai/veo3.1/fast/first-last-frame-to-video",
      "extend-video": "fal-ai/veo3.1/fast/extend",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video", "frames-to-video", "extend-video"],
      durations: ["4s", "6s", "8s"],
      aspectRatios: ["auto", "16:9", "9:16"],
      resolutions: ["720P", "1080P", "4K"],
      maxImages: 2,
      supportsAudio: true,
      supportsNegativePrompt: true,
      supportsSeed: true,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "duration", type: "select", default: "8s", options: ["4s", "6s", "8s"] },
      { key: "aspect_ratio", type: "select", default: "16:9", options: ["auto", "16:9", "9:16"] },
      { key: "resolution", type: "select", default: "720p", options: ["720p", "1080p", "4k"] },
      { key: "negative_prompt", type: "string" },
      { key: "generate_audio", type: "boolean", default: true },
      { key: "seed", type: "number" },
      { key: "image_url", type: "file", modes: ["image-to-video"] },
      { key: "first_frame_url", type: "file", modes: ["frames-to-video"] },
      { key: "last_frame_url", type: "file", modes: ["frames-to-video"] },
      { key: "video_url", type: "file", modes: ["extend-video"] },
    ],
    pricingEstimate: {
      unit: "manual",
      note: "Depends on duration, resolution, and endpoint.",
    },
  },
  "sora-2": {
    id: "sora-2",
    displayName: "Sora 2",
    provider: "falai",
    description: "OpenAI text-to-video model on fal.ai.",
    accessTier: "paid",
    color: "#111827",
    icon: "S",
    endpoints: {
      "text-to-video": "fal-ai/sora-2/text-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video"],
      durations: ["4s", "8s", "12s", "16s", "20s"],
      aspectRatios: ["16:9", "9:16"],
      resolutions: ["720P"],
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "resolution", type: "select", default: "720p", options: ["720p"] },
      { key: "aspect_ratio", type: "select", default: "16:9", options: ["16:9", "9:16"] },
      { key: "duration", type: "select", default: "8s", options: [4, 8, 12, 16, 20] },
      { key: "delete_video", type: "boolean", default: false },
    ],
    pricingEstimate: {
      unit: "manual",
      note: "Depends on duration and fal.ai current Sora pricing.",
    },
  },
  "hailuo-02-standard": {
    id: "hailuo-02-standard",
    displayName: "Hailuo 02 Standard",
    provider: "falai",
    description: "MiniMax Hailuo standard model for text, image, and frame-to-video.",
    accessTier: "paid",
    color: "#06b6d4",
    icon: "H",
    endpoints: {
      "text-to-video": "fal-ai/minimax/hailuo-02/standard/text-to-video",
      "image-to-video": "fal-ai/minimax/hailuo-02/standard/image-to-video",
      "frames-to-video": "fal-ai/minimax/hailuo-02/standard/image-to-video",
    },
    capabilities: {
      inputModes: ["text-to-video", "image-to-video", "frames-to-video"],
      durations: ["6s", "10s"],
      resolutions: ["512P", "768P"],
      maxImages: 2,
    },
    parameterSchema: [
      { key: "prompt", type: "string", required: true },
      { key: "duration", type: "select", default: "6s", options: [6, 10] },
      { key: "resolution", type: "select", default: "768P", options: ["512P", "768P"] },
      { key: "prompt_optimizer", type: "boolean", default: true },
      { key: "image_url", type: "file", modes: ["image-to-video", "frames-to-video"] },
      { key: "end_image_url", type: "file", modes: ["frames-to-video"] },
    ],
    pricingEstimate: {
      unit: "manual",
      note: "Depends on duration, resolution, and endpoint.",
    },
  },
};

export const VIDEO_MODEL_REGISTRY_ORDER = Object.keys(VIDEO_MODEL_REGISTRY);

export function getVideoModelRegistryItem(modelId: string) {
  return VIDEO_MODEL_REGISTRY[modelId as keyof typeof VIDEO_MODEL_REGISTRY] ?? null;
}

export function getVideoModelRegistryItems() {
  return VIDEO_MODEL_REGISTRY_ORDER.map((id) => VIDEO_MODEL_REGISTRY[id as keyof typeof VIDEO_MODEL_REGISTRY]);
}

export function getVideoModelEndpoint(modelId: string, mode: string) {
  const model = getVideoModelRegistryItem(modelId);
  if (!model) return undefined;
  const normalizedMode = normalizeRegistryMode(mode);
  return model.endpoints[normalizedMode] ?? model.endpoints["text-to-video"];
}

export function isVideoModelModeSupported(modelId: string, mode: string) {
  const model = getVideoModelRegistryItem(modelId);
  if (!model) return false;
  return Boolean(model.endpoints[normalizeRegistryMode(mode)]);
}

export function normalizeRegistryMode(mode?: string): VideoModelMode {
  if (mode === "image-to-video" || mode === "reference-to-video" || mode === "frames-to-video") {
    return mode;
  }
  if (mode === "first-last-frame") return "frames-to-video";
  if (mode === "extend-video" || mode === "video-to-video") return mode;
  return "text-to-video";
}

export function normalizeDurationForFal(duration?: number | string) {
  if (duration === undefined || duration === null) return undefined;
  if (typeof duration === "number") return duration;
  if (duration === "auto") return "auto";
  const parsed = Number.parseInt(duration, 10);
  return Number.isNaN(parsed) ? duration : parsed;
}

export function normalizeResolutionForFal(resolution?: string) {
  return resolution?.toLowerCase();
}

export function getDefaultImageConstraints() {
  return {
    maxSizeMB: 10,
    formats: IMAGE_FORMATS,
  };
}
