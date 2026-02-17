import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { MutasiListItem, PaginatedResponse } from "../lib/types";

export function MutasiPage() {
  const [rows, setRows] = useState<MutasiListItem[]>([]);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<MutasiListItem>["meta"]>({
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
        const payload = await apiClient.getMutasi({ page, limit: meta.limit });
        if (!cancelled) {
          setRows(payload.data);
          setMeta(payload.meta);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRows([]);
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat data mutasi");
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
        <h1>Mutasi</h1>
        <p>Data mutasi dari API Express lokal.</p>
      </div>

      {isLoading ? <p>Memuat data mutasi...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Penduduk</th>
              <th>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.tanggalMutasi.slice(0, 10)}</td>
                <td>{item.jenisMutasi}</td>
                <td>
                  {item.penduduk.nama} ({item.penduduk.nik})
                </td>
                <td>{item.keterangan ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Tidak ada data.</td>
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
