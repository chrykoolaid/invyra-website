import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint3CreateRole, getPurchaseOrder, updatePurchaseOrder } from "@/lib/inventory/inventory-procurement-service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const { id } = await context.params;
    return ok({ purchaseOrder: await getPurchaseOrder(guard.session, id), stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load purchase order", 404);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint3CreateRole(guard.session)) return fail("Supervisor, Manager, Administrator or Owner role required", 403);
  try {
    const { id } = await context.params;
    const purchaseOrder = await updatePurchaseOrder({ request, session: guard.session, id, body: await request.json() });
    return ok({ purchaseOrder, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to update purchase order");
  }
}
