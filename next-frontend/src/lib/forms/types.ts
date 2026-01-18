import { z } from "zod";
import {
  createAccountSchema,
  loginSchema,
  createTransferSchema,
} from "./schemas";

export type CreateAccountFormValues = z.infer<typeof createAccountSchema>;
export type LoginFormValues = z.infer<typeof loginSchema>;
export type CreateTransferFormValues = z.infer<typeof createTransferSchema>;
