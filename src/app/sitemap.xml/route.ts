const publicRoutes = [
  "",
  "acceptable-use",
  "pricing",
  "privacy",
  "privacy-policy",
  "seedance-1-5",
  "sora-2",
  "terms",
  "terms-of-service",
  "veo-3-1",
  "wan-2-6",
  "frames-to-video",
  "image-to-video",
  "reference-to-video",
  "text-to-video",
];

const locales = ["en", "zh"];
const defaultLocale = "en";

export const revalidate = 3600;

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://reelkey.app").replace(
    /\/+$/,
    ""
  );
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrl(baseUrl: string, locale: string, route: string) {
  const localePrefix = locale === defaultLocale ? "" : `/${locale}`;
  const routePath = route ? `/${route}` : "";
  return `${baseUrl}${localePrefix}${routePath || "/"}`;
}

export function GET() {
  const baseUrl = getBaseUrl();
  const urls = publicRoutes.flatMap((route) =>
    locales.map((locale) => buildUrl(baseUrl, locale, route))
  );

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${escapeXml(url)}</loc>
  </url>`
  )
  .join("\n")}
</urlset>
`;

  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
