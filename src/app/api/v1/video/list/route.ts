import { NextRequest } from "next/server";
import { videoService } from "@/services/video";
import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { createServerTimer } from "@/lib/server-perf";

export async function GET(request: NextRequest) {
  const timer = createServerTimer("GET /api/v1/video/list");
  try {
    const user = await requireAuth(request);
    timer.mark("auth");
    const { searchParams } = new URL(request.url);

    const result = await videoService.listVideos(user.id, {
      limit: Number.parseInt(searchParams.get("limit") || "20"),
      cursor: searchParams.get("cursor") || undefined,
      status: searchParams.get("status") || undefined,
    });
    timer.mark("listVideos");
    timer.done();

    return apiSuccess(result);
  } catch (error) {
    timer.mark("error");
    return handleApiError(error);
  }
}
