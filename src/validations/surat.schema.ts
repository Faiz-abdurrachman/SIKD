import { z } from "zod";

import { SURAT_DYNAMIC_FIELDS } from "@/lib/surat-fields";

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

const nonEmptyText = (label: string, min = 3, max = 255) =>
  z
    .string()
    .min(min, `${label} minimal ${min} karakter`)
    .max(max, `${label} maksimal ${max} karakter`)
    .transform((value) => value.trim());

const requiredDateString = (label: string) =>
  z
    .string()
    .min(1, `${label} wajib diisi`)
    .refine((value) => !Number.isNaN(new Date(value).getTime()), `${label} tidak valid`);

const requiredTimeString = (label: string) =>
  z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, `${label} harus format HH:mm`);

const optionalText = (max = 255) => z.string().max(max).optional().or(z.literal(""));

const defaultIsiSuratSchema = z.object({}).passthrough();

const isiSuratByJenisSchema = {
  SK_DOMISILI: z
    .object({
      keperluan: nonEmptyText("Keperluan"),
    })
    .strict(),
  SK_TIDAK_MAMPU: z
    .object({
      keperluan: nonEmptyText("Keperluan"),
      penghasilanPerBulan: optionalText(100),
    })
    .strict(),
  SK_USAHA: z
    .object({
      namaUsaha: nonEmptyText("Nama usaha"),
      jenisUsaha: nonEmptyText("Jenis usaha"),
      alamatUsaha: nonEmptyText("Alamat usaha", 5),
      sejakTahun: optionalText(20),
    })
    .strict(),
  SK_KELAHIRAN: z
    .object({
      namaAnak: nonEmptyText("Nama anak"),
      jenisKelaminAnak: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
      tanggalLahirAnak: requiredDateString("Tanggal lahir anak"),
      tempatLahirAnak: nonEmptyText("Tempat lahir anak"),
      anakKe: z.coerce.number().int().positive("Anak ke harus lebih dari 0"),
      namaAyah: nonEmptyText("Nama ayah"),
      namaIbu: nonEmptyText("Nama ibu"),
    })
    .strict(),
  SK_KEMATIAN: z
    .object({
      tanggalKematian: requiredDateString("Tanggal kematian"),
      tempatKematian: nonEmptyText("Tempat kematian"),
      penyebab: nonEmptyText("Penyebab"),
    })
    .strict(),
  SK_PINDAH: z
    .object({
      alamatTujuan: nonEmptyText("Alamat tujuan", 5),
      alasanPindah: nonEmptyText("Alasan pindah"),
    })
    .strict(),
  SK_DATANG: z
    .object({
      alamatAsal: nonEmptyText("Alamat asal", 5),
      alasanDatang: nonEmptyText("Alasan datang"),
      tanggalDatang: z
        .string()
        .optional()
        .or(z.literal(""))
        .refine((value) => !value || !Number.isNaN(new Date(value).getTime()), "Tanggal datang tidak valid"),
    })
    .strict(),
  SK_BELUM_MENIKAH: z
    .object({
      keperluan: nonEmptyText("Keperluan"),
    })
    .strict(),
  SK_BEDA_NAMA: z
    .object({
      namaDocument: nonEmptyText("Nama dokumen"),
      namaLain: nonEmptyText("Nama lain pada dokumen"),
      keperluan: nonEmptyText("Keperluan"),
    })
    .strict(),
  SK_KEHILANGAN: z
    .object({
      barangHilang: nonEmptyText("Barang hilang"),
      tanggalHilang: requiredDateString("Tanggal hilang"),
      lokasiHilang: optionalText(255),
    })
    .strict(),
  SK_CATATAN_KEPOLISIAN: z
    .object({
      keperluan: nonEmptyText("Keperluan"),
      tujuan: nonEmptyText("Tujuan"),
    })
    .strict(),
  SURAT_PENGANTAR: z
    .object({
      keperluan: nonEmptyText("Keperluan"),
      tujuan: nonEmptyText("Tujuan"),
    })
    .strict(),
  SK_TANAH: z
    .object({
      luasTanah: nonEmptyText("Luas tanah"),
      lokasi: nonEmptyText("Lokasi"),
      batasUtara: nonEmptyText("Batas utara"),
      batasSelatan: nonEmptyText("Batas selatan"),
      batasTimur: nonEmptyText("Batas timur"),
      batasBarat: nonEmptyText("Batas barat"),
      dasarKepemilikan: nonEmptyText("Dasar kepemilikan"),
    })
    .strict(),
  SK_PENGHASILAN: z
    .object({
      penghasilanPerBulan: nonEmptyText("Penghasilan per bulan"),
      pekerjaan: nonEmptyText("Pekerjaan"),
      keperluan: nonEmptyText("Keperluan"),
    })
    .strict(),
  SK_IZIN_KERAMAIAN: z
    .object({
      namaAcara: nonEmptyText("Nama acara"),
      tanggalAcara: requiredDateString("Tanggal acara"),
      waktuMulai: requiredTimeString("Waktu mulai"),
      waktuSelesai: requiredTimeString("Waktu selesai"),
      tempatAcara: nonEmptyText("Tempat acara", 5),
      jumlahUndangan: z
        .union([z.coerce.number().int().positive("Jumlah undangan harus lebih dari 0"), z.literal(""), z.undefined()])
        .optional(),
    })
    .strict(),
  LAINNYA: z
    .object({
      judulSurat: nonEmptyText("Judul surat"),
      isiCustom: nonEmptyText("Isi surat", 5, 5000),
    })
    .strict(),
} as const;

