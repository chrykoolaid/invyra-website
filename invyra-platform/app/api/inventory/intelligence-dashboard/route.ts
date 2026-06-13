import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getInventoryIntelligenceDashboard } from "@/lib/inventory/inventory-intelligence-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ dashboard: await getInventoryIntelligenceDashboard(guard.session) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load intelligence dashboard", 500);
  }
}
