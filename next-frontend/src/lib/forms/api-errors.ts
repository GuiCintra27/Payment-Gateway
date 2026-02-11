import type { FieldPath, FieldValues, UseFormSetError } from "react-hook-form";

export type ApiErrorPayload = {
  code?: string;
  message?: string;
  details?: Record<string, string>;
};

export type ActionResult =
  | { ok: true; redirectTo?: string }
  | { ok: false; error: ApiErrorPayload };

export async function parseApiError(response: Response): Promise<ApiErrorPayload> {
  const text = await response.text();
  if (!text) {
    return { message: "Erro desconhecido." };
  }
  try {
    return JSON.parse(text) as ApiErrorPayload;
  } catch {
    return { message: text };
  }
}

export function applyFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  details: Record<string, string> | undefined,
  fieldMap: Record<string, FieldPath<T>>,
) {
  if (!details) {
    return false;
  }

  let applied = false;
  Object.entries(details).forEach(([key, message]) => {
    const field = fieldMap[key];
    if (field) {
      setError(field, { message });
      applied = true;
    }
  });

  return applied;
}

export function getApiErrorMessage(payload: ApiErrorPayload, fallback: string) {
  return payload.message && payload.message.trim() !== ""
    ? payload.message
    : fallback;
}
