import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { transitionPurchaseOrder } from "@/lib/inventory/inventory-procurement-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "APPROVE" });
  if (!guard.ok) return guard.response;
  try {
    const { id } = await context.params;
    const purchaseOrder = await transitionPurchaseOrder({ request, session: guard.session, id, action: "submit" });
    return ok({ purchaseOrder, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to transition purchase order");
  }
}
