#!/usr/bin/env node

const siteUrl = normalizeSiteUrl(
  process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || "https://reelkey.app"
);
const expectedToken = normalizeToken(process.env.GOOGLE_SITE_VERIFICATION);

function normalizeSiteUrl(value) {
  return value.replace(/\/+$/, "");
}

function normalizeToken(value) {
  if (!value) return "";

  const trimmed = value.trim();
  const contentMatch = trimmed.match(/content=["']([^"']+)["']/i);

  return contentMatch?.[1]?.trim() || trimmed;
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "user-agent": "ReelKey-GSC-Verification/1.0",
    },
  });

  const text = await response.text();
  return { ok: response.ok, status: response.status, text };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function main() {
  assert(expectedToken, "GOOGLE_SITE_VERIFICATION is not set.");

  const home = await fetchText(siteUrl);
  assert(home.ok, `Homepage returned HTTP ${home.status}: ${siteUrl}`);
  assert(
    home.text.includes(`name="google-site-verification"`) &&
      home.text.includes(`content="${expectedToken}"`),
    "Homepage does not contain the expected google-site-verification meta tag."
  );

  const robotsUrl = `${siteUrl}/robots.txt`;
  const robots = await fetchText(robotsUrl);
  assert(robots.ok, `robots.txt returned HTTP ${robots.status}: ${robotsUrl}`);
  assert(
    robots.text.includes(`${siteUrl}/sitemap.xml`),
    "robots.txt does not reference the expected sitemap.xml URL."
  );

  const sitemapUrl = `${siteUrl}/sitemap.xml`;
  const sitemap = await fetchText(sitemapUrl);
  assert(sitemap.ok, `sitemap.xml returned HTTP ${sitemap.status}: ${sitemapUrl}`);
  assert(
    sitemap.text.includes("<urlset") || sitemap.text.includes("<sitemapindex"),
    "sitemap.xml does not look like a valid sitemap."
  );

  console.log(`Google Search Console readiness check passed for ${siteUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
