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
import { LABEL_MAP } from "@/lib/constants";
import { formatTanggalIndonesia } from "@/lib/format";
import type { PendudukListItem, PendudukListResponse } from "@/types/penduduk.types";

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

const LIST_QUERY = "page=1&limit=500&sortBy=nama&sortOrder=asc";

export function PendudukTable({ canCreate, canUpdate, canDelete }: PendudukTableProps) {
  const [rows, setRows] = useState<PendudukListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<PendudukListItem | null>(null);

  const loadPenduduk = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/penduduk?${LIST_QUERY}`, {
        cache: "no-store",
      });

      const result = (await response.json()) as PendudukListResponse | ErrorResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "Gagal memuat data penduduk" : (result.error?.message ?? "Gagal memuat data penduduk");
        throw new Error(message);
      }

      setRows(result.data);
    } catch (error) {
      console.error("[PendudukTable.loadPenduduk]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data penduduk");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      total: rows.length,
      lakiLaki: rows.filter((item) => item.jenisKelamin === "LAKI_LAKI").length,
      perempuan: rows.filter((item) => item.jenisKelamin === "PEREMPUAN").length,
      nonAktif: rows.filter((item) => item.statusKependudukan !== "TETAP").length,
    }),
    [rows],
  );

  const columns = useMemo<ColumnDef<PendudukListItem>[]>(
    () => [
      {
        id: "no",
        header: "No",
        cell: ({ row }) => <span className="text-sm text-slate-600">{row.index + 1}</span>,
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
    [canDelete, canUpdate],
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
        <StatCard description="Jumlah penduduk laki-laki" icon={UserCheck} title="Laki-laki" value={stats.lakiLaki} />
        <StatCard description="Jumlah penduduk perempuan" icon={VenusAndMars} title="Perempuan" value={stats.perempuan} />
        <StatCard description="Status bukan tetap" icon={UserMinus} title="Non Aktif" value={stats.nonAktif} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchKey="nama"
        searchPlaceholder="Cari nama penduduk..."
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
