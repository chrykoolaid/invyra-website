import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getInventoryLossDashboard } from "@/lib/inventory/inventory-loss-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const dashboard = await getInventoryLossDashboard(guard.session);
    return ok({ dashboard, sprint6Enabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load loss dashboard", 500);
  }
}
