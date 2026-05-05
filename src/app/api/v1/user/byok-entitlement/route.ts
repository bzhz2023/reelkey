import { requireAuth } from "@/lib/api/auth";
import { apiSuccess, handleApiError } from "@/lib/api/response";
import { byokEntitlementService } from "@/services/byok-entitlement";

export async function GET(request: Request) {
  try {
    const user = await requireAuth(request);
    const hasLifetimeAccess = await byokEntitlementService.hasLifetime(user.id);

    return apiSuccess({
      hasLifetimeAccess,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
