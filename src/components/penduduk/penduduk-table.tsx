"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Plus, Trash2, UserCheck, UserMinus, Users, VenusAndMars } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LABEL_MAP } from "@/lib/constants";
import { formatTanggalIndonesia } from "@/lib/format";
import { fetchPaginatedPage } from "@/lib/paginated-client-fetch";
import type { PendudukListItem } from "@/types/penduduk.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type PendudukTableProps = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type PendudukFilter = {
  q: string;
  nik: string;
  jenisKelamin: "all" | "LAKI_LAKI" | "PEREMPUAN";
  agama: "all" | "ISLAM" | "KRISTEN" | "KATOLIK" | "HINDU" | "BUDDHA" | "KONGHUCU" | "KEPERCAYAAN";
  statusPerkawinan: "all" | "BELUM_KAWIN" | "KAWIN" | "CERAI_HIDUP" | "CERAI_MATI";
  statusKependudukan: "all" | "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
  pendidikanTerakhir: "all" | "TIDAK_SEKOLAH" | "SD" | "SMP" | "SMA" | "D1" | "D2" | "D3" | "S1" | "S2" | "S3";
  pekerjaan: string;
};

const EMPTY_FILTER: PendudukFilter = {
  q: "",
  nik: "",
  jenisKelamin: "all",
  agama: "all",
  statusPerkawinan: "all",
  statusKependudukan: "all",
  pendidikanTerakhir: "all",
  pekerjaan: "",
};

