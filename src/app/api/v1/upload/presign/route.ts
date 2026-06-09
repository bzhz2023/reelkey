import { nanoid } from "nanoid";
import { z } from "zod";

import { requireAuth } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/error";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { getStorage } from "@/lib/storage";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB，文件直传 R2，不经过 Vercel Function 请求体

const presignSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().min(1),
  size: z.number().int().positive().max(MAX_FILE_SIZE),
});

export async function POST(request: Request) {
  try {
    const user = await requireAuth(request);
    const body = await request.json();
    const parsed = presignSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("Invalid upload request", 400, {
        code: "INVALID_UPLOAD_REQUEST",
      });
    }
    const data = parsed.data;

    if (!ALLOWED_IMAGE_TYPES.includes(data.contentType)) {
      throw new ApiError(
        `Invalid content type. Allowed: ${ALLOWED_IMAGE_TYPES.join(", ")}`,
        400
      );
    }

    const ext = getSafeExtension(data.fileName, data.contentType);
    const key = `uploads/${user.id}/${nanoid()}.${ext}`;
    const signed = getStorage().getPresignedPutUrl({
      key,
      expiresInSeconds: 900,
    });

    return apiSuccess({
      ...signed,
      maxFileSize: MAX_FILE_SIZE,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function getSafeExtension(fileName: string, contentType: string): string {
  const extension = fileName.split(".").pop()?.toLowerCase();
  if (extension && /^[a-z0-9]+$/.test(extension)) {
    return extension;
  }

  if (contentType === "image/png") return "png";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/webp") return "webp";
  return "jpg";
}
