import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { InvoiceDownloadButton } from "@/components/invoice-download-button"
import { ArrowLeft, CreditCard, Calendar, FileText, Hash, Clock } from "lucide-react"
import Link from "next/link"
import { cookies } from "next/headers"
import { StatusBadge } from "@/components/StatusBadge"
import { getApiBaseUrl } from "@/lib/api"

type InvoiceEvent = {
  id: string
  invoice_id: string
  event_type: string
  from_status?: string | null
  to_status?: string | null
  metadata?: Record<string, unknown> | null
  request_id?: string | null
  created_at: string
}

async function getInvoice(id: string) {
  const cookiesStore = await cookies()
  const apiKey = cookiesStore.get("apiKey")?.value
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/invoice/${id}`, {
    headers: {
      "X-API-KEY": apiKey as string,
    },
    cache: "force-cache",
    next: {
      tags: [`accounts/${apiKey}/invoices/${id}`],
    },
  })
  return response.json()
}

async function getInvoiceEvents(id: string): Promise<InvoiceEvent[]> {
  const cookiesStore = await cookies()
  const apiKey = cookiesStore.get("apiKey")?.value
  const apiBaseUrl = getApiBaseUrl()
  const response = await fetch(`${apiBaseUrl}/invoice/${id}/events`, {
    headers: {
      "X-API-KEY": apiKey as string,
    },
    cache: "no-store",
    next: {
      tags: [`accounts/${apiKey}/invoices/${id}/events`],
    },
  })
  if (!response.ok) {
    return []
  }
  return response.json()
}

export default async function InvoiceDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const invoice = await getInvoice(id)
  const events = await getInvoiceEvents(id)

  const eventConfig: Record<
    string,
    { title: string; description: string; tone: "success" | "warning" | "danger" | "neutral" }
  > = {
    created: {
      title: "Transacao criada",
      description: "Registro inicial da fatura",
      tone: "neutral",
    },
    pending_published: {
      title: "Analise antifraude iniciada",
      description: "Evento publicado para validacao",
      tone: "warning",
    },
    approved: {
      title: "Transacao aprovada",
      description: "Pagamento confirmado",
      tone: "success",
    },
    rejected: {
      title: "Transacao rejeitada",
      description: "Verifique os dados do cartao",
      tone: "danger",
    },
    balance_applied: {
      title: "Saldo atualizado",
      description: "Credito aplicado na conta",
      tone: "success",
    },
  }

  const toneColor = (tone: "success" | "warning" | "danger" | "neutral") => {
    if (tone === "success") return "bg-success"
    if (tone === "warning") return "bg-warning"
    if (tone === "danger") return "bg-destructive"
    return "bg-primary"
  }

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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="h-4 w-[2px] rounded-full bg-primary/70" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Transacao
            </h1>
            <StatusBadge status={invoice.status} />
          </div>
          <p className="font-mono text-sm text-muted-foreground">
            {invoice.id}
          </p>
        </div>
        <InvoiceDownloadButton
          invoice={invoice}
          variant="outline"
          size="sm"
          showLabel
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Transaction Info */}
        <Card className="animate-slideUp stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="size-4 text-primary" />
              Detalhes da Transacao
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                <Hash className="size-3.5" />
                ID
              </div>
              <span className="font-mono text-sm text-foreground">
                {invoice.id.slice(0, 16)}...
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                <span className="text-xs font-bold">R$</span>
                Valor
              </div>
              <span className="font-mono text-lg font-bold text-primary tabular-nums">
                R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                <Calendar className="size-3.5" />
                Criado em
              </div>
              <span className="text-sm text-foreground">
                {new Date(invoice.created_at).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>

            <div className="flex items-start justify-between py-1.5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                <FileText className="size-3.5" />
                Descricao
              </div>
              <span className="text-sm text-foreground text-right max-w-[200px]">
                {invoice.description}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="animate-slideUp stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-primary" />
              Metodo de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Tipo
              </span>
              <span className="text-sm text-foreground">
                {invoice.payment_type === "credit_card"
                  ? "Cartao de credito"
                  : "Boleto"}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 border-b border-border/50">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Ultimos digitos
              </span>
              <span className="font-mono text-sm text-foreground">
                **** {invoice.card_last_digits}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5">
              <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80">
                Status
              </span>
              <StatusBadge status={invoice.status} />
            </div>
          </CardContent>
        </Card>

        {/* Timeline / Events (placeholder) */}
        <Card className="md:col-span-2 animate-slideUp stagger-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="size-4 text-primary" />
              Historico de Eventos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="text-sm text-muted-foreground">
                Nenhum evento registrado ainda.
              </div>
            ) : (
              <div className="space-y-4">
                {events.map((event, index) => {
                  const config =
                    eventConfig[event.event_type] ??
                    {
                      title: event.event_type,
                      description: "Evento registrado",
                      tone: "neutral" as const,
                    }
                  return (
                    <div className="flex gap-4" key={event.id}>
                      <div className="flex flex-col items-center">
                        <div className={`size-3 rounded-full ${toneColor(config.tone)}`} />
                        {index < events.length - 1 && (
                          <div className="w-px flex-1 bg-border" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-foreground">
                          {config.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.created_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
