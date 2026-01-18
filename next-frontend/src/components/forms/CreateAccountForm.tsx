"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { createAccountSchema } from "@/lib/forms/schemas";
import type { CreateAccountFormValues } from "@/lib/forms/types";
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors";
import { createAccountAction } from "@/app/actions/account-actions";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateAccountForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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
  });

  const onSubmit = async (values: CreateAccountFormValues) => {
    setFormError(null);

    const formData = new FormData();
    formData.set("name", values.name.trim());
    formData.set("email", values.email.trim());

    const result = await createAccountAction(formData);

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
      return;
    }

    if (result.error.code === "email_already_exists") {
      setError("email", { message: "Email ja cadastrado." });
      return;
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      name: "name",
      email: "email",
    });

    if (!applied) {
      setFormError(
        getApiErrorMessage(result.error, "Nao foi possivel criar a conta."),
      );
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <Alert className="bg-[#2a3749] border-gray-700">
          <AlertTitle className="text-gray-200">Ops</AlertTitle>
          <AlertDescription className="text-gray-400">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="name" className="text-sm text-gray-300">
          Nome
        </label>
        <Input
          id="name"
          placeholder="Nome da sua loja"
          className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
          {...register("name")}
        />
        {errors.name?.message && (
          <p className="text-sm text-red-400">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm text-gray-300">
          Email
        </label>
        <Input
          id="email"
          type="email"
          placeholder="voce@empresa.com"
          className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
          {...register("email")}
        />
        {errors.email?.message && (
          <p className="text-sm text-red-400">{errors.email.message}</p>
        )}
      </div>

      <Button
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Criando..." : "Criar conta"}
      </Button>
    </form>
  );
}
