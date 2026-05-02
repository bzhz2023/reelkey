/**
 * Global Proxy Configuration
 *
 * This file configures undici global proxy for all Node.js fetch requests.
 * It should be imported as early as possible in the application lifecycle.
 *
 * IMPORTANT: Import this in your API routes or server-side code BEFORE making any fetch calls.
 */

const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY;

if (PROXY_URL) {
  try {
    // Keep this file side-effect safe in Next.js bundling: don't require("undici")
    // unless proxy is explicitly configured and module exists at runtime.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const req = Function("return require")() as NodeRequire;
    const undici = req("undici");
    const proxyAgent = new undici.ProxyAgent(PROXY_URL);
    undici.setGlobalDispatcher(proxyAgent);
    console.log(`📡 [Proxy] Global proxy configured: ${PROXY_URL}`);
  } catch (error) {
    console.warn(
      `⚠️  [Proxy] Failed to configure undici proxy:`,
      error instanceof Error ? error.message : error
    );
  }
} else {
  console.log(`ℹ️  [Proxy] No HTTP_PROXY/HTTPS_PROXY environment variable found`);
}

export {};
