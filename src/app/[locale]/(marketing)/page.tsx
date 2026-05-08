import { HeroSection } from "@/components/landing/hero-section";
import { DeferredHomeSections } from "@/components/landing/deferred-home-sections";

import type { Locale } from "@/config/i18n-config";
import { siteConfig } from "@/config/site";
import { i18n } from "@/config/i18n-config";
import { buildAlternates, resolveOgImage } from "@/lib/seo";
import { getConfiguredAIProvider } from "@/ai/provider-config";

interface HomePageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

interface PageMetadataProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export async function generateMetadata({ params }: PageMetadataProps) {
  const { locale } = await params;

  const titles = {
    en: "ReelKey — AI Video Generator | Sora 2, Kling, Veo 3.1, No Subscription",
    zh: "ReelKey — AI 视频生成器 | Sora 2、Kling、Veo 3.1，无订阅费",
  };

  const descriptions = {
    en: "Generate AI videos with Sora 2, Kling 3.0, Veo 3.1 Fast, Seedance 2.0 & Hailuo — using your own fal.ai API key. No subscription, no expiring credits. One-time lifetime license from $29.",
    zh: "用自己的 fal.ai API Key 调用 Sora 2、Kling 3.0、Veo 3.1、Seedance 2.0、Hailuo 等 7 款模型生成 AI 视频，无订阅费，无过期积分，终身授权 $29 起。",
  };

  const canonicalUrl = `${siteConfig.url}${locale === i18n.defaultLocale ? "" : `/${locale}`}`;
  const alternates = buildAlternates("/", locale);
  const ogImage = resolveOgImage();

  return {
    title: titles[locale] || titles.en,
    description: descriptions[locale] || descriptions.en,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      url: canonicalUrl,
      siteName: siteConfig.name,
      locale: locale === "zh" ? "zh_CN" : "en_US",
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: titles[locale] || titles.en,
      description: descriptions[locale] || descriptions.en,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function HomePage({ params }: HomePageProps) {
  return (
    <>
      <HeroSection
        currentProvider={getConfiguredAIProvider()}
      />
      <DeferredHomeSections />
    </>
  );
}
