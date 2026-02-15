import { cookies } from "next/headers"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArrowRight, Sparkles, Shield, Zap, TrendingUp } from "lucide-react"
import { createDemoAccountAction } from "@/app/actions/account-actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreateAccountForm } from "@/components/forms/CreateAccountForm"

const errorMessages: Record<string, string> = {
  account_create_failed: "Nao foi possivel criar sua conta. Tente novamente.",
  demo_unavailable: "Modo demo indisponivel no momento. Tente novamente.",
}

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const cookiesStore = await cookies()
  const apiKey = cookiesStore.get("apiKey")?.value
  if (apiKey) {
    redirect("/invoices")
  }

  const error = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error]
    : undefined

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* Hero Section */}
      <section className="text-center space-y-4 py-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
          <span>Gateway de</span>{" "}
          <span className="text-gradient-metallic">Pagamentos</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
          Processamento de pagamentos moderno, seguro e em tempo real.
          Crie sua conta ou explore o demo.
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/60 font-mono">
          <Shield className="size-3" />
          <span>Secure by default</span>
          <span className="text-border">|</span>
          <Zap className="size-3" />
          <span>Event-driven</span>
          <span className="text-border">|</span>
          <TrendingUp className="size-3" />
          <span>Real-time</span>
        </div>
      </section>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="max-w-2xl mx-auto">
          <AlertTitle>Ops!</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Cards Section */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-5xl mx-auto">
        {/* Create Account Card */}
        <Card variant="feature" className="animate-slideUp stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10 text-primary">
                <ArrowRight className="size-4" />
              </div>
              Criar conta
            </CardTitle>
            <CardDescription>
              Receba sua API Key e comece a processar pagamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateAccountForm />
          </CardContent>
        </Card>

        {/* Demo Mode Card */}
        <Card className="animate-slideUp stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center size-8 rounded-lg bg-accent/10 text-accent">
                <Sparkles className="size-4" />
              </div>
              Modo demo
            </CardTitle>
            <CardDescription>
              Acesse dados prontos e explore o produto em segundos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="size-1.5 rounded-full bg-success" />
                Conta com saldo inicial e 5 transacoes
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="size-1.5 rounded-full bg-warning" />
                Status variados (aprovado, pendente, rejeitado)
              </li>
              <li className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <div className="size-1.5 rounded-full bg-accent" />
                Ideal para explorar o fluxo completo
              </li>
            </ul>
            <form action={createDemoAccountAction}>
              <Button variant="accent" className="w-full">
                <Sparkles className="size-4" />
                Entrar no demo
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>

      {/* Already have account link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Ja tenho uma API Key
          <ArrowRight className="size-3" />
        </Link>
      </div>

      {/* Features Strip */}
      <section className="py-8 border-t border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center space-y-1">
            <p className="font-display text-2xl font-bold text-foreground tabular-nums">99.9%</p>
            <p className="text-xs text-muted-foreground">Uptime</p>
          </div>
          <div className="text-center space-y-1">
            <p className="font-display text-2xl font-bold text-foreground tabular-nums">&lt;100ms</p>
            <p className="text-xs text-muted-foreground">Latencia</p>
          </div>
          <div className="text-center space-y-1">
            <p className="font-display text-2xl font-bold text-foreground tabular-nums">256-bit</p>
            <p className="text-xs text-muted-foreground">Encryption</p>
          </div>
          <div className="text-center space-y-1">
            <p className="font-display text-2xl font-bold text-foreground tabular-nums">PCI</p>
            <p className="text-xs text-muted-foreground">Compliant</p>
          </div>
        </div>
      </section>
    </div>
  )
}
