# ReelKey — BYOK 技术方案说明

给开发者的背景说明，解释 API Key 安全方案的决策和用户交互设计。

---

## 一、问题背景

ReelKey 是一个 BYOK（Bring Your Own Key）产品，用户使用自己的 fal.ai API Key 生成视频。
核心安全问题：**用户的 API Key 如何安全传递给 fal.ai，同时不被第三方截获？**

---

## 二、为什么不能在前端直接调用 fal.ai

用户在浏览器里直接发请求给 fal.ai，API Key 会出现在请求 Header 里。
任何人打开浏览器开发者工具的 Network 面板，都能直接看到这个 Key。
这是前端直调 API 的固有风险，无法规避。

---

## 三、为什么不把 Key 存数据库

存数据库需要加密，但只要服务端代码和加密密钥同时泄露，Key 就会暴露。
更重要的是：**不存数据库，才能对用户诚实地说"你的 Key 不在我们的服务器上"**。
这是 BYOK 产品最强的信任卖点，不应该放弃。

---

## 四、最终方案：浏览器存储 + 服务端代理转发

### 数据流

```
[用户输入 Key]
      ↓
[存入浏览器 localStorage]  ← Key 只在用户本地，永久保存，不发服务器
      ↓
[用户点击生成]
      ↓
[前端读取 localStorage 中的 Key]
[放入自定义 Header: X-Fal-Key: sk-xxx]
[发给 Next.js API Route /api/fal/proxy]
      ↓
[Next.js API Route 接收请求]
[从 Header 取出 Key，转发给 fal.ai]  ← Key 只在这个请求的内存里，不写DB，不写日志
[请求结束，Key 从内存消失]
      ↓
[fal.ai 执行视频生成，返回视频 URL]
      ↓
[服务端把视频下载，上传到 Cloudflare R2]  ← 这步不需要 Key
[在数据库记录视频信息和生成成本]
```

### localStorage 的特性（重要）

localStorage 是**持久化存储**，不是 Session 存储：
- 关闭标签页 → Key 还在
- 关闭浏览器 → Key 还在
- 第二天打开 → Key 还在
- 唯一会消失的情况：用户主动清除浏览器数据，或用户在设置页删除 Key

所以用户体验是：**第一次输入一次，之后永远不需要再输入。**
唯一限制：跨设备不同步（手机和电脑需要分别输入一次），可以在 FAQ 说明。

### fal.ai 官方支持这个方案

fal.ai 提供了官方库 `@fal-ai/client` + `@fal-ai/server-proxy`，
专门为这种"前端存 Key + 服务端代理"的场景设计，有完整的 Next.js 示例。

安装：
```bash
pnpm add @fal-ai/client @fal-ai/server-proxy
```

服务端代理 Route（几乎是零配置）：
```ts
// src/app/api/fal/proxy/[...path]/route.ts
import { route } from "@fal-ai/server-proxy/nextjs";
export const { GET, POST } = route;
```

前端调用时，从 Header 传入用户的 Key：
```ts
import * as fal from "@fal-ai/client";

// 从 localStorage 读取 Key
const userKey = localStorage.getItem("fal_api_key");

// 配置 fal 客户端使用代理 + 用户 Key
fal.config({
  proxyUrl: "/api/fal/proxy",
  credentials: userKey,
});

// 之后的调用和普通 fal.ai 调用完全一样
const result = await fal.subscribe("fal-ai/kling-video/v2.1/standard/text-to-video", {
  input: { prompt, duration, aspect_ratio },
});
```

---

## 五、对用户的安全承诺（措辞要精确）

**可以说的（真实）：**
> "Your API key is stored only in your browser's localStorage. It is never sent to our database or stored on our servers. When you generate a video, your key passes through our proxy server to reach fal.ai — it exists in server memory only for the duration of that request, and is never logged or persisted."

**不能说的（过度承诺）：**
> "We can never see your API key." （代理转发的那一刻，服务器内存里是有的）
> "100% safe." （没有 100% 安全的系统）

---

## 六、用户交互设计

### 6.1 首次进入 — Key 未设置

用户登录后，如果 localStorage 中没有 Key，显示引导弹窗：

