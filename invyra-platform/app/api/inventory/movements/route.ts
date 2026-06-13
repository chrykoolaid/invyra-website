import { ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { buildInventoryMovementsApiPayload } from "@/lib/inventory/inventory-read-only-api";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;

  return ok(await buildInventoryMovementsApiPayload(guard.session));
}
