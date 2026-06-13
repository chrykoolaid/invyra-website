import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { archiveInventoryLocation, ensureSprint5ApproveRole } from "@/lib/inventory/inventory-transfer-service";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint5ApproveRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const { id } = await context.params;
    const location = await archiveInventoryLocation({ request, session: guard.session, id });
    return ok({ location, archivedOnly: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to archive location", 400);
  }
}
