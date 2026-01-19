import type React from "react"
import { Inter, Sora, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Header } from "@/components/header"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
})

export const metadata = {
  title: "Payment Gateway",
  description: "Gateway de pagamentos moderno e seguro",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${sora.variable} ${jetbrainsMono.variable} font-sans bg-background min-h-screen bg-grid`}
      >
        <div className="relative min-h-screen flex flex-col bg-hero">
          {/* Vignette overlay */}
          <div className="pointer-events-none fixed inset-0 bg-vignette" />

          {/* Header */}
          <Header />

          {/* Main content */}
          <main className="relative flex-1 container mx-auto px-4 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="relative border-t border-border/50 py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm text-gradient-metallic">
                    PG
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Payment Gateway
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date().getFullYear()} Payment Gateway. Todos os direitos reservados.
                </p>
                <p className="text-2xs text-muted-foreground/60 font-mono">
                  Secure by default
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
