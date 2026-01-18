import type React from "react";
import { InvoiceForm } from "./InvoiceForm";

const errorMessages: Record<string, string> = {
  invalid_expiry: "Informe a data de expiracao no formato MM/AA ou MM/AAAA.",
  validation_error: "Preencha todos os campos obrigatorios corretamente.",
  invoice_create_failed: "Nao foi possivel criar a transferencia. Tente novamente.",
};

export default async function CreateInvoicePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error] ?? errorMessages.invoice_create_failed
    : undefined;

  return (
    <div className="bg-[#1e293b] rounded-lg p-6 border border-gray-800">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-1">Nova Transferencia</h1>
        <p className="text-gray-400">
          Preencha os dados abaixo para processar uma nova transferencia
        </p>
      </div>

      <InvoiceForm initialError={error} />
    </div>
  );
}
