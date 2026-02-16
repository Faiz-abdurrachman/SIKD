import { z } from "zod";

export const noKKSchema = z
  .string()
  .length(16, "Nomor KK harus 16 digit")
  .regex(/^\d{16}$/, "Nomor KK harus berupa angka");

const statusHubunganEnum = z.enum([
  "KEPALA_KELUARGA",
  "ISTRI",
  "ANAK",
  "MENANTU",
  "CUCU",
  "ORANG_TUA",
  "MERTUA",
  "FAMILI_LAIN",
  "PEMBANTU",
  "LAINNYA",
]);

export const createKeluargaSchema = z.object({
  noKK: noKKSchema,
  alamat: z.string().min(5, "Alamat wajib diisi").max(255, "Alamat maksimal 255 karakter"),
  rtId: z.string().min(1, "RT wajib dipilih"),
  kepalaKeluargaId: z.string().optional().or(z.literal("")),
});

export const updateKeluargaSchema = createKeluargaSchema.partial();

export const addAnggotaSchema = z.object({
  pendudukId: z.string().min(1, "Penduduk wajib dipilih"),
  statusHubungan: statusHubunganEnum,
});

export const updateAnggotaSchema = z.object({
  statusHubungan: statusHubunganEnum,
});

export const removeAnggotaSchema = z.object({
  targetKeluargaId: z.string().min(1, "Target KK wajib dipilih"),
});

export const searchKeluargaSchema = z.object({
  q: z.string().optional(),
  rtId: z.string().optional(),
  rwId: z.string().optional(),
  dusunId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("noKK"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreateKeluargaInput = z.infer<typeof createKeluargaSchema>;
export type UpdateKeluargaInput = z.infer<typeof updateKeluargaSchema>;
export type AddAnggotaInput = z.infer<typeof addAnggotaSchema>;
export type UpdateAnggotaInput = z.infer<typeof updateAnggotaSchema>;
export type RemoveAnggotaInput = z.infer<typeof removeAnggotaSchema>;
export type SearchKeluargaInput = z.infer<typeof searchKeluargaSchema>;
