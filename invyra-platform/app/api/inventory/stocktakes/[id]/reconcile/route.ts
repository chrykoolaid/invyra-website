import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint8ApprovalRole, transitionInventoryStocktake } from "@/lib/inventory/inventory-stocktake-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "APPROVE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint8ApprovalRole(guard.session)) return fail("Manager or higher role required for stocktake reconciliation", 403);
  try {
    const { id } = await context.params;
    const stocktake = await transitionInventoryStocktake({ request, session: guard.session, id, action: "reconcile" });
    return ok({ stocktake, stocktakeAction: "reconcile", ledgerRule: "Variance lines were posted as STOCKTAKE_ADJUSTMENT movements." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to reconcile stocktake", 400);
  }
}
