"use client";

import { differenceInYears } from "date-fns";
import { Loader2, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LABEL_MAP } from "@/lib/constants";
import { formatTanggalIndonesia } from "@/lib/format";
import { formatEnumLabel } from "@/lib/format";
import type { KeluargaDetailItem } from "@/types/keluarga.types";

type AnggotaListProps = {
  keluargaId: string;
  anggota: KeluargaDetailItem["anggota"];
  canUpdate: boolean;
};

type SearchPendudukItem = {
  id: string;
  nik: string;
  nama: string;
  statusHubungan:
    | "KEPALA_KELUARGA"
    | "ISTRI"
    | "ANAK"
    | "MENANTU"
    | "CUCU"
    | "ORANG_TUA"
    | "MERTUA"
    | "FAMILI_LAIN"
    | "PEMBANTU"
    | "LAINNYA";
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
  keluarga: {
    noKK: string;
  };
};

type SearchResponse = {
  success: true;
  data: SearchPendudukItem[];
};

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

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

type StatusHubunganValue = (typeof STATUS_HUBUNGAN_OPTIONS)[number]["value"];

function getUmur(tanggalLahir: Date | string) {
  const parsedDate = tanggalLahir instanceof Date ? tanggalLahir : new Date(tanggalLahir);

  if (Number.isNaN(parsedDate.getTime())) {
    return "-";
  }

  const umur = differenceInYears(new Date(), parsedDate);

  return `${Math.max(umur, 0)} tahun`;
}

