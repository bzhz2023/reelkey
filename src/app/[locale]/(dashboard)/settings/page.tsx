import { SettingsPage } from "@/components/billing/settings-page";
import { i18n } from "@/config/i18n-config";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function SettingsRoute({ params }: PageProps) {
  const { locale } = await params;

  return <SettingsPage locale={locale} />;
}
