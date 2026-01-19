import Link from "next/link"
import { KeyRound, ArrowLeft } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AuthForm } from "./AuthForm"

const errorMessages: Record<string, string> = {
  invalid_api_key: "API Key invalida. Verifique e tente novamente.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error]
    : undefined

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] animate-fadeIn">
      {/* Back link */}
      <div className="w-full max-w-md mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="size-3" />
          Voltar
        </Link>
      </div>

      {/* Login Card */}
      <Card variant="glass" className="w-full max-w-md animate-scaleIn">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto flex items-center justify-center size-12 rounded-xl bg-primary/10 text-primary">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-2xl">Autenticacao</CardTitle>
          <CardDescription>
            Insira sua API Key para acessar o sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AuthForm initialError={error} />

          {/* Sign up link */}
          <div className="text-center text-sm text-muted-foreground">
            Ainda nao tem uma conta?{" "}
            <Link
              href="/"
              className="text-primary hover:text-primary-hover transition-colors"
            >
              Criar conta
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Security note */}
      <p className="mt-6 text-2xs text-muted-foreground/60 font-mono text-center">
        Secured with HMAC-256 | Rate-limited
      </p>
    </div>
  )
}
