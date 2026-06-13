import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listReceivablePurchaseOrders } from "@/lib/inventory/inventory-receiving-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const purchaseOrders = await listReceivablePurchaseOrders(guard.session);
    return ok({ purchaseOrders, receivingEnabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list receivable purchase orders", 500);
  }
}
