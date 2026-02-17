import { z } from "zod";

const roleEnum = z.enum(["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"]);

export const passwordSchema = z
  .string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung huruf besar")
  .regex(/[0-9]/, "Password harus mengandung angka");

export const createUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, underscore")
    .transform((value) => value.toLowerCase()),
  nama: z.string().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  password: passwordSchema,
  role: roleEnum,
  isActive: z.boolean().optional().default(true),
});

export const updateUserSchema = createUserSchema
  .omit({ password: true })
  .partial()
  .refine(
    (value) =>
      value.username !== undefined ||
      value.nama !== undefined ||
      value.email !== undefined ||
      value.role !== undefined ||
      value.isActive !== undefined,
    {
      message: "Minimal satu field harus diisi",
    },
  );

export const resetPasswordSchema = z.object({
  password: passwordSchema,
});

export const searchUserSchema = z.object({
  q: z.string().optional(),
  role: roleEnum.optional(),
  isActive: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }

      return value === "true";
    }),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type SearchUserInput = z.infer<typeof searchUserSchema>;
