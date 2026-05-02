import { NextRequest } from "next/server";
import { db, videos, VideoStatus } from "@/db";
import { eq } from "drizzle-orm";
import { getStorage } from "@/lib/storage";
import { creditService } from "@/services/credit";
import { apiSuccess, apiError } from "@/lib/api/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    const body = await request.json();
    const { videoUrl } = body;

    if (!videoUrl) {
      return apiError("videoUrl is required", 400);
    }

    // 1. 获取视频记录
    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.uuid, uuid))
      .limit(1);

    if (!video) {
      return apiError("Video not found", 404);
    }

    console.log(`Force completing video: ${uuid}, current status: ${video.status}`);

    // 2. 更新为 UPLOADING 状态
    await db
      .update(videos)
      .set({
        status: VideoStatus.UPLOADING,
        originalVideoUrl: videoUrl,
        updatedAt: new Date(),
      })
      .where(eq(videos.uuid, uuid));

    // 3. 下载并上传到 R2
    const storage = getStorage();
    const key = `videos/${uuid}/${Date.now()}.mp4`;
    const uploaded = await storage.downloadAndUpload({
      sourceUrl: videoUrl,
      key,
      contentType: "video/mp4",
    });

    console.log(`Video uploaded to R2: ${uploaded.url}`);

    // 4. 结算积分（BYOK 模式下可能没有冻结积分，会自动跳过）
    try {
      await creditService.settle(uuid);
    } catch (error) {
      console.log("Credit settlement skipped (BYOK mode):", error);
    }

    // 5. 更新为 COMPLETED 状态
    await db
      .update(videos)
      .set({
        status: VideoStatus.COMPLETED,
        videoUrl: uploaded.url,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(videos.uuid, uuid));

    console.log(`✅ Video ${uuid} completed successfully!`);

    return apiSuccess({
      uuid,
      status: "COMPLETED",
      videoUrl: uploaded.url,
    });
  } catch (error) {
    console.error("Force complete error:", error);
    return apiError(String(error), 500);
  }
}
