"use server";

import { updateTag } from "next/cache";
import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api";
import { parseApiError, type ActionResult } from "@/lib/forms/api-errors";

export async function createInvoiceAction(
  formData: FormData,
): Promise<ActionResult> {
  const cookiesStore = await cookies();
  const apiKey = cookiesStore.get("apiKey")?.value;
  if (!apiKey) {
    return {
      ok: false,
      error: { code: "invalid_api_key", message: "API key invalida." },
    };
  }

  const amount = formData.get("amount")?.toString().replace(",", ".");
  const description = formData.get("description");
  const cardNumberRaw = formData.get("cardNumber")?.toString() ?? "";
  const cardNumber = cardNumberRaw.replace(/\D/g, "");
  const expiryDateRaw = formData.get("expiryDate")?.toString().trim() ?? "";
  const [expiryMonthRaw, expiryYearRaw] = expiryDateRaw.split("/");
  const expiryMonth = Number.parseInt(expiryMonthRaw ?? "", 10);
  const expiryYearValue = Number.parseInt(expiryYearRaw ?? "", 10);
  const expiryYear = Number.isNaN(expiryYearValue)
    ? NaN
    : expiryYearValue < 100
    ? 2000 + expiryYearValue
    : expiryYearValue;
  const cvvRaw = formData.get("cvv")?.toString() ?? "";
  const cvv = cvvRaw.replace(/\D/g, "");
  const cardholderName = formData.get("cardholderName");

  if (!expiryMonth || Number.isNaN(expiryYear)) {
    return {
      ok: false,
      error: { code: "invalid_expiry", message: "Data de expiracao invalida." },
    };
  }

  const apiBaseUrl = getApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/invoice`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": apiKey as string,
    },
    body: JSON.stringify({
      amount: parseFloat(amount as string),
      description,
      card_number: cardNumber,
      expiry_month: expiryMonth,
      expiry_year: expiryYear,
      cvv,
      cardholder_name: cardholderName,
      payment_type: "credit_card",
    }),
  });

  if (!response.ok) {
    return { ok: false, error: await parseApiError(response) };
  }

  const data = await response.json();

  updateTag(`accounts/${apiKey}/invoices`);
  updateTag(`accounts/${apiKey}/invoices/${data.id}`);

  return { ok: true, redirectTo: "/invoices" };
}
