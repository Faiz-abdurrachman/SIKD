import { FormEvent, useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { SettingsPayload } from "../lib/types";

type DesaFormState = {
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

function toDesaForm(payload: SettingsPayload | null): DesaFormState {
  return {
    nama: payload?.desa?.nama ?? "",
    kecamatan: payload?.desa?.kecamatan ?? "",
    kabupaten: payload?.desa?.kabupaten ?? "",
    provinsi: payload?.desa?.provinsi ?? "",
    kodePos: payload?.desa?.kodePos ?? "",
    alamatKantor: payload?.desa?.alamatKantor ?? "",
    telepon: payload?.desa?.telepon ?? "",
    email: payload?.desa?.email ?? "",
    website: payload?.desa?.website ?? "",
    namaKepalaDesa: payload?.desa?.namaKepalaDesa ?? "",
    nipKepalaDesa: payload?.desa?.nipKepalaDesa ?? "",
  };
}

function toSettingsMap(payload: SettingsPayload | null) {
  if (!payload) {
    return {} as Record<string, string>;
  }

  return Object.fromEntries(payload.settings.map((item) => [item.key, item.value]));
}

export function PengaturanPage() {
  const [data, setData] = useState<SettingsPayload | null>(null);
  const [desaForm, setDesaForm] = useState<DesaFormState>(() => toDesaForm(null));
  const [settingsMap, setSettingsMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingDesa, setIsSavingDesa] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await apiClient.getSettings();
      setData(payload);
      setDesaForm(toDesaForm(payload));
      setSettingsMap(toSettingsMap(payload));
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat pengaturan");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSaveDesa(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSavingDesa(true);

    try {
      const payload = await apiClient.updateSettings({ desa: desaForm });
      setData(payload);
      setDesaForm(toDesaForm(payload));
      setNotice("Profil desa berhasil diperbarui.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan profil desa");
    } finally {
      setIsSavingDesa(false);
    }
  }

  async function handleSaveSettings() {
    setError(null);
    setNotice(null);
    setIsSavingSettings(true);

    try {
      const payload = await apiClient.updateSettings({ settings: settingsMap });
      setData(payload);
      setSettingsMap(toSettingsMap(payload));
      setNotice("Konfigurasi sistem berhasil diperbarui.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Gagal menyimpan konfigurasi");
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Pengaturan</h1>
        <p>Pengaturan profil desa dan konfigurasi sistem.</p>
      </div>

      <div className="toolbar">
        <button onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      {isLoading ? <p>Memuat pengaturan...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {notice ? <p className="success-text">{notice}</p> : null}

      <form className="panel-card form-grid" onSubmit={handleSaveDesa}>
        <h3>Profil Desa</h3>
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, nama: event.target.value }))}
          placeholder="Nama Desa"
          value={desaForm.nama}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, kecamatan: event.target.value }))}
          placeholder="Kecamatan"
          value={desaForm.kecamatan}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, kabupaten: event.target.value }))}
          placeholder="Kabupaten"
          value={desaForm.kabupaten}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, provinsi: event.target.value }))}
          placeholder="Provinsi"
          value={desaForm.provinsi}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, kodePos: event.target.value }))}
          placeholder="Kode Pos"
          value={desaForm.kodePos}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, alamatKantor: event.target.value }))}
          placeholder="Alamat Kantor"
          value={desaForm.alamatKantor}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, telepon: event.target.value }))}
          placeholder="Telepon"
          value={desaForm.telepon}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email"
          type="email"
          value={desaForm.email}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, website: event.target.value }))}
          placeholder="Website"
          value={desaForm.website}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, namaKepalaDesa: event.target.value }))}
          placeholder="Nama Kepala Desa"
          value={desaForm.namaKepalaDesa}
        />
        <input
          onChange={(event) => setDesaForm((prev) => ({ ...prev, nipKepalaDesa: event.target.value }))}
          placeholder="NIP Kepala Desa"
          value={desaForm.nipKepalaDesa}
        />
        <button disabled={isSavingDesa} type="submit">
          {isSavingDesa ? "Menyimpan..." : "Simpan Profil Desa"}
        </button>
      </form>

      <article className="panel-card">
        <div className="toolbar">
          <h3>Konfigurasi Sistem</h3>
          <button disabled={isSavingSettings} onClick={() => void handleSaveSettings()} type="button">
            {isSavingSettings ? "Menyimpan..." : "Simpan Konfigurasi"}
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Group</th>
                <th>Key</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {data?.settings.map((item) => (
                <tr key={item.id}>
                  <td>{item.group}</td>
                  <td>{item.key}</td>
                  <td>
                    <input
                      onChange={(event) =>
                        setSettingsMap((prev) => ({
                          ...prev,
                          [item.key]: event.target.value,
                        }))
                      }
                      value={settingsMap[item.key] ?? ""}
                    />
                  </td>
                </tr>
              ))}
              {!isLoading && (!data || data.settings.length === 0) ? (
                <tr>
                  <td colSpan={3}>Belum ada konfigurasi.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
