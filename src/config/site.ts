/**
 * Site configuration
 * Central place for website settings, auth providers, and features
 */
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github?: string;
    twitter?: string;
    discord?: string;
  };
  auth: {
    enableGoogleLogin: boolean;
    enableMagicLinkLogin: boolean;
    defaultProvider: "google" | "email";
  };
  routes: {
    defaultLoginRedirect: string;
  };
}

export const siteConfig: SiteConfig = {
  name: "ReelKey",
  description: "AI video generator supporting Sora 2, Kling, Veo 3.1, Seedance & Hailuo via fal.ai. Use your own API key — no subscriptions, no expiring credits.",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://reelkey.app",
  ogImage: "/og.png",
  links: {},
  auth: {
    enableGoogleLogin: true,
    enableMagicLinkLogin: true,
    defaultProvider: "google",
  },
  routes: {
    defaultLoginRedirect: "/text-to-video",
  },
};

// Helper to get enabled auth providers
export function getEnabledAuthProviders() {
  const providers: string[] = [];
  if (siteConfig.auth.enableGoogleLogin) providers.push("google");
  if (siteConfig.auth.enableMagicLinkLogin) providers.push("email");
  return providers;
}
