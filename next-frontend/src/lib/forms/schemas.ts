import { z } from "zod";

const expiryRegex = /^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/;

export const createAccountSchema = z.object({
  name: z
    .string()
    .min(2, "Informe o nome da loja.")
    .max(120, "Nome muito longo."),
  email: z.string().email("Email invalido."),
});

export const loginSchema = z.object({
  apiKey: z.string().min(16, "Informe uma API key valida."),
});

export const createTransferSchema = z.object({
  amount: z
    .coerce
    .number({ invalid_type_error: "Informe um valor valido." })
    .positive("Informe um valor maior que zero."),
  description: z
    .string()
    .min(3, "Descreva o motivo da transferencia.")
    .max(200, "Descricao muito longa."),
  cardNumber: z
    .string()
    .regex(/^\d{12,19}$/, "Numero do cartao invalido."),
  expiryDate: z
    .string()
    .regex(expiryRegex, "Data de expiracao invalida."),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV invalido."),
  cardholderName: z
    .string()
    .min(3, "Informe o nome no cartao.")
    .max(120, "Nome muito longo."),
});
