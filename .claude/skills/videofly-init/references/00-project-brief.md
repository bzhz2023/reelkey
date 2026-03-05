# Step 0: Input Normalization

Collect and normalize user input into a canonical project brief before any file modifications.

## Required Fields

Ask user via AskUserQuestion if not provided:

| Field | Type | Validation | Example |
|-------|------|-----------|---------|
| `projectName` | string | Non-empty, no special chars | ClipMagic |
| `domain` | string | Valid domain format | clipmagic.com |
| `description` | string | 10-150 chars | AI-powered short video creation platform |

## Optional Fields (with defaults)

| Field | Default | Notes |
|-------|---------|-------|
| `referenceUrl` | null | URL to fetch for content generation |
| `supportEmail` | `support@{domain}` | Must be valid email format |
| `logoEmoji` | 🎬 | Single emoji character |
| `primaryColor` | `紫罗兰` | 中文颜色名（见下方颜色表） |
| `locales` | `["en", "zh"]` | Array of locale codes |
| `darkMode` | `true` | Boolean |

## Auto-Derived Fields

Compute these from required fields — never ask user:

```
packageName       = kebab-case(projectName)     # "ClipMagic" → "clip-magic"
localStoragePrefix = snake_case(projectName)     # "ClipMagic" → "clip_magic"
appUrl            = "https://{domain}"           # "clipmagic.com" → "https://clipmagic.com"
privacyEmail      = "privacy@{domain}"
```

## Collection Flow

1. Check if user already provided fields in their message
2. For missing required fields: use AskUserQuestion with one question per field
3. For missing optional fields: use defaults silently
4. Print normalized brief summary for user confirmation:

```
Project Brief:
  Name:       {projectName}
  Domain:     {domain}
  Description: {description}
  Email:      {supportEmail}
  Color:      {primaryColor}（如：紫罗兰、天蓝、琥珀）
  Locales:    {locales}
  Reference:  {referenceUrl || "none"}
```

## 颜色名称参考表

用户用中文颜色名指定品牌色。在 Step 3 中，根据颜色名在 tweakcn 主题编辑器中选择对应色调。

### 按产品类型推荐默认色

如果用户没指定颜色，根据产品描述智能推荐：

| 产品类型 | 推荐色 | 色调感觉 |
|---------|--------|---------|
| AI/科技/开发工具 | 紫罗兰 | 创新、智能 |
| 视频/创意/设计 | 品红/洋红 | 创意、活力 |
| 金融/商务/企业 | 靛蓝 | 信任、专业 |
| 社交/内容/媒体 | 天蓝 | 开放、友好 |
| 电商/零售 | 珊瑚红 | 热情、行动力 |
| 健康/环保/教育 | 翠绿 | 自然、成长 |
| 游戏/娱乐 | 琥珀 | 活力、温暖 |
| 奢侈品/高端 | 石墨/炭黑 | 高级、沉稳 |

### 可用颜色名称

| 中文名 | 色系 |
|-------|------|
| 天蓝 | 蓝色系 (偏亮) |
| 靛蓝 | 蓝色系 (偏深) |
| 宝蓝 | 蓝色系 (经典) |
| 紫罗兰 | 紫色系 |
| 薰衣草 | 紫色系 (偏淡) |
| 品红/洋红 | 粉紫系 |
| 珊瑚红 | 红橙系 |
| 玫瑰红 | 红粉系 |
| 琥珀 | 橙黄系 |
| 金色 | 黄色系 |
| 翠绿 | 绿色系 |
| 薄荷绿 | 绿色系 (偏亮) |
| 墨绿 | 绿色系 (偏深) |
| 青色 | 蓝绿系 |
| 石墨 | 灰黑系 |

用户也可以说"蓝色"、"绿色"这样的大类，由 AI 结合产品特性选定具体色调。

## Rules

- Never block execution on optional fields — use defaults
- If user provides partial info (e.g., "init project ClipMagic"), extract what's available and ask for the rest
- primaryColor 接受中文颜色名，不需要 hex 色号
- 如果用户没指定颜色，根据 description 中的产品类型自动推荐（参考上方表格）
- Trim whitespace from all string inputs
