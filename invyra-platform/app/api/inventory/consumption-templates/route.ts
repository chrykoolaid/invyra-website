import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryConsumptionTemplate, ensureSprint7ConsumptionRole, listInventoryConsumptionTemplates } from "@/lib/inventory/inventory-consumption-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try { return ok({ templates: await listInventoryConsumptionTemplates(guard.session), sprint: "7" }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to list consumption templates", 500); }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint7ConsumptionRole(guard.session)) return fail("Supervisor or higher role required for templates", 403);
  try { return created({ template: await createInventoryConsumptionTemplate({ request, session: guard.session, body: await request.json() }) }); }
  catch (error) { return fail(error instanceof Error ? error.message : "Unable to create consumption template", 400); }
}