export function PendudukTable({ canCreate, canUpdate, canDelete }: PendudukTableProps) {
  const [rows, setRows] = useState<PendudukListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PendudukListItem | null>(null);
  const [draftFilter, setDraftFilter] = useState<PendudukFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<PendudukFilter>(EMPTY_FILTER);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const loadPenduduk = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchPaginatedPage<PendudukListItem>({
        endpoint: "/api/v1/penduduk",
        sortBy: "nama",
        sortOrder: "asc",
        errorMessage: "Gagal memuat data penduduk",
        page: pagination.page,
        limit: pagination.pageSize,
        query: {
          q: appliedFilter.q,
          nik: appliedFilter.nik,
          jenisKelamin: appliedFilter.jenisKelamin !== "all" ? appliedFilter.jenisKelamin : undefined,
          agama: appliedFilter.agama !== "all" ? appliedFilter.agama : undefined,
          statusPerkawinan: appliedFilter.statusPerkawinan !== "all" ? appliedFilter.statusPerkawinan : undefined,
          statusKependudukan:
            appliedFilter.statusKependudukan !== "all" ? appliedFilter.statusKependudukan : undefined,
          pendidikanTerakhir:
            appliedFilter.pendidikanTerakhir !== "all" ? appliedFilter.pendidikanTerakhir : undefined,
          pekerjaan: appliedFilter.pekerjaan,
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
      console.error("[PendudukTable.loadPenduduk]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data penduduk");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    void loadPenduduk();
  }, [loadPenduduk]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/penduduk/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "Gagal menghapus data penduduk" : (result.error?.message ?? "Gagal menghapus data penduduk");
        throw new Error(message);
      }

      toast.success(`Data ${deleteTarget.nama} berhasil dinonaktifkan`);
      await loadPenduduk();
    } catch (error) {
      console.error("[PendudukTable.handleDelete]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data penduduk");
    }
  }, [deleteTarget, loadPenduduk]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
      lakiLakiPage: rows.filter((item) => item.jenisKelamin === "LAKI_LAKI").length,
      perempuanPage: rows.filter((item) => item.jenisKelamin === "PEREMPUAN").length,
      nonAktifPage: rows.filter((item) => item.statusKependudukan !== "TETAP").length,
    }),
    [pagination.total, rows],
  );

  const columns = useMemo<ColumnDef<PendudukListItem>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {(pagination.page - 1) * pagination.pageSize + row.index + 1}
          </span>
        ),
      },
      {
        accessorKey: "nama",
        header: "Nama",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{row.original.nama}</p>
            <p className="text-xs text-slate-500">NIK: {row.original.nik}</p>
          </div>
        ),
      },
      {
        id: "tempatTanggalLahir",
        header: "Tempat/Tgl Lahir",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm text-slate-700">{row.original.tempatLahir}</p>
            <p className="text-xs text-slate-500">{formatTanggalIndonesia(row.original.tanggalLahir)}</p>
          </div>
        ),
      },
      {
        id: "jenisKelamin",
        header: "JK",
        cell: ({ row }) => (
          <Badge variant="secondary">
            {LABEL_MAP.jenisKelamin[row.original.jenisKelamin]}
          </Badge>
        ),
      },
      {
        id: "keluarga",
        header: "Keluarga",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-700">No. KK: {row.original.keluarga.noKK}</p>
            <p className="text-xs text-slate-500">
              RT {row.original.keluarga.rt.nomor}/RW {row.original.keluarga.rt.rw.nomor} • {row.original.keluarga.rt.rw.dusun.nama}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "statusKependudukan",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.statusKependudukan} type="kependudukan" />,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button asChild size="icon" type="button" variant="outline">
              <Link href={`/penduduk/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {canUpdate ? (
              <Button asChild size="icon" type="button" variant="outline">
                <Link href={`/penduduk/${row.original.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            {canDelete ? (
              <Button
                className="text-red-600 hover:text-red-700"
                onClick={() => setDeleteTarget(row.original)}
                size="icon"
                type="button"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [canDelete, canUpdate, pagination.page, pagination.pageSize],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        description="Kelola data penduduk desa secara terstruktur dan terdokumentasi."
        title="Data Penduduk"
      >
        {canCreate ? (
          <Button asChild>
            <Link href="/penduduk/tambah">
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penduduk
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Seluruh data penduduk tercatat" icon={Users} title="Total Penduduk" value={stats.total} />
        <StatCard description="Jumlah laki-laki di halaman aktif" icon={UserCheck} title="Laki-laki (Halaman)" value={stats.lakiLakiPage} />
        <StatCard description="Jumlah perempuan di halaman aktif" icon={VenusAndMars} title="Perempuan (Halaman)" value={stats.perempuanPage} />
        <StatCard description="Status bukan tetap di halaman aktif" icon={UserMinus} title="Non Aktif (Halaman)" value={stats.nonAktifPage} />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari NIK / nama penduduk"
              value={draftFilter.q}
            />
          </div>

          <div className="space-y-2">
            <Label>NIK (Spesifik)</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, nik: event.target.value }))}
              placeholder="Contoh: 3276xxxxxxxxxxxx"
              value={draftFilter.nik}
            />
          </div>

          <div className="space-y-2">
            <Label>Jenis Kelamin</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, jenisKelamin: value as PendudukFilter["jenisKelamin"] }))}
              value={draftFilter.jenisKelamin}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {Object.entries(LABEL_MAP.jenisKelamin).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Agama</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, agama: value as PendudukFilter["agama"] }))}
              value={draftFilter.agama}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {Object.entries(LABEL_MAP.agama).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status Perkawinan</Label>
            <Select
              onValueChange={(value) =>
                setDraftFilter((prev) => ({ ...prev, statusPerkawinan: value as PendudukFilter["statusPerkawinan"] }))
              }
              value={draftFilter.statusPerkawinan}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {Object.entries(LABEL_MAP.statusPerkawinan).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status Kependudukan</Label>
            <Select
              onValueChange={(value) =>
                setDraftFilter((prev) => ({
                  ...prev,
                  statusKependudukan: value as PendudukFilter["statusKependudukan"],
                }))
              }
              value={draftFilter.statusKependudukan}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="TETAP">Tetap</SelectItem>
                <SelectItem value="SEMENTARA">Sementara</SelectItem>
                <SelectItem value="PINDAH">Pindah</SelectItem>
                <SelectItem value="MENINGGAL">Meninggal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pendidikan Terakhir</Label>
            <Select
              onValueChange={(value) =>
                setDraftFilter((prev) => ({ ...prev, pendidikanTerakhir: value as PendudukFilter["pendidikanTerakhir"] }))
              }
              value={draftFilter.pendidikanTerakhir}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {Object.entries(LABEL_MAP.pendidikan).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pekerjaan</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, pekerjaan: event.target.value }))}
              placeholder="Contoh: Guru, Petani"
              value={draftFilter.pekerjaan}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button
            onClick={() => {
              setAppliedFilter({ ...draftFilter });
              setPagination((previous) => ({
                ...previous,
                page: 1,
              }));
            }}
            type="button"
          >
            Terapkan Filter
          </Button>
          <Button
            onClick={() => {
              setDraftFilter({ ...EMPTY_FILTER });
              setAppliedFilter({ ...EMPTY_FILTER });
              setPagination((previous) => ({
                ...previous,
                page: 1,
              }));
            }}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        serverPagination={pagination}
        onServerPageChange={(page) => {
          setPagination((previous) => ({
            ...previous,
            page,
          }));
        }}
        onServerPageSizeChange={(pageSize) => {
          setPagination((previous) => ({
            ...previous,
            page: 1,
            pageSize,
          }));
        }}
      />

      <ConfirmDialog
        description={
          deleteTarget
            ? `Data ${deleteTarget.nama} akan dinonaktifkan (status menjadi PINDAH). Tindakan ini tetap tercatat di audit log.`
            : ""
        }
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Nonaktifkan Data Penduduk"
        variant="danger"
      />
    </div>
  );
}
