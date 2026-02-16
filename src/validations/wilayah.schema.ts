import { z } from "zod";

export const updateDesaSchema = z.object({
  nama: z.string().min(3, "Nama desa minimal 3 karakter").max(100).optional(),
  kecamatan: z.string().min(3).max(100).optional(),
  kabupaten: z.string().min(3).max(100).optional(),
  provinsi: z.string().min(3).max(100).optional(),
  kodePos: z.string().max(10).optional().or(z.literal("")),
  alamatKantor: z.string().max(255).optional().or(z.literal("")),
  telepon: z.string().max(30).optional().or(z.literal("")),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  website: z.string().max(100).optional().or(z.literal("")),
  namaKepalaDesa: z.string().max(100).optional().or(z.literal("")),
  nipKepalaDesa: z.string().max(50).optional().or(z.literal("")),
});

export const createDusunSchema = z.object({
  desaId: z.string().min(1, "Desa wajib dipilih"),
  nama: z.string().min(2, "Nama dusun minimal 2 karakter").max(100),
});

export const updateDusunSchema = z.object({
  nama: z.string().min(2, "Nama dusun minimal 2 karakter").max(100),
});

export const createRWSchema = z.object({
  dusunId: z.string().min(1, "Dusun wajib dipilih"),
  nomor: z.string().min(1, "Nomor RW wajib diisi").max(3),
});

export const updateRWSchema = z.object({
  nomor: z.string().min(1, "Nomor RW wajib diisi").max(3),
});

export const createRTSchema = z.object({
  rwId: z.string().min(1, "RW wajib dipilih"),
  nomor: z.string().min(1, "Nomor RT wajib diisi").max(3),
});

export const updateRTSchema = z.object({
  nomor: z.string().min(1, "Nomor RT wajib diisi").max(3),
});

export type UpdateDesaInput = z.infer<typeof updateDesaSchema>;
export type CreateDusunInput = z.infer<typeof createDusunSchema>;
export type UpdateDusunInput = z.infer<typeof updateDusunSchema>;
export type CreateRWInput = z.infer<typeof createRWSchema>;
export type UpdateRWInput = z.infer<typeof updateRWSchema>;
export type CreateRTInput = z.infer<typeof createRTSchema>;
export type UpdateRTInput = z.infer<typeof updateRTSchema>;
