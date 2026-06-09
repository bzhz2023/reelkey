import type { SubmitData } from "@/components/video-generator";
import { falKeyStorage } from "@/lib/fal-key";

const MAX_DIRECT_IMAGE_UPLOAD_SIZE = 20 * 1024 * 1024;
const MAX_FUNCTION_IMAGE_UPLOAD_SIZE = 4 * 1024 * 1024; // Vercel Function 请求体上限 4.5MB，预留 multipart 开销
const LARGE_PAYLOAD_MESSAGE = "Image is too large. Please upload an image under 20 MB.";
const DIRECT_UPLOAD_FAILED_MESSAGE =
  "Image upload failed. Please try again, or contact support if the issue persists.";

/**
 * API request format
 */
export interface VideoGenerateRequest {
  prompt: string;
  model: string;
  duration: number;
  aspectRatio?: string;
  quality?: string;
  imageUrl?: string;
  imageUrls?: string[];
  generateAudio?: boolean;
}

/**
 * Parse duration string to number
 * "10s" -> 10, "5s" -> 5, etc.
 * Clamps to valid range 4-30
 */
export function parseDuration(duration?: string): number {
  if (!duration) return 10;
  const num = Number.parseInt(duration.replace(/\D/g, ""));
  if (num < 4) return 4;
  if (num > 30) return 30;
  return num;
}

/**
 * Convert resolution to quality
 * "1080P" / "1080p" -> "1080p"
 * "720P" / "720p" -> "720p"
 * "480P" / "480p" -> "480p"
 */
export function resolutionToQuality(resolution?: string): string {
  if (!resolution) return "720p";
  if (resolution.toLowerCase().includes("1080")) return "1080p";
  if (resolution.toLowerCase().includes("480")) return "480p";
  return "720p";
}

export async function parseApiResponse<T = unknown>(response: Response): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text) as T;
  } catch {
    const message =
      response.status === 413 || /request entity too large|payload too large|FUNCTION_PAYLOAD_TOO_LARGE/i.test(text)
        ? LARGE_PAYLOAD_MESSAGE
        : text.slice(0, 200) || `Request failed with status ${response.status}`;

    return {
      success: false,
      error: { message },
    } as T;
  }
}

/**
 * Upload image and return public URL
 */
export async function uploadImage(file: File): Promise<string> {
  if (file.size > MAX_DIRECT_IMAGE_UPLOAD_SIZE) {
    throw new Error(LARGE_PAYLOAD_MESSAGE);
  }

  try {
    return await uploadImageDirect(file);
  } catch (error) {
    if (file.size > MAX_FUNCTION_IMAGE_UPLOAD_SIZE) {
      throw error;
    }
    return uploadImageViaApi(file);
  }
}

async function uploadImageDirect(file: File): Promise<string> {
  const presignRes = await fetch("/api/v1/upload/presign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  const presignData = await parseApiResponse<{
    success?: boolean;
    data?: { uploadUrl?: string; publicUrl?: string };
    error?: { message?: string };
  }>(presignRes);

  if (!presignData?.success || !presignData.data?.uploadUrl || !presignData.data.publicUrl) {
    throw new Error(presignData?.error?.message || "Failed to prepare image upload");
  }

  let uploadRes: Response;
  try {
    uploadRes = await fetch(presignData.data.uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      body: file,
    });
  } catch {
    throw new Error(DIRECT_UPLOAD_FAILED_MESSAGE);
  }

  if (!uploadRes.ok) {
    throw new Error(DIRECT_UPLOAD_FAILED_MESSAGE);
  }

  return presignData.data.publicUrl;
}

async function uploadImageViaApi(file: File): Promise<string> {
  if (file.size > MAX_FUNCTION_IMAGE_UPLOAD_SIZE) {
    throw new Error(LARGE_PAYLOAD_MESSAGE);
  }

  const formData = new FormData();
  formData.append("file", file);

  const uploadRes = await fetch("/api/v1/upload", {
    method: "POST",
    body: formData,
  });

  const uploadData = await parseApiResponse<{
    success?: boolean;
    data?: { publicUrl?: string };
    error?: { message?: string };
  }>(uploadRes);
  if (!uploadData?.success) {
    throw new Error(uploadData?.error?.message || "Failed to upload image");
  }

  if (!uploadData.data?.publicUrl) {
    throw new Error("Failed to upload image");
  }

  return uploadData.data.publicUrl;
}

/**
 * Transform SubmitData to API request
 * Handles both `quality` (direct) and `resolution` (converted) fields
 */
export async function transformSubmitData(
  data: SubmitData
): Promise<VideoGenerateRequest> {
  // Upload images if exist (parallel upload for multiple images)
  let imageUrl: string | undefined;
  let imageUrls: string[] | undefined;
  if (data.images && data.images.length > 0) {
    const urls = await Promise.all(data.images.map(uploadImage));
    if (urls.length === 1) {
      imageUrl = urls[0];
    } else {
      imageUrls = urls;
    }
  }

  // Determine quality: use direct quality field if present, otherwise convert from resolution
  let quality: string | undefined;
  if (data.quality) {
    quality = data.quality;
  } else if (data.resolution) {
    quality = resolutionToQuality(data.resolution);
  }

  const model = data.model || "sora-2";

  return {
    prompt: data.prompt,
    model,
    duration: parseDuration(data.duration),
    aspectRatio: data.aspectRatio || undefined,
    quality,
    imageUrl,
    imageUrls,
    generateAudio: data.generateAudio,
  };
}

/**
 * Call video generation API
 */
export async function generateVideo(
  request: VideoGenerateRequest
): Promise<{ videoUuid: string; status: string; creditsUsed: number }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add user's fal.ai API key if available (BYOK mode)
  const falKey = falKeyStorage.get();
  if (falKey) {
    headers["x-fal-key"] = falKey;
  }

  const res = await fetch("/api/v1/video/generate", {
    method: "POST",
    headers,
    body: JSON.stringify(request),
  });

  const data = await parseApiResponse<{
    success?: boolean;
    data?: { videoUuid: string; status: string; creditsUsed: number };
    error?: { message?: string; details?: { code?: string } };
  }>(res);

  if (!data?.success) {
    const code = data?.error?.details?.code;
    if (code === "FAL_KEY_MISSING" || code === "FAL_KEY_INVALID") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fal-key-invalid"));
      }
    }
    throw new Error(data?.error?.message || "Failed to generate video");
  }

  if (!data.data) {
    throw new Error("Failed to generate video");
  }

  return data.data;
}

/**
 * Get video status (triggers backend refresh)
 */
export async function getVideoStatus(
  videoUuid: string
): Promise<{ status: string; videoUrl?: string; error?: string }> {
  const headers: Record<string, string> = {};
  const falKey = falKeyStorage.get();
  if (falKey) {
    headers["x-fal-key"] = falKey;
  }
  const res = await fetch(`/api/v1/video/${videoUuid}/status`, { headers });
  const data = await res.json();

  if (!data.success) {
    const code = data.error?.details?.code;
    if (code === "FAL_KEY_MISSING" || code === "FAL_KEY_INVALID") {
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("fal-key-invalid", { detail: { videoId: videoUuid } }),
        );
      }
    }
    throw new Error(data.error?.message || "Failed to get video status");
  }

  return data.data;
}

/**
 * Get credit balance
 */
export async function getCreditBalance(): Promise<{
  totalCredits: number;
  usedCredits: number;
  frozenCredits: number;
  availableCredits: number;
  expiringSoon: number;
}> {
  const res = await fetch("/api/v1/credit/balance");
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error?.message || "Failed to get credit balance");
  }

  return data.data;
}
