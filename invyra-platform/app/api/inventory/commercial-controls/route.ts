import { created, fail, ok } from "@/lib/api/responses";
import { requirePlatformAccess } from "@/lib/security/platform-guard";
import { ensureSprint10CommercialRole, getInventoryCommercialHardeningDashboard, recordInventoryCommercialControlSnapshot } from "@/lib/inventory/inventory-commercial-hardening-service";

export async function GET(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "VIEW" });
  if (!guard.ok) return guard.response;
  try {
    return ok({ dashboard: await getInventoryCommercialHardeningDashboard(guard.session) });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to load commercial controls", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requirePlatformAccess({ request, module: "INVENTORY", level: "ADMINISTER" });
  if (!guard.ok) return guard.response;
  if (!ensureSprint10CommercialRole(guard.session)) return fail("Administrator or owner role required for commercial control snapshots", 403);
  try {
    const checks = await recordInventoryCommercialControlSnapshot({ request, session: guard.session });
    return created({ checks, commercialRule: "Control snapshots provide release evidence and do not mutate stock." });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to record commercial control snapshot", 400);
  }
}
