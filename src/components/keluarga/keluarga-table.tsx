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

export function KeluargaTable({ canCreate, canUpdate, canDelete }: KeluargaTableProps) {
  const [rows, setRows] = useState<KeluargaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<KeluargaListItem | null>(null);
  const [search, setSearch] = useState("");
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
          q: search,
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
  }, [pagination.page, pagination.pageSize, search]);

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

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchPlaceholder="Cari nomor KK..."
        searchValue={search}
        onSearchChange={(value) => {
          setSearch(value);
          setPagination((previous) => ({
            ...previous,
            page: 1,
          }));
        }}
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
