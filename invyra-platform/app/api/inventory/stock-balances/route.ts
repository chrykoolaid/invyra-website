import { ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { listInventoryStockBalances } from "@/lib/inventory/inventory-ledger-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  return ok({
    meta: {
      phase: "Sprint 2",
      stockMutationEnabled: true,
      environment: guard.session.environment,
      message: "Stock balances are calculated from immutable InventoryMovement ledger rows."
    },
    records: await listInventoryStockBalances({ session: guard.session })
  });
}
