import { z } from "zod";

export const updateSettingsSchema = z
  .object({
    settings: z.record(z.string(), z.string()).optional(),
    desa: z
      .object({
        nama: z.string().min(3, "Nama desa minimal 3 karakter").max(120).optional(),
        kecamatan: z.string().min(3, "Kecamatan minimal 3 karakter").max(120).optional(),
        kabupaten: z.string().min(3, "Kabupaten minimal 3 karakter").max(120).optional(),
        provinsi: z.string().min(3, "Provinsi minimal 3 karakter").max(120).optional(),
        kodePos: z.string().max(10).optional().or(z.literal("")),
        alamatKantor: z.string().max(255).optional().or(z.literal("")),
        telepon: z.string().max(30).optional().or(z.literal("")),
        email: z.string().email("Email tidak valid").optional().or(z.literal("")),
        website: z.string().url("Website tidak valid").optional().or(z.literal("")),
        namaKepalaDesa: z.string().max(120).optional().or(z.literal("")),
        nipKepalaDesa: z.string().max(30).optional().or(z.literal("")),
      })
      .optional(),
  })
  .refine((value) => Boolean(value.settings || value.desa), {
    message: "Minimal isi settings atau profil desa",
    path: ["settings"],
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