```
┌──────────────────────────────────────────────────┐
│  🔑  Connect your fal.ai API Key                  │
│                                                    │
│  ReelKey uses your own fal.ai key to generate     │
│  videos. Your key stays in your browser only —    │
│  never stored on our servers.                     │
│                                                    │
│  Don't have a key yet?                            │
│  [Get your fal.ai key →]  (链接到 fal.ai/dashboard) │
│                                                    │
│  ┌──────────────────────────────────────────┐     │
│  │ Paste your key here...              👁   │     │
│  └──────────────────────────────────────────┘     │
│                                                    │
│  🔒 Stored in your browser only. Never uploaded.  │
│                                                    │
│       [Verify & Save]                              │
└──────────────────────────────────────────────────┘
```

交互细节：
- 输入框为密码类型，右侧有眼睛图标切换显示/隐藏
- 点击"Verify & Save"后按钮变为"Verifying..."状态
- 后台向 fal.ai 发一个最小的验证请求（查余额或模型列表）
- 3秒内显示结果：成功（绿色勾）或失败（红色提示 + 具体原因）
- 成功后弹窗自动关闭，进入生成页

引导步骤（折叠展开）：
1. 打开 fal.ai → 注册账号
2. 进入 Dashboard → API Keys
3. 点击 Create new key → 复制

### 6.2 已设置 Key — 正常状态

Header 右上角（用户头像旁）显示连接状态：
```
● fal.ai Connected    [用户头像]
```

点击绿点或进入设置页，显示 Key 管理区块：

```
┌──────────────────────────────────────────────────┐
│  fal.ai API Key                                   │
│                                                    │
│  ● Connected   sk-xxxx...xxxx   [Change Key]      │
│                                                    │
│  This month: $3.45 used                           │
│  [View fal.ai billing →]                          │
│                                                    │
│  💡 Tip: Set a spending limit in fal.ai to        │
│  prevent unexpected charges.                       │
│  [Set limit in fal.ai →]                          │
│                                                    │
│  [Remove Key]                                      │
└──────────────────────────────────────────────────┘
```

### 6.3 Key 失效 — 自动恢复流程

生成时 fal.ai 返回 401/403，不直接报错，而是：

1. 显示 Toast："Your fal.ai key is no longer valid"
2. 自动弹出 Key 输入弹窗（同首次引导，但文案改为"Please update your key"）
3. 用户重新粘贴新 Key → 验证 → 自动重试刚才失败的生成请求

### 6.4 余额不足

fal.ai 返回余额不足错误时：

```
Toast: "Insufficient fal.ai balance. 
       Top up your account to continue."
[Top up fal.ai →]  (链接到 fal.ai 充值页)
```

不显示具体余额（你不知道），只引导用户去充值。

---

## 七、需要改动的文件（相对于原开发计划）

### 删除的改动
- ~~`src/db/schema.ts` 加 `falApiKey` 字段~~ → 不需要
- ~~`src/lib/user-api-key.ts`~~ → 不需要
- ~~`src/app/api/v1/user/fal-key/route.ts`~~ → 不需要
- ~~`src/services/video.ts` 从数据库读 Key~~ → 不需要

### 新增的改动

**新增：`src/app/api/fal/proxy/[...path]/route.ts`**
```ts
import { route } from "@fal-ai/server-proxy/nextjs";
export const { GET, POST } = route;
```
这是唯一需要新建的 API Route，几行代码。

**新增：`src/lib/fal-key.ts`**
```ts
// localStorage 的读写封装，统一管理 Key 的存取
const FAL_KEY_STORAGE_KEY = "reelkey_fal_api_key";

export const falKeyStorage = {
  get: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(FAL_KEY_STORAGE_KEY);
  },
  set: (key: string): void => {
    localStorage.setItem(FAL_KEY_STORAGE_KEY, key);
  },
  remove: (): void => {
    localStorage.removeItem(FAL_KEY_STORAGE_KEY);
  },
  exists: (): boolean => {
    return !!falKeyStorage.get();
  },
};
```

**新增：`src/lib/fal-client.ts`**
```ts
// 配置 fal 客户端，每次请求前从 localStorage 读取 Key
import * as fal from "@fal-ai/client";
import { falKeyStorage } from "./fal-key";

export function configureFalClient() {
  const key = falKeyStorage.get();
  fal.config({
    proxyUrl: "/api/fal/proxy",
    credentials: key || undefined,
  });
}

// 验证 Key 是否有效
export async function validateFalKey(key: string): Promise<boolean> {
  try {
    fal.config({ proxyUrl: "/api/fal/proxy", credentials: key });
    // 调一个最轻量的接口验证 Key
    await fal.queue.status("fal-ai/kling-video/v2.1/standard/text-to-video", {
      requestId: "test",
    });
    return true;
  } catch (e: any) {
    // 401/403 = Key 无效，其他错误（如 404）= Key 有效但请求本身有问题
    if (e?.status === 401 || e?.status === 403) return false;
    return true;
  }
}
```

