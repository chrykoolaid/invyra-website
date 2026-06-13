import { created, fail } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createOpeningBalance, ensureSprint2TransactionRole } from "@/lib/inventory/inventory-ledger-service";

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "APPROVE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint2TransactionRole(guard.session)) return fail("Manager, Administrator or Owner role required", 403);
  try {
    const movement = await createOpeningBalance({ request, session: guard.session, body: await request.json() });
    return created({ movement, ledgerEnabled: true, stockMutationEnabled: true, mutationType: "OPENING_BALANCE" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create opening balance", 400);
  }
}
