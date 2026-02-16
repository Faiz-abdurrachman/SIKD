import { z } from "zod";

import { nikSchema } from "@/validations/penduduk.schema";

const enumJenisKelamin = z.enum(["LAKI_LAKI", "PEREMPUAN"]);
const enumAgama = z.enum(["ISLAM", "KRISTEN", "KATOLIK", "HINDU", "BUDDHA", "KONGHUCU", "KEPERCAYAAN"]);
const enumStatusPerkawinan = z.enum(["BELUM_KAWIN", "KAWIN", "CERAI_HIDUP", "CERAI_MATI"]);
const enumPendidikan = z.enum(["TIDAK_SEKOLAH", "SD", "SMP", "SMA", "D1", "D2", "D3", "S1", "S2", "S3"]);
const enumStatusHubungan = z.enum([
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

const dateSchema = z.string().min(1, "Tanggal wajib diisi");

export const createMutasiSchema = z.discriminatedUnion("jenisMutasi", [
  z.object({
    jenisMutasi: z.literal("LAHIR"),
    nik: nikSchema,
    nama: z.string().min(3, "Nama minimal 3 karakter").max(100),
    jenisKelamin: enumJenisKelamin,
    tempatLahir: z.string().min(2, "Tempat lahir wajib diisi").max(50),
    tanggalLahir: dateSchema,
    keluargaId: z.string().min(1, "KK wajib dipilih"),
    namaAyah: z.string().min(3, "Nama ayah wajib diisi").max(100),
    namaIbu: z.string().min(3, "Nama ibu wajib diisi").max(100),
    tanggalMutasi: dateSchema,
    keterangan: z.string().max(500).optional().or(z.literal("")),
  }),
  z.object({
    jenisMutasi: z.literal("MATI"),
    pendudukId: z.string().min(1, "Penduduk wajib dipilih"),
    tanggalMutasi: dateSchema,
    tempatKematian: z.string().min(2, "Tempat kematian wajib diisi").max(100),
    penyebabKematian: z.string().min(3, "Penyebab kematian wajib diisi").max(200),
    keterangan: z.string().max(500).optional().or(z.literal("")),
  }),
  z.object({
    jenisMutasi: z.literal("PINDAH_KELUAR"),
    pendudukId: z.string().min(1, "Penduduk wajib dipilih"),
    tanggalMutasi: dateSchema,
    alamatTujuan: z.string().min(5, "Alamat tujuan wajib diisi").max(255),
    alasanPindah: z.string().min(3, "Alasan pindah wajib diisi").max(200),
    keterangan: z.string().max(500).optional().or(z.literal("")),
  }),
  z.object({
    jenisMutasi: z.literal("PINDAH_MASUK"),
    nik: nikSchema,
    nama: z.string().min(3, "Nama minimal 3 karakter").max(100),
    jenisKelamin: enumJenisKelamin,
    tempatLahir: z.string().min(2, "Tempat lahir wajib diisi").max(50),
    tanggalLahir: dateSchema,
    agama: enumAgama,
    statusPerkawinan: enumStatusPerkawinan,
    pendidikanTerakhir: enumPendidikan,
    pekerjaan: z.string().min(2, "Pekerjaan wajib diisi").max(50),
    keluargaId: z.string().min(1, "KK wajib dipilih"),
    statusHubungan: enumStatusHubungan,
    alamatAsal: z.string().min(5, "Alamat asal wajib diisi").max(255),
    tanggalMutasi: dateSchema,
    namaAyah: z.string().max(100).optional().or(z.literal("")),
    namaIbu: z.string().max(100).optional().or(z.literal("")),
    keterangan: z.string().max(500).optional().or(z.literal("")),
  }),
]);

export const searchMutasiSchema = z.object({
  q: z.string().optional(),
  jenisMutasi: z.enum(["LAHIR", "MATI", "PINDAH_KELUAR", "PINDAH_MASUK"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("tanggalMutasi"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateMutasiInput = z.infer<typeof createMutasiSchema>;
export type SearchMutasiInput = z.infer<typeof searchMutasiSchema>;
