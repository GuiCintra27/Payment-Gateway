import type React from "react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
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
  const error = resolvedSearchParams?.error ? errorMessages[resolvedSearchParams.error] : undefined
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Card className="w-full max-w-md bg-[#1e293b] border-gray-800">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Autenticação</CardTitle>
          <CardDescription className="text-gray-400">Insira sua API Key para acessar o sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm initialError={error} />
          <div className="mt-4 text-center text-sm text-gray-400">
            Ainda nao tem uma conta?{" "}
            <Link className="text-indigo-400 hover:text-indigo-300" href="/">
              Criar conta
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
