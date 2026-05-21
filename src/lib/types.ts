export type FieldErrors = {
  [field: string]: string[] | undefined;
};

/**
 * Discriminated result for server actions.
 *
 * Success branch carries an optional `redirectTo` so the client can navigate
 * after the pending UI resolves (server-side `redirect()` throws mid-action,
 * leaving optimistic buttons spinning).
 *
 * Failure branch carries either per-field validation errors (`formErrors`)
 * or a form-level message — typically not both.
 */
export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; formErrors?: FieldErrors; message?: string };

export const INITIAL_ACTION_STATE: ActionResult = { ok: false };

export function fieldError(state: ActionResult, name: string): string[] | undefined {
  return !state.ok ? state.formErrors?.[name] : undefined;
}

export function formMessage(state: ActionResult): string | undefined {
  return !state.ok ? state.message : undefined;
}
