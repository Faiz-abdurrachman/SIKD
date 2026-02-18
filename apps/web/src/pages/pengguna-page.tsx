import { FormEvent, useCallback, useEffect, useState } from "react";

import { apiClient } from "../lib/api";
import type { PaginatedResponse, UserListItem, UserRole } from "../lib/types";

const ROLE_OPTIONS: UserRole[] = ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"];

const DEFAULT_CREATE_FORM = {
  username: "",
  nama: "",
  email: "",
  password: "",
  role: "OPERATOR" as UserRole,
  isActive: true,
};

export function PenggunaPage() {
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [q, setQ] = useState("");
  const [draftQ, setDraftQ] = useState("");
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginatedResponse<UserListItem>["meta"]>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await apiClient.getUsers({ q, page, limit: meta.limit });
      setRows(payload.data);
      setMeta(payload.meta);
    } catch (loadError) {
      setRows([]);
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat data pengguna");
    } finally {
      setIsLoading(false);
    }
  }, [q, page, meta.limit]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setIsSubmitting(true);

    try {
      await apiClient.createUser({
        username: createForm.username,
        nama: createForm.nama,
        email: createForm.email,
        password: createForm.password,
        role: createForm.role,
        isActive: createForm.isActive,
      });
      setNotice("Pengguna baru berhasil dibuat.");
      setCreateForm(DEFAULT_CREATE_FORM);
      setPage(1);
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Gagal membuat pengguna");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(item: UserListItem) {
    setError(null);
    setNotice(null);

    try {
      await apiClient.toggleUser(item.id);
      setNotice(`Status pengguna ${item.username} berhasil diubah.`);
      await load();
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : "Gagal mengubah status pengguna");
    }
  }

  async function handleResetPassword(item: UserListItem) {
    const newPassword = window.prompt(`Password baru untuk ${item.username}:`);

    if (!newPassword) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await apiClient.resetUserPassword(item.id, newPassword);
      setNotice(`Password ${item.username} berhasil di-reset.`);
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : "Gagal reset password pengguna");
    }
  }

  return (
    <section className="page-section">
      <div className="section-header">
        <h1>Pengguna</h1>
        <p>Manajemen user aplikasi lokal.</p>
      </div>

      <form className="panel-card form-grid" onSubmit={handleCreate}>
        <h3>Tambah Pengguna</h3>
        <input
          onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
          placeholder="Username"
          required
          value={createForm.username}
        />
        <input
          onChange={(event) => setCreateForm((prev) => ({ ...prev, nama: event.target.value }))}
          placeholder="Nama Lengkap"
          required
          value={createForm.nama}
        />
        <input
          onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
          placeholder="Email (opsional)"
          type="email"
          value={createForm.email}
        />
        <input
          onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
          placeholder="Password"
          required
          type="password"
          value={createForm.password}
        />

        <label>
          Role
          <select
            onChange={(event) => setCreateForm((prev) => ({ ...prev, role: event.target.value as UserRole }))}
            value={createForm.role}
          >
            {ROLE_OPTIONS.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </label>

        <label className="checkbox-row">
          <input
            checked={createForm.isActive}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, isActive: event.target.checked }))}
            type="checkbox"
          />
          Aktif
        </label>

        <button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Menyimpan..." : "Tambah Pengguna"}
        </button>
      </form>

      <div className="toolbar">
        <input onChange={(event) => setDraftQ(event.target.value)} placeholder="Cari username/nama/email" value={draftQ} />
        <button
          onClick={() => {
            setPage(1);
            setQ(draftQ.trim());
          }}
          type="button"
        >
          Cari
        </button>
        <button
          onClick={() => {
            setDraftQ("");
            setQ("");
            setPage(1);
          }}
          type="button"
        >
          Reset
        </button>
      </div>

      {isLoading ? <p>Memuat data pengguna...</p> : null}
      {error ? <p className="error-text">{error}</p> : null}
      {notice ? <p className="success-text">{notice}</p> : null}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Username</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Last Login</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => (
              <tr key={item.id}>
                <td>{item.username}</td>
                <td>{item.nama}</td>
                <td>{item.email ?? "-"}</td>
                <td>{item.role}</td>
                <td>{item.isActive ? "Aktif" : "Nonaktif"}</td>
                <td>{item.lastLoginAt ? item.lastLoginAt.slice(0, 19).replace("T", " ") : "-"}</td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => void handleToggle(item)} type="button">
                      Toggle
                    </button>
                    <button onClick={() => void handleResetPassword(item)} type="button">
                      Reset Password
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={7}>Tidak ada data pengguna.</td>
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
