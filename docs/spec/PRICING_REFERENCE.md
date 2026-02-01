# AI 视频生成平台定价方案模板

> 📚 **这是一个参考模板** - 你可以根据自己选择的 AI 模型和 API 成本进行调整

---

## 📖 使用说明

### 本模板适用场景

这是一个 AI 视频生成 SaaS 平台的定价方案模板，适用于：

- 支持多种 AI 视频生成模型（Sora、Veo、Wan、Seedance 等）
- 基于积分的消费模式
- 订阅制 + 一次性购买混合模式

### 如何使用本模板

1. **确定你的基准模型** - 选择一个主要模型作为定价基准
2. **查询 API 成本** - 了解每个模型的实际 API 调用成本
3. **调整积分数量** - 根据你的成本模型修改积分数量
4. **设置目标毛利率** - 一般建议 40-70%
5. **在 Creem/Stripe 创建产品** - 按照模板的产品结构创建

### 本示例假设

本模板基于以下假设（**你需要根据自己的实际情况修改**）：

- **基准模型**: Veo 3.1 Fast Lite
- **基准消耗**: 10 积分/视频（固定）
- **进货价参考**: Evolink.ai 约 **1 积分 = ¥0.1**（≈ $0.014）
- **基准成本**: 约 ¥1.00/视频（≈ $0.14）= 10 积分 × ¥0.1
- **目标毛利率**: 50-70%

> 💡 **成本计算说明**:
> - 进货价基于 Evolink.ai: **1 积分 ≈ ¥0.1**（约 $0.014）
> - 如果一个视频消耗 10 积分，则成本 = 10 × ¥0.1 = **¥1.00**（约 $0.14）
> - 售价倍数 2.5x 可获得约 60% 毛利率（$0.35 / $0.14 - 1 = 150%）

---

## 🎯 积分消耗规则（示例）

### 模型积分配置

| 模型 | 720p | 1080p | 说明 |
|-----|------|-------|------|
| **Veo 3.1 Fast Lite** | **10 积分** | **10 积分** | 固定价格（基准） |
| **Sora 2 Lite** | 2 积分 | - | 10秒固定 |
| **Wan 2.6** | 25积分 (5秒) | 42积分 (5秒) | 1.67x 乘数 |
| **Seedance 1.5 Pro** | 4积分/秒 | 8积分/秒 | 按秒计费 |

> ⚠️ **重要**: 你需要根据自己的 API 成本重新计算积分消耗

### 积分计算公式

```
积分 = ceil(API成本(美元) × 10)
```

示例：
- 如果 API 成本是 $0.96，则积分为 ceil(0.96 × 10) = 10 积分
- 如果 API 成本是 $0.16，则积分为 ceil(0.16 × 10) = 2 积分

---

## 💰 完整产品定价方案（示例）

### 一、月付订阅 (3个)

| Product ID | 名称 | 价格 | 积分/月 | 基准视频数* | 单价/视频 | 毛利率** |
|------------|------|------|---------|-----------|-----------|---------|
| `basic_monthly` | Basic | $9.90 | 400 | ~40 | $0.248 | 44% |
| `pro_monthly` | Pro ⭐ | $29.90 | 1,500 | ~150 | $0.199 | 30% |
| `ultimate_monthly` | Ultimate | $79.90 | 4,500 | ~450 | $0.178 | 21% |

*以基准模型（10积分/视频）计算
**假设基准模型 API 成本为 $0.14/视频（¥1.00），目标毛利率 60%

### 二、年付订阅 (3个)

| Product ID | 名称 | ~~原价~~ | **年付价** | 积分/年 | 基准视频数 | 单价/视频 | 折扣 |
|------------|------|----------|------------|---------|----------|-----------|------|
| `basic_yearly` | Basic | ~~$118.80~~ | **$99** | 4,800 | ~480 | $0.206 | 17% |
| `pro_yearly` | Pro ⭐ | ~~$358.80~~ | **$239** | 18,000 | ~1,800 | $0.133 | 33% |
| `ultimate_yearly` | Ultimate | ~~$958.80~~ | **$699** | 54,000 | ~5,400 | $0.129 | 27% |

