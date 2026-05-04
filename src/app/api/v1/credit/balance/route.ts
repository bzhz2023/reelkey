import { NextRequest } from "next/server";

import { creditService } from "@/services/credit";

import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { createServerTimer } from "@/lib/server-perf";

export async function GET(request: NextRequest) {
  const timer = createServerTimer("GET /api/v1/credit/balance");
  try {
    const user = await requireAuth(request);
    timer.mark("auth");
    const balance = await creditService.getBalance(user.id);
    timer.mark("getBalance");
    timer.done();
    return apiSuccess(balance);
  } catch (error) {
    timer.mark("error");
    return handleApiError(error);
  }
}
