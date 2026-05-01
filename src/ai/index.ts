import type { AIVideoProvider, ProviderType } from "./types";
import { EvolinkProvider } from "./providers/evolink";
import { KieProvider } from "./providers/kie";
import { ApimartProvider } from "./providers/apimart";
import { FalAiProvider } from "./providers/falai";
import {
  getConfiguredAIProvider,
  requireProviderApiKey,
} from "./provider-config";

const providers: Map<ProviderType, AIVideoProvider> = new Map();

export function getProvider(type: ProviderType): AIVideoProvider {
  if (providers.has(type)) return providers.get(type)!;

  let provider: AIVideoProvider;
  switch (type) {
    case "evolink":
      provider = new EvolinkProvider(requireProviderApiKey("evolink"));
      break;
    case "kie":
      provider = new KieProvider(requireProviderApiKey("kie"));
      break;
    case "apimart":
      provider = new ApimartProvider(requireProviderApiKey("apimart"));
      break;
    case "falai":
      throw new Error("FalAI provider requires user API key. Use getProviderWithKey() instead.");
    default:
      throw new Error(`Unknown provider: ${type}`);
  }

  providers.set(type, provider);
  return provider;
}

// New function for BYOK providers that require user-provided API keys
export function getProviderWithKey(type: ProviderType, apiKey: string): AIVideoProvider {
  if (type === "falai") {
    return new FalAiProvider(apiKey);
  }
  // For non-BYOK providers, ignore the key and use standard getProvider
  return getProvider(type);
}

export function getDefaultProvider(): AIVideoProvider {
  const type = getConfiguredAIProvider() || "evolink";
  return getProvider(type);
}

export * from "./types";
export * from "./provider-config";
