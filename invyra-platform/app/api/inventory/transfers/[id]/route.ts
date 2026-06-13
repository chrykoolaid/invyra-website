import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getInventoryTransfer } from "@/lib/inventory/inventory-transfer-service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const { id } = await context.params;
    const transfer = await getInventoryTransfer(guard.session, id);
    return ok({ transfer, transferEngineEnabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to read transfer", 404);
  }
}
