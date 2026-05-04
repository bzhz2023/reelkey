import { MobileMenuProvider } from "@/components/layout/mobile-menu-context";
import { ToolLayoutContent } from "@/components/layout/tool-layout-content";
import { i18n } from "@/config/i18n-config";

interface ToolLayoutProps {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
}

export function generateStaticParams() {
  return i18n.locales.map((locale) => ({ locale }));
}

export default async function ToolLayout({
  children,
  params,
}: ToolLayoutProps) {
  const { locale } = await params;

  return (
    <MobileMenuProvider>
      <ToolLayoutContent lang={locale}>
        {children}
      </ToolLayoutContent>
    </MobileMenuProvider>
  );
}
