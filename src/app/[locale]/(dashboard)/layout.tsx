import { DashboardLayoutContent } from "@/components/layout/dashboard-layout-content";
import { i18n } from "@/config/i18n-config";

interface DashboardLayoutProps {
  children?: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function DashboardLayout({
  children,
  params,
}: DashboardLayoutProps) {
  const { locale } = await params;
  return <DashboardLayoutContent lang={locale}>{children}</DashboardLayoutContent>;
}
