import { fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint8CountRole, transitionInventoryStocktake } from "@/lib/inventory/inventory-stocktake-service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "EDIT" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint8CountRole(guard.session)) return fail("Supervisor or higher role required for stocktake submission", 403);
  try {
    const { id } = await context.params;
    const stocktake = await transitionInventoryStocktake({ request, session: guard.session, id, action: "submit" });
    return ok({ stocktake, stocktakeAction: "submit" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to submit stocktake", 400);
  }
}
