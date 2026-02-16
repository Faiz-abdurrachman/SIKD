"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { KeluargaOption } from "@/types/penduduk.types";
import { createPendudukSchema } from "@/validations/penduduk.schema";

const pendudukFormSchema = createPendudukSchema.extend({
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi"),
});

type PendudukFormValues = z.input<typeof pendudukFormSchema>;

type PendudukFormProps = {
  mode: "create" | "edit";
  pendudukId?: string;
  defaultValues?: Partial<PendudukFormValues>;
  keluargaOptions: KeluargaOption[];
};

const JENIS_KELAMIN_OPTIONS = [
  { label: "Laki-laki", value: "LAKI_LAKI" },
  { label: "Perempuan", value: "PEREMPUAN" },
] as const;

const AGAMA_OPTIONS = [
  { label: "Islam", value: "ISLAM" },
  { label: "Kristen", value: "KRISTEN" },
  { label: "Katolik", value: "KATOLIK" },
  { label: "Hindu", value: "HINDU" },
  { label: "Buddha", value: "BUDDHA" },
  { label: "Konghucu", value: "KONGHUCU" },
  { label: "Kepercayaan", value: "KEPERCAYAAN" },
] as const;

const STATUS_PERKAWINAN_OPTIONS = [
  { label: "Belum Kawin", value: "BELUM_KAWIN" },
  { label: "Kawin", value: "KAWIN" },
  { label: "Cerai Hidup", value: "CERAI_HIDUP" },
  { label: "Cerai Mati", value: "CERAI_MATI" },
] as const;

const PENDIDIKAN_OPTIONS = [
  { label: "Tidak/Belum Sekolah", value: "TIDAK_SEKOLAH" },
  { label: "SD", value: "SD" },
  { label: "SMP", value: "SMP" },
  { label: "SMA", value: "SMA" },
  { label: "D1", value: "D1" },
  { label: "D2", value: "D2" },
  { label: "D3", value: "D3" },
  { label: "S1", value: "S1" },
  { label: "S2", value: "S2" },
  { label: "S3", value: "S3" },
] as const;

const STATUS_HUBUNGAN_OPTIONS = [
  { label: "Kepala Keluarga", value: "KEPALA_KELUARGA" },
  { label: "Istri", value: "ISTRI" },
  { label: "Anak", value: "ANAK" },
  { label: "Menantu", value: "MENANTU" },
  { label: "Cucu", value: "CUCU" },
  { label: "Orang Tua", value: "ORANG_TUA" },
  { label: "Mertua", value: "MERTUA" },
  { label: "Famili Lain", value: "FAMILI_LAIN" },
  { label: "Pembantu", value: "PEMBANTU" },
  { label: "Lainnya", value: "LAINNYA" },
] as const;

const GOLONGAN_DARAH_OPTIONS = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "AB", value: "AB" },
  { label: "O", value: "O" },
  { label: "Tidak Tahu", value: "TIDAK_TAHU" },
] as const;

const INITIAL_VALUES: PendudukFormValues = {
  nik: "",
  nama: "",
  tempatLahir: "",
  tanggalLahir: "",
  jenisKelamin: "LAKI_LAKI",
  agama: "ISLAM",
  statusPerkawinan: "BELUM_KAWIN",
  pendidikanTerakhir: "SMA",
  pekerjaan: "",
  golonganDarah: undefined,
  statusHubungan: "ANAK",
  namaAyah: "",
  namaIbu: "",
  kewarganegaraan: "WNI",
  telepon: "",
  keluargaId: "",
  catatan: "",
};

