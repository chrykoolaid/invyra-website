import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { buildInventoryItemsApiPayload } from "@/lib/inventory/inventory-read-only-api";
import { createInventoryItemMaster, ensureSprint1WriteRole } from "@/lib/inventory/inventory-master-write-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  return ok(await buildInventoryItemsApiPayload(guard.session));
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint1WriteRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const item = await createInventoryItemMaster({ request, session: guard.session, body: await request.json() });
    return created({ item, writeEnabled: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create item", 400);
  }
}
