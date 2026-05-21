import type { ZodSchema, z } from 'zod';
import { auth } from '@/auth';
import type { ActionResult } from '@/lib/types';

export const ok = (extras?: { redirectTo?: string }): ActionResult => ({
  ok: true,
  ...extras,
});

export const formError = (message: string): ActionResult => ({
  ok: false,
  message,
});

/**
 * Parse a subset of fields from FormData against a Zod schema.
 * Returns the parsed data on success, or a ready-to-return ActionResult
 * with `formErrors` populated on failure.
 */
export function parseFormData<S extends ZodSchema>(
  schema: S,
  formData: FormData,
  fields: readonly string[]
):
  | { ok: true; data: z.infer<S> }
  | { ok: false; result: ActionResult } {
  const input = Object.fromEntries(
    fields.map((field) => [field, formData.get(field)])
  );
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        formErrors: parsed.error.flatten().fieldErrors,
      },
    };
  }
  return { ok: true, data: parsed.data };
}

/**
 * Resolve the current user or a ready-to-return ActionResult with the
 * given form-level message. The success branch narrows `user.id` to a
 * non-nullable string.
 */
export async function requireUserOr(message: string): Promise<
  | { ok: true; user: { id: string } }
  | { ok: false; result: ActionResult }
> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return { ok: false, result: formError(message) };
  }
  return { ok: true, user: { id: userId } };
}
