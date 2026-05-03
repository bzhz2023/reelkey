# ReelKey 开发计划 v2.0

基于 videofly-template 改造为 BYOK 模式。

**核心改造：** Key 安全方案从"加密存数据库"改为"浏览器存储 + 服务端代理转发"。

---

## 核心架构（必须理解）

```
用户浏览器 localStorage（存 Key，永久保存）
         ↓ 每次请求附在 Header: x-fal-key
Next.js API Route（代理层，转发不存储）
         ↓ 转发给 fal.ai（Key 在内存中，请求结束即消失）
fal.ai 执行生成 → 返回视频 URL
         ↓
服务端下载视频 → 上传 Cloudflare R2（此步不需要 Key）
         ↓
数据库记录：视频信息 + 生成成本（不含 Key）
```

**Key 的生命周期：用户浏览器 → 请求 Header → 服务器内存（毫秒级）→ 消失。**
**数据库里永远没有 Key。**

---

## 计划复核与修正（2026-05-02）

原计划方向正确，但有几处会直接影响主流程可用性，后续请按以下修正执行：

1. `@fal-ai/client` 导入方式必须是：
   - `import { fal } from "@fal-ai/client"`
   - 不要使用 `import * as fal`（TypeScript 下会导致 `fal.config / fal.queue` 类型报错）

2. `BYOK` 主链路必须强制 `x-fal-key`：
   - `/api/v1/video/generate` 缺 key 返回结构化错误：`code: "FAL_KEY_MISSING"`
   - 前端收到 `FAL_KEY_MISSING / FAL_KEY_INVALID` 自动弹出 key 设置弹窗

3. 状态轮询也必须带用户 key：
   - 前端轮询 `/api/v1/video/[uuid]/status` 时附带 `x-fal-key`
   - 服务端 `refreshStatus(uuid, userId, userApiKey)` 使用 `getProviderWithKey("falai", userApiKey)` 查询 fal 状态
   - 不允许在轮询时依赖平台环境变量 key

4. callback 路由必须支持 `falai`：
   - `/api/v1/video/callback/[provider]` 的 provider 白名单包含 `falai`
   - `falai` 回调解析不能走 `getProvider("falai")`（该路径要求环境变量 key），应使用纯解析函数

5. fal 状态查询必须避免固定单 endpoint：
   - 不能只查 kling endpoint
   - 至少做 endpoint 兜底尝试，查不到时优先返回 `processing` 避免误判失败
   - 401/403 映射 `FAL_KEY_INVALID`，402 映射余额不足

6. 弹窗集成位置以当前项目结构为准：
   - 优先在 `src/components/tool/tool-page-layout.tsx` 集成 key 缺失弹窗与 `fal-key-missing` 事件
   - 不建议在服务端 layout 组件里直接做浏览器事件逻辑

7. fal 任务完成链路要按 provider 生命周期处理：
   - `createTask` 必须把本次使用的 `falEndpoint` 存进 `videos.parameters`
   - 轮询时优先使用该 endpoint 查询 `fal.queue.status/result`，避免 request id 与 endpoint 不匹配导致一直显示生成中
   - webhook 解析要兼容 `request_id/requestId/id` 以及 `payload/data/output` 多层结果结构
   - 如果回调 URL 签名已通过且 videoUuid 已定位记录，fal 回调缺少 task id 时不应直接丢弃完成结果

8. BYOK 模式不能走平台积分结算失败路径：
   - 用户 key 生成时没有 `credit_holds` 记录
   - `creditService.release` 和 `creditService.settle` 都应在无 hold 时静默返回
   - 否则 fal.ai 已完成后，R2 转存/完成入库阶段会因为 `Hold not found` 回滚，页面保持生成中

9. API Key 校验必须按 provider 独立实现：
   - 当前 fal.ai 校验使用 `fal.queue.status` 查询一个不存在的 request id：401/403 代表 key 无效，404 代表认证通过但任务不存在
   - 该规则只适用于 fal.ai，不能直接复用到 OpenRouter、KIE、Evolink 等其他 provider
   - 后续新增 provider 时，应提供各自的最小无计费校验方式，并把校验结果统一映射为 `valid / invalid / temporarily_unavailable`
   - UI 层只展示统一连接状态，不应关心具体 provider 的校验细节

