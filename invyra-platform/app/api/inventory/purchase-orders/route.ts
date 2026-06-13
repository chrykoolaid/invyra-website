import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createPurchaseOrder, ensureSprint3CreateRole, listPurchaseOrders } from "@/lib/inventory/inventory-procurement-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const purchaseOrders = await listPurchaseOrders(guard.session);
    return ok({ purchaseOrders, procurementEnabled: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list purchase orders", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint3CreateRole(guard.session)) return fail("Supervisor, Manager, Administrator or Owner role required", 403);
  try {
    const purchaseOrder = await createPurchaseOrder({ request, session: guard.session, body: await request.json() });
    return created({ purchaseOrder, procurementEnabled: true, stockMutationEnabled: false });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create purchase order");
  }
}
