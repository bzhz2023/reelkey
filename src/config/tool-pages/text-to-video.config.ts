import { ToolPageConfig } from "./types";

/**
 * Text to Video 工具页面配置
 */
export const textToVideoConfig: ToolPageConfig = {
  // SEO 配置
  seo: {
    title: "Text to Video - Create Videos from Text with AI",
    description: "Transform your text descriptions into stunning videos using AI. Simply describe what you want, and watch fal.ai models bring your vision to life.",
    keywords: [
      "text to video",
      "ai video generator",
      "video from text",
      "ai video creation",
      "kling",
      "wan",
      "text to video ai",
    ],
    ogImage: "/og-text-to-video.jpg",
  },

  // 生成器配置
  generator: {
    mode: "text-to-video",
    uiMode: "compact",

    defaults: {
      model: "kling-2.5-turbo",
      duration: 5,
      aspectRatio: "16:9",
      outputNumber: 1,
    },

    models: {
      available: [
        "kling-2.5-turbo",
        "wan-2.5",
        "seedance-2.0",
        "kling-3.0-pro",
        "veo-3.1",
        "sora-2-pro",
        "happyhorse-1.0",
        "hailuo-02-standard",
      ],
      default: "kling-2.5-turbo",
    },

    features: {
      showImageUpload: false,
      showPromptInput: true,
      showModeSelector: false,
    },

    promptPlaceholder: "Describe the video you want to create... e.g., 'A serene mountain landscape at sunset with birds flying'",

    settings: {
      showDuration: true,
      showAspectRatio: true,
      showQuality: false,
      showOutputNumber: false,
      showAudioGeneration: true,

      durations: [5, 10],
      aspectRatios: ["16:9", "9:16", "1:1"],
    },
  },

  // Landing Page 配置
  landing: {
    hero: {
      title: "Create Stunning Videos from Text",
      description: "Describe your vision in plain text and let AI bring it to life. From cinematic scenes to product showcases, the possibilities are endless.",
      ctaText: "Start Creating",
      ctaSubtext: "Use your own fal.ai API key",
    },

    examples: [
      {
        thumbnail: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80",
        title: "Cinematic Mountain Scene",
        prompt: "A majestic mountain range at golden hour, camera slowly flying through valleys",
      },
      {
        thumbnail: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=600&q=80",
        title: "Urban City Timelapse",
        prompt: "New York City timelapse at night, cars leaving light trails, buildings glowing",
      },
      {
        thumbnail: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=80",
        title: "Ocean Sunset",
        prompt: "Calm ocean waves at sunset, camera slowly zooming out, peaceful atmosphere",
      },
    ],

    features: [
      "Simply describe what you want to see",
      "Access to fal.ai models (Kling 2.5 Turbo Pro, Wan 2.5)",
      "Cinematic quality up to 1080p",
      "Generate audio and sound effects automatically",
      "Multiple aspect ratios for any platform",
    ],

    supportedModels: [
      { name: "Kling 2.5 Turbo Pro", provider: "fal.ai", color: "#0ea5e9" },
      { name: "Wan 2.5", provider: "fal.ai", color: "#06b6d4" },
    ],

    stats: {
      videosGenerated: "1M+",
      usersCount: "100K+",
      avgRating: 4.9,
    },
  },

  // 多语言 key 前缀
  i18nPrefix: "ToolPage.TextToVideo",
};
