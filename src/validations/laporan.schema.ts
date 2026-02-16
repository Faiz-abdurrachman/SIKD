import { z } from "zod";

export const laporanSummarySchema = z.object({
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
});

export type LaporanSummaryInput = z.infer<typeof laporanSummarySchema>;
