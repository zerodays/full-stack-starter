import z from "zod";

export const projectIdParamSchema = z.object({
  id: z.uuid(),
});
