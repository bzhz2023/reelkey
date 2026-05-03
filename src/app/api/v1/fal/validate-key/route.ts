import { fal } from "@fal-ai/client";
import { NextRequest, NextResponse } from "next/server";

const VALIDATION_ENDPOINT = "fal-ai/kling-video/v2.1/standard/text-to-video";
const VALIDATION_REQUEST_ID = "reelkey-validation-check";

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-fal-key")?.trim();

  if (!apiKey) {
    return NextResponse.json(
      { valid: false, error: "Missing fal.ai API key" },
      { status: 400 }
    );
  }

  try {
    fal.config({
      credentials: apiKey,
      suppressLocalCredentialsWarning: true,
    });

    await fal.queue.status(VALIDATION_ENDPOINT, {
      requestId: VALIDATION_REQUEST_ID,
      logs: false,
    });

    return NextResponse.json({ valid: true });
  } catch (error: any) {
    const status = error?.status;

    if (status === 401 || status === 403) {
      return NextResponse.json(
        { valid: false, error: "Invalid fal.ai API key" },
        { status: 401 }
      );
    }

    // Auth succeeded if fal.ai can identify the request and only reports that
    // the synthetic validation request does not exist.
    if (status === 404) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json(
      { valid: false, error: "Unable to validate fal.ai API key" },
      { status: 502 }
    );
  }
}
