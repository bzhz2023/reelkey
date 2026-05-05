// ============================================
// 类型定义
// ============================================

export type ProductType = "subscription" | "one-time";
import type { ProviderType } from "@/ai/types";
import {
  isModelModeSupported,
  isModelSupported,
  type GenerationMode,
} from "@/ai/model-mapping";
import { BYOK_MODE } from "@/config/byok-mode";
import {
  getVideoModelRegistryItem,
  VIDEO_MODEL_REGISTRY_ORDER,
} from "@/config/video-model-registry";

export interface CreditPackagePrice {
  amount: number;            // 价格（美分）
  currency: string;
}

export interface CreditPackageConfig {
  id: string;
  name: string;              // 产品显示名称
  credits: number;           // 积分数量
  price: CreditPackagePrice;
  type: ProductType;
  billingPeriod?: "month" | "year";
  popular?: boolean;
  disabled?: boolean;
  expireDays?: number;       // 覆盖默认过期天数
  features?: string[];       // 功能列表（用于展示）
  /** 是否允许免费用户购买（仅积分包有效） */
  allowFreeUser?: boolean;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: ProviderType;
  description: string;
  supportImageToVideo: boolean;
  maxDuration: number;
  durations: number[];
  aspectRatios: string[];
  qualities?: string[];
  creditCost: {
    base: number;            // 基础积分（10s）
    perExtraSecond?: number; // 每额外秒积分
    highQualityMultiplier?: number; // 高质量乘数
  };
  /** Whether the model is enabled (default: true). Disabled models can still be shown with a badge */
  enabled?: boolean;
  /** free = available to free users; paid = part of the full paid model catalog */
  accessTier: "free" | "paid";
  /** Optional badge text for disabled/upcoming models (e.g., "Coming Soon") */
  badge?: string;
}

// ============================================
// 用户配置导入
// ============================================
// 所有的价格和积分配置都在 pricing-user.ts 中
// 用户只需要修改那个文件即可
import {
  NEW_USER_GIFT,
  CREDIT_EXPIRATION,
  SUBSCRIPTION_PRODUCTS,
  CREDIT_PACKAGES,
  VIDEO_MODEL_PRICING,
} from "./pricing-user";

// ============================================
// 转换函数：用户配置 -> 内部格式
// ============================================

/** 将美元转换为美分（内部使用） */
function usdToCents(usd: number): number {
  return Math.round(usd * 100);
}

// ============================================
// 统一积分配置（从 pricing-user.ts 生成）
// ============================================

