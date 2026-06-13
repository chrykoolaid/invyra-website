import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryStocktake, ensureSprint8CountRole, getStocktakeDashboard, listInventoryStocktakes } from "@/lib/inventory/inventory-stocktake-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ stocktakes: await listInventoryStocktakes(guard.session), dashboard: await getStocktakeDashboard(guard.session), ledgerRule: "Only reconciliation posts STOCKTAKE_ADJUSTMENT movements." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list stocktakes", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint8CountRole(guard.session)) return fail("Supervisor or higher role required for stocktakes", 403);
  try {
    const stocktake = await createInventoryStocktake({ request, session: guard.session, body: await request.json() });
    return created({ stocktake, stocktakeRule: "Creating a stocktake does not mutate stock." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create stocktake", 400);
  }
}
