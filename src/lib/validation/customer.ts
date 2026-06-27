import { z } from "zod";

export const customerInputSchema = z.object({
  name: z.string().trim().min(1, "Müşteri adı zorunlu").max(200),
  is_active: z.boolean().default(true),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
