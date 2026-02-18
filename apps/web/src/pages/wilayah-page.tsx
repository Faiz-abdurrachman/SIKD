import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { WilayahOverview } from "../lib/types";

export function WilayahPage() {
  const [data, setData] = useState<WilayahOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await apiClient.getWilayahOverview();
      setData(payload);
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat data wilayah");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Wilayah</h1>
        <p>Master data desa, dusun, RW, dan RT.</p>
      </div>

      <div className="toolbar">
        <button onClick={() => void load()} type="button">
          Refresh
        </button>
      </div>

      {isLoading ? <p>Memuat data wilayah...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {data ? (
        <>
          <div className="card-grid four">
            <article className="stat-card">
              <h3>Dusun</h3>
              <p>{data.dusun.length}</p>
            </article>
            <article className="stat-card">
              <h3>RW</h3>
              <p>{data.rw.length}</p>
            </article>
            <article className="stat-card">
              <h3>RT</h3>
              <p>{data.rt.length}</p>
            </article>
            <article className="stat-card">
              <h3>Kepala Desa</h3>
              <p>{data.desa?.namaKepalaDesa ?? "-"}</p>
            </article>
          </div>

          <article className="panel-card">
            <h3>Profil Desa</h3>
            <p>
              {data.desa
                ? `${data.desa.nama}, ${data.desa.kecamatan}, ${data.desa.kabupaten}, ${data.desa.provinsi}`
                : "Data desa belum tersedia"}
            </p>
          </article>

          <div className="card-grid two">
            <article className="panel-card">
              <h3>Daftar Dusun</h3>
              <ul className="plain-list">
                {data.dusun.map((item) => (
                  <li key={item.id}>
                    {item.nama} ({item._count?.rwList ?? 0} RW)
                  </li>
                ))}
                {data.dusun.length === 0 ? <li>Belum ada dusun.</li> : null}
              </ul>
            </article>

            <article className="panel-card">
              <h3>Daftar RW</h3>
              <ul className="plain-list">
                {data.rw.map((item) => (
                  <li key={item.id}>
                    RW {item.nomor} - Dusun {item.dusun.nama} ({item._count?.rtList ?? 0} RT)
                  </li>
                ))}
                {data.rw.length === 0 ? <li>Belum ada RW.</li> : null}
              </ul>
            </article>
          </div>

          <article className="panel-card">
            <h3>Daftar RT</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Dusun</th>
                    <th>RW</th>
                    <th>RT</th>
                    <th>Jumlah KK</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rt.map((item) => (
                    <tr key={item.id}>
                      <td>{item.rw.dusun.nama}</td>
                      <td>{item.rw.nomor}</td>
                      <td>{item.nomor}</td>
                      <td>{item._count?.keluarga ?? 0}</td>
                    </tr>
                  ))}
                  {data.rt.length === 0 ? (
                    <tr>
                      <td colSpan={4}>Belum ada RT.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </>
      ) : null}
    </section>
  );
}
