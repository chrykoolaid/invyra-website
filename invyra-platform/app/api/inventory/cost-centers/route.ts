import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryCostCenter, ensureSprint7ConsumptionRole, listInventoryCostCenters } from "@/lib/inventory/inventory-consumption-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try { return ok({ costCenters: await listInventoryCostCenters(guard.session), sprint: "7" }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to list cost centers", 500); }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint7ConsumptionRole(guard.session)) return fail("Supervisor or higher role required for cost centers", 403);
  try { return created({ costCenter: await createInventoryCostCenter({ request, session: guard.session, body: await request.json() }) }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to create cost center", 400); }
}
