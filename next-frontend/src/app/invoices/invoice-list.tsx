import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Plus, Eye, Download, ChevronLeft, ChevronRight, Receipt, TrendingUp, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { StatusBadge } from "@/components/StatusBadge"
import { cookies } from "next/headers"
import { getApiBaseUrl } from "@/lib/api"

export async function getInvoices() {
  const cookiesStore = await cookies()
  const apiKey = cookiesStore.get("apiKey")?.value
  const apiBaseUrl = getApiBaseUrl()
  if (!apiKey) {
    return []
  }
  const response = await fetch(`${apiBaseUrl}/invoice`, {
    headers: {
      "X-API-KEY": apiKey as string,
    },
    cache: "no-store",
  })
  return response.json()
}

type InvoiceListProps = {
  page?: string
  size?: string
}

function parsePositiveInt(value: string | undefined, fallback: number, max?: number) {
  const parsed = Number.parseInt(value ?? "", 10)
  const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
  if (typeof max === "number") {
    return Math.min(normalized, max)
  }
  return normalized
}

export async function InvoiceList({ page, size }: InvoiceListProps) {
  const invoices = await getInvoices()
  const pageSize = parsePositiveInt(size, 5, 50)
  const total = invoices.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = Math.min(parsePositiveInt(page, 1), totalPages)
  const startIndex = (currentPage - 1) * pageSize
  const pageInvoices = invoices.slice(startIndex, startIndex + pageSize)
  const startLabel = total === 0 ? 0 : startIndex + 1
  const endLabel = Math.min(startIndex + pageSize, total)
  const hasPrev = currentPage > 1
  const hasNext = currentPage < totalPages

  const maxPagesToShow = 5
  const halfWindow = Math.floor(maxPagesToShow / 2)
  const windowStart = Math.max(1, currentPage - halfWindow)
  const windowEnd = Math.min(totalPages, windowStart + maxPagesToShow - 1)
  const pages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, index) => windowStart + index
  )

  const buildHref = (targetPage: number) => `/invoices?page=${targetPage}&size=${pageSize}`

  // Calculate stats
  const approvedCount = invoices.filter((i: { status: string }) => i.status === "approved").length
  const pendingCount = invoices.filter((i: { status: string }) => i.status === "pending").length
  const rejectedCount = invoices.filter((i: { status: string }) => i.status === "rejected").length
  const totalAmount = invoices.reduce((sum: number, i: { amount: number }) => sum + i.amount, 0)

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="h-4 w-[2px] rounded-full bg-primary/70" />
            <h1 className="font-display text-2xl font-bold text-foreground">
              Transacoes
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Gerencie e acompanhe suas transacoes
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/create">
            <Plus className="size-4" />
            Nova Transacao
          </Link>
        </Button>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="animate-slideUp stagger-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary">
                <Receipt className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{total}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Total
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slideUp stagger-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-success-bg text-success">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{approvedCount}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Aprovadas
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slideUp stagger-3">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-warning-bg text-warning">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">{pendingCount}</p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Pendentes
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-slideUp stagger-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center size-10 rounded-lg bg-accent/10 text-accent">
                <span className="text-sm font-bold">R$</span>
              </div>
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/80">
                  Volume
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table Card */}
      <Card className="animate-slideUp stagger-5">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/70">
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    ID
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Data
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Descricao
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Valor
                  </th>
                  <th className="text-left py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Status
                  </th>
                  <th className="text-right py-2.5 px-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground/80">
                    Acoes
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center justify-center size-12 rounded-full bg-secondary">
                          <Receipt className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            Nenhuma transacao encontrada
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Crie sua primeira transacao para comecar
                          </p>
                        </div>
                        <Button asChild size="sm" className="mt-2">
                          <Link href="/invoices/create">
                            <Plus className="size-4" />
                            Nova Transacao
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  pageInvoices.map((invoice: {
                    id: string
                    created_at: string
                    description: string
                    amount: number
                    status: "approved" | "pending" | "rejected"
                  }) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-border/50 hover:bg-white/[0.03] transition-colors duration-150"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm text-foreground">
                          {invoice.id.slice(0, 8)}...
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground max-w-[200px] truncate">
                        {invoice.description}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm font-medium text-foreground tabular-nums">
                          R$ {invoice.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={invoice.status} />
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={`/invoices/${invoice.id}`}>
                              <Eye className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="size-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Mostrando {startLabel} - {endLabel} de {total} resultados
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!hasPrev}
                  asChild={hasPrev}
                >
                  {hasPrev ? (
                    <Link href={buildHref(currentPage - 1)}>
                      <ChevronLeft className="size-4" />
                    </Link>
                  ) : (
                    <ChevronLeft className="size-4" />
                  )}
                </Button>

                {pages.map((pageNumber) => {
                  const isActive = pageNumber === currentPage
                  return (
                    <Button
                      key={pageNumber}
                      variant={isActive ? "default" : "ghost"}
                      size="icon-sm"
                      asChild
                    >
                      <Link href={buildHref(pageNumber)}>
                        {pageNumber}
                      </Link>
                    </Button>
                  )
                })}

                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={!hasNext}
                  asChild={hasNext}
                >
                  {hasNext ? (
                    <Link href={buildHref(currentPage + 1)}>
                      <ChevronRight className="size-4" />
                    </Link>
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
