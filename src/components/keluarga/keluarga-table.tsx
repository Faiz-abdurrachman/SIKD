"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Home, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchPaginatedPage } from "@/lib/paginated-client-fetch";
import type { KeluargaListItem } from "@/types/keluarga.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type KeluargaTableProps = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
};

type KeluargaFilter = {
  q: string;
  dusunId: string;
  rwId: string;
  rtId: string;
};

const EMPTY_FILTER: KeluargaFilter = {
  q: "",
  dusunId: "all",
  rwId: "all",
  rtId: "all",
};

export function KeluargaTable({ canCreate, canUpdate, canDelete }: KeluargaTableProps) {
  const [rows, setRows] = useState<KeluargaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<KeluargaListItem | null>(null);
  const [draftFilter, setDraftFilter] = useState<KeluargaFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<KeluargaFilter>(EMPTY_FILTER);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const loadKeluarga = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchPaginatedPage<KeluargaListItem>({
        endpoint: "/api/v1/keluarga",
        sortBy: "noKK",
        sortOrder: "asc",
        errorMessage: "Gagal memuat data keluarga",
        page: pagination.page,
        limit: pagination.pageSize,
        query: {
          q: appliedFilter.q,
          dusunId: appliedFilter.dusunId !== "all" ? appliedFilter.dusunId : undefined,
          rwId: appliedFilter.rwId !== "all" ? appliedFilter.rwId : undefined,
          rtId: appliedFilter.rtId !== "all" ? appliedFilter.rtId : undefined,
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
      console.error("[KeluargaTable.loadKeluarga]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data keluarga");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    void loadKeluarga();
  }, [loadKeluarga]);

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/keluarga/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "Gagal menghapus KK" : (result.error?.message ?? "Gagal menghapus KK");
        throw new Error(message);
      }

      toast.success(`KK ${deleteTarget.noKK} berhasil dihapus`);
      await loadKeluarga();
    } catch (error) {
      console.error("[KeluargaTable.handleDelete]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus KK");
    }
  }, [deleteTarget, loadKeluarga]);

  const stats = useMemo(() => {
    const totalAnggota = rows.reduce((sum, item) => sum + item.jumlahAnggota, 0);
    const totalTanpaKepala = rows.filter((item) => !item.kepalaKeluarga).length;

    return {
      totalKeluarga: pagination.total,
      totalAnggota,
      rataRataAnggota: rows.length ? (totalAnggota / rows.length).toFixed(1) : "0.0",
      tanpaKepala: totalTanpaKepala,
    };
  }, [pagination.total, rows]);

  const dusunOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((item) => [item.rt.rw.dusun.id, { id: item.rt.rw.dusun.id, nama: item.rt.rw.dusun.nama }]),
      ).values(),
    ).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [rows]);

  const rwOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((item) => [
          item.rt.rw.id,
          {
            id: item.rt.rw.id,
            nomor: item.rt.rw.nomor,
            dusunId: item.rt.rw.dusun.id,
            dusunNama: item.rt.rw.dusun.nama,
          },
        ]),
      ).values(),
    )
      .filter((item) => draftFilter.dusunId === "all" || item.dusunId === draftFilter.dusunId)
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [draftFilter.dusunId, rows]);

  const rtOptions = useMemo(() => {
    return Array.from(
      new Map(
        rows.map((item) => [
          item.rt.id,
          {
            id: item.rt.id,
            nomor: item.rt.nomor,
            rwId: item.rt.rw.id,
            rwNomor: item.rt.rw.nomor,
          },
        ]),
      ).values(),
    )
      .filter((item) => draftFilter.rwId === "all" || item.rwId === draftFilter.rwId)
      .sort((a, b) => a.nomor.localeCompare(b.nomor));
  }, [draftFilter.rwId, rows]);

  const columns = useMemo<ColumnDef<KeluargaListItem>[]>(
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
        accessorKey: "noKK",
        header: "No. KK",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{row.original.noKK}</p>
            <p className="line-clamp-1 text-xs text-slate-500">{row.original.alamat}</p>
          </div>
        ),
      },
      {
        id: "wilayah",
        header: "Wilayah",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm text-slate-700">Dusun {row.original.rt.rw.dusun.nama}</p>
            <p className="text-xs text-slate-500">
              RT {row.original.rt.nomor}/RW {row.original.rt.rw.nomor}
            </p>
          </div>
        ),
      },
      {
        id: "kepala",
        header: "Kepala Keluarga",
        cell: ({ row }) =>
          row.original.kepalaKeluarga ? (
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">{row.original.kepalaKeluarga.nama}</p>
              <p className="text-xs text-slate-500">{row.original.kepalaKeluarga.nik}</p>
            </div>
          ) : (
            <Badge variant="secondary">Belum ditentukan</Badge>
          ),
      },
      {
        accessorKey: "jumlahAnggota",
        header: "Anggota",
        cell: ({ row }) => <Badge variant="outline">{row.original.jumlahAnggota} orang</Badge>,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button asChild size="icon" type="button" variant="outline">
              <Link href={`/keluarga/${row.original.id}`}>
                <Eye className="h-4 w-4" />
              </Link>
            </Button>

            {canUpdate ? (
              <Button asChild size="icon" type="button" variant="outline">
                <Link href={`/keluarga/${row.original.id}/edit`}>
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
        description="Kelola data Kartu Keluarga (KK), alamat, dan anggota keluarga."
        title="Data Keluarga"
      >
        {canCreate ? (
          <Button asChild>
            <Link href="/keluarga/tambah">
              <Plus className="mr-2 h-4 w-4" />
              Tambah KK
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Total kartu keluarga terdaftar" icon={Home} title="Total KK" value={stats.totalKeluarga} />
        <StatCard description="Jumlah anggota di halaman aktif" icon={Users} title="Anggota (Halaman)" value={stats.totalAnggota} />
        <StatCard description="Rata-rata anggota di halaman aktif" icon={UserRound} title="Rata-rata (Halaman)" value={stats.rataRataAnggota} />
        <StatCard description="KK tanpa kepala keluarga di halaman aktif" icon={UserRound} title="Tanpa Kepala (Halaman)" value={stats.tanpaKepala} />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari No KK / kepala keluarga / alamat"
              value={draftFilter.q}
            />
          </div>

          <div className="space-y-2">
            <Label>Dusun</Label>
            <Select
              onValueChange={(value) =>
                setDraftFilter((prev) => ({
                  ...prev,
                  dusunId: value,
                  rwId: "all",
                  rtId: "all",
                }))
              }
              value={draftFilter.dusunId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {dusunOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>RW</Label>
            <Select
              onValueChange={(value) =>
                setDraftFilter((prev) => ({
                  ...prev,
                  rwId: value,
                  rtId: "all",
                }))
              }
              value={draftFilter.rwId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {rwOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    RW {item.nomor} ({item.dusunNama})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>RT</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, rtId: value }))}
              value={draftFilter.rtId}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {rtOptions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    RT {item.nomor} (RW {item.rwNomor})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            ? `KK ${deleteTarget.noKK} akan dihapus permanen. Pastikan semua anggota sudah dipindahkan atau dihapus terlebih dahulu.`
            : ""
        }
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Hapus Data KK"
        variant="danger"
      />
    </div>
  );
}
