"use client";

import { Home, MapPinned, MapPlus, Pencil, Plus, Trash2, Trees } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { DesaItem, DusunItem, RTItem, RWItem, WilayahOverviewResponse } from "@/types/wilayah.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type WilayahManagerProps = {
  canManage: boolean;
};

type OverviewState = {
  desa: DesaItem | null;
  dusun: DusunItem[];
  rw: RWItem[];
  rt: RTItem[];
};

type EditTarget =
  | { type: "dusun"; id: string; label: string; value: string }
  | { type: "rw"; id: string; label: string; value: string }
  | { type: "rt"; id: string; label: string; value: string }
  | null;

type DeleteTarget =
  | { type: "dusun"; id: string; label: string }
  | { type: "rw"; id: string; label: string }
  | { type: "rt"; id: string; label: string }
  | null;

const EMPTY_OVERVIEW: OverviewState = {
  desa: null,
  dusun: [],
  rw: [],
  rt: [],
};

export function WilayahManager({ canManage }: WilayahManagerProps) {
  const [data, setData] = useState<OverviewState>(EMPTY_OVERVIEW);
  const [isLoading, setIsLoading] = useState(true);

  const [desaForm, setDesaForm] = useState({
    nama: "",
    kecamatan: "",
    kabupaten: "",
    provinsi: "",
    kodePos: "",
    alamatKantor: "",
    telepon: "",
    email: "",
    namaKepalaDesa: "",
    nipKepalaDesa: "",
  });

  const [dusunNama, setDusunNama] = useState("");
  const [rwForm, setRwForm] = useState({
    dusunId: "",
    nomor: "",
  });
  const [rtForm, setRtForm] = useState({
    rwId: "",
    nomor: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/wilayah/overview", {
        cache: "no-store",
      });

      const payload = (await response.json()) as WilayahOverviewResponse | ErrorResponse;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Gagal memuat data wilayah" : (payload.error?.message ?? "Gagal memuat data wilayah");
        throw new Error(message);
      }

      setData(payload.data);

      if (payload.data.desa) {
        setDesaForm({
          nama: payload.data.desa.nama,
          kecamatan: payload.data.desa.kecamatan,
          kabupaten: payload.data.desa.kabupaten,
          provinsi: payload.data.desa.provinsi,
          kodePos: payload.data.desa.kodePos ?? "",
          alamatKantor: payload.data.desa.alamatKantor ?? "",
          telepon: payload.data.desa.telepon ?? "",
          email: payload.data.desa.email ?? "",
          namaKepalaDesa: payload.data.desa.namaKepalaDesa ?? "",
          nipKepalaDesa: payload.data.desa.nipKepalaDesa ?? "",
        });
      }

      if (payload.data.dusun.length && !rwForm.dusunId) {
        setRwForm((prev) => ({
          ...prev,
          dusunId: payload.data.dusun[0]?.id ?? "",
        }));
      }

      if (payload.data.rw.length && !rtForm.rwId) {
        setRtForm((prev) => ({
          ...prev,
          rwId: payload.data.rw[0]?.id ?? "",
        }));
      }
    } catch (error) {
      console.error("[WilayahManager.loadData]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data wilayah");
      setData(EMPTY_OVERVIEW);
    } finally {
      setIsLoading(false);
    }
  }, [rtForm.rwId, rwForm.dusunId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const stats = useMemo(
    () => ({
      dusun: data.dusun.length,
      rw: data.rw.length,
      rt: data.rt.length,
      kk: data.rt.reduce((sum, item) => sum + item._count.keluarga, 0),
    }),
    [data],
  );

  const groupedTree = useMemo(
    () =>
      data.dusun.map((dusun) => ({
        ...dusun,
        rwList: data.rw
          .filter((rw) => rw.dusunId === dusun.id)
          .map((rw) => ({
            ...rw,
            rtList: data.rt.filter((rt) => rt.rwId === rw.id),
          })),
      })),
    [data],
  );

  const requestJson = async (
    url: string,
    init: RequestInit,
    fallbackMessage: string,
  ) => {
    const response = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });

    const payload = (await response.json()) as
      | {
          success: true;
        }
      | ErrorResponse;

    if (!response.ok || !payload.success) {
      const message = payload.success ? fallbackMessage : (payload.error?.message ?? fallbackMessage);
      throw new Error(message);
    }
  };

  const handleUpdateDesa = async () => {
    setIsSubmitting(true);

    try {
      await requestJson("/api/v1/wilayah/desa", { method: "PUT", body: JSON.stringify(desaForm) }, "Gagal memperbarui data desa");
      toast.success("Profil desa berhasil diperbarui");
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleUpdateDesa]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui data desa");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateDusun = async () => {
    if (!data.desa?.id) {
      toast.error("Data desa tidak tersedia");
      return;
    }

    setIsSubmitting(true);

    try {
      await requestJson(
        "/api/v1/wilayah/dusun",
        {
          method: "POST",
          body: JSON.stringify({
            desaId: data.desa.id,
            nama: dusunNama,
          }),
        },
        "Gagal menambah dusun",
      );
      toast.success("Dusun berhasil ditambahkan");
      setDusunNama("");
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleCreateDusun]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambah dusun");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRW = async () => {
    setIsSubmitting(true);

    try {
      await requestJson(
        "/api/v1/wilayah/rw",
        {
          method: "POST",
          body: JSON.stringify(rwForm),
        },
        "Gagal menambah RW",
      );
      toast.success("RW berhasil ditambahkan");
      setRwForm((prev) => ({ ...prev, nomor: "" }));
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleCreateRW]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambah RW");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateRT = async () => {
    setIsSubmitting(true);

    try {
      await requestJson(
        "/api/v1/wilayah/rt",
        {
          method: "POST",
          body: JSON.stringify(rtForm),
        },
        "Gagal menambah RT",
      );
      toast.success("RT berhasil ditambahkan");
      setRtForm((prev) => ({ ...prev, nomor: "" }));
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleCreateRT]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambah RT");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTarget) {
      return;
    }

    setIsSubmitting(true);

    try {
      if (editTarget.type === "dusun") {
        await requestJson(
          `/api/v1/wilayah/dusun/${editTarget.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ nama: editValue }),
          },
          "Gagal memperbarui dusun",
        );
      }

      if (editTarget.type === "rw") {
        await requestJson(
          `/api/v1/wilayah/rw/${editTarget.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ nomor: editValue }),
          },
          "Gagal memperbarui RW",
        );
      }

      if (editTarget.type === "rt") {
        await requestJson(
          `/api/v1/wilayah/rt/${editTarget.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ nomor: editValue }),
          },
          "Gagal memperbarui RT",
        );
      }

      toast.success(`${editTarget.label} berhasil diperbarui`);
      setEditTarget(null);
      setEditValue("");
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleSaveEdit]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memperbarui data");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      if (deleteTarget.type === "dusun") {
        await requestJson(`/api/v1/wilayah/dusun/${deleteTarget.id}`, { method: "DELETE" }, "Gagal menghapus dusun");
      }

      if (deleteTarget.type === "rw") {
        await requestJson(`/api/v1/wilayah/rw/${deleteTarget.id}`, { method: "DELETE" }, "Gagal menghapus RW");
      }

      if (deleteTarget.type === "rt") {
        await requestJson(`/api/v1/wilayah/rt/${deleteTarget.id}`, { method: "DELETE" }, "Gagal menghapus RT");
      }

      toast.success(`${deleteTarget.label} berhasil dihapus`);
      await loadData();
    } catch (error) {
      console.error("[WilayahManager.handleDelete]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menghapus data");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader description="Kelola profil desa dan struktur wilayah administratif." title="Manajemen Wilayah" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Total dusun" icon={Trees} title="Dusun" value={stats.dusun} />
        <StatCard description="Total RW" icon={MapPinned} title="RW" value={stats.rw} />
        <StatCard description="Total RT" icon={MapPlus} title="RT" value={stats.rt} />
        <StatCard description="Total KK terdaftar" icon={Home} title="KK" value={stats.kk} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profil Desa</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <Label>Nama Desa</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, nama: event.target.value }))} value={desaForm.nama} />
          </div>
          <div className="space-y-1">
            <Label>Kecamatan</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, kecamatan: event.target.value }))} value={desaForm.kecamatan} />
          </div>
          <div className="space-y-1">
            <Label>Kabupaten</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, kabupaten: event.target.value }))} value={desaForm.kabupaten} />
          </div>
          <div className="space-y-1">
            <Label>Provinsi</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, provinsi: event.target.value }))} value={desaForm.provinsi} />
          </div>
          <div className="space-y-1">
            <Label>Kode Pos</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, kodePos: event.target.value }))} value={desaForm.kodePos} />
          </div>
          <div className="space-y-1">
            <Label>Telepon</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, telepon: event.target.value }))} value={desaForm.telepon} />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Alamat Kantor</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, alamatKantor: event.target.value }))} value={desaForm.alamatKantor} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, email: event.target.value }))} value={desaForm.email} />
          </div>
          <div className="space-y-1">
            <Label>Nama Kepala Desa</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, namaKepalaDesa: event.target.value }))} value={desaForm.namaKepalaDesa} />
          </div>
          <div className="space-y-1">
            <Label>NIP Kepala Desa</Label>
            <Input disabled={!canManage || isLoading} onChange={(event) => setDesaForm((prev) => ({ ...prev, nipKepalaDesa: event.target.value }))} value={desaForm.nipKepalaDesa} />
          </div>
        </CardContent>
        {canManage ? (
          <div className="px-6 pb-6 text-right">
            <Button disabled={isSubmitting || isLoading} onClick={() => void handleUpdateDesa()} type="button">
              Simpan Profil Desa
            </Button>
          </div>
        ) : null}
      </Card>

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Tambah Wilayah</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 rounded-lg border p-3">
              <Label>Tambah Dusun</Label>
              <Input onChange={(event) => setDusunNama(event.target.value)} placeholder="Nama dusun" value={dusunNama} />
              <Button className="w-full" disabled={isSubmitting} onClick={() => void handleCreateDusun()} type="button">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Dusun
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <Label>Tambah RW</Label>
              <Select
                onValueChange={(value) => setRwForm((prev) => ({ ...prev, dusunId: value }))}
                value={rwForm.dusunId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dusun" />
                </SelectTrigger>
                <SelectContent>
                  {data.dusun.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input onChange={(event) => setRwForm((prev) => ({ ...prev, nomor: event.target.value }))} placeholder="Nomor RW (contoh: 001)" value={rwForm.nomor} />
              <Button className="w-full" disabled={isSubmitting} onClick={() => void handleCreateRW()} type="button">
                <Plus className="mr-2 h-4 w-4" />
                Tambah RW
              </Button>
            </div>

            <div className="space-y-2 rounded-lg border p-3">
              <Label>Tambah RT</Label>
              <Select onValueChange={(value) => setRtForm((prev) => ({ ...prev, rwId: value }))} value={rtForm.rwId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih RW" />
                </SelectTrigger>
                <SelectContent>
                  {data.rw.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.dusun.nama} - RW {item.nomor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input onChange={(event) => setRtForm((prev) => ({ ...prev, nomor: event.target.value }))} placeholder="Nomor RT (contoh: 001)" value={rtForm.nomor} />
              <Button className="w-full" disabled={isSubmitting} onClick={() => void handleCreateRT()} type="button">
                <Plus className="mr-2 h-4 w-4" />
                Tambah RT
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Struktur Wilayah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {groupedTree.map((dusun) => (
            <div className="rounded-lg border p-3" key={dusun.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>Dusun</Badge>
                  <p className="font-semibold text-slate-900">{dusun.nama}</p>
                </div>
                {canManage ? (
                  <div className="flex gap-1">
                    <Button
                      onClick={() => {
                        setEditTarget({ type: "dusun", id: dusun.id, label: "Dusun", value: dusun.nama });
                        setEditValue(dusun.nama);
                      }}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      className="text-red-600 hover:text-red-700"
                      onClick={() => setDeleteTarget({ type: "dusun", id: dusun.id, label: `Dusun ${dusun.nama}` })}
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {dusun.rwList.map((rw) => (
                  <div className="rounded-md border bg-slate-50 p-2" key={rw.id}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-800">RW {rw.nomor}</p>
                      {canManage ? (
                        <div className="flex gap-1">
                          <Button
                            onClick={() => {
                              setEditTarget({ type: "rw", id: rw.id, label: "RW", value: rw.nomor });
                              setEditValue(rw.nomor);
                            }}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteTarget({ type: "rw", id: rw.id, label: `RW ${rw.nomor}` })}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {rw.rtList.map((rt) => (
                        <Badge className="gap-1" key={rt.id} variant="secondary">
                          RT {rt.nomor} ({rt._count.keluarga} KK)
                          {canManage ? (
                            <button
                              className="ml-1 text-slate-500 hover:text-slate-800"
                              onClick={(event) => {
                                event.preventDefault();
                                setEditTarget({ type: "rt", id: rt.id, label: "RT", value: rt.nomor });
                                setEditValue(rt.nomor);
                              }}
                              type="button"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                          ) : null}
                          {canManage ? (
                            <button
                              className="ml-1 text-red-500 hover:text-red-700"
                              onClick={(event) => {
                                event.preventDefault();
                                setDeleteTarget({ type: "rt", id: rt.id, label: `RT ${rt.nomor}` });
                              }}
                              type="button"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          ) : null}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog onOpenChange={(open) => !open && setEditTarget(null)} open={Boolean(editTarget)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.label}</DialogTitle>
            <DialogDescription>Perbarui nilai {editTarget?.label?.toLowerCase()}.</DialogDescription>
          </DialogHeader>
          <Input onChange={(event) => setEditValue(event.target.value)} value={editValue} />
          <DialogFooter>
            <Button onClick={() => setEditTarget(null)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleSaveEdit()} type="button">
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        description={deleteTarget ? `${deleteTarget.label} akan dihapus permanen.` : ""}
        onConfirm={handleDelete}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        open={Boolean(deleteTarget)}
        title="Hapus Data Wilayah"
        variant="danger"
      />
    </div>
  );
}
