"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CreditCard, Info, Loader2, FileText, Lock } from "lucide-react"
import Link from "next/link"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createInvoiceAction } from "./create-invoice-action"
import { createTransferSchema } from "@/lib/forms/schemas"
import type { CreateTransferFormValues } from "@/lib/forms/types"
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors"

type InvoiceFormProps = {
  initialError?: string
}

export function InvoiceForm({ initialError }: InvoiceFormProps) {
  const router = useRouter()
  const [formError, setFormError] = useState<string | null>(initialError ?? null)

  const nextYear = new Date().getFullYear() + 2
  const expiryYear = String(nextYear % 100).padStart(2, "0")
  const defaultExpiryDate = `12/${expiryYear}`

  const {
    register,
    handleSubmit,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransferFormValues>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      amount: 100.00,
      description: "Pagamento de servico",
      cardNumber: "4111111111111111",
      expiryDate: defaultExpiryDate,
      cvv: "123",
      cardholderName: "Joao da Silva",
    },
  })

  const watchAmount = watch("amount")
  const watchDescription = watch("description")

  const onSubmit = async (values: CreateTransferFormValues) => {
    setFormError(null)

    const formData = new FormData()
    formData.set("amount", values.amount.toString())
    formData.set("description", values.description)
    formData.set("cardNumber", values.cardNumber)
    formData.set("expiryDate", values.expiryDate)
    formData.set("cvv", values.cvv)
    formData.set("cardholderName", values.cardholderName)

    const result = await createInvoiceAction(formData)

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo)
      }
      return
    }

    if (result.error.code === "invalid_api_key") {
      router.push("/login?error=invalid_api_key")
      return
    }

    if (result.error.code === "invalid_expiry") {
      setError("expiryDate", { message: "Data de expiracao invalida." })
      return
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      amount: "amount",
      description: "description",
      card_number: "cardNumber",
      cvv: "cvv",
      expiry_month: "expiryDate",
      expiry_year: "expiryDate",
      cardholder_name: "cardholderName",
    })

    if (!applied) {
      setFormError(
        getApiErrorMessage(result.error, "Nao foi possivel criar a transacao.")
      )
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Alert variant="info">
        <Info className="size-4" />
        <AlertTitle>Ambiente de simulacao</AlertTitle>
        <AlertDescription>
          Use apenas dados ficticios. Nenhuma informacao real e processada.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Transaction Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Details Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="size-4 text-primary" />
                Dados da Transacao
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="amount"
                  className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Valor (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                    R$
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    step={0.01}
                    min={0.01}
                    placeholder="0,00"
                    className="pl-10 font-mono"
                    aria-invalid={!!errors.amount}
                    {...register("amount", { valueAsNumber: true })}
                  />
                </div>
                {errors.amount?.message && (
                  <p className="text-xs text-danger-text">{errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Descricao
                </label>
                <Textarea
                  id="description"
                  placeholder="Descreva o motivo da transacao"
                  aria-invalid={!!errors.description}
                  {...register("description")}
                />
                {errors.description?.message && (
                  <p className="text-xs text-danger-text">{errors.description.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <CreditCard className="size-4 text-primary" />
                Dados do Cartao
              </CardTitle>
              <CardDescription>
                Informacoes de pagamento (ambiente de teste)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="cardNumber"
                  className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Numero do Cartao
                </label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    className="pl-10 font-mono"
                    aria-invalid={!!errors.cardNumber}
                    {...register("cardNumber")}
                  />
                </div>
                {errors.cardNumber?.message && (
                  <p className="text-xs text-danger-text">{errors.cardNumber.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="expiryDate"
                    className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    Validade
                  </label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/AA"
                    className="font-mono"
                    aria-invalid={!!errors.expiryDate}
                    {...register("expiryDate")}
                  />
                  {errors.expiryDate?.message && (
                    <p className="text-xs text-danger-text">{errors.expiryDate.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cvv"
                    className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                  >
                    CVV
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      className="pl-10 font-mono"
                      aria-invalid={!!errors.cvv}
                      {...register("cvv")}
                    />
                  </div>
                  {errors.cvv?.message && (
                    <p className="text-xs text-danger-text">{errors.cvv.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cardholderName"
                  className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground"
                >
                  Nome no Cartao
                </label>
                <Input
                  id="cardholderName"
                  placeholder="Como aparece no cartao"
                  className="uppercase"
                  aria-invalid={!!errors.cardholderName}
                  {...register("cardholderName")}
                />
                {errors.cardholderName?.message && (
                  <p className="text-xs text-danger-text">{errors.cardholderName.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <Card variant="feature" className="sticky top-6">
            <CardHeader>
              <CardTitle className="text-base">Resumo da Transacao</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor</span>
                  <span className="font-mono font-medium tabular-nums">
                    R$ {(watchAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa</span>
                  <span className="font-mono text-muted-foreground tabular-nums">
                    R$ 0,00
                  </span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between">
                  <span className="font-medium">Total</span>
                  <span className="font-mono font-bold text-primary tabular-nums">
                    R$ {(watchAmount || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {watchDescription && (
                <div className="pt-2 border-t border-border">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-1">
                    Descricao
                  </p>
                  <p className="text-sm line-clamp-2">{watchDescription}</p>
                </div>
              )}

              <div className="pt-4 space-y-3">
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="size-4" />
                      Processar Transacao
                    </>
                  )}
                </Button>
                <Button type="button" variant="ghost" className="w-full" asChild>
                  <Link href="/invoices">Cancelar</Link>
                </Button>
              </div>

              <p className="text-2xs text-center text-muted-foreground/60 font-mono">
                Secured with 256-bit encryption
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
