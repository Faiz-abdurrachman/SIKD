import { z } from "zod";

export const nikSchema = z
  .string()
  .length(16, "NIK harus 16 digit")
  .regex(/^\d{16}$/, "NIK harus berupa angka");

export const createPendudukSchema = z.object({
  nik: nikSchema,
  nama: z
    .string()
    .min(3, "Nama minimal 3 karakter")
    .max(100, "Nama maksimal 100 karakter")
    .regex(/^[a-zA-Z\s'.,-]+$/, "Nama hanya boleh huruf, spasi, titik, koma, dan strip"),
  tempatLahir: z.string().min(2, "Tempat lahir wajib diisi").max(50),
  tanggalLahir: z
    .string()
    .or(z.date())
    .refine((value) => new Date(value) <= new Date(), "Tanggal lahir tidak boleh di masa depan"),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]),
  agama: z.enum(["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "KEPERCAYAAN"]),
  statusPerkawinan: z.enum(["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]),
  pendidikanTerakhir: z.enum(["TIDAK_SEKOLAH", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"]),
  pekerjaan: z.string().min(2, "Pekerjaan wajib diisi").max(50),
  golonganDarah: z.enum(["A", "B", "AB", "O", "TIDAK_TAHU"]).optional(),
  statusHubungan: z.enum([
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
  ]),
  namaAyah: z.string().max(100).optional(),
  namaIbu: z.string().max(100).optional(),
  kewarganegaraan: z.string().default("WNI"),
  telepon: z
    .string()
    .regex(/^(\+62|62|0)[0-9]{8,13}$/, "Format telepon tidak valid")
    .optional()
    .or(z.literal("")),
  keluargaId: z.string().min(1, "Keluarga/KK wajib dipilih"),
  catatan: z.string().max(500).optional(),
});

export const updatePendudukSchema = createPendudukSchema.partial().omit({ nik: true });

export const searchPendudukSchema = z.object({
  q: z.string().optional(),
  nik: z.string().optional(),
  jenisKelamin: z.enum(["LAKI_LAKI", "PEREMPUAN"]).optional(),
  agama: z
    .enum(["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "KEPERCAYAAN"])
    .optional(),
  statusPerkawinan: z.enum(["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]).optional(),
  statusKependudukan: z.enum(["TETAP", "SEMENTARA", "PINDAH", "MENINGGAL"]).optional(),
  pendidikanTerakhir: z.enum(["TIDAK_SEKOLAH", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"]).optional(),
  pekerjaan: z.string().optional(),
  rtId: z.string().optional(),
  rwId: z.string().optional(),
  dusunId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("nama"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

export type CreatePendudukInput = z.infer<typeof createPendudukSchema>;
export type UpdatePendudukInput = z.infer<typeof updatePendudukSchema>;
export type SearchPendudukInput = z.infer<typeof searchPendudukSchema>;