---

## 开发顺序（10 天计划）

### Phase 0: 环境配置（等用户完成）

**配置 `.env.local`：**
```bash
# 数据库
DATABASE_URL=

# 认证
BETTER_AUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# R2 存储
STORAGE_ENDPOINT=
STORAGE_ACCESS_KEY=
STORAGE_SECRET_KEY=
STORAGE_BUCKET=
STORAGE_DOMAIN=

# Callback（本地用 ngrok，生产用真实域名）
AI_CALLBACK_URL=
CALLBACK_HMAC_SECRET=

# 邮件
RESEND_API_KEY=
RESEND_FROM=

# 支付（可后续配置）
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
```

**需要删除的环境变量：**
```bash
# 删除这些（不再需要平台 AI Provider Keys）
EVOLINK_API_KEY=
KIE_API_KEY=
APIMART_API_KEY=
DEFAULT_AI_PROVIDER=
```

**本地开发 Callback 配置：**
```bash
# 安装 ngrok
brew install ngrok

# 启动 ngrok
ngrok http 3000

# 把生成的 URL 填入 .env.local
AI_CALLBACK_URL=https://xxxx.ngrok.io/api/v1/video/callback
```

---

### Phase 1: fal.ai 基础集成（Day 1-2）

#### 1.1 安装依赖（5分钟）
```bash
pnpm add @fal-ai/client @fal-ai/server-proxy
```

#### 1.2 创建 fal.ai 代理 Route（15分钟）

**新建：`src/app/api/fal/proxy/[...path]/route.ts`**
```ts
import { route } from "@fal-ai/server-proxy/nextjs";
export const { GET, POST } = route;
```

这个 Route 接收前端发来的 fal.ai 请求，把 Header 里的用户 Key 转发给 fal.ai。
fal.ai 官方库会自动处理 Key 的提取和转发，无需手写逻辑。

#### 1.3 创建 Key 管理工具层（1小时）

**新建：`src/lib/fal-key.ts`**

localStorage 的统一读写封装：

```ts
const STORAGE_KEY = "reelkey_fal_api_key";

export const falKeyStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  },
  set: (key: string): void => {
    localStorage.setItem(STORAGE_KEY, key);
  },
  remove: (): void => {
    localStorage.removeItem(STORAGE_KEY);
  },
  exists: (): boolean => !!falKeyStorage.get(),
};
```

**新建：`src/lib/fal-client.ts`**

fal 客户端配置 + Key 验证：

```ts
import * as fal from "@fal-ai/client";
import { falKeyStorage } from "./fal-key";

// 每次调用前配置客户端
export function configureFalClient(key?: string) {
  fal.config({
    proxyUrl: "/api/fal/proxy",
    credentials: key || falKeyStorage.get() || undefined,
  });
}

// 验证 Key 是否有效（调用一个最轻量的 fal.ai 接口）
export async function validateFalKey(key: string): Promise<{
  valid: boolean;
  error?: string;
}> {
  try {
    configureFalClient(key);
    // 尝试查询一个任务状态（会返回 404，但 Key 有效时不会返回 401）
    await fal.queue.status("fal-ai/kling-video/v2.1/standard/text-to-video", {
      requestId: "validation-test",
      logs: false,
    });
    return { valid: true };
  } catch (e: any) {
    if (e?.status === 401 || e?.status === 403) {
      return { valid: false, error: "Invalid API key" };
    }
    // 其他错误（404 等）说明 Key 本身有效，只是请求参数有问题
    return { valid: true };
  }
}
```

#### 1.4 创建 useFalKey Hook（1小时）

**新建：`src/hooks/use-fal-key.ts`**

管理 Key 状态的 React Hook，供全局使用：

