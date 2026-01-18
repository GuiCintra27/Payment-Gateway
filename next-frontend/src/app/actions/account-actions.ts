"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getApiBaseUrl } from "@/lib/api";
import { parseApiError, type ActionResult } from "@/lib/forms/api-errors";

type AccountResponse = {
  api_key?: string;
};

type DemoResponse = {
  account?: {
    api_key?: string;
  };
};

async function setAuthCookies(apiKey: string) {
  const cookiesStore = await cookies();
  cookiesStore.set("apiKey", apiKey, {
    httpOnly: true,
    sameSite: "lax",
  });
  cookiesStore.set("apiKeyPreview", apiKey, {
    httpOnly: true,
    maxAge: 300,
    sameSite: "lax",
  });
}

export async function createAccountAction(
  formData: FormData,
): Promise<ActionResult> {
  const name = formData.get("name")?.toString() ?? "";
  const email = formData.get("email")?.toString() ?? "";

  const response = await fetch(`${getApiBaseUrl()}/accounts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await parseApiError(response) };
  }

  const data: AccountResponse = await response.json();
  if (!data.api_key) {
    return {
      ok: false,
      error: { message: "API key nao retornada pelo gateway." },
    };
  }

  await setAuthCookies(data.api_key);
  return { ok: true, redirectTo: "/welcome" };
}

export async function createDemoAccountAction() {
  const response = await fetch(`${getApiBaseUrl()}/demo`, {
    method: "POST",
  });

  if (!response.ok) {
    redirect("/?error=demo_unavailable");
  }

  const data: DemoResponse = await response.json();
  if (!data.account?.api_key) {
    redirect("/?error=demo_unavailable");
  }

  await setAuthCookies(data.account.api_key);
  redirect("/welcome?mode=demo");
}
