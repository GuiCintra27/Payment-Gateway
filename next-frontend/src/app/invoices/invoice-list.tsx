import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusIcon, Eye, Download } from "lucide-react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { cookies } from "next/headers";
import { getApiBaseUrl } from "@/lib/api";

export async function getInvoices() {
  const cookiesStore = await cookies();
  const apiKey = cookiesStore.get("apiKey")?.value;
  const apiBaseUrl = getApiBaseUrl();
  if (!apiKey) {
    return [];
  }
  const response = await fetch(`${apiBaseUrl}/invoice`, {
    headers: {
      "X-API-KEY": apiKey as string,
    },
    cache: "no-store",
  });
  return response.json();
}

type InvoiceListProps = {
  page?: string;
  size?: string;
};

function parsePositiveInt(value: string | undefined, fallback: number, max?: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  const normalized = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  if (typeof max === "number") {
    return Math.min(normalized, max);
  }
  return normalized;
}

export async function InvoiceList({ page, size }: InvoiceListProps) {
  const invoices = await getInvoices();
  const pageSize = parsePositiveInt(size, 3, 50);
  const total = invoices.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(parsePositiveInt(page, 1), totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const pageInvoices = invoices.slice(startIndex, startIndex + pageSize);
  const startLabel = total === 0 ? 0 : startIndex + 1;
  const endLabel = Math.min(startIndex + pageSize, total);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const maxPagesToShow = 5;
  const halfWindow = Math.floor(maxPagesToShow / 2);
  const windowStart = Math.max(1, currentPage - halfWindow);
  const windowEnd = Math.min(totalPages, windowStart + maxPagesToShow - 1);
  const pages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, index) => windowStart + index,
  );

  const buildHref = (targetPage: number) => `/invoices?page=${targetPage}&size=${pageSize}`;

  return (
    <div className="bg-[#1e293b] rounded-lg p-6 border border-gray-800">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Transferencias</h1>
          <p className="text-gray-400">
            Gerencie suas transferencias e acompanhe as transferencias
          </p>
        </div>
        <Button
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          asChild
        >
          <Link href="/invoices/create">
            <PlusIcon className="h-4 w-4 mr-2" />
            Nova Transferencia
          </Link>
        </Button>
      </div>

      {/* Filtros */}
      {/* <div className="bg-[#232f43] rounded-lg p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="text-sm text-gray-400 mb-1 block">Status</label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="bg-[#2a3749] border-gray-700 text-white">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Data Inicial</label>
          <Input
            type="text"
            placeholder="dd/mm/aaaa"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Data Final</label>
          <Input
            type="text"
            placeholder="dd/mm/aaaa"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        <div>
          <label className="text-sm text-gray-400 mb-1 block">Buscar</label>
          <Input
            type="text"
            placeholder="ID ou descrição"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div> */}

      {/* Tabela de Transferencias */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                ID
              </th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                DATA
              </th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                DESCRIÇÃO
              </th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                VALOR
              </th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                STATUS
              </th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium text-sm">
                AÇÕES
              </th>
            </tr>
          </thead>
          <tbody>
            {pageInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-gray-800">
                <td className="py-4 px-4 text-white">{invoice.id}</td>
                <td className="py-4 px-4 text-white">
                  {new Date(invoice.created_at).toLocaleDateString()}
                </td>
                <td className="py-4 px-4 text-white">{invoice.description}</td>
                <td className="py-4 px-4 text-white">
                  R$ {invoice.amount.toFixed(2).replace(".", ",")}
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={invoice.status} />
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-gray-700"
                      asChild
                    >
                      <Link href={`/invoices/${invoice.id}`}>
                        <Eye className="h-4 w-4 text-gray-400" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-gray-700"
                    >
                      <Download className="h-4 w-4 text-gray-400" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-gray-400">
          Mostrando {startLabel} - {endLabel} de {total} resultados
        </div>
        <div className="flex gap-1">
          {hasPrev ? (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#2a3749] border-gray-700"
              asChild
            >
              <Link href={buildHref(currentPage - 1)}>&lt;</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#2a3749] border-gray-700"
              disabled
            >
              &lt;
            </Button>
          )}

          {pages.map((pageNumber) => {
            const isActive = pageNumber === currentPage;
            return (
              <Button
                key={pageNumber}
                size="sm"
                className={isActive ? "h-8 w-8 bg-indigo-600 text-white" : "h-8 w-8 bg-[#2a3749] border border-gray-700"}
                variant={isActive ? "default" : "outline"}
                asChild
              >
                <Link href={buildHref(pageNumber)}>{pageNumber}</Link>
              </Button>
            );
          })}

          {hasNext ? (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#2a3749] border-gray-700"
              asChild
            >
              <Link href={buildHref(currentPage + 1)}>&gt;</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 bg-[#2a3749] border-gray-700"
              disabled
            >
              &gt;
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