**年付优惠策略**：
- Basic：买10送12（标准优惠）
- Pro：33% OFF（限时优惠，主力产品）
- Ultimate：27% OFF（大客户优惠）

> 💡 **说明**: 年付通过额外赠送积分实现折扣，单价/视频更低

### 三、一次性积分包 (5个)

| Product ID | 名称 | 价格 | 积分 | 基准视频数 | 单价/视频 | 购买限制 | vs 订阅 |
|------------|------|------|------|----------|-----------|----------|---------|
| `starter_pack` | Starter | $14.90 | 400 | ~40 | $0.373 | 所有用户 | +50% vs Basic 月付 |
| `standard_pack` | Standard | $39.90 | 1,500 | ~150 | $0.266 | 订阅用户 | +33% vs Pro 月付 |
| `pro_pack` | Pro | $99.90 | 4,500 | ~450 | $0.222 | 订阅用户 | +25% vs Ultimate 月付 |
| `studio_pack` | Studio | $129.00 | 4,800 | ~480 | $0.269 | 订阅用户 | +30% vs Basic 年付 |
| `ultimate_pack` | Ultimate | $299.00 | 18,000 | ~1,800 | $0.166 | 订阅用户 | +25% vs Pro 年付 |

**有效期**：所有积分包 1 年有效

> 💡 **核心原则**: 积分包 = 订阅积分 + 25-35% 溢价
>
> **订阅最划算，积分用完买更贵**

---

## 📋 产品汇总表

| # | Product ID | 类型 | 价格 | 积分 | 基准视频数 | 单价/视频 | 有效期 |
|---|------------|------|------|------|----------|-----------|--------|
| **积分包** |||||||||
| 1 | `starter_pack` | One-time | $14.90 | 280 | ~28 | $0.532 | 1年 |
| 2 | `standard_pack` | One-time | $39.90 | 860 | ~86 | $0.464 | 1年 |
| 3 | `pro_pack` | One-time | $99.90 | 2,290 | ~229 | $0.436 | 1年 |
| 4 | `studio_pack` | One-time | $129.00 | 3,360 | ~336 | $0.384 | 1年 |
| 5 | `ultimate_pack` | One-time | $299.00 | 10,320 | ~1,032 | $0.290 | 1年 |
| **月付订阅** |||||||||
| 6 | `basic_monthly` | Monthly | $9.90 | 280 | ~28 | $0.354 | 1月 |
| 7 | `pro_monthly` | Monthly | $29.90 | 860 | ~86 | $0.348 | 1月 |
| 8 | `ultimate_monthly` | Monthly | $79.90 | 2,290 | ~229 | $0.349 | 1月 |
| **年付订阅** |||||||||
| 9 | `basic_yearly` | Yearly | $99 | 3,360 | ~336 | $0.295 | 1年 |
| 10 | `pro_yearly` | Yearly | $239 | 10,320 | ~1,032 | $0.232 | 1年 |
| 11 | `ultimate_yearly` | Yearly | $699 | 27,480 | ~2,748 | $0.254 | 1年 |

**总计: 11 个产品**

---

## 🔄 价格梯度分析

### 单价梯度（用户感知价值）

| 购买方式 | 单价/基准视频 | vs Starter | 毛利率 | 说明 |
|----------|-------------|------------|--------|------|
| Starter Pack | $0.532 | - | 74% | 入门体验价 |
| Standard Pack | $0.464 | -13% | 70% | 订阅用户专属 |
| Pro Pack | $0.436 | -18% | 68% | |
| Studio Pack | $0.384 | -28% | 64% | |
| Ultimate Pack | $0.290 | -45% | 52% | |
| Basic 月付 | $0.354 | -33% | 60% | **最划算** |
| Pro 月付 | $0.348 | -35% | 60% | **最划算** |
| Ultimate 月付 | $0.349 | -34% | 60% | **最划算** |
| Basic 年付 | $0.295 | -45% | 53% | 标准折扣 |
| Pro 年付 | $0.232 | -56% | 40% | **限时优惠** |
| Ultimate 年付 | $0.254 | -52% | 45% | 大客户优惠 |

