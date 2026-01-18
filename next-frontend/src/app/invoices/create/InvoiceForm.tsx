"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createInvoiceAction } from "./create-invoice-action";
import { createTransferSchema } from "@/lib/forms/schemas";
import type { CreateTransferFormValues } from "@/lib/forms/types";
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors";

type InvoiceFormProps = {
  initialError?: string;
};

export function InvoiceForm({ initialError }: InvoiceFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null,
  );

  const nextYear = new Date().getFullYear() + 2;
  const expiryYear = String(nextYear % 100).padStart(2, "0");
  const defaultExpiryDate = `12/${expiryYear}`;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateTransferFormValues>({
    resolver: zodResolver(createTransferSchema),
    defaultValues: {
      amount: 0.01,
      description: "Transferencia de servico",
      cardNumber: "1111111111111111",
      expiryDate: defaultExpiryDate,
      cvv: "123",
      cardholderName: "Nome Sobrenome",
    },
  });

  const onSubmit = async (values: CreateTransferFormValues) => {
    setFormError(null);

    const formData = new FormData();
    formData.set("amount", values.amount.toString());
    formData.set("description", values.description);
    formData.set("cardNumber", values.cardNumber);
    formData.set("expiryDate", values.expiryDate);
    formData.set("cvv", values.cvv);
    formData.set("cardholderName", values.cardholderName);

    const result = await createInvoiceAction(formData);

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
      return;
    }

    if (result.error.code === "invalid_api_key") {
      router.push("/login?error=invalid_api_key");
      return;
    }

    if (result.error.code === "invalid_expiry") {
      setError("expiryDate", { message: "Data de expiracao invalida." });
      return;
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      amount: "amount",
      description: "description",
      card_number: "cardNumber",
      cvv: "cvv",
      expiry_month: "expiryDate",
      expiry_year: "expiryDate",
      cardholder_name: "cardholderName",
    });

    if (!applied) {
      setFormError(
        getApiErrorMessage(
          result.error,
          "Nao foi possivel criar a transferencia.",
        ),
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <Alert className="bg-[#2a3749] border-gray-700 mb-6">
          <AlertTitle className="text-gray-200">Ops</AlertTitle>
          <AlertDescription className="text-gray-400">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      <Alert className="bg-[#2a3749] border-gray-700 mb-6">
        <AlertTitle className="text-gray-200">Ambiente de simulacao</AlertTitle>
        <AlertDescription className="text-gray-400">
          Use apenas dados ficticios. Nenhuma informacao real de cartao e armazenada.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Informacoes da Transferencia */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-gray-300 block">
              Valor (R$)
            </label>
            <Input
              id="amount"
              type="number"
              step={0.01}
              min={0}
              placeholder="0,00"
              className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
              {...register("amount", { valueAsNumber: true })}
            />
            {errors.amount?.message && (
              <p className="text-sm text-red-400">{errors.amount.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="description" className="text-gray-300 block">
              Descricao
            </label>
            <Textarea
              id="description"
              placeholder="Descreva o motivo da transferencia"
              className="bg-[#2a3749] border-gray-700 min-h-[120px] text-white placeholder-gray-400"
              {...register("description")}
            />
            {errors.description?.message && (
              <p className="text-sm text-red-400">
                {errors.description.message}
              </p>
            )}
          </div>
        </div>

        {/* Dados do Cartao */}
        <div className="bg-[#232f43] rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Dados do Cartao
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="cardNumber" className="text-gray-300 block">
                Numero do Cartao
              </label>
              <div className="relative">
                <Input
                  id="cardNumber"
                  placeholder="0000000000000000"
                  maxLength={19}
                  className="bg-[#2a3749] border-gray-700 pl-10 text-white placeholder-gray-400"
                  {...register("cardNumber")}
                />
                <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              </div>
              {errors.cardNumber?.message && (
                <p className="text-sm text-red-400">
                  {errors.cardNumber.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="expiryDate" className="text-gray-300 block">
                  Data de Expiracao
                </label>
                <Input
                  id="expiryDate"
                  placeholder="MM/AA"
                  className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
                  {...register("expiryDate")}
                />
                {errors.expiryDate?.message && (
                  <p className="text-sm text-red-400">
                    {errors.expiryDate.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="cvv" className="text-gray-300 block">
                  CVV
                </label>
                <Input
                  id="cvv"
                  placeholder="123"
                  className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
                  {...register("cvv")}
                />
                {errors.cvv?.message && (
                  <p className="text-sm text-red-400">{errors.cvv.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="cardholderName" className="text-gray-300 block">
                Nome no Cartao
              </label>
              <Input
                id="cardholderName"
                placeholder="Como aparece no cartao"
                className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
                {...register("cardholderName")}
              />
              {errors.cardholderName?.message && (
                <p className="text-sm text-red-400">
                  {errors.cardholderName.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          className="bg-[#2a3749] border-gray-700"
        >
          Cancelar
        </Button>

        <Button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={isSubmitting}
        >
          <CreditCard className="h-4 w-4 mr-2" />
          {isSubmitting ? "Processando..." : "Processar Transferencia"}
        </Button>
      </div>
    </form>
  );
}
