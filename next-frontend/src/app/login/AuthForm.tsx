"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowRight, Info, Loader2 } from "lucide-react"

import { loginSchema } from "@/lib/forms/schemas"
import type { LoginFormValues } from "@/lib/forms/types"
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors"
import { loginAction } from "@/app/actions/auth-actions"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AuthFormProps = {
  initialError?: string
}

export function AuthForm({ initialError }: AuthFormProps) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(initialError ?? null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      apiKey: "",
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)

    const formData = new FormData()
    formData.set("apiKey", values.apiKey.trim())

    const result = await loginAction(formData)

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo)
      }
      return
    }

    if (result.error.code === "invalid_api_key") {
      setError("apiKey", { message: "API Key invalida." })
      return
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      apiKey: "apiKey",
    })

    if (!applied) {
      setFormError(getApiErrorMessage(result.error, "Falha ao autenticar."))
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="apiKey" className="text-sm font-medium text-foreground">
          API Key
        </label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            type="password"
            placeholder="Digite sua API Key"
            className="font-mono"
            aria-invalid={!!errors.apiKey}
            {...register("apiKey")}
          />
          <Button type="submit" disabled={isSubmitting} className="px-4">
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <ArrowRight className="size-4" />
            )}
          </Button>
        </div>
        {errors.apiKey?.message && (
          <p className="text-xs text-danger-text">{errors.apiKey.message}</p>
        )}
      </div>

      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>Como obter uma API Key?</AlertTitle>
        <AlertDescription>
          Crie uma conta na pagina inicial para receber sua API Key.
          Ela sera exibida apenas uma vez.
        </AlertDescription>
      </Alert>
    </form>
  )
}