### 设计理念

1. **Starter 积分包**: 单价最高（$0.532），74% 毛利率，面向免费用户
2. **其他积分包**: 单价 $0.29-0.46，52-70% 毛利率，订阅用户专属
3. **月付订阅**: 单价 $0.35 左右，60% 毛利率，**最划算**
4. **年付订阅**: 单价 $0.23-0.29，40-53% 毛利率，策略性优惠

**核心逻辑**：
- ✅ 订阅比积分包便宜 33-56%
- ✅ 激励用户订阅而非单独购买
- ✅ 年付通过赠送积分实现折扣

---

## 📊 毛利率分析（示例）

假设基准模型 API 成本为 $0.14/视频（¥1.00）：

| 产品 | 单价/视频 | 成本 | 毛利 | 毛利率 | 评价 |
|------|-----------|------|------|--------|------|
| Starter Pack | $0.532 | $0.14 | $0.392 | **74%** | ✅ 很高 |
| Standard Pack | $0.464 | $0.14 | $0.324 | **70%** | ✅ 很高 |
| Pro Pack | $0.436 | $0.14 | $0.296 | **68%** | ✅ 很高 |
| Studio Pack | $0.384 | $0.14 | $0.244 | **64%** | ✅ 健康 |
| Ultimate Pack | $0.290 | $0.14 | $0.150 | **52%** | ✅ 健康 |
| Basic 月付 | $0.354 | $0.14 | $0.214 | **60%** | ✅ 健康 |
| Pro 月付 | $0.348 | $0.14 | $0.208 | **60%** | ✅ 健康 |
| Ultimate 月付 | $0.349 | $0.14 | $0.209 | **60%** | ✅ 健康 |
| Basic 年付 | $0.295 | $0.14 | $0.155 | **53%** | ✅ 可接受 |
| Pro 年付 | $0.232 | $0.14 | $0.092 | **40%** | ⚠️ 策略性 |
| Ultimate 年付 | $0.254 | $0.14 | $0.114 | **45%** | ⚠️ 策略性 |

**结论**：
- 积分包和月付订阅保持 52-74% 健康毛利
- 年付订阅通过薄利多销获取长期客户（40-53%）
- Pro 年付 33% 折扣作为引流主力产品，毛利 40%

> ⚠️ **重要**: 以上基于 Veo 3.1 Fast Lite 成本约 ¥1.00（$0.14）/视频，你需要根据自己的实际 API 成本重新计算

---

## 📝 支付平台产品配置

### 积分包示例

```json
{
  "product_id": "starter_pack",
  "product_name": "AI Video Starter Pack",
  "description": "Get {credits} credits (~{videos} videos) for AI video generation. One-time purchase, valid for 1 year. Commercial license included.",
  "price": 14.90,
  "metadata": {
    "credits": 430,
    "valid_months": 12,
    "subscriber_only": false
  }
}
```

### 月付订阅示例

```json
{
  "product_id": "basic_monthly",
  "product_name": "AI Video Basic Plan (Monthly)",
  "description": "Monthly subscription with {credits} credits (~{videos} videos) per month. Priority generation and commercial license included.",
  "price": 9.90,
  "interval": "month",
  "metadata": {
    "credits": 280,
    "valid_months": 1
  }
}
```

### 年付订阅示例

