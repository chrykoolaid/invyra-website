import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listInventoryForecastRecommendations } from "@/lib/inventory/inventory-intelligence-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ recommendations: await listInventoryForecastRecommendations(guard.session), advisoryRule: "Recommendations remain advisory until converted into approved procurement, transfer, or stocking workflows." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list forecast recommendations", 500);
  }
}
