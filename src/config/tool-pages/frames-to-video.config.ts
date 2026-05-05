import { ToolPageConfig } from "./types";

/**
 * First and last frame to video tool page configuration.
 */
export const framesToVideoConfig: ToolPageConfig = {
  seo: {
    title: "First and Last Frame to Video - Create AI Transition Videos",
    description:
      "Upload a first frame and a last frame, then generate a smooth AI transition video with fal.ai models.",
    keywords: [
      "first frame to video",
      "last frame to video",
      "first and last frame video",
      "ai transition video",
      "image to video",
      "veo",
      "kling",
    ],
    ogImage: "/og-frames-to-video.jpg",
  },

  generator: {
    mode: "frames-to-video",
    uiMode: "compact",

    defaults: {
      model: "veo-3.1-fast",
      duration: 5,
      aspectRatio: "16:9",
      outputNumber: 1,
    },

    models: {
      available: ["veo-3.1-fast", "kling-3.0-pro", "hailuo-02-standard"],
      default: "veo-3.1-fast",
    },

    features: {
      showImageUpload: true,
      showPromptInput: true,
      showModeSelector: false,
    },

    promptPlaceholder:
      "Describe the motion between the first and last frame, e.g., a smooth cinematic camera move with natural lighting...",

    settings: {
      showDuration: true,
      showAspectRatio: true,
      showQuality: true,
      showOutputNumber: false,
      showAudioGeneration: false,

      durations: [5, 6, 8, 10],
      aspectRatios: ["16:9", "9:16", "1:1"],
      qualities: ["720P", "1080P"],
    },
  },

  landing: {
    hero: {
      title: "Create Smooth Transitions Between Two Frames",
      description:
        "Upload a start frame and an end frame, then let AI generate the motion between them.",
      ctaText: "Start Creating",
      ctaSubtext: "Use your own fal.ai API key",
    },

    examples: [
      {
        thumbnail:
          "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=600&q=80",
        title: "Landscape Transition",
        prompt: "A peaceful camera move from sunrise to golden hour.",
      },
      {
        thumbnail:
          "https://images.unsplash.com/photo-1518005020951-eccb494ad742?w=600&q=80",
        title: "Product Reveal",
        prompt: "A clean product reveal with a slow orbiting camera.",
      },
      {
        thumbnail:
          "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=80",
        title: "Scene Morph",
        prompt: "A cinematic transition with soft light and natural movement.",
      },
    ],

    features: [
      "Upload first and last frame images",
      "Generate smooth transition videos",
      "Use fal.ai models that support first/last frame endpoints",
      "Control duration, aspect ratio, and resolution by model",
      "Keep billing directly on your fal.ai account",
    ],

    supportedModels: [
      { name: "Veo 3.1 Fast", provider: "fal.ai", color: "#4285f4" },
      { name: "Kling 3.0 Pro", provider: "fal.ai", color: "#f59e0b" },
      { name: "Hailuo 02 Standard", provider: "fal.ai", color: "#06b6d4" },
    ],

    stats: {
      videosGenerated: "100K+",
      usersCount: "15K+",
      avgRating: 4.7,
    },
  },

  i18nPrefix: "ToolPage.FramesToVideo",
};
