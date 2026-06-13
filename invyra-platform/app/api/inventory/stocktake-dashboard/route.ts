import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getStocktakeDashboard } from "@/lib/inventory/inventory-stocktake-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ dashboard: await getStocktakeDashboard(guard.session) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load stocktake dashboard", 500);
  }
}
