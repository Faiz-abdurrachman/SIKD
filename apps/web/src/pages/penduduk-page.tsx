import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { PaginatedResponse, PendudukListItem } from "../lib/types";

export function PendudukPage() {
  const [rows, setRows] = useState<PendudukListItem[]>([]);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<PendudukListItem>["meta"]>({
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
        const payload = await apiClient.getPenduduk({ q, page, limit: meta.limit });
        if (!cancelled) {
          setRows(payload.data);
          setMeta(payload.meta);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRows([]);
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat data penduduk");
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
  }, [q, page, meta.limit]);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Penduduk</h1>
        <p>Daftar data penduduk dari API Express lokal.</p>
      </div>

      <div className="toolbar">
        <input
          onChange={(event) => setDraftQ(event.target.value)}
          placeholder="Cari nama / NIK"
          value={draftQ}
        />
        <button
          onClick={() => {
            setPage(1);
            setQ(draftQ.trim());
          }}
          type="button"
        >
          Cari
        </button>
      </div>

      {isLoading ? <p>Memuat data penduduk...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>NIK</th>
              <th>Nama</th>
              <th>JK</th>
              <th>Status</th>
              <th>KK</th>
              <th>Wilayah</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.nik}</td>
                <td>{item.nama}</td>
                <td>{item.jenisKelamin}</td>
                <td>{item.statusKependudukan}</td>
                <td>{item.keluarga.noKK}</td>
                <td>
                  RT {item.keluarga.rt.nomor}/RW {item.keluarga.rt.rw.nomor} - {item.keluarga.rt.rw.dusun.nama}
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6}>Tidak ada data.</td>
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
