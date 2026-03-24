import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().max(200, "Search query is too long").trim().min(1, "Search query is required"),
});
