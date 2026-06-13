import { ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { buildInventoryConfigurationApiPayload } from "@/lib/inventory/inventory-read-only-api";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;

  return ok(await buildInventoryConfigurationApiPayload(guard.session));
}
