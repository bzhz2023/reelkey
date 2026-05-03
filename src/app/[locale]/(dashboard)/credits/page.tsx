import { CreditsPage } from "@/components/credits/credits-page";
import { ApiUsagePage } from "@/components/usage/api-usage-page";
import { CREDITS_CONFIG } from "@/config/credits";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CreditsRoute({ params }: PageProps) {
  const { locale } = await params;
  if (CREDITS_CONFIG.BYOK_MODE) {
    return <ApiUsagePage />;
  }

  return <CreditsPage locale={locale} />;
}