export function PendudukForm({ mode, pendudukId, defaultValues, keluargaOptions }: PendudukFormProps) {
  const router = useRouter();
  const [isKeluargaOpen, setIsKeluargaOpen] = useState(false);

  const form = useForm<PendudukFormValues>({
    resolver: zodResolver(pendudukFormSchema),
    defaultValues: {
      ...INITIAL_VALUES,
      ...defaultValues,
    },
  });

  useEffect(() => {
    form.reset({
      ...INITIAL_VALUES,
      ...defaultValues,
    });
  }, [defaultValues, form]);

  const selectedKeluargaId = useWatch({
    control: form.control,
    name: "keluargaId",
  });

  const selectedKeluarga = useMemo(
    () => keluargaOptions.find((item) => item.id === selectedKeluargaId),
    [keluargaOptions, selectedKeluargaId],
  );

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: PendudukFormValues) => {
    if (mode === "edit" && !pendudukId) {
      toast.error("ID penduduk tidak ditemukan");
      return;
    }

    const endpoint = mode === "create" ? "/api/v1/penduduk" : `/api/v1/penduduk/${pendudukId}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: { id: string };
        error?: { message?: string };
      };

      if (!response.ok || !result.success) {
        toast.error(result.error?.message ?? "Gagal menyimpan data penduduk");
        return;
      }

      toast.success(mode === "create" ? "Penduduk berhasil ditambahkan" : "Penduduk berhasil diperbarui");

      if (mode === "create") {
        router.push("/penduduk");
      } else {
        router.push(`/penduduk/${pendudukId}`);
      }

      router.refresh();
    } catch (error) {
      console.error("[PendudukForm.onSubmit]", error);
      toast.error("Terjadi kesalahan saat menyimpan data penduduk");
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nik"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIK</FormLabel>
                  <FormControl>
                    <Input
                      disabled={mode === "edit"}
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit NIK"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama lengkap" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tempatLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempat Lahir</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan tempat lahir" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tanggalLahir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal Lahir</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="jenisKelamin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Jenis Kelamin</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih jenis kelamin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {JENIS_KELAMIN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Kependudukan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="agama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agama</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih agama" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {AGAMA_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusPerkawinan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Perkawinan</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status perkawinan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_PERKAWINAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pendidikanTerakhir"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pendidikan Terakhir</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih pendidikan terakhir" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PENDIDIKAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pekerjaan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pekerjaan</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan pekerjaan" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="keluargaId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Keluarga / Nomor KK</FormLabel>
                  <Popover onOpenChange={setIsKeluargaOpen} open={isKeluargaOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          className={cn("w-full justify-between", !field.value && "text-slate-500")}
                          role="combobox"
                          type="button"
                          variant="outline"
                        >
                          {selectedKeluarga
                            ? `${selectedKeluarga.noKK} - ${selectedKeluarga.kepalaKeluargaNama ?? "-"}`
                            : "Pilih keluarga"}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[420px] p-0">
                      <Command>
                        <CommandInput placeholder="Cari No KK / Kepala Keluarga..." />
                        <CommandList>
                          <CommandEmpty>Data keluarga tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            {keluargaOptions.map((option) => (
                              <CommandItem
                                key={option.id}
                                onSelect={() => {
                                  form.setValue("keluargaId", option.id, { shouldValidate: true });
                                  setIsKeluargaOpen(false);
                                }}
                                value={`${option.noKK} ${option.kepalaKeluargaNama ?? ""} ${option.alamat}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    option.id === field.value ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{option.noKK}</span>
                                  <span className="text-xs text-slate-500">
                                    {option.kepalaKeluargaNama ?? "-"} • RT {option.rtNomor}/RW {option.rwNomor} •{" "}
                                    {option.dusunNama}
                                  </span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="statusHubungan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status Hubungan Keluarga</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih status hubungan" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {STATUS_HUBUNGAN_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="namaAyah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Ayah</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama ayah" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="namaIbu"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Ibu</FormLabel>
                  <FormControl>
                    <Input placeholder="Masukkan nama ibu" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Tambahan</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="golonganDarah"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Golongan Darah</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih golongan darah" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GOLONGAN_DARAH_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kewarganegaraan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kewarganegaraan</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: WNI" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telepon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telepon</FormLabel>
                  <FormControl>
                    <Input placeholder="Contoh: 081234567890" {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="catatan"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Catatan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tambahkan catatan jika diperlukan" rows={4} {...field} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => router.push("/penduduk")} type="button" variant="outline">
            Batal
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : mode === "create" ? (
              "Simpan Penduduk"
            ) : (
              "Update Penduduk"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
