import { InvoiceList } from "@/app/invoices/invoice-list"

export const dynamic = "force-dynamic";

export default async function InvoiceListPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>;
}) {
  // Em uma aplicação real, verificaria se o usuário está autenticado
  // const isAuthenticated = checkAuth()
  // if (!isAuthenticated) redirect('/auth')

  const resolvedSearchParams = await searchParams;
  return <InvoiceList page={resolvedSearchParams?.page} size={resolvedSearchParams?.size} />
}