const isiSuratSchema = z.record(z.string(), z.unknown());

export type JenisSuratInput = z.infer<typeof jenisSuratSchema>;

export function validateIsiSuratByJenis(jenisSurat: JenisSuratInput, isiSurat: unknown) {
  const schema = isiSuratByJenisSchema[jenisSurat] ?? defaultIsiSuratSchema;

  return schema.safeParse(isiSurat ?? {});
}

function addIsiSuratIssues(
  ctx: z.RefinementCtx,
  jenisSurat: JenisSuratInput,
  isiSurat: unknown,
  pathPrefix: Array<string | number> = ["isiSurat"],
) {
  const parsed = validateIsiSuratByJenis(jenisSurat, isiSurat);

  if (parsed.success) {
    return;
  }

  for (const issue of parsed.error.issues) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: issue.message,
      path: [...pathPrefix, ...issue.path],
    });
  }
}

export const createSuratSchema = z
  .object({
    jenisSurat: jenisSuratSchema,
    perihal: z.string().min(5, "Perihal minimal 5 karakter").max(200, "Perihal maksimal 200 karakter"),
    pendudukIds: z
      .array(z.string().min(1, "Penduduk tidak valid"))
      .min(1, "Minimal 1 penduduk terkait")
      .max(10, "Maksimal 10 penduduk terkait"),
    isiSurat: isiSuratSchema.optional(),
    keterangan: z.string().max(500, "Keterangan maksimal 500 karakter").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    addIsiSuratIssues(ctx, value.jenisSurat, value.isiSurat ?? {}, ["isiSurat"]);
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

export function getRequiredIsiSuratFields(jenisSurat: JenisSuratInput) {
  return (SURAT_DYNAMIC_FIELDS[jenisSurat] ?? []).filter((item) => item.required).map((item) => item.key);
}

export type StatusSuratInput = z.infer<typeof statusSuratSchema>;
export type CreateSuratInput = z.infer<typeof createSuratSchema>;
export type UpdateSuratInput = z.infer<typeof updateSuratSchema>;
export type RejectSuratInput = z.infer<typeof rejectSuratSchema>;
export type SearchSuratInput = z.infer<typeof searchSuratSchema>;