```json
{
  "product_id": "basic_yearly",
  "product_name": "AI Video Basic Plan (Annual)",
  "description": "Annual subscription with {credits} credits (~{videos} videos) for the year. Pay for 10 months, get 12 months of credits. Priority generation and commercial license included.",
  "price": 99.00,
  "interval": "year",
  "metadata": {
    "credits": 3360,
    "valid_months": 12,
    "original_price": 118.80
  }
}
```

### 完整产品列表

| # | Product ID | 类型 | 价格 | 积分 |
|---|------------|------|------|------|
| 1 | `starter_pack` | One-time | $14.90 | 430 |
| 2 | `standard_pack` | One-time | $29.90 | 860 |
| 3 | `pro_pack` | One-time | $59.90 | 1,720 |
| 4 | `studio_pack` | One-time | $99.00 | 2,840 |
| 5 | `ultimate_pack` | One-time | $199.00 | 5,700 |
| 6 | `basic_monthly` | Monthly | $9.90 | 280 |
| 7 | `pro_monthly` | Monthly | $29.90 | 860 |
| 8 | `ultimate_monthly` | Monthly | $79.90 | 2,290 |
| 9 | `basic_yearly` | Yearly | $99 | 3,360 |
| 10 | `pro_yearly` | Yearly | $239 | 10,320 |
| 11 | `ultimate_yearly` | Yearly | $699 | 27,480 |

---

## 🎨 商品描述模板

### 积分包模板

```
Get {credits} credits (~{videos} videos) for AI video generation. One-time purchase, valid for 1 year. Commercial license included.
```

示例:
- Starter: "Get 430 credits (~43 videos) for AI video generation. One-time purchase, valid for 1 year. Commercial license included."

### 月付订阅模板

```
Monthly subscription with {credits} credits (~{videos} videos) per month. Priority generation and commercial license included.
```

### 年付订阅模板（标准）

```
Annual subscription with {credits} credits (~{videos} videos) for the year. Pay for 10 months, get 12 months of credits. Priority generation and commercial license included.
```

### 年付订阅模板（限时优惠）

```
Annual subscription with {credits} credits (~{videos} videos) for the year. {Discount_Name} limited offer - {Discount}% OFF! Priority generation and commercial license included.
```

示例:
- Pro 年付: "Annual subscription with 10,320 credits (~1,032 videos) for the year. 2026 New Year limited offer - 33% OFF! Priority generation and commercial license included."

---

## 💡 定价策略指南

### 1. 确定基准模型

选择一个主要模型作为定价基准：
- 建议选择最常用的模型
- 或者选择成本中等的模型
- 确保该模型稳定可靠

### 2. 计算积分消耗

```
积分 = ceil(API成本(美元) × 倍数)
```

倍数建议：
- **保守策略**: 10倍（毛利率高，约60%+）
- **平衡策略**: 8-10倍（毛利率约50-60%）
- **激进策略**: 5-8倍（毛利率约40-50%，快速获客）

示例计算（基于 Evolink.ai 进货价 ¥0.1/积分）:

假设基准模型（Veo 3.1 Fast Lite）消耗 10 积分/视频:

**成本计算**:
- 积分消耗: 10 积分
- 进货价: 10 × ¥0.1 = ¥1.00 ≈ $0.14
- 这是纯 API 成本

**定价策略（选择倍数）**:

| 策略 | 倍数 | 售价 | 毛利 | 毛利率 | 适用场景 |
|------|------|------|------|--------|----------|
| 保守 | 10x | $1.40 | $1.26 | 90% | 高端市场，强调质量 |
| 平衡 | 7x | $0.98 | $0.84 | 86% | **推荐**（本模板采用 2.5x） |
| 标准 | 5x | $0.70 | $0.56 | 80% | 竞争激烈市场 |
| 激进 | 2.5x | $0.35 | $0.21 | 60% | **本模板采用**，平衡获客与利润 |