export const CREDITS_CONFIG = {
  // ========== 系统开关 ==========
  enabled: true, // 积分系统始终启用
  BYOK_MODE, // 当前产品模式：用户自带 fal.ai API Key，工具主链路不展示/不消耗平台积分

  // ========== 新用户赠送 ==========
  registerGift: {
    enabled: NEW_USER_GIFT.enabled,
    amount: NEW_USER_GIFT.credits,
    expireDays: NEW_USER_GIFT.validDays,
  },

  // ========== 过期配置 ==========
  expiration: {
    subscriptionDays: CREDIT_EXPIRATION.subscriptionDays,
    purchaseDays: CREDIT_EXPIRATION.purchaseDays,
    warnBeforeDays: CREDIT_EXPIRATION.warnBeforeDays,
  },

  // ========== 订阅产品（从 pricing-user.ts 生成）==========
  subscriptions: Object.fromEntries(
    SUBSCRIPTION_PRODUCTS.filter((p) => p.enabled).map((product) => {
      const isYearly = product.period === "year";
      const planType = product.id.includes("basic")
        ? "BASIC"
        : product.id.includes("pro")
          ? "PRO"
          : "TEAM";
      const envKey = isYearly ? "YEARLY" : "MONTHLY";

      return [
        product.id,
        {
          id: product.id,
          name: product.name,
          credits: product.credits,
          price: {
            amount: usdToCents(product.priceUsd),
            currency: "USD",
          },
          type: "subscription" as const,
          billingPeriod: product.period,
          popular: product.popular,
          expireDays: isYearly ? 365 : undefined,
          features: product.features || [],
        },
      ];
    })
  ) as Record<string, CreditPackageConfig>,

  // ========== 一次性购买产品（从 pricing-user.ts 生成）==========
  packages: Object.fromEntries(
    CREDIT_PACKAGES.filter((p) => p.enabled).map((pkg) => [
      pkg.id,
      {
        id: pkg.id,
        name: pkg.name,
        credits: pkg.credits,
        price: {
          amount: usdToCents(pkg.priceUsd),
          currency: "USD",
        },
        type: "one-time" as const,
        popular: pkg.popular,
        expireDays: CREDIT_EXPIRATION.purchaseDays,
        features: pkg.features || [],
        // allowFreeUser: 是否允许免费用户购买（前端使用）
        allowFreeUser: pkg.allowFreeUser ?? true, // 默认允许
      },
    ])
  ) as Record<string, CreditPackageConfig>,

  // ========== AI 模型配置（从 pricing-user.ts 生成）==========
  models: Object.fromEntries(
    Object.entries(VIDEO_MODEL_PRICING)
      .map(([modelId, pricing]) => {
        const registryItem = getVideoModelRegistryItem(modelId);
        if (!registryItem) return null;
        const durations = registryItem.capabilities.durations
          ?.map((duration) => Number.parseInt(duration, 10))
          .filter((duration) => !Number.isNaN(duration));
        const maxDuration = durations?.length ? Math.max(...durations) : 5;
        const baseConfig: Omit<ModelConfig, "creditCost" | "accessTier"> = {
          id: registryItem.id,
          name: registryItem.displayName,
          provider: registryItem.provider,
          description: registryItem.description,
          supportImageToVideo: registryItem.capabilities.inputModes.some((mode) =>
            ["image-to-video", "reference-to-video", "frames-to-video"].includes(mode)
          ),
          maxDuration,
          durations: durations?.length ? durations : [5],
          aspectRatios: registryItem.capabilities.aspectRatios ?? ["16:9"],
          qualities: registryItem.capabilities.resolutions,
        };

        const creditCost: {
          base: number;
          perExtraSecond: number;
          highQualityMultiplier?: number;
        } = {
          base: pricing.baseCredits,
          perExtraSecond: pricing.perSecond,
        };

        if (pricing.qualityMultiplier !== undefined) {
          creditCost.highQualityMultiplier = pricing.qualityMultiplier;
        }

        return [
          modelId,
          {
            ...baseConfig,
            creditCost,
            enabled: pricing.enabled,
            accessTier: pricing.accessTier ?? "paid",
            badge: pricing.enabled ? undefined : "Coming Soon",
          },
        ];
      })
      .filter(Boolean) as Array<[string, ModelConfig]>
  ) as Record<string, ModelConfig>,
};

// ============================================
// 辅助函数
// ============================================

/** 获取所有订阅产品 */
export function getSubscriptionProducts(): CreditPackageConfig[] {
  return Object.values(CREDITS_CONFIG.subscriptions).filter(
    (p) => !(p as CreditPackageConfig).disabled
  );
}

/** 获取所有一次性购买产品 */
export function getOnetimeProducts(): CreditPackageConfig[] {
  return Object.values(CREDITS_CONFIG.packages).filter(
    (p) => !(p as CreditPackageConfig).disabled
  );
}

/** 根据产品 ID 获取配置 */
export function getProductById(productId: string): CreditPackageConfig | null {
  const all = {
    ...CREDITS_CONFIG.subscriptions,
    ...CREDITS_CONFIG.packages,
  };
  return Object.values(all).find(p => p.id === productId) || null;
}

/** 获取产品过期天数 */
export function getProductExpiryDays(product: CreditPackageConfig): number {
  if (product.expireDays !== undefined) {
    return product.expireDays;
  }
  return product.type === "subscription"
    ? CREDITS_CONFIG.expiration.subscriptionDays
    : CREDITS_CONFIG.expiration.purchaseDays;
}

