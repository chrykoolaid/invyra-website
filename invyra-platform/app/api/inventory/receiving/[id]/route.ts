import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { getReceivablePurchaseOrder } from "@/lib/inventory/inventory-receiving-service";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const purchaseOrder = await getReceivablePurchaseOrder(guard.session, params.id);
    return ok({ purchaseOrder, receivingEnabled: true });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load receivable purchase order", 404);
  }
}
