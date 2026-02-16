"use client";

import type { ColumnDef } from "@tanstack/react-table";
import {
  KeyRound,
  Pencil,
  ShieldCheck,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROLE_LABEL } from "@/lib/constants";
import { formatTanggalIndonesia } from "@/lib/format";
import type { UserListItem, UserListResponse } from "@/types/user.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type UserFormState = {
  username: string;
  nama: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";
  isActive: boolean;
};

const EMPTY_FORM: UserFormState = {
  username: "",
  nama: "",
  email: "",
  password: "",
  role: "OPERATOR",
  isActive: true,
};

const LIST_QUERY = "page=1&limit=500&sortBy=createdAt&sortOrder=desc";

export function UserTable() {
  const [rows, setRows] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [openCreate, setOpenCreate] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openReset, setOpenReset] = useState(false);

  const [createForm, setCreateForm] = useState<UserFormState>(EMPTY_FORM);
  const [editForm, setEditForm] = useState<UserFormState>(EMPTY_FORM);

  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<UserListItem | null>(null);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch(`/api/v1/users?${LIST_QUERY}`, {
        cache: "no-store",
      });

      const result = (await response.json()) as UserListResponse | ErrorResponse;

      if (!response.ok || !result.success) {
        const message = result.success ? "Gagal memuat data user" : (result.error?.message ?? "Gagal memuat data user");
        throw new Error(message);
      }

      setRows(result.data);
    } catch (error) {
      console.error("[UserTable.loadUsers]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat data user");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((item) => item.isActive).length,
      inactive: rows.filter((item) => !item.isActive).length,
      superAdmin: rows.filter((item) => item.role === "SUPER_ADMIN").length,
    }),
    [rows],
  );

  const columns = useMemo<ColumnDef<UserListItem>[]>(
    () => [
      {
        id: "username",
        header: "Username",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-900">{row.original.username}</p>
            <p className="text-xs text-slate-500">{row.original.email ?? "-"}</p>
          </div>
        ),
      },
      {
        accessorKey: "nama",
        header: "Nama",
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => <Badge variant="secondary">{ROLE_LABEL[row.original.role]}</Badge>,
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge className={row.original.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
            {row.original.isActive ? "Aktif" : "Nonaktif"}
          </Badge>
        ),
      },
      {
        id: "lastLoginAt",
        header: "Login Terakhir",
        cell: ({ row }) =>
          row.original.lastLoginAt ? formatTanggalIndonesia(row.original.lastLoginAt) : "Belum pernah",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Aksi</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              onClick={() => {
                const user = row.original;
                setSelectedUser(user);
                setEditForm({
                  username: user.username,
                  nama: user.nama,
                  email: user.email ?? "",
                  password: "",
                  role: user.role,
                  isActive: user.isActive,
                });
                setOpenEdit(true);
              }}
              size="icon"
              type="button"
              variant="outline"
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <Button
              onClick={() => {
                setSelectedUser(row.original);
                setResetPassword("");
                setOpenReset(true);
              }}
              size="icon"
              type="button"
              variant="outline"
            >
              <KeyRound className="h-4 w-4" />
            </Button>

            <Button
              className={row.original.isActive ? "text-red-600 hover:text-red-700" : "text-emerald-700 hover:text-emerald-800"}
              onClick={() => setToggleTarget(row.original)}
              size="icon"
              type="button"
              variant="outline"
            >
              {row.original.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

  const handleCreate = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createForm),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal menambah user" : (payload.error?.message ?? "Gagal menambah user"));
      }

      toast.success("Pengguna berhasil ditambahkan");
      setOpenCreate(false);
      setCreateForm(EMPTY_FORM);
      await loadUsers();
    } catch (error) {
      console.error("[UserTable.handleCreate]", error);
      toast.error(error instanceof Error ? error.message : "Gagal menambah user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedUser) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: editForm.username,
          nama: editForm.nama,
          email: editForm.email,
          role: editForm.role,
          isActive: editForm.isActive,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal mengubah user" : (payload.error?.message ?? "Gagal mengubah user"));
      }

      toast.success("Pengguna berhasil diperbarui");
      setOpenEdit(false);
      setSelectedUser(null);
      await loadUsers();
    } catch (error) {
      console.error("[UserTable.handleEdit]", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengubah user");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!selectedUser) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/v1/users/${selectedUser.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: resetPassword,
        }),
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal reset password" : (payload.error?.message ?? "Gagal reset password"));
      }

      toast.success("Password pengguna berhasil direset");
      setOpenReset(false);
      setSelectedUser(null);
      setResetPassword("");
    } catch (error) {
      console.error("[UserTable.handleResetPassword]", error);
      toast.error(error instanceof Error ? error.message : "Gagal reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async () => {
    if (!toggleTarget) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/users/${toggleTarget.id}/toggle`, {
        method: "PATCH",
      });

      const payload = (await response.json()) as
        | {
            success: true;
          }
        | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal mengubah status user" : (payload.error?.message ?? "Gagal mengubah status user"));
      }

      toast.success(`User ${toggleTarget.username} berhasil ${toggleTarget.isActive ? "dinonaktifkan" : "diaktifkan"}`);
      await loadUsers();
    } catch (error) {
      console.error("[UserTable.handleToggleActive]", error);
      toast.error(error instanceof Error ? error.message : "Gagal mengubah status user");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader description="Kelola akun pengguna dan hak akses sistem SIDESA." title="Manajemen Pengguna">
        <Button
          onClick={() => {
            setCreateForm(EMPTY_FORM);
            setOpenCreate(true);
          }}
          type="button"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah User
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Total akun terdaftar" icon={Users} title="Total User" value={stats.total} />
        <StatCard description="Akun aktif" icon={UserCheck} title="Aktif" value={stats.active} />
        <StatCard description="Akun nonaktif" icon={UserX} title="Nonaktif" value={stats.inactive} />
        <StatCard description="Jumlah super admin" icon={ShieldCheck} title="Super Admin" value={stats.superAdmin} />
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        searchKey="username"
        searchPlaceholder="Cari username..."
      />

      <Dialog onOpenChange={setOpenCreate} open={openCreate}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Pengguna</DialogTitle>
            <DialogDescription>Masukkan data user baru untuk akses SIDESA.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              onChange={(event) => setCreateForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="Username"
              value={createForm.username}
            />
            <Input
              onChange={(event) => setCreateForm((prev) => ({ ...prev, nama: event.target.value }))}
              placeholder="Nama lengkap"
              value={createForm.nama}
            />
            <Input
              onChange={(event) => setCreateForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email (opsional)"
              value={createForm.email}
            />
            <Input
              onChange={(event) => setCreateForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="Password"
              type="password"
              value={createForm.password}
            />
            <Select
              onValueChange={(value) => setCreateForm((prev) => ({ ...prev, role: value as UserFormState["role"] }))}
              value={createForm.role}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="KEPALA_DESA">Kepala Desa</SelectItem>
                <SelectItem value="SEKRETARIS">Sekretaris</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenCreate(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleCreate()} type="button">
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setOpenEdit} open={openEdit}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
            <DialogDescription>Perbarui profil dan role pengguna.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <Input
              onChange={(event) => setEditForm((prev) => ({ ...prev, username: event.target.value }))}
              placeholder="Username"
              value={editForm.username}
            />
            <Input
              onChange={(event) => setEditForm((prev) => ({ ...prev, nama: event.target.value }))}
              placeholder="Nama lengkap"
              value={editForm.nama}
            />
            <Input
              onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
              placeholder="Email (opsional)"
              value={editForm.email}
            />
            <Select
              onValueChange={(value) => setEditForm((prev) => ({ ...prev, role: value as UserFormState["role"] }))}
              value={editForm.role}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                <SelectItem value="KEPALA_DESA">Kepala Desa</SelectItem>
                <SelectItem value="SEKRETARIS">Sekretaris</SelectItem>
                <SelectItem value="OPERATOR">Operator</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) =>
                setEditForm((prev) => ({
                  ...prev,
                  isActive: value === "true",
                }))
              }
              value={String(editForm.isActive)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">Aktif</SelectItem>
                <SelectItem value="false">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button onClick={() => setOpenEdit(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleEdit()} type="button">
              {isSubmitting ? "Menyimpan..." : "Update"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog onOpenChange={setOpenReset} open={openReset}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              {selectedUser ? `Set password baru untuk user ${selectedUser.username}.` : "Set password baru."}
            </DialogDescription>
          </DialogHeader>

          <Input
            onChange={(event) => setResetPassword(event.target.value)}
            placeholder="Password baru"
            type="password"
            value={resetPassword}
          />

          <DialogFooter>
            <Button onClick={() => setOpenReset(false)} type="button" variant="outline">
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={() => void handleResetPassword()} type="button">
              {isSubmitting ? "Menyimpan..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        description={
          toggleTarget
            ? `User ${toggleTarget.username} akan ${toggleTarget.isActive ? "dinonaktifkan" : "diaktifkan"}.`
            : ""
        }
        onConfirm={handleToggleActive}
        onOpenChange={(open) => {
          if (!open) {
            setToggleTarget(null);
          }
        }}
        open={Boolean(toggleTarget)}
        title={toggleTarget?.isActive ? "Nonaktifkan User" : "Aktifkan User"}
        variant={toggleTarget?.isActive ? "danger" : "warning"}
      />
    </div>
  );
}
