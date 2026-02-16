import { z } from "zod";

export const searchAuditSchema = z.object({
  q: z.string().optional(),
  userId: z.string().optional(),
  entity: z.string().optional(),
  action: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type SearchAuditInput = z.infer<typeof searchAuditSchema>;
