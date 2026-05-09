import Script from "next/script";

const DEFAULT_PLAUSIBLE_SCRIPT = "https://plausible.io/js/script.js";

function getHostname(value: string | undefined) {
  if (!value) return undefined;

  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

function isLocalhost(hostname: string | undefined) {
  return (
    !hostname ||
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1"
  );
}

function isProvisionedScript(script: string) {
  return /\/js\/pa-[^/]+\.js$/.test(script);
}

/**
 * Plausible Analytics
 *
 * https://plausible.io
 * https://plausible.io/docs/script
 */
export function PlausibleAnalytics() {
  const enabled = process.env.NEXT_PUBLIC_PLAUSIBLE_ENABLED;
  if (enabled === "false") {
    return null;
  }

  const configuredDomain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN?.trim();
  const appDomain = getHostname(process.env.NEXT_PUBLIC_APP_URL);
  const domain = configuredDomain || appDomain;

  if (isLocalhost(domain)) {
    return null;
  }

  const script =
    process.env.NEXT_PUBLIC_PLAUSIBLE_SCRIPT?.trim() || DEFAULT_PLAUSIBLE_SCRIPT;
  const provisionedScript = isProvisionedScript(script);

  return (
    <>
      {provisionedScript ? (
        <Script
          id="plausible-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
              plausible.init();
            `,
          }}
        />
      ) : null}
      <Script
        id="plausible-analytics"
        defer
        strategy="afterInteractive"
        data-domain={provisionedScript ? undefined : domain}
        src={script}
      />
    </>
  );
}
