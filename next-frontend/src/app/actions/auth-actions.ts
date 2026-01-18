"use server";

import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api";
import { parseApiError, type ActionResult } from "@/lib/forms/api-errors";

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const apiKey = formData.get("apiKey")?.toString() ?? "";

  if (!apiKey) {
    return {
      ok: false,
      error: { code: "api_key_required", message: "API key obrigatoria." },
    };
  }

  const response = await fetch(`${getApiBaseUrl()}/accounts`, {
    headers: {
      "X-API-KEY": apiKey,
    },
  });

  if (!response.ok) {
    return { ok: false, error: await parseApiError(response) };
  }

  const cookiesStore = await cookies();
  cookiesStore.set("apiKey", apiKey, {
    httpOnly: true,
    sameSite: "lax",
  });

  return { ok: true, redirectTo: "/invoices" };
}
