"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { CalendarDays, Plus, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { AsyncCombobox, type AsyncComboboxOption } from "@/components/shared/async-combobox";
import { DataTable } from "@/components/shared/data-table";
import { FilterActions, FilterPanel, FilterToggleButton } from "@/components/shared/filter-panel";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import { fetchPaginatedPage } from "@/lib/paginated-client-fetch";
import type { MutasiListItem } from "@/types/mutasi.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type KeluargaOption = {
  id: string;
  noKK: string;
  kepalaKeluarga: { nama: string } | null;
};

type PendudukOption = {
  id: string;
  nik: string;
  nama: string;
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
};

type KeluargaSearchResponse = {
  success: true;
  data: KeluargaOption[];
};

type PendudukSearchResponse = {
  success: true;
  data: PendudukOption[];
};

type MutasiFormState = {
  jenisMutasi: "LAHIR" | "MATI" | "PINDAH_KELUAR" | "PINDAH_MASUK";
  tanggalMutasi: string;
  keterangan: string;
  pendudukId: string;
  nik: string;
  nama: string;
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
  tempatLahir: string;
  tanggalLahir: string;
  keluargaId: string;
  namaAyah: string;
  namaIbu: string;
  tempatKematian: string;
  penyebabKematian: string;
  alamatTujuan: string;
  alasanPindah: string;
  alamatAsal: string;
  agama: "ISLAM" | "KRISTEN" | "KATOLIK" | "HINDU" | "BUDDHA" | "KONGHUCU" | "KEPERCAYAAN";
  statusPerkawinan: "BELUM_KAWIN" | "KAWIN" | "CERAI_HIDUP" | "CERAI_MATI";
  pendidikanTerakhir: "TIDAK_SEKOLAH" | "SD" | "SMP" | "SMA" | "D1" | "D2" | "D3" | "S1" | "S2" | "S3";
  pekerjaan: string;
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
};

type MutasiFilter = {
  q: string;
  jenisMutasi: "all" | "LAHIR" | "MATI" | "PINDAH_KELUAR" | "PINDAH_MASUK";
};

const EMPTY_FORM: MutasiFormState = {
  jenisMutasi: "MATI",
  tanggalMutasi: "",
  keterangan: "",
  pendudukId: "",
  nik: "",
  nama: "",
  jenisKelamin: "LAKI_LAKI",
  tempatLahir: "",
  tanggalLahir: "",
  keluargaId: "",
  namaAyah: "",
  namaIbu: "",
  tempatKematian: "",
  penyebabKematian: "",
  alamatTujuan: "",
  alasanPindah: "",
  alamatAsal: "",
  agama: "ISLAM",
  statusPerkawinan: "BELUM_KAWIN",
  pendidikanTerakhir: "SMA",
  pekerjaan: "",
  statusHubungan: "ANAK",
};

const EMPTY_FILTER: MutasiFilter = {
  q: "",
  jenisMutasi: "all",
};

