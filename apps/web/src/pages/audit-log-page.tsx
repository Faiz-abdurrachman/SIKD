import { useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { AuditLogItem, PaginatedResponse } from "../lib/types";

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditLogItem[]>([]);
  const [filters, setFilters] = useState({ q: "", entity: "", action: "", fromDate: "", toDate: "" });
  const [draftFilters, setDraftFilters] = useState({ q: "", entity: "", action: "", fromDate: "", toDate: "" });
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<AuditLogItem>["meta"]>({
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
        const payload = await apiClient.getAuditLogs({ ...filters, page, limit: meta.limit });
        if (!cancelled) {
          setRows(payload.data);
          setMeta(payload.meta);
        }
      } catch (loadError) {
        if (!cancelled) {
          setRows([]);
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat audit log");
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
  }, [filters, page, meta.limit]);

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Audit Log</h1>
        <p>Riwayat perubahan data dan aktivitas pengguna.</p>
      </div>

      <div className="toolbar">
        <input
          onChange={(event) => setDraftFilters((prev) => ({ ...prev, q: event.target.value }))}
          placeholder="Cari user/entity/action"
          value={draftFilters.q}
        />
        <input
          onChange={(event) => setDraftFilters((prev) => ({ ...prev, entity: event.target.value }))}
          placeholder="Entity"
          value={draftFilters.entity}
        />
        <input
          onChange={(event) => setDraftFilters((prev) => ({ ...prev, action: event.target.value }))}
          placeholder="Action"
          value={draftFilters.action}
        />
        <label>
          Dari
          <input
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, fromDate: event.target.value }))}
            type="date"
            value={draftFilters.fromDate}
          />
        </label>
        <label>
          Sampai
          <input
            onChange={(event) => setDraftFilters((prev) => ({ ...prev, toDate: event.target.value }))}
            type="date"
            value={draftFilters.toDate}
          />
        </label>
        <button
          onClick={() => {
            setPage(1);
            setFilters(draftFilters);
          }}
          type="button"
        >
          Terapkan
        </button>
        <button
          onClick={() => {
            const cleared = { q: "", entity: "", action: "", fromDate: "", toDate: "" };
            setPage(1);
            setDraftFilters(cleared);
            setFilters(cleared);
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      {isLoading ? <p>Memuat audit log...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Entity ID</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.createdAt.slice(0, 19).replace("T", " ")}</td>
                <td>{item.user ? `${item.user.username} (${item.user.role})` : "-"}</td>
                <td>{item.action}</td>
                <td>{item.entity}</td>
                <td>{item.entityId ?? "-"}</td>
                <td>{item.ipAddress ?? "-"}</td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={6}>Tidak ada audit log.</td>
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
          <button disabled={meta.page >= meta.totalPages} onClick={() => setPage((prev) => prev + 1)} type="button">
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