```ts
"use client";
import { useState, useEffect } from "react";
import { falKeyStorage } from "@/lib/fal-key";
import { validateFalKey } from "@/lib/fal-client";

export type FalKeyStatus = "missing" | "validating" | "valid" | "invalid";

export function useFalKey() {
  const [status, setStatus] = useState<FalKeyStatus>("missing");
  const [maskedKey, setMaskedKey] = useState<string | null>(null);

  useEffect(() => {
    const stored = falKeyStorage.get();
    if (stored) {
      setStatus("valid");
      setMaskedKey(maskKey(stored));
    }
  }, []);

  const saveKey = async (newKey: string): Promise<boolean> => {
    setStatus("validating");
    const result = await validateFalKey(newKey);
    if (result.valid) {
      falKeyStorage.set(newKey);
      setStatus("valid");
      setMaskedKey(maskKey(newKey));
      return true;
    } else {
      setStatus("invalid");
      return false;
    }
  };

  const removeKey = () => {
    falKeyStorage.remove();
    setStatus("missing");
    setMaskedKey(null);
  };

  return { status, maskedKey, saveKey, removeKey };
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return key.slice(0, 6) + "..." + key.slice(-4);
}
```

---

### Phase 2: FalAiProvider 实现（Day 3）

#### 2.1 创建 FalAiProvider（2-3小时）

**新建：`src/ai/providers/falai.ts`**

实现 `AIVideoProvider` 接口，接收用户 Key 作为构造参数：

```ts
import * as fal from "@fal-ai/client";
import type { AIVideoProvider, VideoGenerationParams, VideoTaskResponse } from "../types";

// fal.ai 模型的 endpoint 映射
const FAL_ENDPOINTS: Record<string, { t2v: string; i2v?: string }> = {
  "kling-2.5-turbo": {
    t2v: "fal-ai/kling-video/v2.1/standard/text-to-video",
    i2v: "fal-ai/kling-video/v2.1/standard/image-to-video",
  },
  "wan-2.5": {
    t2v: "fal-ai/wan/v2.2/text-to-video",
    i2v: "fal-ai/wan/v2.2/image-to-video",
  },
};

export class FalAiProvider implements AIVideoProvider {
  name = "falai";
  supportImageToVideo = true;

  constructor(private apiKey: string) {
    // Key 作为参数传入，不从环境变量读，不持久化
    fal.config({
      proxyUrl: "/api/fal/proxy",
      credentials: apiKey,
    });
  }

  async createTask(params: VideoGenerationParams): Promise<VideoTaskResponse> {
    const modelKey = params.model || "kling-2.5-turbo";
    const endpoints = FAL_ENDPOINTS[modelKey];
    if (!endpoints) throw new Error(`Unsupported model: ${modelKey}`);

    const isI2V = !!params.imageUrl;
    const endpoint = isI2V ? endpoints.i2v : endpoints.t2v;
    if (!endpoint) throw new Error(`Model ${modelKey} does not support image-to-video`);

    const input: Record<string, any> = {
      prompt: params.prompt,
      duration: params.duration || 5,
      aspect_ratio: params.aspectRatio || "16:9",
    };
    if (isI2V) input.image_url = params.imageUrl;

    const { request_id } = await fal.queue.submit(endpoint, {
      input,
      webhookUrl: params.callbackUrl,
    });

    return {
      taskId: request_id,
      provider: "falai" as any,
      status: "pending",
    };
  }

  async getTaskStatus(taskId: string): Promise<VideoTaskResponse> {
    // 简化：先轮询 Kling endpoint（实际应该记录模型信息）
    try {
      const status = await fal.queue.status(
        "fal-ai/kling-video/v2.1/standard/text-to-video",
        { requestId: taskId, logs: false }
      );

      if (status.status === "COMPLETED") {
        const result = await fal.queue.result(
          "fal-ai/kling-video/v2.1/standard/text-to-video",
          { requestId: taskId }
        );
        return {
          taskId,
          provider: "falai" as any,
          status: "completed",
          videoUrl: (result.data as any)?.video?.url,
        };
      }

      return {
        taskId,
        provider: "falai" as any,
        status: status.status === "FAILED" ? "failed" : "processing",
      };
    } catch (e) {
      return { taskId, provider: "falai" as any, status: "failed" };
    }
  }

  parseCallback(payload: any): VideoTaskResponse {
    const isSuccess = payload.status === "OK";
    return {
      taskId: payload.request_id,
      provider: "falai" as any,
      status: isSuccess ? "completed" : "failed",
      videoUrl: payload.payload?.video?.url,
      error: !isSuccess
        ? { code: "FAL_ERROR", message: payload.error || "Generation failed" }
        : undefined,
    };
  }
}
```

