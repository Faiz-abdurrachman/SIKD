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
import type { PendudukOption, RtOption } from "@/types/keluarga.types";
import { createKeluargaSchema } from "@/validations/keluarga.schema";

const keluargaFormSchema = createKeluargaSchema.extend({
  kepalaKeluargaId: z.string().optional(),
});

type KeluargaFormValues = z.input<typeof keluargaFormSchema>;

type KeluargaFormProps = {
  mode: "create" | "edit";
  keluargaId?: string;
  defaultValues?: Partial<KeluargaFormValues>;
  rtOptions: RtOption[];
  pendudukOptions: PendudukOption[];
};

const INITIAL_VALUES: KeluargaFormValues = {
  noKK: "",
  alamat: "",
  rtId: "",
  kepalaKeluargaId: "",
};

export function KeluargaForm({ mode, keluargaId, defaultValues, rtOptions, pendudukOptions }: KeluargaFormProps) {
  const router = useRouter();
  const [isPendudukOpen, setIsPendudukOpen] = useState(false);

  const form = useForm<KeluargaFormValues>({
    resolver: zodResolver(keluargaFormSchema),
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

  const selectedKepalaId = useWatch({
    control: form.control,
    name: "kepalaKeluargaId",
  });

  const selectedKepala = useMemo(
    () => pendudukOptions.find((item) => item.id === selectedKepalaId),
    [pendudukOptions, selectedKepalaId],
  );

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (values: KeluargaFormValues) => {
    if (mode === "edit" && !keluargaId) {
      toast.error("ID keluarga tidak ditemukan");
      return;
    }

    const endpoint = mode === "create" ? "/api/v1/keluarga" : `/api/v1/keluarga/${keluargaId}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          kepalaKeluargaId: values.kepalaKeluargaId?.trim() ? values.kepalaKeluargaId : undefined,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        error?: { message?: string };
      };

      if (!response.ok || !result.success) {
        toast.error(result.error?.message ?? "Gagal menyimpan data keluarga");
        return;
      }

      toast.success(mode === "create" ? "KK berhasil ditambahkan" : "KK berhasil diperbarui");

      if (mode === "create") {
        router.push("/keluarga");
      } else {
        router.push(`/keluarga/${keluargaId}`);
      }

      router.refresh();
    } catch (error) {
      console.error("[KeluargaForm.onSubmit]", error);
      toast.error("Terjadi kesalahan saat menyimpan data keluarga");
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Informasi Kartu Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="noKK"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nomor KK</FormLabel>
                  <FormControl>
                    <Input
                      inputMode="numeric"
                      maxLength={16}
                      placeholder="16 digit nomor KK"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RT / RW / Dusun</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Pilih wilayah RT" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rtOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
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
              name="alamat"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Alamat</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Masukkan alamat lengkap KK" rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kepala Keluarga</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <FormField
              control={form.control}
              name="kepalaKeluargaId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Pilih Penduduk</FormLabel>
                  <Popover onOpenChange={setIsPendudukOpen} open={isPendudukOpen}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          className={cn("w-full justify-between", !field.value && "text-slate-500")}
                          role="combobox"
                          type="button"
                          variant="outline"
                        >
                          {selectedKepala
                            ? `${selectedKepala.nik} - ${selectedKepala.nama}`
                            : "Pilih kepala keluarga (opsional)"}
                          <ChevronsUpDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-[420px] p-0">
                      <Command>
                        <CommandInput placeholder="Cari NIK / nama penduduk..." />
                        <CommandList>
                          <CommandEmpty>Data penduduk tidak ditemukan.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                form.setValue("kepalaKeluargaId", "", { shouldValidate: true });
                                setIsPendudukOpen(false);
                              }}
                              value="tanpa-kepala"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  !field.value ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <span>Tanpa kepala keluarga</span>
                            </CommandItem>
                            {pendudukOptions.map((option) => (
                              <CommandItem
                                key={option.id}
                                onSelect={() => {
                                  form.setValue("kepalaKeluargaId", option.id, { shouldValidate: true });
                                  setIsPendudukOpen(false);
                                }}
                                value={`${option.nik} ${option.nama}`}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    option.id === field.value ? "opacity-100" : "opacity-0",
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{option.nama}</span>
                                  <span className="text-xs text-slate-500">{option.nik}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-slate-500">
                    Opsional saat membuat KK. Bisa ditentukan nanti dari detail anggota.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button onClick={() => router.push("/keluarga")} type="button" variant="outline">
            Batal
          </Button>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : mode === "create" ? (
              "Simpan KK"
            ) : (
              "Update KK"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
