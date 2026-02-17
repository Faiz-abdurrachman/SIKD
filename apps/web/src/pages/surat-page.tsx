import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { PaginatedResponse, SuratListItem } from "../lib/types";

export function SuratPage() {
  const [rows, setRows] = useState<SuratListItem[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<SuratListItem>["meta"]>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await apiClient.getSurat({ page, limit: meta.limit });
        if (!cancelled) {
          setRows(payload.data);
          setMeta(payload.meta);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRows([]);
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat data surat");
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
  }, [page, meta.limit]);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Surat</h1>
        <p>Data surat dari API Express lokal.</p>
      </div>

      {isLoading ? <p>Memuat data surat...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>No Surat</th>
              <th>Jenis</th>
              <th>Perihal</th>
              <th>Status</th>
              <th>Tanggal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.nomorSurat}</td>
                <td>{item.jenisSurat}</td>
                <td>{item.perihal}</td>
                <td>{item.status}</td>
                <td>{item.tanggalSurat.slice(0, 10)}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5}>Tidak ada data.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="pagination">
        <span>
          Halaman {meta.page} / {meta.totalPages} (Total: {meta.total})
        </span>
        <div className="pagination-buttons">
          <button disabled={meta.page <= 1} onClick={() => setPage((prev) => prev - 1)} type="button">
            Prev
          </button>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setPage((prev) => prev + 1)}
            type="button"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