export function MutasiPage({ canCreate }: { canCreate: boolean }) {
  const [rows, setRows] = useState<MutasiListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftFilter, setDraftFilter] = useState<MutasiFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<MutasiFilter>(EMPTY_FILTER);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [keluargaOptionMap, setKeluargaOptionMap] = useState<Record<string, AsyncComboboxOption>>({});
  const [pendudukOptionMap, setPendudukOptionMap] = useState<Record<string, AsyncComboboxOption>>({});

  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<MutasiFormState>(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadMutasi = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchPaginatedPage<MutasiListItem>({
        endpoint: "/api/v1/mutasi",
        sortBy: "tanggalMutasi",
        sortOrder: "desc",
        errorMessage: "Gagal memuat data mutasi",
        page: pagination.page,
        limit: pagination.pageSize,
        query: {
          q: appliedFilter.q,
          jenisMutasi: appliedFilter.jenisMutasi !== "all" ? appliedFilter.jenisMutasi : undefined,
        },
      });
      setRows(result.data);
      setPagination((previous) => ({
        ...previous,
        page: result.meta.page,
        pageSize: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      }));
    } catch (error) {
      console.error("[MutasiPage.loadMutasi]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data mutasi");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    void loadMutasi();
  }, [loadMutasi]);

  const searchKeluargaOptions = useCallback(async (query: string) => {
    const response = await fetch(`/api/v1/keluarga/search?q=${encodeURIComponent(query)}&limit=20`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as KeluargaSearchResponse | ErrorResponse;

    if (!response.ok || !payload.success) {
      throw new Error(payload.success ? "Gagal mencari data KK" : (payload.error?.message ?? "Gagal mencari data KK"));
    }

    const options = payload.data.map<AsyncComboboxOption>((item) => ({
      value: item.id,
      label: `${item.noKK} - ${item.kepalaKeluarga?.nama ?? "-"}`,
      description: `Nomor KK: ${item.noKK}`,
    }));

    setKeluargaOptionMap((previous) => {
      const next = { ...previous };

      for (const option of options) {
        next[option.value] = option;
      }

      return next;
    });

    return options;
  }, []);

  const searchPendudukOptions = useCallback(async (query: string) => {
    const response = await fetch(`/api/v1/penduduk/search?q=${encodeURIComponent(query)}`, {
      cache: "no-store",
    });
    const payload = (await response.json()) as PendudukSearchResponse | ErrorResponse;

    if (!response.ok || !payload.success) {
      throw new Error(payload.success ? "Gagal mencari penduduk" : (payload.error?.message ?? "Gagal mencari penduduk"));
    }

    const options = payload.data
      .filter((item) => item.statusKependudukan === "TETAP" || item.statusKependudukan === "SEMENTARA")
      .map<AsyncComboboxOption>((item) => ({
        value: item.id,
        label: `${item.nik} - ${item.nama}`,
        description: `Status: ${formatEnumLabel(item.statusKependudukan)}`,
      }));

    setPendudukOptionMap((previous) => {
      const next = { ...previous };

      for (const option of options) {
        next[option.value] = option;
      }

      return next;
    });

    return options;
  }, []);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      lahir: rows.filter((item) => item.jenisMutasi === "LAHIR").length,
      mati: rows.filter((item) => item.jenisMutasi === "MATI").length,
      pindah: rows.filter((item) => item.jenisMutasi.includes("PINDAH")).length,
    }),
    [pagination.total, rows],
  );

  const activeFilterCount = useMemo(() => {
    const candidates = [
      appliedFilter.q.trim(),
      appliedFilter.jenisMutasi !== "all" ? appliedFilter.jenisMutasi : "",
    ];

    return candidates.filter((value) => value.length > 0).length;
  }, [appliedFilter]);

  const columns = useMemo<ColumnDef<MutasiListItem>[]>(
    () => [
      {
        accessorKey: "tanggalMutasi",
        header: "Tanggal",
        cell: ({ row }) => formatTanggalIndonesia(row.original.tanggalMutasi),
      },
      {
        accessorKey: "jenisMutasi",
        header: "Jenis",
        cell: ({ row }) => <Badge variant="secondary">{formatEnumLabel(row.original.jenisMutasi)}</Badge>,
      },
      {
        id: "penduduk",
        header: "Penduduk",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{row.original.penduduk.nama}</p>
            <p className="text-xs text-slate-500">{row.original.penduduk.nik}</p>
          </div>
        ),
      },
      {
        id: "wilayah",
        header: "Wilayah",
        cell: ({ row }) => (
          <p className="text-sm text-slate-700">
            RT {row.original.penduduk.keluarga.rt.nomor}/RW {row.original.penduduk.keluarga.rt.rw.nomor} -{" "}
            {row.original.penduduk.keluarga.rt.rw.dusun.nama}
          </p>
        ),
      },
      {
        accessorKey: "statusKependudukan",
        header: "Status Penduduk",
        cell: ({ row }) => <StatusBadge status={row.original.penduduk.statusKependudukan} type="kependudukan" />,
      },
      {
        accessorKey: "keterangan",
        header: "Keterangan",
        cell: ({ row }) => row.original.keterangan ?? "-",
      },
    ],
    [],
  );

  const handleCreate = async () => {
    setIsSubmitting(true);

    try {
      let payload: Record<string, unknown>;

      if (form.jenisMutasi === "MATI") {
        payload = {
          jenisMutasi: "MATI",
          pendudukId: form.pendudukId,
          tanggalMutasi: form.tanggalMutasi,
          tempatKematian: form.tempatKematian,
          penyebabKematian: form.penyebabKematian,
          keterangan: form.keterangan,
        };
      } else if (form.jenisMutasi === "PINDAH_KELUAR") {
        payload = {
          jenisMutasi: "PINDAH_KELUAR",
          pendudukId: form.pendudukId,
          tanggalMutasi: form.tanggalMutasi,
          alamatTujuan: form.alamatTujuan,
          alasanPindah: form.alasanPindah,
          keterangan: form.keterangan,
        };
      } else if (form.jenisMutasi === "LAHIR") {
        payload = {
          jenisMutasi: "LAHIR",
          nik: form.nik,
          nama: form.nama,
          jenisKelamin: form.jenisKelamin,
          tempatLahir: form.tempatLahir,
          tanggalLahir: form.tanggalLahir,
          keluargaId: form.keluargaId,
          namaAyah: form.namaAyah,
          namaIbu: form.namaIbu,
          tanggalMutasi: form.tanggalMutasi,
          keterangan: form.keterangan,
        };
      } else {
        payload = {
          jenisMutasi: "PINDAH_MASUK",
          nik: form.nik,
          nama: form.nama,
          jenisKelamin: form.jenisKelamin,
          tempatLahir: form.tempatLahir,
          tanggalLahir: form.tanggalLahir,
          agama: form.agama,
          statusPerkawinan: form.statusPerkawinan,
          pendidikanTerakhir: form.pendidikanTerakhir,
          pekerjaan: form.pekerjaan,
          keluargaId: form.keluargaId,
          statusHubungan: form.statusHubungan,
          alamatAsal: form.alamatAsal,
          tanggalMutasi: form.tanggalMutasi,
          namaAyah: form.namaAyah,
          namaIbu: form.namaIbu,
          keterangan: form.keterangan,
        };
      }

      const response = await fetch("/api/v1/mutasi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const body = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !body.success) {
        throw new Error(body.success ? "Gagal menambah mutasi" : (body.error?.message ?? "Gagal menambah mutasi"));
      }

      toast.success("Data mutasi berhasil ditambahkan");
      setOpenCreate(false);
      setForm(EMPTY_FORM);
      await loadMutasi();
    } catch (error) {
      console.error("[MutasiPage.handleCreate]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambah mutasi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleServerPageChange = useCallback((page: number) => {
    setPagination((previous) => ({
      ...previous,
      page,
    }));
  }, []);

  const handleServerPageSizeChange = useCallback((pageSize: number) => {
    setPagination((previous) => ({
      ...previous,
      page: 1,
      pageSize,
    }));
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((previous) => !previous);
  }, []);

  return (
    <div className="dashboard-layout">
      <PageHeader description="Catat dan pantau seluruh perubahan data kependudukan." title="Data Mutasi">
        <FilterToggleButton
          activeCount={activeFilterCount}
          isOpen={isFilterOpen}
          onToggle={handleToggleFilter}
        />
        {canCreate ? (
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setOpenCreate(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Catat Mutasi
          </Button>
        ) : null}
      </PageHeader>

      <div className="kpi-grid">
        <StatCard description="Total mutasi tercatat" icon={RefreshCw} title="Total Mutasi" value={stats.total} />
        <StatCard description="Mutasi kelahiran di halaman aktif" icon={Users} title="Kelahiran (Halaman)" value={stats.lahir} />
        <StatCard description="Mutasi kematian di halaman aktif" icon={CalendarDays} title="Kematian (Halaman)" value={stats.mati} />
        <StatCard description="Mutasi pindah di halaman aktif" icon={RefreshCw} title="Pindah (Halaman)" value={stats.pindah} />
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        contentClassName="space-y-4"
        title="Filter Mutasi"
      >
        <div className="form-grid md:grid-cols-2 xl:grid-cols-4">
          <div className="field-stack xl:col-span-3">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari NIK / nama penduduk / keterangan"
              value={draftFilter.q}
            />
          </div>

          <div className="field-stack">
            <Label>Jenis Mutasi</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, jenisMutasi: value as MutasiFilter["jenisMutasi"] }))}
              value={draftFilter.jenisMutasi}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="LAHIR">Lahir</SelectItem>
                <SelectItem value="MATI">Mati</SelectItem>
                <SelectItem value="PINDAH_KELUAR">Pindah Keluar</SelectItem>
                <SelectItem value="PINDAH_MASUK">Pindah Masuk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <FilterActions
          applyLabel="Terapkan"
          onApply={() => {
            setAppliedFilter({ ...draftFilter });
            setIsFilterOpen(false);
            setPagination((previous) => ({
              ...previous,
              page: 1,
            }));
          }}
          onReset={() => {
            setDraftFilter({ ...EMPTY_FILTER });
            setAppliedFilter({ ...EMPTY_FILTER });
            setIsFilterOpen(false);
            setPagination((previous) => ({
              ...previous,
              page: 1,
            }));
          }}
        />
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
        serverPagination={pagination}
      />

      <Dialog onOpenChange={setOpenCreate} open={openCreate}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Catat Mutasi Baru</DialogTitle>
            <DialogDescription>Pilih jenis mutasi lalu isi field yang dibutuhkan.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Jenis Mutasi</Label>
              <Select
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    jenisMutasi: value as MutasiFormState["jenisMutasi"],
                  }))
                }
                value={form.jenisMutasi}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LAHIR">Lahir</SelectItem>
                  <SelectItem value="MATI">Mati</SelectItem>
                  <SelectItem value="PINDAH_KELUAR">Pindah Keluar</SelectItem>
                  <SelectItem value="PINDAH_MASUK">Pindah Masuk</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tanggal Mutasi</Label>
              <Input
                onChange={(event) => setForm((prev) => ({ ...prev, tanggalMutasi: event.target.value }))}
                type="date"
                value={form.tanggalMutasi}
              />
            </div>

            {(form.jenisMutasi === "MATI" || form.jenisMutasi === "PINDAH_KELUAR") ? (
              <div className="space-y-2">
                <Label>Penduduk</Label>
                <AsyncCombobox
                  emptyText="Penduduk tidak ditemukan."
                  fetchOptions={searchPendudukOptions}
                  onFetchError={(error) => {
                    console.error("[MutasiPage.searchPendudukOptions]", error);
                    toast.error(error instanceof Error ? error.message : "Gagal mencari penduduk");
                  }}
                  onValueChange={(value) => setForm((previous) => ({ ...previous, pendudukId: value }))}
                  placeholder="Cari penduduk (NIK / nama)"
                  searchPlaceholder="Ketik NIK atau nama penduduk..."
                  selectedLabel={form.pendudukId ? pendudukOptionMap[form.pendudukId]?.label : undefined}
                  value={form.pendudukId}
                />
              </div>
            ) : null}

            {(form.jenisMutasi === "LAHIR" || form.jenisMutasi === "PINDAH_MASUK") ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>NIK</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, nik: event.target.value }))} value={form.nik} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, nama: event.target.value }))} value={form.nama} />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select
                      onValueChange={(value) => setForm((prev) => ({ ...prev, jenisKelamin: value as MutasiFormState["jenisKelamin"] }))}
                      value={form.jenisKelamin}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LAKI_LAKI">Laki-laki</SelectItem>
                        <SelectItem value="PEREMPUAN">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tempat Lahir</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, tempatLahir: event.target.value }))} value={form.tempatLahir} />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tanggal Lahir</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, tanggalLahir: event.target.value }))} type="date" value={form.tanggalLahir} />
                  </div>
                  <div className="space-y-2">
                    <Label>KK Tujuan</Label>
                    <AsyncCombobox
                      emptyText="Data KK tidak ditemukan."
                      fetchOptions={searchKeluargaOptions}
                      onFetchError={(error) => {
                        console.error("[MutasiPage.searchKeluargaOptions]", error);
                        toast.error(error instanceof Error ? error.message : "Gagal mencari data KK");
                      }}
                      onValueChange={(value) => setForm((previous) => ({ ...previous, keluargaId: value }))}
                      placeholder="Cari nomor KK atau nama kepala keluarga"
                      searchPlaceholder="Ketik nomor KK atau nama kepala keluarga..."
                      selectedLabel={form.keluargaId ? keluargaOptionMap[form.keluargaId]?.label : undefined}
                      value={form.keluargaId}
                    />
                  </div>
                </div>
              </>
            ) : null}

            {form.jenisMutasi === "LAHIR" ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Nama Ayah</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, namaAyah: event.target.value }))} value={form.namaAyah} />
                  </div>
                  <div className="space-y-2">
                    <Label>Nama Ibu</Label>
                    <Input onChange={(event) => setForm((prev) => ({ ...prev, namaIbu: event.target.value }))} value={form.namaIbu} />
                  </div>
                </div>
              </>
            ) : null}

            {form.jenisMutasi === "MATI" ? (
              <>
                <div className="space-y-2">
                  <Label>Tempat Kematian</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, tempatKematian: event.target.value }))} value={form.tempatKematian} />
                </div>
                <div className="space-y-2">
                  <Label>Penyebab Kematian</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, penyebabKematian: event.target.value }))} value={form.penyebabKematian} />
                </div>
              </>
            ) : null}

            {form.jenisMutasi === "PINDAH_KELUAR" ? (
              <>
                <div className="space-y-2">
                  <Label>Alamat Tujuan</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, alamatTujuan: event.target.value }))} value={form.alamatTujuan} />
                </div>
                <div className="space-y-2">
                  <Label>Alasan Pindah</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, alasanPindah: event.target.value }))} value={form.alasanPindah} />
                </div>
              </>
            ) : null}

            {form.jenisMutasi === "PINDAH_MASUK" ? (
              <>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Agama</Label>
                    <Select
                      onValueChange={(value) => setForm((prev) => ({ ...prev, agama: value as MutasiFormState["agama"] }))}
                      value={form.agama}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ISLAM">Islam</SelectItem>
                        <SelectItem value="KRISTEN">Kristen</SelectItem>
                        <SelectItem value="KATOLIK">Katolik</SelectItem>
                        <SelectItem value="HINDU">Hindu</SelectItem>
                        <SelectItem value="BUDDHA">Buddha</SelectItem>
                        <SelectItem value="KONGHUCU">Konghucu</SelectItem>
                        <SelectItem value="KEPERCAYAAN">Kepercayaan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Perkawinan</Label>
                    <Select
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, statusPerkawinan: value as MutasiFormState["statusPerkawinan"] }))
                      }
                      value={form.statusPerkawinan}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BELUM_KAWIN">Belum Kawin</SelectItem>
                        <SelectItem value="KAWIN">Kawin</SelectItem>
                        <SelectItem value="CERAI_HIDUP">Cerai Hidup</SelectItem>
                        <SelectItem value="CERAI_MATI">Cerai Mati</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Pendidikan</Label>
                    <Select
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, pendidikanTerakhir: value as MutasiFormState["pendidikanTerakhir"] }))
                      }
                      value={form.pendidikanTerakhir}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TIDAK_SEKOLAH">Tidak Sekolah</SelectItem>
                        <SelectItem value="SD">SD</SelectItem>
                        <SelectItem value="SMP">SMP</SelectItem>
                        <SelectItem value="SMA">SMA</SelectItem>
                        <SelectItem value="D1">D1</SelectItem>
                        <SelectItem value="D2">D2</SelectItem>
                        <SelectItem value="D3">D3</SelectItem>
                        <SelectItem value="S1">S1</SelectItem>
                        <SelectItem value="S2">S2</SelectItem>
                        <SelectItem value="S3">S3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Status Hubungan</Label>
                    <Select
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, statusHubungan: value as MutasiFormState["statusHubungan"] }))
                      }
                      value={form.statusHubungan}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KEPALA_KELUARGA">Kepala Keluarga</SelectItem>
                        <SelectItem value="ISTRI">Istri</SelectItem>
                        <SelectItem value="ANAK">Anak</SelectItem>
                        <SelectItem value="MENANTU">Menantu</SelectItem>
                        <SelectItem value="CUCU">Cucu</SelectItem>
                        <SelectItem value="ORANG_TUA">Orang Tua</SelectItem>
                        <SelectItem value="MERTUA">Mertua</SelectItem>
                        <SelectItem value="FAMILI_LAIN">Famili Lain</SelectItem>
                        <SelectItem value="PEMBANTU">Pembantu</SelectItem>
                        <SelectItem value="LAINNYA">Lainnya</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pekerjaan</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, pekerjaan: event.target.value }))} value={form.pekerjaan} />
                </div>

                <div className="space-y-2">
                  <Label>Alamat Asal</Label>
                  <Input onChange={(event) => setForm((prev) => ({ ...prev, alamatAsal: event.target.value }))} value={form.alamatAsal} />
                </div>
              </>
            ) : null}

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))} value={form.keterangan} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenCreate(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleCreate()} type="button">
              {isSubmitting ? "Menyimpan..." : "Simpan Mutasi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
