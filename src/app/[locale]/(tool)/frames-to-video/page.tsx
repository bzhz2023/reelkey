import { getToolPageConfig, getToolPageConfigForProvider } from "@/config/tool-pages";
import { ToolPageLoader } from "@/components/tool/tool-page-loader";
import type { Locale } from "@/config/i18n-config";
import { buildAlternates, resolveOgImage } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getConfiguredAIProvider } from "@/ai/provider-config";
import { BYOK_MODE } from "@/config/byok-mode";

interface FramesToVideoPageProps {
  params: Promise<{
    locale: Locale;
  }>;
}

export async function generateMetadata({
  params,
}: FramesToVideoPageProps) {
  const { locale } = await params;
  const config = getToolPageConfig("frames-to-video");
  const alternates = buildAlternates("/frames-to-video", locale);
  const ogImage = resolveOgImage(config.seo?.ogImage);

  return {
    title: config.seo?.title,
    description: config.seo?.description,
    keywords: config.seo?.keywords,
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
    openGraph: {
      title: config.seo?.title,
      description: config.seo?.description,
      url: alternates.canonical,
      siteName: siteConfig.name,
      type: "website",
      images: ogImage ? [ogImage] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: config.seo?.title,
      description: config.seo?.description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function FramesToVideoPage({ params }: FramesToVideoPageProps) {
  const config = getToolPageConfigForProvider(
    "frames-to-video",
    BYOK_MODE ? "falai" : getConfiguredAIProvider(),
    "paid"
  );
  const { locale } = await params;
  return (
    <ToolPageLoader
      config={config}
      locale={locale}
      toolRoute="frames-to-video"
    />
  );
}
