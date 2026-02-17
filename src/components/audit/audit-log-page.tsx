"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Filter, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import { fetchAllPages } from "@/lib/paginated-client-fetch";
import type { AuditListItem } from "@/types/audit.types";

type AuditFilter = {
  q: string;
  entity: string;
  action: string;
  fromDate: string;
  toDate: string;
};

const EMPTY_FILTER: AuditFilter = {
  q: "",
  entity: "all",
  action: "all",
  fromDate: "",
  toDate: "",
};

export function AuditLogPage() {
  const [rows, setRows] = useState<AuditListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draftFilter, setDraftFilter] = useState<AuditFilter>(EMPTY_FILTER);
  const [appliedFilter, setAppliedFilter] = useState<AuditFilter>(EMPTY_FILTER);

  const loadLogs = useCallback(async () => {
    setIsLoading(true);

    try {
      const data = await fetchAllPages<AuditListItem>({
        endpoint: "/api/v1/audit-logs",
        sortBy: "createdAt",
        sortOrder: "desc",
        errorMessage: "Gagal memuat audit log",
        query: {
          q: appliedFilter.q,
          entity: appliedFilter.entity !== "all" ? appliedFilter.entity : undefined,
          action: appliedFilter.action !== "all" ? appliedFilter.action : undefined,
          fromDate: appliedFilter.fromDate,
          toDate: appliedFilter.toDate,
        },
      });
      setRows(data);
    } catch (error) {
      console.error("[AuditLogPage.loadLogs]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat audit log");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      uniqueUser: new Set(rows.map((item) => item.user.id)).size,
      uniqueEntity: new Set(rows.map((item) => item.entity)).size,
      today: rows.filter((item) => {
        const created = new Date(item.createdAt);
        const now = new Date();

        return (
          created.getDate() === now.getDate() &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }).length,
    }),
    [rows],
  );

  const entityOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.entity))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.action))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const columns = useMemo<ColumnDef<AuditListItem>[]>(
    () => [
      {
        accessorKey: "createdAt",
        header: "Waktu",
        cell: ({ row }) => formatTanggalIndonesia(row.original.createdAt),
      },
      {
        id: "user",
        header: "User",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-slate-800">{row.original.user.nama}</p>
            <p className="text-xs text-slate-500">{row.original.user.username}</p>
          </div>
        ),
      },
      {
        accessorKey: "action",
        header: "Aksi",
        cell: ({ row }) => <Badge variant="secondary">{formatEnumLabel(row.original.action)}</Badge>,
      },
      {
        accessorKey: "entity",
        header: "Entity",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="text-sm text-slate-800">{row.original.entity}</p>
            <p className="text-xs text-slate-500">{row.original.entityId ?? "-"}</p>
          </div>
        ),
      },
      {
        accessorKey: "ipAddress",
        header: "IP Address",
        cell: ({ row }) => row.original.ipAddress ?? "-",
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader description="Jejak aktivitas sistem untuk pemantauan dan audit keamanan." title="Audit Log" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Total aktivitas" icon={Activity} title="Total Log" value={stats.total} />
        <StatCard description="User terlibat" icon={User} title="User Aktif" value={stats.uniqueUser} />
        <StatCard description="Jenis entity tercatat" icon={Filter} title="Entity" value={stats.uniqueEntity} />
        <StatCard description="Aktivitas hari ini" icon={Activity} title="Hari Ini" value={stats.today} />
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari action/entity/user"
              value={draftFilter.q}
            />
          </div>

          <div className="space-y-2">
            <Label>Entity</Label>
            <Select onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, entity: value }))} value={draftFilter.entity}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {entityOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Aksi</Label>
            <Select onValueChange={(value) => setDraftFilter((prev) => ({ ...prev, action: value }))} value={draftFilter.action}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                {actionOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Dari Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, fromDate: event.target.value }))}
              type="date"
              value={draftFilter.fromDate}
            />
          </div>

          <div className="space-y-2">
            <Label>Sampai Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, toDate: event.target.value }))}
              type="date"
              value={draftFilter.toDate}
            />
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Button onClick={() => setAppliedFilter({ ...draftFilter })} type="button">Terapkan Filter</Button>
          <Button
            onClick={() => {
              setDraftFilter({ ...EMPTY_FILTER });
              setAppliedFilter({ ...EMPTY_FILTER });
            }}
            type="button"
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </div>

      <DataTable columns={columns} data={rows} isLoading={isLoading} searchKey="entity" searchPlaceholder="Cari entity..." />
    </div>
  );
}
