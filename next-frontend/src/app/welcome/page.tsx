import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { CheckCircle2, Copy, Key, ArrowRight, Sparkles } from "lucide-react"
import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"

async function dismissPreviewAction() {
  "use server"
  const cookiesStore = await cookies()
  cookiesStore.delete("apiKeyPreview")
  redirect("/invoices")
}

export default async function WelcomePage({
  searchParams,
}: {
  searchParams?: Promise<{ mode?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const cookiesStore = await cookies()
  const apiKeyPreview = cookiesStore.get("apiKeyPreview")?.value

  if (!apiKeyPreview) {
    redirect("/invoices")
  }

  const isDemo = resolvedSearchParams?.mode === "demo"

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
      <Card variant="glass" className="w-full max-w-lg animate-scaleIn">
        <CardHeader className="text-center space-y-4">
          {/* Success icon */}
          <div className="mx-auto flex items-center justify-center size-16 rounded-full bg-success-bg border border-success-border">
            {isDemo ? (
              <Sparkles className="size-8 text-success" />
            ) : (
              <CheckCircle2 className="size-8 text-success" />
            )}
          </div>

          {/* Title and description */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <CardTitle className="text-2xl">
                {isDemo ? "Demo pronto!" : "Conta criada!"}
              </CardTitle>
              {isDemo && (
                <Badge variant="accent">Demo</Badge>
              )}
            </div>
            <CardDescription className="text-base">
              Guarde sua API Key com seguranca.{" "}
              <span className="text-warning-text font-medium">
                Ela sera exibida apenas uma vez.
              </span>
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* API Key display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Key className="size-4" />
              <span>Sua API Key</span>
            </div>
            <div className="relative">
              <div className="rounded-lg border border-border bg-background-subtle p-4 font-mono text-sm text-foreground break-all select-all">
                {apiKeyPreview}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <CopyButton value={apiKeyPreview} />
            <form action={dismissPreviewAction}>
              <Button className="w-full">
                Continuar para o dashboard
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </div>

          {/* Security note */}
          <Alert variant="warning" className="text-xs">
            <AlertDescription>
              Esta chave permite acesso total a sua conta. Nunca compartilhe ou exponha em codigo publico.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Security footer */}
      <p className="mt-6 text-2xs text-muted-foreground/60 font-mono text-center">
        API Keys are hashed (HMAC-256) and rate-limited
      </p>
    </div>
  )
}
