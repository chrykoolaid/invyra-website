import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createReceivingBatch, ensureSprint4ReceiveRole, listReceivingHistory } from "@/lib/inventory/inventory-receiving-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const records = await listReceivingHistory(guard.session);
    return ok({ records, receivingEnabled: true, stockMutationEnabled: true, mutationType: "RECEIVING" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list receiving history", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint4ReceiveRole(guard.session)) return fail("Inventory receiving role required", 403);
  try {
    const receipt = await createReceivingBatch({ request, session: guard.session, body: await request.json() });
    return created({ receipt, receivingEnabled: true, stockMutationEnabled: true, mutationType: "RECEIVING" });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create receiving batch", 400);
  }
}
