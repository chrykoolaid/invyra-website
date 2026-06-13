import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryConsumptionEvent, ensureSprint7ConsumptionRole, listInventoryConsumptionEvents } from "@/lib/inventory/inventory-consumption-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try { return ok({ consumptionEvents: await listInventoryConsumptionEvents(guard.session), ledgerRule: "STORE_USE movements are immutable." }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to list consumption events", 500); }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint7ConsumptionRole(guard.session)) return fail("Supervisor or higher role required for consumption", 403);
  try { return created({ consumptionEvent: await createInventoryConsumptionEvent({ request, session: guard.session, body: await request.json() }), stockMutationRule: "Consumption reduces stock only through STORE_USE ledger movements." }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to create consumption event", 400); }
}
