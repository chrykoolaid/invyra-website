import { z } from "zod";
import { created, fail } from "@/lib/api/responses";
import { activateDevice } from "@/lib/devices/device-activation";

const schema = z.object({
  code: z.string().min(10),
  deviceName: z.string().min(2),
  deviceIdentifier: z.string().min(3).optional().nullable(),
  assignedLocation: z.string().min(2).optional().nullable()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid device activation payload.", 422, parsed.error.flatten());

  try {
    const device = await activateDevice({ request, ...parsed.data });
    return created({ device });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to activate device.");
  }
}
