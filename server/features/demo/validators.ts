import { z } from "zod";

export const demoTraceQuerySchema = z.object({
  name: z.string().min(1).optional(),
  delay: z.coerce.number().min(0).max(5000).optional().default(500),
  skipDb: z.coerce.boolean().optional().default(false),
});

export type DemoTraceInput = z.infer<typeof demoTraceQuerySchema>;