#### 2.2 注册 FalAiProvider（30分钟）

**修改：`src/ai/types.ts`**
```ts
export type ProviderType = "evolink" | "kie" | "apimart" | "falai";
```

**修改：`src/ai/index.ts`**
```ts
import { FalAiProvider } from "./providers/falai";

// 新增一个支持传入 Key 的工厂函数
export function getProviderWithKey(type: ProviderType, apiKey: string): AIVideoProvider {
  switch (type) {
    case "falai":
      return new FalAiProvider(apiKey);
    default:
      return getProvider(type); // 原有逻辑保留
  }
}
```

**修改：`src/ai/provider-config.ts`**
```ts
export const AI_PROVIDERS = ["evolink", "kie", "apimart", "falai"] as const;
```

---

### Phase 3: 视频生成 API 改造（Day 4）

#### 3.1 修改视频生成 API（1小时）

**修改：`src/app/api/v1/video/generate/route.ts`**

从请求 Header 取用户 Key，传给 service 层：

```ts
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request);

    // 从 Header 取用户的 fal.ai Key（BYOK 必填）
    const falApiKey = request.headers.get("x-fal-key");
    if (!falApiKey) {
      throw new ApiError(
        "Please set your fal.ai API key before generating videos.",
        400,
        { code: "FAL_KEY_MISSING" }
      );
    }

    const body = await request.json();
    const data = generateSchema.parse(body);

    const result = await videoService.generate({
      userId: user.id,
      falApiKey,        // 传给 service，不存储
      prompt: data.prompt,
      model: data.model,
      // ...其他参数
    });

    return apiSuccess(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

**修改：`src/services/video.ts`**

`GenerateVideoParams` 加 `falApiKey` 字段，传给 Provider：

```ts
export interface GenerateVideoParams {
  userId: string;
  falApiKey: string;  // 新增，来自用户请求，不存数据库
  prompt: string;
  // ...其他字段不变
}

// generate 方法里：
async generate(params: GenerateVideoParams) {
  // 用用户的 Key 创建 Provider
  const provider = getProviderWithKey("falai", params.falApiKey);
  // ...原有生成逻辑，只是 provider 来源变了
}
```

**补充：轮询接口也要传 key**

```ts
// src/app/api/v1/video/[uuid]/status/route.ts
const userApiKey = request.headers.get("x-fal-key") || undefined;
const result = await videoService.refreshStatus(uuid, user.id, userApiKey);
```

#### 3.2 修改前端调用（30分钟）

**修改：`src/lib/video-api.ts`**

前端调用时在 Header 里附上 Key：

```ts
export async function generateVideo(data: VideoGenerateRequest) {
  const falKey = falKeyStorage.get();
  if (!falKey) {
    throw new Error("FAL_KEY_MISSING");
  }

  const response = await fetch("/api/v1/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fal-key": falKey,  // 附上用户 Key
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    const code = error?.error?.details?.code;
    if (code === "FAL_KEY_MISSING" || code === "FAL_KEY_INVALID") {
      // 触发重新输入 Key 的流程
      window.dispatchEvent(new Event("fal-key-missing"));
    }
    throw new Error(error?.error?.message || "Generation failed");
  }

  return response.json();
}
```

---

### Phase 4: 首次引导弹窗（Day 6）

#### 4.1 创建首次引导弹窗组件（2小时）

**新建：`src/components/onboarding/fal-key-modal.tsx`**

（完整代码见 BYOK-SECURITY-DESIGN.md 第七节）

#### 4.2 在工具页布局中集成弹窗（30分钟）

**修改：`src/components/tool/tool-page-layout.tsx`**

在工具页布局里检测 Key 状态，Key 缺失时显示弹窗：

```tsx
"use client";
import { useState, useEffect } from "react";
import { FalKeyModal } from "@/components/onboarding/fal-key-modal";
import { falKeyStorage } from "@/lib/fal-key";

