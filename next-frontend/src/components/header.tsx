import Link from "next/link"
import { Button } from "@/components/ui/button"
import { LogOut, User } from "lucide-react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

export async function logoutAction() {
  "use server"
  const cookiesStore = await cookies()
  cookiesStore.delete("apiKey")
  redirect("/login")
}

export async function Header() {
  const cookiesStore = await cookies()
  const isAuthenticated = cookiesStore.get("apiKey")?.value !== undefined

  return (
    <header className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <span className="font-display text-xl font-bold text-gradient-metallic">
              PG
            </span>
            <span className="text-foreground font-medium group-hover:text-primary transition-colors">
              Payment Gateway
            </span>
          </Link>

          {/* Navigation / User area */}
          {isAuthenticated ? (
            <div className="flex items-center gap-4">
              {/* User info */}
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center justify-center size-8 rounded-full bg-secondary border border-border">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <span className="text-muted-foreground hidden sm:inline">
                  Conta ativa
                </span>
              </div>

              {/* Separator */}
              <div className="h-6 w-px bg-border" />

              {/* Logout */}
              <form action={logoutAction}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="size-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link href="/">
                <Button size="sm">
                  Criar conta
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
