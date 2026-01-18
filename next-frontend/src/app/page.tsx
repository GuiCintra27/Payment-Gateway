import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createDemoAccountAction,
} from "@/app/actions/account-actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateAccountForm } from "@/components/forms/CreateAccountForm";

const errorMessages: Record<string, string> = {
  account_create_failed: "Nao foi possivel criar sua conta. Tente novamente.",
  demo_unavailable: "Modo demo indisponivel no momento. Tente novamente.",
};

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookiesStore = await cookies();
  const apiKey = cookiesStore.get("apiKey")?.value;
  if (apiKey) {
    redirect("/invoices");
  }

  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error]
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Gateway de Transferencias
          </h1>
          <p className="text-gray-400">
            Crie sua conta ou use um demo para explorar o fluxo completo.
          </p>
        </div>
        <Link className="text-indigo-400 hover:text-indigo-300" href="/login">
          Tenho API Key
        </Link>
      </div>

      {error && (
        <Alert className="bg-[#2a3749] border-gray-700">
          <AlertTitle className="text-gray-200">Ops</AlertTitle>
          <AlertDescription className="text-gray-400">{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-[#1e293b] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Criar conta</CardTitle>
            <CardDescription className="text-gray-400">
              Receba sua API Key e comece a emitir transferencias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAccountForm />
          </CardContent>
        </Card>

        <Card className="bg-[#1e293b] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Modo demo</CardTitle>
            <CardDescription className="text-gray-400">
              Acesse dados prontos e explore o produto em segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-sm text-gray-400 space-y-2">
              <li>- Conta com saldo inicial e 5 transferencias</li>
              <li>- Status variados (aprovado, pendente, rejeitado)</li>
              <li>- Ideal para mostrar o fluxo ao recrutador</li>
            </ul>
            <form action={createDemoAccountAction}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Entrar no demo
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