> 💡 **重要说明**: 本模板采用 2.5x 倍数（约 $0.35/视频），毛利率 60%，这是基于:
> - 10 积分 × ¥0.1 = $0.14 成本
> - $0.35 售价 = $0.14 × 2.5
> - 毛利率 = ($0.35 - $0.14) / $0.35 = 60%

### 3. 设置订阅积分

月付积分建议：
- Basic: 30-50 个基准视频
- Pro: 100-200 个基准视频
- Ultimate: 300-600 个基准视频

年付积分建议：
- 月付积分 × 12 × 1.2-1.5（赠送20-50%）

### 4. 设置积分包

积分包应该提供：
- 灵活性：不订阅也能使用
- 引导作用：引导用户转为订阅
- 价格梯度：明显的单价优势

建议比例：
- Starter: 0.5-1 个月积分
- Standard: 1-2 个月积分
- Pro: 2-4 个月积分
- Studio: 4-8 个月积分
- Ultimate: 8-16 个月积分

### 5. 年付折扣策略

建议折扣：
- Basic: 15-20%（标准优惠）
- Pro: 25-35%（主力产品，可限时）
- Ultimate: 20-30%（大客户）

---

## 📝 代码配置示例

### pricing-user.ts 结构

```typescript
// ============================================
// 一、基础设置
// ============================================

export const NEW_USER_GIFT = {
  enabled: true,
  credits: 2,  // 根据基准模型调整（建议 1-3 个视频）
  validDays: 30,
};

export const CREDIT_EXPIRATION = {
  subscriptionDays: 30,    // 订阅积分有效期（天）
  purchaseDays: 365,       // 一次性购买积分有效期（天）
  warnBeforeDays: 7,       // 过期提醒（天）
};

// ============================================
// 二、订阅产品配置
// ============================================

export const SUBSCRIPTION_PRODUCTS = [
  // 月付订阅
  {
    id: "basic_monthly",
    name: "Basic Plan",
    priceUsd: 9.9,
    credits: 280,  // 根据基准模型调整
    // 成本计算: 280 积分 × ¥0.1 = ¥28 ≈ $3.9
    // 售价: $9.9 → 毛利率约 60%
    period: "month" as const,
    popular: false,
    enabled: true,
    features: ["hd_videos", "fast_generation"],
  },
  // ... 其他产品
];

// ============================================
// 三、一次性购买积分包
// ============================================

export const CREDIT_PACKAGES: CreditPackageConfig[] = [
  {
    id: "starter_pack",
    name: "Starter Pack",
    priceUsd: 14.9,
    credits: 430,  // 根据基准模型调整
    // 成本计算: 430 积分 × ¥0.1 = ¥43 ≈ $6
    // 售价: $14.9 → 毛利率约 60%
    popular: false,
    enabled: true,
    allowFreeUser: true,  // 所有用户可购买
    features: ["hd_videos", "fast_generation"],
  },
  // ... 其他积分包
];

// ============================================
// 四、AI 模型积分计费
// ============================================

export const VIDEO_MODEL_PRICING: Record<string, VideoModelPricing> = {
  "your-model-id": {
    baseCredits: 10,  // 根据成本计算
    // 成本: 10 积分 × ¥0.1 = ¥1 ≈ $0.14
    // 建议售价: $0.35（约 2.5x，60% 毛利率）
    perSecond: 0,     // 固定价格用 0
    qualityMultiplier: 1,  // 1080p vs 720p 比例
    enabled: true,
  },
};
```

---

## ✅ 实施清单

### 第一阶段：定价设计
- [ ] 确定基准模型和积分消耗
- [ ] 查询各模型 API 成本
- [ ] 计算目标毛利率
- [ ] 设置订阅积分数量
- [ ] 设置积分包数量和价格

### 第二阶段：配置文件
- [ ] 更新 `src/config/pricing-user.ts`
- [ ] 更新 `VIDEO_MODEL_PRICING` 配置
- [ ] 更新 `NEW_USER_GIFT` 配置
- [ ] 更新 `CREDIT_PACKAGES` 配置

