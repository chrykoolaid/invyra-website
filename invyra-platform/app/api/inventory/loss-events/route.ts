import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryLossEvent, ensureSprint6LossRole, listInventoryLossEvents } from "@/lib/inventory/inventory-loss-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const lossEvents = await listInventoryLossEvents(guard.session);
    return ok({ lossEvents, lossEngineEnabled: true, ledgerRule: "Waste and shrinkage reduce stock only through immutable ledger movements." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list inventory loss events", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint6LossRole(guard.session)) return fail("Supervisor or higher role required for inventory loss events", 403);
  try {
    const lossEvent = await createInventoryLossEvent({ request, session: guard.session, body: await request.json() });
    return created({ lossEvent, stockMutationRule: "Loss events are ledger-controlled and cannot directly edit stock balances." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create inventory loss event", 400);
  }
}
