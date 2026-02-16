"use client";

import { Save, Settings2, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SettingsData, SettingsResponse } from "@/types/settings.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type DesaForm = {
  nama: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  kodePos: string;
  alamatKantor: string;
  telepon: string;
  email: string;
  website: string;
  namaKepalaDesa: string;
  nipKepalaDesa: string;
};

type SystemForm = {
  nomor_surat_format: string;
  app_name: string;
  session_timeout_minutes: string;
  max_login_attempts: string;
  backup_retention_days: string;
};

const EMPTY_DESA_FORM: DesaForm = {
  nama: "",
  kecamatan: "",
  kabupaten: "",
  provinsi: "",
  kodePos: "",
  alamatKantor: "",
  telepon: "",
  email: "",
  website: "",
  namaKepalaDesa: "",
  nipKepalaDesa: "",
};

const EMPTY_SYSTEM_FORM: SystemForm = {
  nomor_surat_format: "{nomor}/{kode}/{kode_desa}/{bulan_romawi}/{tahun}",
  app_name: "SIDESA",
  session_timeout_minutes: "30",
  max_login_attempts: "5",
  backup_retention_days: "7",
};

export function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [desaForm, setDesaForm] = useState<DesaForm>(EMPTY_DESA_FORM);
  const [systemForm, setSystemForm] = useState<SystemForm>(EMPTY_SYSTEM_FORM);

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/settings", {
        cache: "no-store",
      });

      const payload = (await response.json()) as SettingsResponse | ErrorResponse;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Gagal memuat pengaturan" : (payload.error?.message ?? "Gagal memuat pengaturan");
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
          website: payload.data.desa.website ?? "",
          namaKepalaDesa: payload.data.desa.namaKepalaDesa ?? "",
          nipKepalaDesa: payload.data.desa.nipKepalaDesa ?? "",
        });
      }

      setSystemForm({
        nomor_surat_format:
          payload.data.grouped.surat?.nomor_surat_format ?? EMPTY_SYSTEM_FORM.nomor_surat_format,
        app_name: payload.data.grouped.general?.app_name ?? EMPTY_SYSTEM_FORM.app_name,
        session_timeout_minutes:
          payload.data.grouped.security?.session_timeout_minutes ?? EMPTY_SYSTEM_FORM.session_timeout_minutes,
        max_login_attempts:
          payload.data.grouped.security?.max_login_attempts ?? EMPTY_SYSTEM_FORM.max_login_attempts,
        backup_retention_days:
          payload.data.grouped.backup?.backup_retention_days ?? EMPTY_SYSTEM_FORM.backup_retention_days,
      });
    } catch (error) {
      console.error("[SettingsPage.loadData]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat pengaturan");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const saveProfile = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          desa: desaForm,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal menyimpan profil desa" : (payload.error?.message ?? "Gagal menyimpan profil desa"));
      }

      toast.success("Profil desa berhasil disimpan");
      await loadData();
    } catch (error) {
      console.error("[SettingsPage.saveProfile]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan profil desa");
    } finally {
      setIsSaving(false);
    }
  };

  const saveSystem = async () => {
    setIsSaving(true);

    try {
      const response = await fetch("/api/v1/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            app_name: systemForm.app_name,
            nomor_surat_format: systemForm.nomor_surat_format,
            session_timeout_minutes: systemForm.session_timeout_minutes,
            max_login_attempts: systemForm.max_login_attempts,
            backup_retention_days: systemForm.backup_retention_days,
          },
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal menyimpan pengaturan sistem" : (payload.error?.message ?? "Gagal menyimpan pengaturan sistem"));
      }

      toast.success("Pengaturan sistem berhasil disimpan");
      await loadData();
    } catch (error) {
      console.error("[SettingsPage.saveSystem]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan pengaturan sistem");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <p className="text-sm text-slate-600">Memuat pengaturan...</p>;
  }

  if (!data) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <Settings2 className="h-4 w-4" />
        <AlertTitle>Pengaturan gagal dimuat</AlertTitle>
        <AlertDescription>Refresh halaman atau cek koneksi API terlebih dahulu.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader description="Kelola profil desa dan konfigurasi inti aplikasi." title="Pengaturan Sistem" />

      <Tabs defaultValue="profil-desa">
        <TabsList>
          <TabsTrigger value="profil-desa">Profil Desa</TabsTrigger>
          <TabsTrigger value="nomor-surat">Nomor Surat</TabsTrigger>
          <TabsTrigger value="keamanan-backup">Keamanan & Backup</TabsTrigger>
        </TabsList>

        <TabsContent className="space-y-4" value="profil-desa">
          <Card>
            <CardHeader>
              <CardTitle>Data Profil Desa</CardTitle>
              <CardDescription>Informasi ini dipakai di header surat dan metadata aplikasi.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Nama Desa</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, nama: event.target.value }))} value={desaForm.nama} />
              </div>
              <div className="space-y-2">
                <Label>Kecamatan</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, kecamatan: event.target.value }))} value={desaForm.kecamatan} />
              </div>
              <div className="space-y-2">
                <Label>Kabupaten</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, kabupaten: event.target.value }))} value={desaForm.kabupaten} />
              </div>
              <div className="space-y-2">
                <Label>Provinsi</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, provinsi: event.target.value }))} value={desaForm.provinsi} />
              </div>
              <div className="space-y-2">
                <Label>Kode Pos</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, kodePos: event.target.value }))} value={desaForm.kodePos} />
              </div>
              <div className="space-y-2">
                <Label>Telepon</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, telepon: event.target.value }))} value={desaForm.telepon} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Alamat Kantor</Label>
                <Input
                  onChange={(event) => setDesaForm((prev) => ({ ...prev, alamatKantor: event.target.value }))}
                  value={desaForm.alamatKantor}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, email: event.target.value }))} value={desaForm.email} />
              </div>
              <div className="space-y-2">
                <Label>Website</Label>
                <Input onChange={(event) => setDesaForm((prev) => ({ ...prev, website: event.target.value }))} value={desaForm.website} />
              </div>
              <div className="space-y-2">
                <Label>Nama Kepala Desa</Label>
                <Input
                  onChange={(event) => setDesaForm((prev) => ({ ...prev, namaKepalaDesa: event.target.value }))}
                  value={desaForm.namaKepalaDesa}
                />
              </div>
              <div className="space-y-2">
                <Label>NIP Kepala Desa</Label>
                <Input
                  onChange={(event) => setDesaForm((prev) => ({ ...prev, nipKepalaDesa: event.target.value }))}
                  value={desaForm.nipKepalaDesa}
                />
              </div>

              <div className="md:col-span-2">
                <Button disabled={isSaving} onClick={() => void saveProfile()} type="button">
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Profil Desa"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="nomor-surat">
          <Card>
            <CardHeader>
              <CardTitle>Format Nomor Surat</CardTitle>
              <CardDescription>
                Gunakan placeholder: {"{nomor}"}, {"{kode}"}, {"{kode_desa}"}, {"{bulan_romawi}"}, {"{tahun}"}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nama Aplikasi</Label>
                <Input onChange={(event) => setSystemForm((prev) => ({ ...prev, app_name: event.target.value }))} value={systemForm.app_name} />
              </div>
              <div className="space-y-2">
                <Label>Format Nomor Surat</Label>
                <Input
                  onChange={(event) => setSystemForm((prev) => ({ ...prev, nomor_surat_format: event.target.value }))}
                  value={systemForm.nomor_surat_format}
                />
              </div>
              <Button disabled={isSaving} onClick={() => void saveSystem()} type="button">
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Menyimpan..." : "Simpan Format"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent className="space-y-4" value="keamanan-backup">
          <Card>
            <CardHeader>
              <CardTitle>Keamanan Session</CardTitle>
              <CardDescription>Atur kebijakan login dan masa aktif sesi pengguna.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Session Timeout (menit)</Label>
                <Input
                  onChange={(event) =>
                    setSystemForm((prev) => ({ ...prev, session_timeout_minutes: event.target.value }))
                  }
                  value={systemForm.session_timeout_minutes}
                />
              </div>
              <div className="space-y-2">
                <Label>Maksimal Login Gagal</Label>
                <Input
                  onChange={(event) => setSystemForm((prev) => ({ ...prev, max_login_attempts: event.target.value }))}
                  value={systemForm.max_login_attempts}
                />
              </div>
              <div className="space-y-2">
                <Label>Retensi Backup (hari)</Label>
                <Input
                  onChange={(event) => setSystemForm((prev) => ({ ...prev, backup_retention_days: event.target.value }))}
                  value={systemForm.backup_retention_days}
                />
              </div>

              <div className="md:col-span-2">
                <Button disabled={isSaving} onClick={() => void saveSystem()} type="button">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  {isSaving ? "Menyimpan..." : "Simpan Pengaturan Keamanan"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Alert>
            <Settings2 className="h-4 w-4" />
            <AlertTitle>Backup Database</AlertTitle>
            <AlertDescription>
              Backup SQL dijalankan dari server melalui script `docker/backup.sh` atau cron job. Halaman ini menyimpan retensi dan kebijakan backup.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
