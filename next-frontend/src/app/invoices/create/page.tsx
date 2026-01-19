import Link from "next/link"
import { ArrowLeft, CreditCard } from "lucide-react"
import { InvoiceForm } from "./InvoiceForm"

const errorMessages: Record<string, string> = {
  invalid_expiry: "Informe a data de expiracao no formato MM/AA ou MM/AAAA.",
  validation_error: "Preencha todos os campos obrigatorios corretamente.",
  invoice_create_failed: "Nao foi possivel criar a transacao. Tente novamente.",
}

export default async function CreateInvoicePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error] ?? errorMessages.invoice_create_failed
    : undefined

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
      {/* Back link */}
      <Link
        href="/invoices"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="size-3" />
        Voltar para transacoes
      </Link>

      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
          <CreditCard className="size-6" />
        </div>
        <div>
          <div className="flex items-center gap-3">
            <span className="h-4 w-[2px] rounded-full bg-primary/70" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Nova Transacao
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Preencha os dados para processar uma nova transacao
          </p>
        </div>
      </div>

      {/* Form */}
      <InvoiceForm initialError={error} />
    </div>
  )
}
