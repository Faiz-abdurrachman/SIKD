import { z } from "zod";

export const jenisSuratSchema = z.enum([
  "SK_DOMISILI",
  "SK_TIDAK_MAMPU",
  "SK_USAHA",
  "SK_KELAHIRAN",
  "SK_KEMATIAN",
  "SK_PINDAH",
  "SK_DATANG",
  "SK_BELUM_MENIKAH",
  "SK_BEDA_NAMA",
  "SK_KEHILANGAN",
  "SK_CATATAN_KEPOLISIAN",
  "SURAT_PENGANTAR",
  "SK_TANAH",
  "SK_PENGHASILAN",
  "SK_IZIN_KERAMAIAN",
  "LAINNYA",
]);

export const statusSuratSchema = z.enum([
  "DRAFT",
  "MENUNGGU_PERSETUJUAN",
  "DISETUJUI",
  "DITOLAK",
  "DICETAK",
  "SELESAI",
]);

const isiSuratSchema = z.record(z.string(), z.unknown());

export const createSuratSchema = z.object({
  jenisSurat: jenisSuratSchema,
  perihal: z.string().min(5, "Perihal minimal 5 karakter").max(200, "Perihal maksimal 200 karakter"),
  pendudukIds: z
    .array(z.string().min(1, "Penduduk tidak valid"))
    .min(1, "Minimal 1 penduduk terkait")
    .max(10, "Maksimal 10 penduduk terkait"),
  isiSurat: isiSuratSchema.optional(),
  keterangan: z.string().max(500, "Keterangan maksimal 500 karakter").optional().or(z.literal("")),
});

export const updateSuratSchema = z.object({
  perihal: z.string().min(5, "Perihal minimal 5 karakter").max(200, "Perihal maksimal 200 karakter").optional(),
  pendudukIds: z
    .array(z.string().min(1, "Penduduk tidak valid"))
    .min(1, "Minimal 1 penduduk terkait")
    .max(10, "Maksimal 10 penduduk terkait")
    .optional(),
  isiSurat: isiSuratSchema.optional(),
  keterangan: z.string().max(500, "Keterangan maksimal 500 karakter").optional().or(z.literal("")),
});

export const rejectSuratSchema = z.object({
  alasanTolak: z.string().min(5, "Alasan tolak minimal 5 karakter").max(255, "Alasan tolak maksimal 255 karakter"),
});

export const searchSuratSchema = z.object({
  q: z.string().optional(),
  jenisSurat: jenisSuratSchema.optional(),
  status: statusSuratSchema.optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("tanggalSurat"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type JenisSuratInput = z.infer<typeof jenisSuratSchema>;
export type StatusSuratInput = z.infer<typeof statusSuratSchema>;
export type CreateSuratInput = z.infer<typeof createSuratSchema>;
export type UpdateSuratInput = z.infer<typeof updateSuratSchema>;
export type RejectSuratInput = z.infer<typeof rejectSuratSchema>;
export type SearchSuratInput = z.infer<typeof searchSuratSchema>;
