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
import type { KeluargaListItem, KeluargaListResponse } from "@/types/keluarga.types";

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

const LIST_QUERY = "page=1&limit=500&sortBy=noKK&sortOrder=asc";

export function KeluargaTable({ canCreate, canUpdate, canDelete }: KeluargaTableProps) {
  const [rows, setRows] = useState<KeluargaListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<KeluargaListItem | null>(null);

  const loadKeluarga = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/keluarga?${LIST_QUERY}`, {
        cache: "no-store",
      });

      const result = (await response.json()) as KeluargaListResponse | ErrorResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "Gagal memuat data keluarga" : (result.error?.message ?? "Gagal memuat data keluarga");
        throw new Error(message);
      }

      setRows(result.data);
    } catch (error) {
      console.error("[KeluargaTable.loadKeluarga]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data keluarga");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      totalKeluarga: rows.length,
      totalAnggota,
      rataRataAnggota: rows.length ? (totalAnggota / rows.length).toFixed(1) : "0.0",
      tanpaKepala: totalTanpaKepala,
    };
  }, [rows]);

  const columns = useMemo<ColumnDef<KeluargaListItem>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => <span className="text-sm text-slate-600">{row.index + 1}</span>,
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
    [canDelete, canUpdate],
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
        <StatCard description="Jumlah anggota dari seluruh KK" icon={Users} title="Total Anggota" value={stats.totalAnggota} />
        <StatCard description="Rata-rata anggota per KK" icon={UserRound} title="Rata-rata/KK" value={stats.rataRataAnggota} />
        <StatCard description="KK tanpa kepala keluarga" icon={UserRound} title="Belum Ada Kepala" value={stats.tanpaKepala} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchKey="noKK"
        searchPlaceholder="Cari nomor KK..."
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
