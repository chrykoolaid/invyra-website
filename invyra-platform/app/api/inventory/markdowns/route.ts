import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { createInventoryMarkdownEvent, ensureSprint6LossRole, listInventoryMarkdownEvents } from "@/lib/inventory/inventory-loss-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    const markdowns = await listInventoryMarkdownEvents(guard.session);
    return ok({ markdowns, labelArchitecture: "Markdown label contains reduced price and replacement barcode." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to list markdowns", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "CREATE" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint6LossRole(guard.session)) return fail("Supervisor or higher role required for markdowns", 403);
  try {
    const markdown = await createInventoryMarkdownEvent({ request, session: guard.session, body: await request.json() });
    return created({ markdown, saleProtectionRule: "Expired items must remain blocked at POS even if a markdown label exists." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create markdown", 400);
  }
}
