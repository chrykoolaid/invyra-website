import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getConsumptionDashboard } from "@/lib/inventory/inventory-consumption-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try { return ok({ dashboard: await getConsumptionDashboard(guard.session), sprint: "7" }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to load consumption dashboard", 500); }
}
