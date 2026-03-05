# Step 4: SEO & GEO Optimization

Update all SEO metadata, add structured data, configure AI bot access, apply GEO optimization methods.

**GEO = Generative Engine Optimization** — 优化内容以被 AI 搜索引擎（ChatGPT、Perplexity、Claude、Copilot）引用。被引用 = 新时代的"排名第一"。

## 4.1 Site Config

File: `src/config/site.ts`

```ts
export const siteConfig: SiteConfig = {
  name: "{projectName}",
  description: "{description}",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://{domain}",
  ogImage: "/og.png",
  // ... keep rest unchanged
};
```

## 4.2 Root Layout Metadata

File: `src/app/layout.tsx`

**注意**：此文件使用 `getLocale()` (next-intl) 获取语言，不要修改 locale 获取逻辑。只更新 `metadata` export：

```ts
export const metadata: Metadata = {
  title: {
    default: "{projectName} - {tagline}",
    template: `%s | {projectName}`,
  },
  description: "{description}",
  keywords: [
    // Generate 10-15 keywords based on product description
    // Mix head terms (high volume) + long-tail (specific)
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: "{projectName}",
    description: "{description}",
    siteName: "{projectName}",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "{projectName}" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "{projectName}",
    description: "{description}",
    images: ["/og.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
  metadataBase: new URL(siteConfig.url),
};
```

## 4.3 Marketing Page Metadata

File: `src/app/[locale]/(marketing)/page.tsx`

```ts
const titles = {
  en: "{projectName} - {English tagline}",
  zh: "{projectName} - {Chinese tagline}",
};
const descriptions = {
  en: "{English description}",
  zh: "{Chinese description}",
};
```

## 4.4 JSON-LD Structured Data

**已内置于模板中 — 无需手动添加。**

### WebSite + Organization Schema（已内置）

`src/app/layout.tsx` 的 `<head>` 中已包含 WebSite 和 Organization JSON-LD schema。品牌名通过 `siteConfig` 引用，Step 2 的全局替换会自动更新。

如需扩展（如添加 SoftwareApplication schema），在现有 `@graph` 数组中追加即可。

### FAQPage Schema（已内置，+40% AI 可见性）

`src/components/landing/faq-section.tsx` 已内置 FAQPage JSON-LD schema，自动从 i18n 读取 FAQ 内容。当 Step 5 替换 FAQ 文案后，schema 会自动适配。**不要重复添加。**

### SpeakableSpecification (可选，语音搜索 + AI 提取)

可选，添加到 WebPage schema 中，帮助 AI 知道哪些内容最适合引用：

```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": ["h1", ".hero-description", ".faq-answer"]
}
```

## 4.5 Robots.txt — AI Bot 访问配置

File: `src/app/robots.ts` — 确认允许所有主要 AI 搜索引擎爬虫：

```ts
// 必须允许的 AI Bot：
// - Googlebot (Google + Google AI Overview)
// - Bingbot (Bing + Microsoft Copilot)
// - GPTBot (OpenAI / ChatGPT)
// - ChatGPT-User (ChatGPT with browsing)
// - PerplexityBot (Perplexity)
// - ClaudeBot (Claude)
// - anthropic-ai (Anthropic)
```

验证 robots.txt 没有误封这些爬虫。默认的 Next.js robots.ts 通常是 allow all，确认无误即可。

同时确认 sitemap 引用正确：
```ts
sitemap: `${process.env.NEXT_PUBLIC_APP_URL || "https://{domain}"}/sitemap.xml`
```

## 4.6 GEO 优化方法 (Princeton 研究)

初始化时应用以下高收益方法到落地页和 FAQ 内容中：

### 必做 (高收益)

| 方法 | 提升幅度 | 初始化时如何应用 |
|------|---------|----------------|
| **引用权威来源** | +40% | FAQ 答案中加入 "According to..." 引用 |
| **添加统计数据** | +37% | 产品描述/FAQ 中加入具体数字 |
| **FAQPage Schema** | +40% | 见 4.4 节，结构化 FAQ 数据 |
| **权威语气** | +25% | 用自信、专业的语言风格 |

### 推荐 (内容层面)

| 方法 | 提升幅度 | 如何应用 |
|------|---------|---------|
| **易于理解** | +20% | 复杂概念用类比解释 |
| **专业术语** | +18% | 适当使用领域术语 |
| **流畅度优化** | +15-30% | 短段落(2-3句)、列表、表格 |

### 避免

| 方法 | 影响 | 说明 |
|------|-----|------|
| **关键词堆砌** | **-10%** | AI 搜索引擎会惩罚关键词堆砌 |

### 最佳组合

- **流畅度 + 统计数据** = 最高综合提升
- **引用 + 权威语气** = 最适合专业/商业内容
- **易理解 + 统计** = 最适合消费者内容

## 4.7 平台特定优化要点

不同 AI 搜索引擎的关键差异：

| 平台 | 主要索引 | 关键因素 | 初始化时需确认 |
|------|---------|---------|--------------|
| ChatGPT | Web (Bing-based) | 域名权威性、内容时效性 | 允许 GPTBot |
| Perplexity | Own + Google | 语义相关性、FAQ Schema | 允许 PerplexityBot |
| Google SGE | Google | E-E-A-T、Schema | Structured Data |
| Copilot | Bing | Bing 索引 | 允许 Bingbot |
| Claude | **Brave Search** | 事实密度 | 允许 ClaudeBot |

**重要**：Claude 使用 Brave Search 而非 Google — 确保 Brave 能索引你的站点。

## 4.8 SEO 内容生成规则

如果提供了 referenceUrl，生成内容时遵循：

- **Title 公式**: "{核心关键词} | {核心利益} | {品牌}" (50-60 字符)
- **Description**: 包含利益点 + CTA + 情感触发 (150-160 字符)
- **Keywords**: 混合头部词(高搜索量) + 长尾词(具体场景)
- **FAQ 内容**: "答案优先"格式（先给直接答案，再展开说明）
- **Alt text**: 描述性，自然包含品牌名

## 文件清单

- `src/config/site.ts` — 站点名称、描述、URL
- `src/app/layout.tsx` — metadata + JSON-LD
- `src/app/[locale]/(marketing)/page.tsx` — 落地页 metadata
- `src/app/robots.ts` — 确认 AI bot 访问
- `src/app/sitemap.ts` — 确认 baseUrl
- `src/lib/seo.ts` — 工具函数域名引用
