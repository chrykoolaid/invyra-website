import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryTransfer, ensureSprint5CreateRole, listInventoryTransfers } from "@/lib/inventory/inventory-transfer-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const transfers = await listInventoryTransfers(guard.session);
    return ok({ transfers, transferEngineEnabled: true, conservationRule: "Transfers move stock only; they never create or destroy stock." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list transfers", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint5CreateRole(guard.session)) return fail("Inventory transfer role required", 403);
  try {
    const transfer = await createInventoryTransfer({ request, session: guard.session, body: await request.json() });
    return created({ transfer, stockMutationEnabled: false, status: "DRAFT" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create transfer", 400);
  }
}