export default function ToolLayout({ children }) {
  const [showKeyModal, setShowKeyModal] = useState(false);

  useEffect(() => {
    // 检测 Key 是否存在
    if (!falKeyStorage.exists()) {
      setShowKeyModal(true);
    }
    // 监听 Key 丢失事件（来自 video-api.ts 的 401 处理）
    const handler = () => setShowKeyModal(true);
    window.addEventListener("fal-key-missing", handler);
    return () => window.removeEventListener("fal-key-missing", handler);
  }, []);

  return (
    <>
      {children}
      <FalKeyModal
        open={showKeyModal}
        onSuccess={() => setShowKeyModal(false)}
      />
    </>
  );
}
```

---

### Phase 5: 设置页 Key 管理（Day 7）

#### 5.1 创建设置页 Key 管理组件（1小时）

**新建：`src/components/settings/fal-key-section.tsx`**

（完整代码见 BYOK-SECURITY-DESIGN.md 第七节）

#### 5.2 集成到设置页（30分钟）

**修改：`src/app/[locale]/(dashboard)/settings/page.tsx`**

引入 `FalKeySection`，放在设置页顶部（最重要的设置）。

---

### Phase 6: 模型配置（Day 8）

#### 6.1 配置 fal.ai 模型（30分钟）

**修改：`src/config/pricing-user.ts`**
```ts
export const VIDEO_MODEL_PRICING = {
  "kling-2.5-turbo": {
    baseCredits: 35,   // $0.35（5s 720p）
    perSecond: 7,      // $0.07/s
    enabled: true,
  },
  "wan-2.5": {
    baseCredits: 25,   // $0.25（5s）
    perSecond: 5,      // $0.05/s
    enabled: true,
  },
  // ...
}
```

**修改：`src/config/credits.ts` 的 `baseConfigs`**
```ts
"kling-2.5-turbo": {
  id: "kling-2.5-turbo",
  name: "Kling 2.5 Turbo Pro",
  provider: "falai" as const,
  description: "Fast, cinematic video generation",
  supportImageToVideo: true,
  maxDuration: 10,
  durations: [5, 10],
  aspectRatios: ["16:9", "9:16", "1:1"],
},
"wan-2.5": {
  id: "wan-2.5",
  name: "Wan 2.5",
  provider: "falai" as const,
  description: "Cost-effective, great for B-roll",
  supportImageToVideo: true,
  maxDuration: 5,
  durations: [5],
  aspectRatios: ["16:9", "9:16", "1:1"],
},
```

#### 6.2 禁用原有模型（15分钟）

```ts
"sora-2": { enabled: false, badge: "Coming Soon" },
"veo-3.1": { enabled: false, badge: "Coming Soon" },
"seedance-1.5-pro": { enabled: false },
```

---

### Phase 7: 完整流程测试（Day 5）

测试路径：
1. 注册/登录
2. 进入设置页，输入 fal.ai Key
3. 验证 Key 有效性
4. 选择模型（Kling 或 Wan）
5. 输入 Prompt，选择参数
6. 生成视频（观察进度）
7. 查看结果（预览、下载）
8. 检查"使用记录"页面的花费显示

**关键检查点：**
- [ ] Key 验证在 3 秒内完成
- [ ] 生成前显示预估费用
- [ ] 生成后显示实际费用
- [ ] 费用误差 < 5%
- [ ] 视频可以正常预览和下载

---

### Phase 8: 积分系统改造（Day 8）

#### 8.1 添加 BYOK 开关（15分钟）✅

```ts
// src/config/credits.ts
export const CREDITS_CONFIG = {
  BYOK_MODE: true,  // 新增开关
  // ...
}
```

#### 8.2 工具页积分入口隐藏（45分钟）✅

- 保留原积分代码，通过 `CREDITS_CONFIG.BYOK_MODE` 控制展示
- 顶部栏隐藏积分余额
- 侧边栏隐藏 `Credits` 入口和 `Upgrade to Pro` 积分升级区
- 生成面板从 `Total Credits` 改为 BYOK 计费说明
- 生成提交不再检查/冻结/释放平台积分，缺少 fal.ai Key 时直接弹出 Key 设置弹窗
- 工具落地页移除 `free credits` 文案，改为提示用户使用自己的 fal.ai API Key

#### 8.3 改造成本显示（1小时）✅

- 保留原 `src/components/credits/credits-page.tsx`、`BalanceCard`、`CreditHistory` 代码，便于未来非 BYOK 模式复用
- 新增 BYOK 专用 `src/components/usage/api-usage-page.tsx`
- `/credits` 路由根据 `CREDITS_CONFIG.BYOK_MODE` 切换：
  - BYOK 模式：显示 API usage、生成统计、估算 provider 成本、fal.ai billing 入口
  - 非 BYOK 模式：继续显示原积分页面

#### 8.4 改造历史页面（1小时）✅

- BYOK usage 表格列：Generation、Model、Settings、Status、Cost
- 记录列表展示全部请求，便于排查失败和生成中的任务
- 顶部 Estimated cost 只统计已完成且预计会被 provider 计费的请求
- 成本显示按 provider/model 独立估算：
  - `falai` + `kling-2.5-turbo`：按 fal.ai 当前用量口径 `duration * $0.07` 估算
  - 失败请求显示 `Not billed`，生成中请求显示 `Pending`
- 表格只读取 ReelKey 已有视频记录，不触发 fal.ai 请求，不消耗生成费用

---

### Phase 9: 定价与支付（Day 9）

#### 9.1 更新定价页面（1小时）✅

- 修改 `src/components/landing/pricing-section.tsx`
- BYOK 模式下不展示原订阅/积分购买页，原代码保留给非 BYOK 模式复用
- 新增 `src/config/byok-pricing.ts`，集中配置免费版、买断早鸟、买断正式价格和权益
- 新增 `src/components/price/byok-lifetime-pricing.tsx`
- 改为买断制：
  ```
  免费版：10次/月 + 2模型 + 7天历史
  买断版（早鸟）：$29 无限次 + 全模型 + 云端存储
  买断版（正式）：$49（早鸟期后）
  ```
- 当前早鸟购买按钮已预留 Creem checkout 入口；正式可用前需要在 9.2 配置 `NEXT_PUBLIC_CREEM_LIFETIME_PRODUCT_ID`

#### 9.2 配置 Creem（30分钟）

- 在 Creem 后台创建产品："ReelKey Lifetime — $29"
- 复制 Product ID 到 `src/config/pricing-user.ts`
- 配置 Webhook URL

---

### Phase 10: 部署与验证（Day 10）

- [ ] Vercel 部署成功
- [ ] 域名 DNS 配置
- [ ] SSL 证书正常
- [ ] Callback URL 可达
- [ ] R2 CORS 配置正确
- [ ] 生产环境完整测试

---

## 容易踩的坑

| 问题 | 解法 |
|------|------|
| fal.ai webhook 本地收不到 | 用 ngrok: `ngrok http 3000`，把生成的 URL 填入 `AI_CALLBACK_URL` |
| R2 视频无法在浏览器播放 | 检查 R2 Bucket 的 CORS 配置，允许你的域名 |
| fal.ai endpoint 字符串拼错 | 去 fal.ai/models 确认每个模型的完整 endpoint 路径 |
| localStorage 在 SSR 报错 | 所有 `localStorage` 访问加 `typeof window !== "undefined"` 判断 |
| Key 验证时 fal.ai 返回 404 | 404 不代表 Key 无效，只是任务不存在；只有 401/403 才是 Key 问题 |
| Kling 生成超过 3 分钟 | 正常现象，不是 Bug；UI 显示进度计时，不要让用户以为卡死了 |

---

## 暂不做（MVP 范围外）

- 多模型并行对比（P1）
- Prompt 模板库（P1）
- 免费版生成次数限制（先全开）
- 国际化（先只做英文）
- 跨设备 Key 同步（localStorage 本身不支持，需要后端，MVP 不做）
