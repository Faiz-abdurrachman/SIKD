"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  CheckCircle2,
  FileText,
  Pencil,
  Plus,
  Printer,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
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
import { Textarea } from "@/components/ui/textarea";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import type { SuratDetailResponse, SuratListItem, SuratListResponse, SuratJenis } from "@/types/surat.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type PendudukOption = {
  id: string;
  nik: string;
  nama: string;
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
};

type SuratFormState = {
  jenisSurat: SuratJenis;
  perihal: string;
  pendudukId: string;
  keperluan: string;
  keterangan: string;
};

const EMPTY_FORM: SuratFormState = {
  jenisSurat: "SK_DOMISILI",
  perihal: "",
  pendudukId: "",
  keperluan: "",
  keterangan: "",
};

const LIST_QUERY = "page=1&limit=500&sortBy=tanggalSurat&sortOrder=desc";

type SuratPageProps = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
};

export function SuratPage({ canCreate, canUpdate, canDelete, canApprove, canPrint }: SuratPageProps) {
  const [rows, setRows] = useState<SuratListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pendudukOptions, setPendudukOptions] = useState<PendudukOption[]>([]);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const [form, setForm] = useState<SuratFormState>(EMPTY_FORM);
  const [selectedSurat, setSelectedSurat] = useState<SuratListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuratListItem | null>(null);

  const loadSurat = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/surat?${LIST_QUERY}`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as SuratListResponse | ErrorResponse;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Gagal memuat data surat" : (payload.error?.message ?? "Gagal memuat data surat");
        throw new Error(message);
      }

      setRows(payload.data);
    } catch (error) {
      console.error("[SuratPage.loadSurat]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data surat");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPendudukOptions = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/penduduk?page=1&limit=500&sortBy=nama&sortOrder=asc", {
        cache: "no-store",
      });

      const payload = (await response.json()) as
        | {
            success: true;
            data: PendudukOption[];
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Gagal memuat daftar penduduk" : (payload.error?.message ?? "Gagal memuat daftar penduduk");
        throw new Error(message);
      }

      setPendudukOptions(
        payload.data.filter(
          (item) => item.statusKependudukan === "TETAP" || item.statusKependudukan === "SEMENTARA",
        ),
      );
    } catch (error) {
      console.error("[SuratPage.loadPendudukOptions]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat daftar penduduk");
      setPendudukOptions([]);
    }
  }, []);

  useEffect(() => {
    void loadSurat();
    void loadPendudukOptions();
  }, [loadSurat, loadPendudukOptions]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      menunggu: rows.filter((item) => item.status === "MENUNGGU_PERSETUJUAN").length,
      disetujui: rows.filter((item) => item.status === "DISETUJUI").length,
      selesai: rows.filter((item) => item.status === "SELESAI").length,
    }),
    [rows],
  );

  const runPatchAction = useCallback(
    async (suratId: string, action: "submit" | "approve" | "reject" | "print" | "complete", payload?: Record<string, unknown>) => {
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/v1/surat/${suratId}/${action}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          ...(payload ? { body: JSON.stringify(payload) } : {}),
        });

        const body = (await response.json()) as
          | {
              success: true;
            }
          | ErrorResponse;

        if (!response.ok || !body.success) {
          throw new Error(body.success ? "Aksi gagal diproses" : (body.error?.message ?? "Aksi gagal diproses"));
        }

        toast.success("Status surat berhasil diperbarui");
        await loadSurat();
      } catch (error) {
        console.error("[SuratPage.runPatchAction]", error);
        toast.error(error instanceof Error ? error.message : "Aksi gagal diproses");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadSurat],
  );

  const handleCreate = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/surat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jenisSurat: form.jenisSurat,
          perihal: form.perihal,
          pendudukIds: [form.pendudukId],
          isiSurat: form.keperluan.trim() ? { keperluan: form.keperluan.trim() } : undefined,
          keterangan: form.keterangan,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal membuat surat" : (payload.error?.message ?? "Gagal membuat surat"));
      }

      toast.success("Surat berhasil dibuat");
      setOpenCreate(false);
      setForm(EMPTY_FORM);
      await loadSurat();
    } catch (error) {
      console.error("[SuratPage.handleCreate]", error);
      toast.error(error instanceof Error ? error.message : "Gagal membuat surat");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = useCallback(async (surat: SuratListItem) => {
    setSelectedSurat(surat);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/surat/${surat.id}`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as SuratDetailResponse | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal memuat detail surat" : (payload.error?.message ?? "Gagal memuat detail surat"));
      }

      const defaultPendudukId = payload.data.pendudukList[0]?.penduduk.id ?? "";
      const isi = payload.data.isiSurat && typeof payload.data.isiSurat === "object" ? payload.data.isiSurat : {};

      setForm({
        jenisSurat: payload.data.jenisSurat,
        perihal: payload.data.perihal,
        pendudukId: defaultPendudukId,
        keperluan: typeof isi.keperluan === "string" ? isi.keperluan : "",
        keterangan: payload.data.keterangan ?? "",
      });

      setOpenEdit(true);
    } catch (error) {
      console.error("[SuratPage.handleOpenEdit]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat detail surat");
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const handleUpdate = async () => {
    if (!selectedSurat) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/surat/${selectedSurat.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          perihal: form.perihal,
          pendudukIds: [form.pendudukId],
          isiSurat: form.keperluan.trim() ? { keperluan: form.keperluan.trim() } : undefined,
          keterangan: form.keterangan,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal mengubah surat" : (payload.error?.message ?? "Gagal mengubah surat"));
      }

      toast.success("Surat berhasil diperbarui");
      setOpenEdit(false);
      setSelectedSurat(null);
      setForm(EMPTY_FORM);
      await loadSurat();
    } catch (error) {
      console.error("[SuratPage.handleUpdate]", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengubah surat");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/surat/${deleteTarget.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal menghapus surat" : (payload.error?.message ?? "Gagal menghapus surat"));
      }

      toast.success("Surat berhasil dihapus");
      await loadSurat();
    } catch (error) {
      console.error("[SuratPage.handleDelete]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus surat");
    }
  }, [deleteTarget, loadSurat]);

  const columns = useMemo<ColumnDef<SuratListItem>[]>(
    () => [
      {
        accessorKey: "nomorSurat",
        header: "Nomor Surat",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{row.original.nomorSurat}</p>
            <p className="text-xs text-slate-500">{formatTanggalIndonesia(row.original.tanggalSurat)}</p>
          </div>
        ),
      },
      {
        accessorKey: "jenisSurat",
        header: "Jenis",
        cell: ({ row }) => <Badge variant="secondary">{formatEnumLabel(row.original.jenisSurat)}</Badge>,
      },
      {
        accessorKey: "perihal",
        header: "Perihal",
      },
      {
        id: "pemohon",
        header: "Pemohon",
        cell: ({ row }) => {
          const pemohon = row.original.pendudukList[0]?.penduduk;

          if (!pemohon) {
            return "-";
          }

          return (
            <div className="space-y-1">
              <p className="font-medium text-slate-800">{pemohon.nama}</p>
              <p className="text-xs text-slate-500">{pemohon.nik}</p>
            </div>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusBadge status={row.original.status} type="surat" />,
      },
      {
        id: "createdBy",
        header: "Pembuat",
        cell: ({ row }) => row.original.createdBy.nama,
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => {
          const surat = row.original;

          return (
            <div className="flex justify-end gap-1">
              {canUpdate && (surat.status === "DRAFT" || surat.status === "DITOLAK") ? (
                <Button onClick={() => void handleOpenEdit(surat)} size="icon" type="button" variant="outline">
                  <Pencil className="h-4 w-4" />
                </Button>
              ) : null}

              {canCreate && (surat.status === "DRAFT" || surat.status === "DITOLAK") ? (
                <Button
                  onClick={() => void runPatchAction(surat.id, "submit")}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Send className="h-4 w-4" />
                </Button>
              ) : null}

              {canApprove && surat.status === "MENUNGGU_PERSETUJUAN" ? (
                <>
                  <Button
                    className="text-emerald-700 hover:text-emerald-800"
                    onClick={() => void runPatchAction(surat.id, "approve")}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    className="text-red-600 hover:text-red-700"
                    onClick={() => {
                      setSelectedSurat(surat);
                      setRejectReason("");
                      setOpenReject(true);
                    }}
                    size="icon"
                    type="button"
                    variant="outline"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </>
              ) : null}

              {canPrint && (surat.status === "DISETUJUI" || surat.status === "DICETAK") ? (
                <Button
                  onClick={() => void runPatchAction(surat.id, "print")}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              ) : null}

              {canPrint && (surat.status === "DISETUJUI" || surat.status === "DICETAK") ? (
                <Button
                  className="text-emerald-700 hover:text-emerald-800"
                  onClick={() => void runPatchAction(surat.id, "complete")}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              ) : null}

              {canDelete && !(surat.status === "DISETUJUI" || surat.status === "DICETAK" || surat.status === "SELESAI") ? (
                <Button
                  className="text-red-600 hover:text-red-700"
                  onClick={() => setDeleteTarget(surat)}
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          );
        },
      },
    ],
    [canApprove, canCreate, canDelete, canPrint, canUpdate, handleOpenEdit, runPatchAction],
  );

  return (
    <div className="space-y-6">
      <PageHeader description="Kelola surat desa, alur persetujuan, dan status cetak." title="Data Surat">
        {canCreate ? (
          <Button
            onClick={() => {
              setForm(EMPTY_FORM);
              setOpenCreate(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat Surat
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Total surat tercatat" icon={FileText} title="Total Surat" value={stats.total} />
        <StatCard description="Menunggu persetujuan" icon={Send} title="Menunggu" value={stats.menunggu} />
        <StatCard description="Surat sudah disetujui" icon={Check} title="Disetujui" value={stats.disetujui} />
        <StatCard description="Surat selesai diproses" icon={CheckCircle2} title="Selesai" value={stats.selesai} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchKey="perihal"
        searchPlaceholder="Cari perihal surat..."
      />

      <Dialog onOpenChange={setOpenCreate} open={openCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Buat Surat Baru</DialogTitle>
            <DialogDescription>Isi data utama untuk membuat surat baru.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Jenis Surat</Label>
              <Select
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    jenisSurat: value as SuratJenis,
                  }))
                }
                value={form.jenisSurat}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SK_DOMISILI">SK Domisili</SelectItem>
                  <SelectItem value="SK_TIDAK_MAMPU">SK Tidak Mampu</SelectItem>
                  <SelectItem value="SK_USAHA">SK Usaha</SelectItem>
                  <SelectItem value="SK_KELAHIRAN">SK Kelahiran</SelectItem>
                  <SelectItem value="SK_KEMATIAN">SK Kematian</SelectItem>
                  <SelectItem value="SK_PINDAH">SK Pindah</SelectItem>
                  <SelectItem value="SK_DATANG">SK Datang</SelectItem>
                  <SelectItem value="SK_BELUM_MENIKAH">SK Belum Menikah</SelectItem>
                  <SelectItem value="SK_BEDA_NAMA">SK Beda Nama</SelectItem>
                  <SelectItem value="SK_KEHILANGAN">SK Kehilangan</SelectItem>
                  <SelectItem value="SK_CATATAN_KEPOLISIAN">SKCK</SelectItem>
                  <SelectItem value="SURAT_PENGANTAR">Surat Pengantar</SelectItem>
                  <SelectItem value="SK_TANAH">SK Tanah</SelectItem>
                  <SelectItem value="SK_PENGHASILAN">SK Penghasilan</SelectItem>
                  <SelectItem value="SK_IZIN_KERAMAIAN">SK Izin Keramaian</SelectItem>
                  <SelectItem value="LAINNYA">Lainnya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Perihal</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, perihal: event.target.value }))} value={form.perihal} />
            </div>

            <div className="space-y-2">
              <Label>Penduduk Pemohon</Label>
              <Select onValueChange={(value) => setForm((prev) => ({ ...prev, pendudukId: value }))} value={form.pendudukId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penduduk" />
                </SelectTrigger>
                <SelectContent>
                  {pendudukOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nik} - {item.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Keperluan</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, keperluan: event.target.value }))} value={form.keperluan} />
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))} rows={3} value={form.keterangan} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenCreate(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleCreate()} type="button">
              {isSubmitting ? "Menyimpan..." : "Simpan Surat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setOpenEdit} open={openEdit}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Surat</DialogTitle>
            <DialogDescription>Perubahan akan menyetel surat ditolak kembali menjadi draft.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Perihal</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, perihal: event.target.value }))} value={form.perihal} />
            </div>

            <div className="space-y-2">
              <Label>Penduduk Pemohon</Label>
              <Select onValueChange={(value) => setForm((prev) => ({ ...prev, pendudukId: value }))} value={form.pendudukId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih penduduk" />
                </SelectTrigger>
                <SelectContent>
                  {pendudukOptions.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nik} - {item.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Keperluan</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, keperluan: event.target.value }))} value={form.keperluan} />
            </div>

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))} rows={3} value={form.keterangan} />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenEdit(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleUpdate()} type="button">
              {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setOpenReject} open={openReject}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tolak Surat</DialogTitle>
            <DialogDescription>Isi alasan penolakan untuk dikirim ke pembuat surat.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Alasan Penolakan</Label>
            <Textarea onChange={(event) => setRejectReason(event.target.value)} rows={4} value={rejectReason} />
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenReject(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting || !selectedSurat}
              onClick={() => {
                if (!selectedSurat) {
                  return;
                }

                void runPatchAction(selectedSurat.id, "reject", { alasanTolak: rejectReason }).then(() => {
                  setOpenReject(false);
                  setSelectedSurat(null);
                  setRejectReason("");
                });
              }}
              type="button"
            >
              {isSubmitting ? "Memproses..." : "Tolak Surat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        description={
          deleteTarget
            ? `Surat ${deleteTarget.nomorSurat} akan dihapus permanen. Pastikan data ini memang tidak dipakai.`
            : ""
        }
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Hapus Surat"
        variant="danger"
      />
    </div>
  );
}
