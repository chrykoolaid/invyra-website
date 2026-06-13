import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listInTransitInventory } from "@/lib/inventory/inventory-transfer-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const inTransit = await listInTransitInventory(guard.session);
    return ok({ inTransit, inTransitTrackingEnabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list in-transit inventory", 500);
  }
}