/** 获取所有模型（按显示顺序排序） */
export function getAvailableModels(options?: {
  provider?: ProviderType;
  mode?: GenerationMode;
  enabledOnly?: boolean;
  access?: "free" | "paid";
}): ModelConfig[] {
  const { provider, mode, enabledOnly = true, access } = options || {};
  // Define display order (newest/most important first)
  // Models not in this list are sorted to the end
  const displayOrder = VIDEO_MODEL_REGISTRY_ORDER;
  const orderMap = new Map(displayOrder.map((id, index) => [id, index]));
  return Object.values(CREDITS_CONFIG.models)
    .filter((model) => !enabledOnly || model.enabled !== false)
    .filter((model) => !access || access === "paid" || model.accessTier === "free")
    .filter((model) => {
      const effectiveProvider = provider || model.provider;
      if (!isModelSupported(model.id, effectiveProvider)) return false;
      if (!mode) return true;
      return isModelModeSupported(model.id, effectiveProvider, mode);
    })
    .sort((a, b) => {
    const aOrder = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER;
    const bOrder = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER;
    return aOrder - bOrder;
  });
}

/** 根据模型 ID 获取配置 */
export function getModelConfig(modelId: string): ModelConfig | null {
  return CREDITS_CONFIG.models[modelId as keyof typeof CREDITS_CONFIG.models] || null;
}

/** 获取模型显示名称，避免 UI 分散维护模型 ID -> 名称映射 */
export function getModelDisplayName(modelId: string): string {
  return getModelConfig(modelId)?.name ?? modelId;
}

/** 计算模型积分消耗（基于 Evolink 1:1 成本） */
export function calculateModelCredits(
  modelId: string,
  params: { duration: number; quality?: string }
): number {
  const config = getModelConfig(modelId);
  if (!config) return 0;

  const { base, perExtraSecond = 0, highQualityMultiplier = 1 } = config.creditCost;

  const parseQualityToResolution = (quality?: string): number => {
    if (!quality) return 720;
    const normalized = quality.toLowerCase();
    if (normalized.includes("1080")) return 1080;
    if (normalized.includes("720")) return 720;
    if (normalized.includes("480")) return 480;
    if (normalized === "high") return 1080;
    return 720;
  };
  const resolution = parseQualityToResolution(params.quality);
  const isHighQuality = resolution >= 1080 || params.quality?.toLowerCase() === "high";

  let credits = 0;

  // 根据模型使用不同的计算逻辑
  switch (modelId) {
    case "sora-2": {
      // Sora 2: 固定价格（10s=2积分, 15s=3积分）
      credits = params.duration === 15 ? 3 : 2;
      break;
    }

    case "wan2.6": {
      // Wan 2.6: 每秒 5 积分（5s=25, 10s=50）
      credits = params.duration * 5;
      if (isHighQuality) {
        credits = credits * 1.67; // 1080p
      }
      break;
    }

    case "veo-3.1": {
      // Veo 3.1: 固定 10 积分
      credits = 10;
      break;
    }

    case "seedance-1.5-pro": {
      // Seedance: 按秒计费，720p 有音频 = 4积分/秒
      let perSecond = 4; // 720p 有音频
      if (isHighQuality) {
        perSecond = 8; // 1080p 有音频
      }
      credits = params.duration * perSecond;
      break;
    }

    case "seedance-1.0-pro-fast": {
      // Seedance 1.0 Fast: 按秒计费
      let perSecondFast = 3;
      if (isHighQuality) {
        perSecondFast = 6;
      }
      credits = params.duration * perSecondFast;
      break;
    }

    case "seedance-1.0-pro-quality": {
      // Seedance 1.0 Quality: 按秒计费，高质量
      let perSecondQuality = 5;
      if (isHighQuality) {
        perSecondQuality = 10;
      }
      credits = params.duration * perSecondQuality;
      break;
    }

    default: {
      // 默认逻辑（兼容旧配置）
      const extraSeconds = Math.max(0, params.duration - 10);
      credits = base + extraSeconds * perExtraSecond;

      if (isHighQuality && highQualityMultiplier > 1) {
        credits = credits * highQualityMultiplier;
      }
      break;
    }
  }

  // 向上取整
  return Math.ceil(credits);
}
