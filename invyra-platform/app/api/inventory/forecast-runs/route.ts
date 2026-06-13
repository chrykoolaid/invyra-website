import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint9PlannerRole, generateInventoryForecastRun, listInventoryForecastRuns } from "@/lib/inventory/inventory-intelligence-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ forecastRuns: await listInventoryForecastRuns(guard.session), advisoryRule: "Forecasts do not mutate stock or create purchase orders automatically." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list forecast runs", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint9PlannerRole(guard.session)) return fail("Manager or higher role required for forecast generation", 403);
  try {
    const forecastRun = await generateInventoryForecastRun({ request, session: guard.session, body: await request.json().catch(() => ({})) });
    return created({ forecastRun, advisoryRule: "Recommendations require human approval before operational conversion." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to generate forecast run", 400);
  }
}
