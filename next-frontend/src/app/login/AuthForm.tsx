"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { loginSchema } from "@/lib/forms/schemas";
import type { LoginFormValues } from "@/lib/forms/types";
import {
  applyFieldErrors,
  getApiErrorMessage,
} from "@/lib/forms/api-errors";
import { loginAction } from "@/app/actions/auth-actions";

import { InfoIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthFormProps = {
  initialError?: string;
};

export function AuthForm({ initialError }: AuthFormProps) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(
    initialError ?? null,
  );

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
  });

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null);

    const formData = new FormData();
    formData.set("apiKey", values.apiKey.trim());

    const result = await loginAction(formData);

    if (result.ok) {
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
      return;
    }

    if (result.error.code === "invalid_api_key") {
      setError("apiKey", { message: "API key invalida." });
      return;
    }

    const applied = applyFieldErrors(setError, result.error.details, {
      apiKey: "apiKey",
    });

    if (!applied) {
      setFormError(
        getApiErrorMessage(result.error, "Falha ao autenticar."),
      );
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      {formError && (
        <Alert className="bg-[#2a3749] border-gray-700">
          <AlertTitle className="text-gray-200">Falha ao autenticar</AlertTitle>
          <AlertDescription className="text-gray-400">
            {formError}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="apiKey" className="text-sm text-gray-300">
          API Key
        </label>
        <div className="flex gap-2">
          <Input
            id="apiKey"
            placeholder="Digite sua API Key"
            className="bg-[#2a3749] border-gray-700 text-white placeholder-gray-400"
            {...register("apiKey")}
          />
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "..." : "→"}
          </Button>
        </div>
        {errors.apiKey?.message && (
          <p className="text-sm text-red-400">{errors.apiKey.message}</p>
        )}
      </div>

      <Alert className="bg-[#2a3749] border-gray-700 mt-4">
        <InfoIcon className="h-4 w-4 text-blue-400" />
        <AlertTitle className="text-gray-200">
          Como obter uma API Key?
        </AlertTitle>
        <AlertDescription className="text-gray-400">
          Para obter sua API Key, voce precisa criar uma conta de comerciante.
          Entre em contato com nosso suporte para mais informacoes.
        </AlertDescription>
      </Alert>
    </form>
  );
}
