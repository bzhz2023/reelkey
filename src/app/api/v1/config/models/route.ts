import { getAvailableModels } from "@/config/credits";
import { apiSuccess } from "@/lib/api/response";
import { getConfiguredAIProvider } from "@/ai/provider-config";
import { BYOK_MODE } from "@/config/byok-mode";

export async function GET() {
  const models = getAvailableModels({
    provider: BYOK_MODE ? "falai" : getConfiguredAIProvider(),
    access: "paid",
  });
  return apiSuccess(models);
}
