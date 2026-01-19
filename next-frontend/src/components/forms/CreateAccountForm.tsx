"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"

import { createAccountSchema } from "@/lib/forms/schemas"
import type { CreateAccountFormValues } from "@/lib/forms/types"
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors"
import { createAccountAction } from "@/app/actions/account-actions"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateAccountForm() {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateAccountFormValues>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  const onSubmit = async (values: CreateAccountFormValues) => {
    setFormError(null)

    const formData = new FormData()
    formData.set("name", values.name.trim())
    formData.set("email", values.email.trim())

    const result = await createAccountAction(formData)

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo)
      }
      return
    }

    if (result.error.code === "email_already_exists") {
      setError("email", { message: "Email ja cadastrado." })
      return
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      name: "name",
      email: "email",
    })

    if (!applied) {
      setFormError(
        getApiErrorMessage(result.error, "Nao foi possivel criar a conta.")
      )
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
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Nome
        </label>
        <Input
          id="name"
          placeholder="Nome da sua empresa"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name?.message && (
          <p className="text-xs text-danger-text">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium text-foreground">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="voce@empresa.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email?.message && (
          <p className="text-xs text-danger-text">{errors.email.message}</p>
        )}
      </div>

      <Button className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Criando...
          </>
        ) : (
          "Criar conta"
        )}
      </Button>
    </form>
  )
}
