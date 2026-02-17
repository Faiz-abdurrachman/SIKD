"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  Check,
  CheckCircle2,
  Download,
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

import { AsyncCombobox, type AsyncComboboxOption } from "@/components/shared/async-combobox";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { Textarea } from "@/components/ui/textarea";
import {
  buildPerihalDefault,
  createEmptyIsiSurat,
  normalizeIsiSuratInput,
  SURAT_DYNAMIC_FIELDS,
  SURAT_JENIS_OPTIONS,
} from "@/lib/surat-fields";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import { fetchPaginatedPage } from "@/lib/paginated-client-fetch";
import type { SuratDetailResponse, SuratJenis, SuratListItem } from "@/types/surat.types";

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

type PendudukSearchResponse = {
  success: true;
  data: PendudukOption[];
};

type SuratFormState = {
  jenisSurat: SuratJenis;
  perihal: string;
  pendudukId: string;
  isiSurat: Record<string, string>;
  keterangan: string;
};

type SuratFilter = {
  q: string;
  jenisSurat: "all" | SuratJenis;
  status: "all" | "DRAFT" | "MENUNGGU_PERSETUJUAN" | "DISETUJUI" | "DITOLAK" | "DICETAK" | "SELESAI";
  fromDate: string;
  toDate: string;
};

type SuratPageProps = {
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canPrint: boolean;
};

const EMPTY_FILTER: SuratFilter = {
  q: "",
  jenisSurat: "all",
  status: "all",
  fromDate: "",
  toDate: "",
};

function createInitialForm(jenisSurat: SuratJenis = "SK_DOMISILI"): SuratFormState {
  return {
    jenisSurat,
    perihal: buildPerihalDefault(jenisSurat),
    pendudukId: "",
    isiSurat: createEmptyIsiSurat(jenisSurat),
    keterangan: "",
  };
}

function buildIsiSuratPayload(jenisSurat: SuratJenis, isiSurat: Record<string, string>) {
  const fields = SURAT_DYNAMIC_FIELDS[jenisSurat] ?? [];
  const payload: Record<string, unknown> = {};

  for (const field of fields) {
    const rawValue = (isiSurat[field.key] ?? "").trim();

    if (!rawValue) {
      continue;
    }

    if (field.type === "number") {
      const numberValue = Number(rawValue);
      payload[field.key] = Number.isFinite(numberValue) ? numberValue : rawValue;
      continue;
    }

    payload[field.key] = rawValue;
  }

  return payload;
}

async function parseErrorResponse(response: Response) {
  try {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ErrorResponse;
      return payload.error?.message ?? "Permintaan gagal diproses";
    }

    return `Permintaan gagal diproses (HTTP ${response.status})`;
  } catch {
    return `Permintaan gagal diproses (HTTP ${response.status})`;
  }
}

