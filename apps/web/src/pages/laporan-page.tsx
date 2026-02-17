import { useEffect, useMemo, useState } from "react";

import { apiClient } from "../lib/api";
import type { LaporanSummary } from "../lib/types";

function getDefaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

export function LaporanPage() {
  const [period, setPeriod] = useState(() => getDefaultPeriod());
  const [summary, setSummary] = useState<LaporanSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const periodLabel = useMemo(() => {
    if (!summary) {
      return "-";
    }

    return `${summary.periode.fromDate.slice(0, 10)} s/d ${summary.periode.toDate.slice(0, 10)}`;
  }, [summary]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await apiClient.getLaporanSummary(period);
        if (!cancelled) {
          setSummary(payload);
        }
      } catch (loadError) {
        if (!cancelled) {
          setSummary(null);
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat laporan");
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
  }, [period]);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Laporan</h1>
        <p>Ringkasan statistik penduduk, mutasi, dan surat.</p>
      </div>

      <div className="toolbar">
        <label>
          Dari
          <input
            onChange={(event) => setPeriod((prev) => ({ ...prev, fromDate: event.target.value }))}
            type="date"
            value={period.fromDate}
          />
        </label>
        <label>
          Sampai
          <input
            onChange={(event) => setPeriod((prev) => ({ ...prev, toDate: event.target.value }))}
            type="date"
            value={period.toDate}
          />
        </label>
      </div>

      {isLoading ? <p>Memuat laporan...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      {summary ? (
        <div className="stack-gap">
          <article className="panel-card">
            <h3>Periode</h3>
            <p>{periodLabel}</p>
          </article>

          <div className="card-grid three">
            <article className="stat-card">
              <h3>Total Penduduk</h3>
              <p>{summary.penduduk.total}</p>
            </article>
            <article className="stat-card">
              <h3>Total Mutasi</h3>
              <p>{summary.mutasi.total}</p>
            </article>
            <article className="stat-card">
              <h3>Total Surat</h3>
              <p>{summary.surat.total}</p>
            </article>
          </div>

          <div className="card-grid two">
            <article className="panel-card">
              <h3>Mutasi per Jenis</h3>
              <ul className="plain-list">
                {summary.mutasi.byJenis.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value}
                  </li>
                ))}
                {summary.mutasi.byJenis.length === 0 ? <li>Tidak ada data.</li> : null}
              </ul>
            </article>
            <article className="panel-card">
              <h3>Surat per Status</h3>
              <ul className="plain-list">
                {summary.surat.byStatus.map((item) => (
                  <li key={item.label}>
                    {item.label}: {item.value}
                  </li>
                ))}
                {summary.surat.byStatus.length === 0 ? <li>Tidak ada data.</li> : null}
              </ul>
            </article>
          </div>
        </div>
      ) : null}
    </section>
  );
}
