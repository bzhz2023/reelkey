import { route } from "@fal-ai/server-proxy/nextjs";

export const { GET, POST } = route;

// 增加超时时间到 60 秒（Vercel Pro 最大值）
export const maxDuration = 60;