### 第三阶段：支付平台
- [ ] 在 Creem/Stripe 创建产品
- [ ] 配置产品描述和 metadata
- [ ] 设置 Webhook
- [ ] 测试支付流程

### 第四阶段：前端实现
- [ ] 更新 Pricing 页面 UI
- [ ] 更新多语言翻译文件
- [ ] 添加积分包订阅限制
- [ ] 测试购买流程

### 第五阶段：上线验证
- [ ] 监控实际 API 成本
- [ ] 监控用户使用数据
- [ ] 根据数据调整定价
- [ ] A/B 测试不同价格

---

## 📊 成本监控指标

上线后需要监控的关键指标：

1. **实际 API 成本**
   - 每个模型的平均成本
   - 不同分辨率的成本差异
   - 不同时长的成本差异

2. **用户使用行为**
   - 用户主要使用哪个模型
   - 平均生成视频时长
   - HD 使用率

3. **财务指标**
   - 实际毛利率 vs 目标毛利率
   - 积分消耗速度
   - 订阅转化率

4. **调整信号**
   - 如果实际毛利 < 目标毛利 10%：考虑涨价
   - 如果用户流失率高：考虑降低积分消耗
   - 如果某个模型使用率过低：调整积分消耗

---

## 🎯 常见问题

### Q1: 如何确定基准积分？

答：查询你的主要模型 API 成本，然后：
```
基准积分 = ceil(API成本 × 目标倍数)
```
例如：API 成本 $0.10，目标倍数 10x → 1 积分

### Q2: 年付应该给多少折扣？

答：建议 20-35%，根据你的目标：
- 20%：标准折扣，平衡利润和用户
- 30%：激进获客，牺牲利润换增长
- 35%+：限时促销，短期冲量

### Q3: 积分包应该比订阅贵多少？

答：建议积分包单价比月付贵 50-100%：
- 月付: $0.20/视频
- 积分包: $0.30-0.40/视频
- 差价用于补偿订阅的持续收入

### Q4: 如何处理免费用户？

答：建议策略：
- 新用户赠送 1-3 个视频体验
- 允许购买 Starter 积分包（低价）
- 其他积分包需要订阅（引导转化）

### Q5: 上线后发现定价错了怎么办？

答：
1. **不要直接修改现有产品** - 会影响已有订单
2. **创建新产品** - 用 v2 后缀
3. **逐步迁移** - 新用户用新产品
4. **老用户可选** - 允许升级到新产品

---

## 🔗 相关资源

### 支付平台文档
- Creem: [支付平台文档链接]
- Stripe: [支付平台文档链接]

### AI 模型文档
- Sora API: [模型 API 文档链接]
- Veo API: [模型 API 文档链接]
- 其他模型: [模型 API 文档链接]

### 本项目相关
- 配置文件: `src/config/pricing-user.ts`
- 积分服务: `src/services/credit.ts`
- 视频服务: `src/services/video.ts`

---

## 📌 重要提示

### ⚠️ 定价风险

1. **成本超支**
   - 风险：实际 API 成本高于预期
   - 应对：预留 10-20% 成本 buffer

2. **价格敏感**
   - 风险：用户觉得价格太高
   - 应对：提供分层定价，满足不同预算

3. **竞争压力**
   - 风险：竞品低价竞争
   - 应对：强调质量和差异化

### ✅ 定价最佳实践

1. **从小做起** - 先小规模测试，验证成本和转化
2. **数据驱动** - 根据实际数据调整，不要凭感觉
3. **灵活调整** - 定价不是一成不变的，定期评估
4. **用户沟通** - 调价时提前通知用户，解释原因
5. **价值导向** - 强调你的产品价值，而不是比价格

---

*文档版本: v2.0 (教学模板版)*
*创建日期: 2026-02-02*
*适用平台: AI 视频生成 SaaS*
*注意事项: 本文档仅供参考，请根据实际情况调整*
