# ReelKey MVP 产品需求文档 v1.1

## 一、产品定位

**ReelKey** 是一个 BYOK（Bring Your Own Key）模式的 AI 视频生成看板，用户使用自己的 fal.ai API Key 生成视频。

### 核心价值主张

- **无订阅制**：一次性买断 $29（早鸟）/ $49（正式），终身使用
- **积分不过期**：用户使用自己的 fal.ai 账户，按实际消耗付费
- **数据隐私**：API Key 存储在用户浏览器，不上传服务器
- **多模型支持**：Kling 2.5 Turbo Pro + Wan 2.5，未来扩展更多

### 目标用户

- AI 视频创意专业用户
- 熟悉 API 概念，愿意自己管理 API Key
- 需要频繁切换多个模型对比效果
- 对数据隐私和成本透明度有要求

---

## 二、核心功能（P0 - MVP 必须）

### 2.1 用户认证

**技术方案：** Better Auth + Google OAuth

**功能要求：**
- Google 一键登录
- 可选登录（访客可体验免费版，登录后解锁云端同步）
- 用户信息：邮箱、头像、注册时间
- 账户状态：免费版 / 买断版（`isPro` 字段）

---

### 2.2 API Key 管理

**存储方案：** localStorage（浏览器本地存储）

**功能要求：**

#### 首次引导弹窗
- 用户登录后，如果 localStorage 中没有 Key，显示引导弹窗
- 弹窗内容：
  - 标题："Connect your fal.ai API Key"
  - 说明："Your key stays in your browser only — never stored on our servers."
  - 引导步骤（折叠展开）：
    1. 打开 fal.ai → 注册账号
    2. 进入 Dashboard → API Keys
    3. 点击 Create new key → 复制
  - 输入框（密码类型，可切换显示/隐藏）
  - 验证按钮："Verify & Save"
  - 安全提示："🔒 Stored in your browser only. Never uploaded."

#### 设置页 Key 管理
- 显示 Key 状态：● Connected / ⚠️ Missing
- 显示脱敏 Key：`sk-xxxx...xxxx`
- 操作按钮：
  - Change Key（重新输入）
  - Remove Key（删除）
- 本月花费显示：`This month: $3.45 used`
- 外链："View fal.ai billing →"
- 安全提示："💡 Tip: Set a spending limit in fal.ai to prevent unexpected charges."

#### Key 验证逻辑
- 输入 Key 后，调用 fal.ai 最小测试请求（查询任务状态）
- 3 秒内返回结果：
  - 成功：绿色勾 + "Key verified"
  - 失败：红色提示 + 具体原因（Invalid key / Network error）

#### Key 失效自动恢复
- 生成时 fal.ai 返回 401/403，不直接报错
- 自动弹出 Key 输入弹窗（文案改为"Please update your key"）
- 用户重新粘贴新 Key → 验证 → 自动重试刚才失败的生成请求

---

### 2.3 视频生成

**支持模型：**
- Kling 2.5 Turbo Pro（fal.ai）
- Wan 2.5（fal.ai）

**生成参数：**

| 参数 | Kling 2.5 Turbo Pro | Wan 2.5 |
|------|---------------------|---------|
| 时长 | 5s, 10s | 5s |
| 分辨率 | 720p, 1080p | 480p, 720p, 1080p |
| 宽高比 | 16:9, 9:16, 1:1 | 16:9, 9:16, 1:1 |
| 模式 | Text-to-Video, Image-to-Video | Text-to-Video, Image-to-Video |

**生成流程：**

1. **前端提交**
   - 用户输入 Prompt
   - 选择模型、时长、分辨率、宽高比
   - （可选）上传参考图片（Image-to-Video）
   - 前端从 localStorage 读取 Key，放入 Header: `x-fal-key`
   - 发送到 `/api/v1/video/generate`

2. **服务端处理**
   - 从 Header 提取用户 Key
   - 使用 `FalAiProvider` 调用 fal.ai API
   - fal.ai 返回 `request_id`
   - 服务端返回任务 ID 给前端

3. **异步轮询**
   - 前端每 3 秒轮询 `/api/v1/video/status/:taskId`
   - 服务端调用 fal.ai 查询任务状态
   - 状态：pending → processing → completed / failed

4. **结果处理**
   - 生成成功：
     - 服务端下载视频，上传到 Cloudflare R2
     - 数据库记录：视频信息、生成参数、成本
     - 返回 R2 永久 URL 给前端
   - 生成失败：
     - 返回错误信息（Key 无效 / 余额不足 / 超时）

**成本显示：**
- 生成前：显示预估费用（根据模型和参数计算）
- 生成后：显示实际费用（从 fal.ai 返回的计费信息）
- 费用单位：美元（$0.35 / $0.70）

**定价表（硬编码，定期更新）：**

| 模型 | 分辨率 | 时长 | 费用 |
|------|--------|------|------|
| Kling 2.5 Turbo Pro | 720p | 5s | $0.35 |
| Kling 2.5 Turbo Pro | 720p | 10s | $0.70 |
| Kling 2.5 Turbo Pro | 1080p | 5s | $0.35 |
| Kling 2.5 Turbo Pro | 1080p | 10s | $0.70 |
| Wan 2.5 | 480p | 5s | $0.25 |
| Wan 2.5 | 720p | 5s | $0.25 |
| Wan 2.5 | 1080p | 5s | $0.25 |

---

### 2.4 历史记录

**存储方案：** 数据库（Neon PostgreSQL）

