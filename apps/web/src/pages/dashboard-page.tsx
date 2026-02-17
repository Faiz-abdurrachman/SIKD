import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { DashboardOverviewData } from "../lib/types";

export function DashboardPage() {
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await apiClient.getDashboardOverview(5);
        if (!cancelled) {
          setData(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat dashboard");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Dashboard</h1>
        <p>Ringkasan data kependudukan, mutasi, dan surat.</p>
      </div>

      {isLoading ? <p>Memuat dashboard...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {data ? (
        <>
          <div className="card-grid four">
            <article className="stat-card">
              <h3>Total Penduduk</h3>
              <p>{data.stats.totalPenduduk}</p>
            </article>
            <article className="stat-card">
              <h3>Total KK</h3>
              <p>{data.stats.totalKeluarga}</p>
            </article>
            <article className="stat-card">
              <h3>Surat Bulan Ini</h3>
              <p>{data.stats.suratBulanIni}</p>
            </article>
            <article className="stat-card">
              <h3>Mutasi Bulan Ini</h3>
              <p>{data.stats.mutasiBulanIni}</p>
            </article>
          </div>

          <div className="card-grid two">
            <article className="panel-card">
              <h3>Mutasi Terbaru</h3>
              <ul className="plain-list">
                {data.recentMutasi.map((item) => (
                  <li key={item.id}>
                    <strong>{item.penduduk.nama}</strong> ({item.penduduk.nik}) - {item.jenisMutasi}
                  </li>
                ))}
                {data.recentMutasi.length === 0 ? <li>Belum ada data.</li> : null}
              </ul>
            </article>
            <article className="panel-card">
              <h3>Surat Terbaru</h3>
              <ul className="plain-list">
                {data.recentSurat.map((item) => (
                  <li key={item.id}>
                    <strong>{item.nomorSurat}</strong> - {item.status} ({item.createdBy.nama})
                  </li>
                ))}
                {data.recentSurat.length === 0 ? <li>Belum ada data.</li> : null}
              </ul>
            </article>
          </div>
        </>
      ) : null}
    </section>
  );
}