**修改：`src/app/api/v1/video/generate/route.ts`**

原来从环境变量取 Key，改为从请求 Header 取用户的 Key：
```ts
export async function POST(request: NextRequest) {
  const user = await requireAuth(request);
  
  // 从 Header 取用户的 fal.ai Key
  const falApiKey = request.headers.get("x-fal-key");
  if (!falApiKey) {
    return apiError("fal.ai API Key is required. Please set your key in Settings.", 400, {
      code: "FAL_KEY_MISSING"
    });
  }
  
  // 把 Key 传给 Provider，不存储
  const result = await videoService.generate({
    userId: user.id,
    falApiKey,  // 传给 service 层
    // ...其他参数
  });
  
  return apiSuccess(result);
}
```

**修改：`src/ai/providers/falai.ts`（新建）**

Provider 接收 Key 作为构造参数，不从环境变量读：
```ts
export class FalAiProvider implements AIVideoProvider {
  constructor(private apiKey: string) {
    // Key 作为参数传入，不存储到任何持久化位置
  }
  
  async createTask(params: VideoGenerationParams): Promise<VideoTaskResponse> {
    fal.config({ 
      proxyUrl: process.env.AI_CALLBACK_URL ? undefined : "/api/fal/proxy",
      credentials: this.apiKey 
    });
    // ...生成逻辑
  }
}
```

**新增：`src/components/settings/fal-key-section.tsx`**

设置页的 Key 管理 UI 组件（见 6.2 节设计稿）。

**新增：`src/components/onboarding/fal-key-modal.tsx`**

首次引导弹窗（见 6.1 节设计稿）。

**新增：`src/hooks/use-fal-key.ts`**

管理 Key 状态的 React Hook：
```ts
export function useFalKey() {
  const [keyStatus, setKeyStatus] = useState<"missing" | "validating" | "valid" | "invalid">("missing");
  const [key, setKey] = useState<string | null>(null);
  
  // 初始化时从 localStorage 读
  useEffect(() => {
    const stored = falKeyStorage.get();
    if (stored) {
      setKey(stored);
      setKeyStatus("valid"); // 假设有效，失效时请求会告诉我们
    }
  }, []);
  
  const saveKey = async (newKey: string) => {
    setKeyStatus("validating");
    const isValid = await validateFalKey(newKey);
    if (isValid) {
      falKeyStorage.set(newKey);
      setKey(newKey);
      setKeyStatus("valid");
    } else {
      setKeyStatus("invalid");
    }
    return isValid;
  };
  
  const removeKey = () => {
    falKeyStorage.remove();
    setKey(null);
    setKeyStatus("missing");
  };
  
  return { key, keyStatus, saveKey, removeKey };
}
```

---

## 八、前端调用生成 API 的改动

原来：前端直接 POST `/api/v1/video/generate`
改为：在 Header 里附上 Key

```ts
// src/lib/video-api.ts 修改
export async function generateVideo(data: VideoGenerateRequest) {
  const falKey = falKeyStorage.get();
  if (!falKey) throw new Error("FAL_KEY_MISSING");
  
  const response = await fetch("/api/v1/video/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-fal-key": falKey,  // 附上用户的 Key
    },
    body: JSON.stringify(data),
  });
  
  return response.json();
}
```

---

## 九、安全说明文案（用于产品 UI）

**设置页 Key 输入框下方小字：**
> 🔒 Stored in your browser only. Never uploaded to our servers.

**FAQ 条目："Is my API key safe?"：**
> Your key is stored in your browser's localStorage — the same place your browser saves preferences and settings. It never leaves your device to be stored on our servers or in our database.
>
> When you generate a video, your key is sent through our proxy server to reach fal.ai. It exists in server memory only for the duration of that request and is never logged or saved.
>
> To protect yourself, we recommend creating a dedicated key in your fal.ai dashboard (instead of using your main key), and setting a monthly spending limit.

**FAQ 条目："What if I don't trust you?"：**
> That's a fair question. Here's what you can do:
> 1. Create a separate key in fal.ai just for ReelKey
> 2. Set a monthly spending limit in fal.ai (e.g. $20/month)
> 3. Monitor your fal.ai billing dashboard directly
> 4. Delete the key from your browser anytime in Settings → API Key → Remove
>
> If you ever see unexpected charges, delete the key immediately and create a new one.
