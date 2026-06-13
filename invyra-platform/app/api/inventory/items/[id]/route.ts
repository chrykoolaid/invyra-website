import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint1WriteRole, setInventoryItemArchived, updateInventoryItemMaster } from "@/lib/inventory/inventory-master-write-service";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint1WriteRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const item = await updateInventoryItemMaster({ request, session: guard.session, id: params.id, body: await request.json() });
    return ok({ item, writeEnabled: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update item", 400);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint1WriteRole(guard.session, "admin")) return fail("Administrator or Owner role required", 403);
  try {
    const item = await setInventoryItemArchived({ request, session: guard.session, id: params.id, archived: true });
    return ok({ item, archived: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to archive item", 400);
  }
}
