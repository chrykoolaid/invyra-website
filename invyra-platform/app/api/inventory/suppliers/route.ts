import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { buildInventorySuppliersApiPayload } from "@/lib/inventory/inventory-read-only-api";
import { createInventorySupplierMaster, ensureSprint1WriteRole } from "@/lib/inventory/inventory-master-write-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  return ok(await buildInventorySuppliersApiPayload(guard.session));
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint1WriteRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const supplier = await createInventorySupplierMaster({ request, session: guard.session, body: await request.json() });
    return created({ supplier, writeEnabled: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create supplier", 400);
  }
}