export function AnggotaList({ keluargaId, anggota, canUpdate }: AnggotaListProps) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchPendudukItem[]>([]);
  const [selectedPendudukId, setSelectedPendudukId] = useState<string | null>(null);
  const [statusHubungan, setStatusHubungan] = useState<StatusHubunganValue>("ANAK");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  const [statusDraft, setStatusDraft] = useState<Record<string, StatusHubunganValue>>({});
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<string | null>(null);

  const anggotaIds = useMemo(() => new Set(anggota.map((item) => item.id)), [anggota]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsSearching(true);

      try {
        const response = await fetch(`/api/v1/penduduk/search?q=${encodeURIComponent(query.trim())}`);
        const payload = (await response.json()) as SearchResponse | ErrorResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Gagal mencari penduduk" : (payload.error?.message ?? "Gagal mencari penduduk"));
        }

        setResults(payload.data.filter((item) => !anggotaIds.has(item.id)));
      } catch (error) {
        console.error("[AnggotaList.search]", error);
        toast.error(error instanceof Error ? error.message : "Gagal mencari penduduk");
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [anggotaIds, open, query]);

  const selectedPenduduk = useMemo(
    () => results.find((item) => item.id === selectedPendudukId),
    [results, selectedPendudukId],
  );

  const handleAddAnggota = async () => {
    if (!selectedPendudukId) {
      toast.error("Pilih penduduk terlebih dahulu");
      return;
    }

    setIsSubmittingAdd(true);

    try {
      const response = await fetch(`/api/v1/keluarga/${keluargaId}/anggota`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pendudukId: selectedPendudukId,
          statusHubungan,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal menambahkan anggota" : (payload.error?.message ?? "Gagal menambahkan anggota"));
      }

      toast.success("Anggota keluarga berhasil ditambahkan");
      setOpen(false);
      setQuery("");
      setSelectedPendudukId(null);
      setStatusHubungan("ANAK");
      router.refresh();
    } catch (error) {
      console.error("[AnggotaList.handleAddAnggota]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambahkan anggota");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  const handleUpdateStatus = useCallback(
    async (pendudukId: string) => {
      const item = anggota.find((row) => row.id === pendudukId);
      const nextStatus = statusDraft[pendudukId];

      if (!item || !nextStatus || nextStatus === item.statusHubungan) {
        return;
      }

      setIsSubmittingStatus(pendudukId);

      try {
        const response = await fetch(`/api/v1/keluarga/${keluargaId}/anggota/${pendudukId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            statusHubungan: nextStatus,
          }),
        });

        const payload = (await response.json()) as
          | {
              success: true;
            }
          | ErrorResponse;

        if (!response.ok || !payload.success) {
          throw new Error(payload.success ? "Gagal memperbarui status hubungan" : (payload.error?.message ?? "Gagal memperbarui status hubungan"));
        }

        toast.success("Status hubungan anggota diperbarui");
        router.refresh();
      } catch (error) {
        console.error("[AnggotaList.handleUpdateStatus]", error);
        toast.error(error instanceof Error ? error.message : "Gagal memperbarui status hubungan");
      } finally {
        setIsSubmittingStatus(null);
      }
    },
    [anggota, keluargaId, router, statusDraft],
  );

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Anggota Keluarga</h3>
            <p className="text-sm text-slate-600">Total anggota: {anggota.length} orang</p>
          </div>

          {canUpdate ? (
            <Button onClick={() => setOpen(true)} type="button">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Anggota
            </Button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NIK</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>JK</TableHead>
                <TableHead>Tanggal Lahir</TableHead>
                <TableHead>Umur</TableHead>
                <TableHead>Status Hubungan</TableHead>
                <TableHead>Status Penduduk</TableHead>
                {canUpdate ? <TableHead className="text-right">Aksi</TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {anggota.length ? (
                anggota.map((item) => {
                  const currentStatus = (statusDraft[item.id] ?? item.statusHubungan) as StatusHubunganValue;

                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nik}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{LABEL_MAP.jenisKelamin[item.jenisKelamin]}</TableCell>
                      <TableCell>{formatTanggalIndonesia(item.tanggalLahir)}</TableCell>
                      <TableCell>{getUmur(item.tanggalLahir)}</TableCell>
                      <TableCell>
                        {canUpdate ? (
                          <Select
                            onValueChange={(value) =>
                              setStatusDraft((prev) => ({ ...prev, [item.id]: value as StatusHubunganValue }))
                            }
                            value={currentStatus}
                          >
                            <SelectTrigger className="w-[170px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {STATUS_HUBUNGAN_OPTIONS.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Badge variant="secondary">{formatEnumLabel(item.statusHubungan)}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.statusKependudukan} type="kependudukan" />
                      </TableCell>
                      {canUpdate ? (
                        <TableCell className="text-right">
                          <Button
                            disabled={
                              isSubmittingStatus === item.id ||
                              currentStatus === item.statusHubungan
                            }
                            onClick={() => void handleUpdateStatus(item.id)}
                            size="sm"
                            type="button"
                            variant="outline"
                          >
                            {isSubmittingStatus === item.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Menyimpan
                              </>
                            ) : (
                              "Simpan"
                            )}
                          </Button>
                        </TableCell>
                      ) : null}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell className="py-6 text-center text-slate-600" colSpan={canUpdate ? 8 : 7}>
                    Belum ada anggota pada KK ini.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog onOpenChange={setOpen} open={open}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Anggota Keluarga</DialogTitle>
            <DialogDescription>
              Cari penduduk berdasarkan NIK atau nama, lalu tentukan status hubungan keluarga.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Cari Penduduk</p>
              <Command>
                <CommandInput
                  onValueChange={setQuery}
                  placeholder="Ketik minimal 2 karakter..."
                  value={query}
                />
                <CommandList>
                  <CommandEmpty>
                    {isSearching ? "Mencari penduduk..." : "Penduduk tidak ditemukan."}
                  </CommandEmpty>
                  <CommandGroup>
                    {results.map((item) => (
                      <CommandItem
                        key={item.id}
                        onSelect={() => setSelectedPendudukId(item.id)}
                        value={`${item.nik} ${item.nama}`}
                      >
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800">{item.nama}</p>
                            <p className="truncate text-xs text-slate-500">
                              {item.nik} • KK {item.keluarga.noKK}
                            </p>
                          </div>
                          {selectedPendudukId === item.id ? <Badge>Dipilih</Badge> : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Status Hubungan</p>
              <Select onValueChange={(value) => setStatusHubungan(value as StatusHubunganValue)} value={statusHubungan}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_HUBUNGAN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPenduduk ? (
              <div className="rounded-md border bg-slate-50 p-3 text-sm text-slate-700">
                Penduduk terpilih: <span className="font-medium">{selectedPenduduk.nama}</span> ({selectedPenduduk.nik})
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button
              disabled={!selectedPendudukId || isSubmittingAdd}
              onClick={() => void handleAddAnggota()}
              type="button"
            >
              {isSubmittingAdd ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Tambah Anggota"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
