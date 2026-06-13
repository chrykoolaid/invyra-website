import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryLocation, ensureSprint5ApproveRole, listInventoryLocations } from "@/lib/inventory/inventory-transfer-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const locations = await listInventoryLocations(guard.session);
    return ok({ locations, locationMasterEnabled: true, environment: guard.session.environment });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list locations", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint5ApproveRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const location = await createInventoryLocation({ request, session: guard.session, body: await request.json() });
    return created({ location, locationMasterEnabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create location", 400);
  }
}
