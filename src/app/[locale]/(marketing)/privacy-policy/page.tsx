import { redirect } from "next/navigation";
import type { Locale } from "@/config/i18n-config";

// 旧路径 301 重定向至正式隐私政策页面，避免旧链接访问崩溃
export default async function PrivacyPolicyRedirect({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/privacy`);
}
