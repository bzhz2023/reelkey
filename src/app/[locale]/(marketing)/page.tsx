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
    en: "ReelKey — BYOK AI Video Generation, No Subscriptions",
    zh: "ReelKey — 自带 API Key 生成 AI 视频，无订阅费",
  };

  const descriptions = {
    en: "Generate AI videos using your own fal.ai API key. Support Kling 2.5 and Wan 2.5 models. Pay providers directly — no subscriptions, no expiring credits. One-time lifetime license from $29.",
    zh: "使用你自己的 fal.ai API Key 生成 AI 视频。支持 Kling 2.5 和 Wan 2.5 模型。直接向服务商付费，无订阅费，无过期积分。一次性终身授权，$29 起。",
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
