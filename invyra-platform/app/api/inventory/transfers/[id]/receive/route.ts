import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { transitionInventoryTransfer } from "@/lib/inventory/inventory-transfer-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" });
  if (!guard.ok) return guard.response;
  try {
    const { id } = await context.params;
    const body = "receive" === "receive" ? await request.json().catch(() => ({})) : undefined;
    const transfer = await transitionInventoryTransfer({ request, session: guard.session, id, action: "receive" as never, body });
    return ok({ transfer, transferAction: "receive" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update transfer", 400);
  }
}