export function SuratPage({ canCreate, canUpdate, canDelete, canApprove, canPrint }: SuratPageProps) {
  const [rows, setRows] = useState<SuratListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftFilter, setDraftFilter] = useState<SuratFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<SuratFilter>(EMPTY_FILTER);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });
  const [pendudukOptionMap, setPendudukOptionMap] = useState<Record<string, AsyncComboboxOption>>({});

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openReject, setOpenReject] = useState(false);

  const [form, setForm] = useState<SuratFormState>(createInitialForm());
  const [selectedSurat, setSelectedSurat] = useState<SuratListItem | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SuratListItem | null>(null);

  const loadSurat = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchPaginatedPage<SuratListItem>({
        endpoint: "/api/v1/surat",
        sortBy: "tanggalSurat",
        sortOrder: "desc",
        errorMessage: "Gagal memuat data surat",
        page: pagination.page,
        limit: pagination.pageSize,
        query: {
          q: appliedFilter.q,
          jenisSurat: appliedFilter.jenisSurat !== "all" ? appliedFilter.jenisSurat : undefined,
          status: appliedFilter.status !== "all" ? appliedFilter.status : undefined,
          fromDate: appliedFilter.fromDate,
          toDate: appliedFilter.toDate,
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
      console.error("[SuratPage.loadSurat]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data surat");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    void loadSurat();
  }, [loadSurat]);

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
      menunggu: rows.filter((item) => item.status === "MENUNGGU_PERSETUJUAN").length,
      disetujui: rows.filter((item) => item.status === "DISETUJUI").length,
      selesai: rows.filter((item) => item.status === "SELESAI").length,
    }),
    [pagination.total, rows],
  );

  const activeFilterCount = useMemo(() => {
    const candidates = [
      appliedFilter.q.trim(),
      appliedFilter.jenisSurat !== "all" ? appliedFilter.jenisSurat : "",
      appliedFilter.status !== "all" ? appliedFilter.status : "",
      appliedFilter.fromDate.trim(),
      appliedFilter.toDate.trim(),
    ];

    return candidates.filter((value) => value.length > 0).length;
  }, [appliedFilter]);

  const runPatchAction = useCallback(
    async (
      suratId: string,
      action: "submit" | "approve" | "reject" | "print" | "complete",
      payload?: Record<string, unknown>,
      options?: { refresh?: boolean; successMessage?: string },
    ) => {
      setIsSubmitting(true);

      try {
        const response = await fetch(`/api/v1/surat/${suratId}/${action}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          ...(payload ? { body: JSON.stringify(payload) } : {}),
        });

        if (!response.ok) {
          throw new Error(await parseErrorResponse(response));
        }

        toast.success(options?.successMessage ?? "Status surat berhasil diperbarui");

        if (options?.refresh !== false) {
          await loadSurat();
        }
      } catch (error) {
        console.error("[SuratPage.runPatchAction]", error);
        toast.error(error instanceof Error ? error.message : "Aksi gagal diproses");
      } finally {
        setIsSubmitting(false);
      }
    },
    [loadSurat],
  );

  const handleJenisSuratChange = useCallback((jenisSurat: SuratJenis) => {
    setForm((previous) => {
      const prevDefault = buildPerihalDefault(previous.jenisSurat);
      const nextDefault = buildPerihalDefault(jenisSurat);
      const shouldAutoReplacePerihal = !previous.perihal.trim() || previous.perihal === prevDefault;

      return {
        ...previous,
        jenisSurat,
        perihal: shouldAutoReplacePerihal ? nextDefault : previous.perihal,
        isiSurat: createEmptyIsiSurat(jenisSurat),
      };
    });
  }, []);

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
          isiSurat: buildIsiSuratPayload(form.jenisSurat, form.isiSurat),
          keterangan: form.keterangan,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success("Surat berhasil dibuat");
      setOpenCreate(false);
      setForm(createInitialForm());
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

      const pemohonId = payload.data.pendudukList[0]?.penduduk.id ?? "";
      const pemohon = payload.data.pendudukList[0]?.penduduk;

      if (pemohon) {
        setPendudukOptionMap((previous) => ({
          ...previous,
          [pemohon.id]: {
            value: pemohon.id,
            label: `${pemohon.nik} - ${pemohon.nama}`,
          },
        }));
      }

      setForm({
        jenisSurat: payload.data.jenisSurat,
        perihal: payload.data.perihal,
        pendudukId: pemohonId,
        isiSurat: normalizeIsiSuratInput(payload.data.jenisSurat, payload.data.isiSurat),
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
          isiSurat: buildIsiSuratPayload(form.jenisSurat, form.isiSurat),
          keterangan: form.keterangan,
        }),
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success("Surat berhasil diperbarui");
      setOpenEdit(false);
      setSelectedSurat(null);
      setForm(createInitialForm());
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

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      toast.success("Surat berhasil dihapus");
      await loadSurat();
    } catch (error) {
      console.error("[SuratPage.handleDelete]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus surat");
    }
  }, [deleteTarget, loadSurat]);

  const handleDownloadPdf = useCallback(async (surat: SuratListItem) => {
    try {
      const response = await fetch(`/api/v1/surat/${surat.id}/pdf`, {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(await parseErrorResponse(response));
      }

      const blob = await response.blob();
      const fileName = `surat-${surat.nomorSurat.replaceAll("/", "-")}.pdf`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      toast.success("PDF surat berhasil diunduh");
    } catch (error) {
      console.error("[SuratPage.handleDownloadPdf]", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengunduh PDF surat");
    }
  }, []);

  const dynamicFields = useMemo(() => SURAT_DYNAMIC_FIELDS[form.jenisSurat] ?? [], [form.jenisSurat]);

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
          const canDownload = canPrint && ["DISETUJUI", "DICETAK", "SELESAI"].includes(surat.status);

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

              {canPrint && surat.status === "DISETUJUI" ? (
                <Button
                  onClick={() =>
                    void runPatchAction(surat.id, "print", undefined, {
                      successMessage: "Surat ditandai sudah dicetak",
                    })
                  }
                  size="icon"
                  type="button"
                  variant="outline"
                >
                  <Printer className="h-4 w-4" />
                </Button>
              ) : null}

              {canDownload ? (
                <Button onClick={() => void handleDownloadPdf(surat)} size="icon" type="button" variant="outline">
                  <Download className="h-4 w-4" />
                </Button>
              ) : null}

              {canPrint && (surat.status === "DISETUJUI" || surat.status === "DICETAK") ? (
                <Button
                  className="text-emerald-700 hover:text-emerald-800"
                  onClick={() =>
                    void runPatchAction(surat.id, "complete", undefined, {
                      successMessage: "Surat diset status selesai",
                    })
                  }
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
    [canApprove, canCreate, canDelete, canPrint, canUpdate, handleDownloadPdf, handleOpenEdit, runPatchAction],
  );

  const renderDynamicFields = () => {
    return dynamicFields.map((field) => {
      const value = form.isiSurat[field.key] ?? "";
      const label = field.required ? `${field.label} *` : field.label;

      if (field.type === "textarea") {
        return (
          <div className="space-y-2" key={field.key}>
            <Label>{label}</Label>
            <Textarea
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  isiSurat: {
                    ...prev.isiSurat,
                    [field.key]: event.target.value,
                  },
                }))
              }
              placeholder={field.placeholder}
              rows={3}
              value={value}
            />
          </div>
        );
      }

      if (field.type === "select") {
        return (
          <div className="space-y-2" key={field.key}>
            <Label>{label}</Label>
            <Select
              onValueChange={(nextValue) =>
                setForm((prev) => ({
                  ...prev,
                  isiSurat: {
                    ...prev.isiSurat,
                    [field.key]: nextValue,
                  },
                }))
              }
              value={value}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Pilih ${field.label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {(field.options ?? []).map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      }

      return (
        <div className="space-y-2" key={field.key}>
          <Label>{label}</Label>
          <Input
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                isiSurat: {
                  ...prev.isiSurat,
                  [field.key]: event.target.value,
                },
              }))
            }
            placeholder={field.placeholder}
            type={field.type}
            value={value}
          />
        </div>
      );
    });
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
      <PageHeader description="Kelola surat desa, alur persetujuan, dan status cetak." title="Data Surat">
        <FilterToggleButton
          activeCount={activeFilterCount}
          isOpen={isFilterOpen}
          onToggle={handleToggleFilter}
        />
        {canCreate ? (
          <Button
            onClick={() => {
              setForm(createInitialForm());
              setOpenCreate(true);
            }}
            type="button"
          >
            <Plus className="mr-2 h-4 w-4" />
            Buat Surat
          </Button>
        ) : null}
      </PageHeader>

      <div className="kpi-grid">
        <StatCard description="Total surat tercatat" icon={FileText} title="Total Surat" value={stats.total} />
        <StatCard description="Menunggu persetujuan di halaman aktif" icon={Send} title="Menunggu (Halaman)" value={stats.menunggu} />
        <StatCard description="Surat disetujui di halaman aktif" icon={Check} title="Disetujui (Halaman)" value={stats.disetujui} />
        <StatCard description="Surat selesai di halaman aktif" icon={CheckCircle2} title="Selesai (Halaman)" value={stats.selesai} />
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        contentClassName="space-y-4"
        title="Filter Surat"
      >
        <div className="form-grid md:grid-cols-2 xl:grid-cols-5">
          <div className="field-stack xl:col-span-2">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari No surat / perihal / NIK / nama"
              value={draftFilter.q}
            />
          </div>

          <div className="field-stack">
            <Label>Jenis Surat</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, jenisSurat: value as SuratFilter["jenisSurat"] }))}
              value={draftFilter.jenisSurat}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {SURAT_JENIS_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="field-stack">
            <Label>Status</Label>
            <Select
              onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, status: value as SuratFilter["status"] }))}
              value={draftFilter.status}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="MENUNGGU_PERSETUJUAN">Menunggu Persetujuan</SelectItem>
                <SelectItem value="DISETUJUI">Disetujui</SelectItem>
                <SelectItem value="DITOLAK">Ditolak</SelectItem>
                <SelectItem value="DICETAK">Dicetak</SelectItem>
                <SelectItem value="SELESAI">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="field-stack">
            <Label>Dari Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, fromDate: event.target.value }))}
              type="date"
              value={draftFilter.fromDate}
            />
          </div>

          <div className="field-stack">
            <Label>Sampai Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, toDate: event.target.value }))}
              type="date"
              value={draftFilter.toDate}
            />
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
            <DialogTitle>Buat Surat Baru</DialogTitle>
            <DialogDescription>Isi data utama dan detail jenis surat.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Jenis Surat</Label>
              <Select onValueChange={(value) => handleJenisSuratChange(value as SuratJenis)} value={form.jenisSurat}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SURAT_JENIS_OPTIONS.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Perihal</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, perihal: event.target.value }))} value={form.perihal} />
            </div>

            <div className="space-y-2">
              <Label>Penduduk Pemohon</Label>
              <AsyncCombobox
                emptyText="Penduduk tidak ditemukan."
                fetchOptions={searchPendudukOptions}
                onFetchError={(error) => {
                  console.error("[SuratPage.searchPendudukOptions]", error);
                  toast.error(error instanceof Error ? error.message : "Gagal mencari penduduk");
                }}
                onValueChange={(value) => setForm((previous) => ({ ...previous, pendudukId: value }))}
                placeholder="Cari penduduk (NIK / nama)"
                searchPlaceholder="Ketik NIK atau nama penduduk..."
                selectedLabel={form.pendudukId ? pendudukOptionMap[form.pendudukId]?.label : undefined}
                value={form.pendudukId}
              />
            </div>

            {renderDynamicFields()}

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))}
                rows={3}
                value={form.keterangan}
              />
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
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Surat</DialogTitle>
            <DialogDescription>Perubahan data ditolak akan kembali ke status draft.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Perihal</Label>
              <Input onChange={(event) => setForm((prev) => ({ ...prev, perihal: event.target.value }))} value={form.perihal} />
            </div>

            <div className="space-y-2">
              <Label>Penduduk Pemohon</Label>
              <AsyncCombobox
                emptyText="Penduduk tidak ditemukan."
                fetchOptions={searchPendudukOptions}
                onFetchError={(error) => {
                  console.error("[SuratPage.searchPendudukOptions]", error);
                  toast.error(error instanceof Error ? error.message : "Gagal mencari penduduk");
                }}
                onValueChange={(value) => setForm((previous) => ({ ...previous, pendudukId: value }))}
                placeholder="Cari penduduk (NIK / nama)"
                searchPlaceholder="Ketik NIK atau nama penduduk..."
                selectedLabel={form.pendudukId ? pendudukOptionMap[form.pendudukId]?.label : undefined}
                value={form.pendudukId}
              />
            </div>

            {renderDynamicFields()}

            <div className="space-y-2">
              <Label>Keterangan</Label>
              <Textarea
                onChange={(event) => setForm((prev) => ({ ...prev, keterangan: event.target.value }))}
                rows={3}
                value={form.keterangan}
              />
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
