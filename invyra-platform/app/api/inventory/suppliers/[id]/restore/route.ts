import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint1WriteRole, setInventorySupplierArchived } from "@/lib/inventory/inventory-master-write-service";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint1WriteRole(guard.session, "admin")) return fail("Administrator or Owner role required", 403);
  try {
    const supplier = await setInventorySupplierArchived({ request, session: guard.session, id: params.id, archived: false });
    return ok({ supplier, restored: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to restore supplier", 400);
  }
}