**数据结构：**
```sql
videos (
  id: uuid,
  user_id: uuid,
  model: string,
  prompt: text,
  duration: int,
  aspect_ratio: string,
  quality: string,
  video_url: string,        -- R2 永久 URL
  thumbnail_url: string,    -- 缩略图
  cost_usd: decimal,        -- 实际花费（美元）
  status: enum,             -- completed / failed
  created_at: timestamp
)
```

**功能要求：**
- 列表展示：缩略图、Prompt、模型、时长、花费、时间
- 搜索：按 Prompt 关键词搜索
- 筛选：按模型、时间范围筛选
- 排序：按时间倒序
- 操作：
  - 预览（弹窗播放）
  - 下载（R2 直链）
  - 一键复用（填充到生成区）
  - 删除（软删除，保留数据库记录）

**免费版限制：**
- 只显示最近 7 天的历史记录
- 7 天后标记"已过期"，记录保留但不能预览

**买断版：**
- 无限历史记录
- 永久可预览和下载

---

### 2.5 视频存储

**技术方案：** Cloudflare R2

**存储策略：**
- 免费版：不上传 R2，只保留 fal.ai 临时 URL（1 小时过期）
- 买断版：上传 R2，永久可用

**文件命名：**
```
videos/{user_id}/{video_id}.mp4
thumbnails/{user_id}/{video_id}.jpg
```

**CDN 加速：**
- 使用 R2 Public URL
- 配置 CORS 允许浏览器访问

---

### 2.6 定价与支付

**定价策略：**

| 版本 | 价格 | 功能 |
|------|------|------|
| 免费版 | $0 | 10 次/月 + 2 模型 + 7 天历史 |
| 买断版（早鸟） | $29 | 无限次 + 全模型 + 云端存储 |
| 买断版（正式） | $49 | 无限次 + 全模型 + 云端存储 |

**支付方案：** Creem（Stripe 替代品）

**支付流程：**
1. 用户点击"Get lifetime access — $29"
2. 跳转到 Creem 支付页面
3. 支付成功后，Creem Webhook 通知服务端
4. 服务端更新用户 `isPro = true`
5. 用户刷新页面，解锁买断版功能

---

## 三、次要功能（P1 - 发布后 2-3 周）

### 3.1 多模型对比模式

**功能描述：**
- 同一 Prompt 同时向多个模型发起请求
- `Promise.allSettled()` 并行生成
- 先完成先显示
- 独立失败处理

**UI 设计：**
- 左侧：Prompt 输入区
- 右侧：2-4 个模型结果并排展示
- 每个结果卡片显示：模型名、时长、费用、状态

---

### 3.2 fal.ai 注册引导

**功能描述：**
- 3 步图文引导（注册 → 创建 Key → 粘贴）
- 截图/GIF 演示
- 充值入口链接

---

### 3.3 Prompt 模板库

**功能描述：**
- 20 条精选模板（B-roll/产品/人物/风景）
- 一键填充到生成区
- 推荐模型标注

---

## 四、技术架构

### 4.1 技术栈

- **前端：** Next.js 15 + React 19 + TypeScript
- **后端：** Next.js API Routes
- **数据库：** Neon PostgreSQL + Drizzle ORM
- **认证：** Better Auth + Google OAuth
- **AI Provider：** fal.ai（用户自己的 Key）
- **存储：** Cloudflare R2
- **支付：** Creem
- **部署：** Vercel

---

### 4.2 核心架构

```
用户浏览器 localStorage（存 Key，永久保存）
         ↓
前端请求 Header: x-fal-key
         ↓
Next.js 代理 Route /api/fal/proxy
         ↓
fal.ai API（Key 在内存中，请求结束即消失）
         ↓
视频 URL → Cloudflare R2（永久存储）
         ↓
数据库记录（不含 Key）
```

---

### 4.3 安全设计

**API Key 安全：**
- Key 存储在用户浏览器 localStorage
- 永远不发送到服务器数据库
- 生成时通过 Header 传递，服务端代理转发
- Key 在服务器内存中只存在毫秒级，请求结束即消失

**数据隐私：**
- 数据库不存储 API Key
- 只记录视频信息和生成成本
- 用户可随时删除历史记录

**支付安全：**
- 使用 Creem Webhook 验证支付状态
- HMAC 签名验证 Webhook 真实性

---

## 五、环境变量配置

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

# Callback
AI_CALLBACK_URL=
CALLBACK_HMAC_SECRET=

# 邮件
RESEND_API_KEY=
RESEND_FROM=

# 支付
CREEM_API_KEY=
CREEM_WEBHOOK_SECRET=
```

**不需要的环境变量：**
```bash
# 删除这些（不再需要平台 AI Provider Keys）
EVOLINK_API_KEY=
KIE_API_KEY=
APIMART_API_KEY=
DEFAULT_AI_PROVIDER=
```

---

## 六、验收标准（发布前）

- [ ] P0 四个功能全部可用（Key 接入、生成、成本显示、历史）
- [ ] fal.ai 注册引导经过 3 个非技术用户测试
- [ ] 实际生成 Kling 和 Wan 各 10 个视频，成功率 > 80%
- [ ] 成本显示与 fal.ai 实际扣费误差 < 5%
- [ ] 移动端主要流程可用
- [ ] Vercel 部署成功，域名正常访问

---

## 七、暂不做（MVP 范围外）

- 多模型并行对比（P1）
- Prompt 模板库（P1）
- 国际化（先只做英文）
- 跨设备 Key 同步（localStorage 本身不支持，需要后端）
- 批量生成
- OpenRouter 接入
- 视频编辑功能
- 社区分享功能
