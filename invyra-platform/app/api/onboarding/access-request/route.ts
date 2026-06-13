import { z } from "zod";
import { created, fail } from "@/lib/api/responses";
import { createAccessRequest } from "@/lib/onboarding/onboarding-management";

const schema = z.object({
  requesterName: z.string().min(2),
  requesterEmail: z.string().email(),
  companyName: z.string().min(2),
  message: z.string().optional().nullable()
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) return fail("Invalid access request payload.", 422, parsed.error.flatten());

  try {
    const accessRequest = await createAccessRequest({ request, ...parsed.data });
    return created({ accessRequest });
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Unable to create access request.");
  }
}
