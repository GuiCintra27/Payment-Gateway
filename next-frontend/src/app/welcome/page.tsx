import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

async function dismissPreviewAction() {
  "use server";
  const cookiesStore = await cookies();
  cookiesStore.delete("apiKeyPreview");
  redirect("/invoices");
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const cookiesStore = await cookies();
  const apiKeyPreview = cookiesStore.get("apiKeyPreview")?.value;

  if (!apiKeyPreview) {
    redirect("/invoices");
  }

  const isDemo = resolvedSearchParams?.mode === "demo";

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <Card className="w-full max-w-xl bg-[#1e293b] border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">
            {isDemo ? "Demo pronto" : "Conta criada"}
          </CardTitle>
          <CardDescription className="text-gray-400">
            Guarde sua API Key. Ela sera exibida apenas uma vez.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-gray-700 bg-[#2a3749] p-4 text-center text-white break-all">
            {apiKeyPreview}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <CopyButton value={apiKeyPreview} />
            <form action={dismissPreviewAction}>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                Continuar
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
