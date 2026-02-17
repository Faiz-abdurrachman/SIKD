"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Activity, Filter, User } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable } from "@/components/shared/data-table";
import { FilterActions, FilterPanel, FilterToggleButton } from "@/components/shared/filter-panel";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import { fetchPaginatedPage } from "@/lib/paginated-client-fetch";
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 1,
  });

  const loadLogs = useCallback(async () => {
    setIsLoading(true);

    try {
      const result = await fetchPaginatedPage<AuditListItem>({
        endpoint: "/api/v1/audit-logs",
        sortBy: "createdAt",
        sortOrder: "desc",
        errorMessage: "Gagal memuat audit log",
        page: pagination.page,
        limit: pagination.pageSize,
        query: {
          q: appliedFilter.q,
          entity: appliedFilter.entity !== "all" ? appliedFilter.entity : undefined,
          action: appliedFilter.action !== "all" ? appliedFilter.action : undefined,
          fromDate: appliedFilter.fromDate,
          toDate: appliedFilter.toDate,
        },
      });
      setRows(result.data);
      setPagination((previous) => ({
        ...previous,
        page: result.meta.page,
        pageSize: result.meta.limit,
        total: result.meta.total,
        totalPages: result.meta.totalPages,
      }));
    } catch (error) {
      console.error("[AuditLogPage.loadLogs]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat audit log");
      setRows([]);
    } finally {
      setIsLoading(false);
    }
  }, [appliedFilter, pagination.page, pagination.pageSize]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const stats = useMemo(
    () => ({
      total: pagination.total,
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
    [pagination.total, rows],
  );

  const entityOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.entity))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const actionOptions = useMemo(() => {
    return Array.from(new Set(rows.map((item) => item.action))).sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const activeFilterCount = useMemo(() => {
    const candidates = [
      appliedFilter.q.trim(),
      appliedFilter.entity !== "all" ? appliedFilter.entity : "",
      appliedFilter.action !== "all" ? appliedFilter.action : "",
      appliedFilter.fromDate.trim(),
      appliedFilter.toDate.trim(),
    ];

    return candidates.filter((value) => value.length > 0).length;
  }, [appliedFilter]);

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

  const handleServerPageChange = useCallback((page: number) => {
    setPagination((previous) => ({
      ...previous,
      page,
    }));
  }, []);

  const handleServerPageSizeChange = useCallback((pageSize: number) => {
    setPagination((previous) => ({
      ...previous,
      page: 1,
      pageSize,
    }));
  }, []);

  const handleToggleFilter = useCallback(() => {
    setIsFilterOpen((previous) => !previous);
  }, []);

  return (
    <div className="dashboard-layout">
      <PageHeader description="Jejak aktivitas sistem untuk pemantauan dan audit keamanan." title="Audit Log">
        <FilterToggleButton
          activeCount={activeFilterCount}
          isOpen={isFilterOpen}
          onToggle={handleToggleFilter}
        />
      </PageHeader>

      <div className="kpi-grid">
        <StatCard description="Total aktivitas" icon={Activity} title="Total Log" value={stats.total} />
        <StatCard description="User terlibat di halaman aktif" icon={User} title="User Aktif (Halaman)" value={stats.uniqueUser} />
        <StatCard description="Jenis entity di halaman aktif" icon={Filter} title="Entity (Halaman)" value={stats.uniqueEntity} />
        <StatCard description="Aktivitas hari ini di halaman aktif" icon={Activity} title="Hari Ini (Halaman)" value={stats.today} />
      </div>

      <FilterPanel
        isOpen={isFilterOpen}
        contentClassName="space-y-4"
        title="Filter Audit Log"
      >
        <div className="form-grid md:grid-cols-2 xl:grid-cols-5">
          <div className="field-stack">
            <Label>Kata Kunci</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, q: event.target.value }))}
              placeholder="Cari action/entity/user"
              value={draftFilter.q}
            />
          </div>

          <div className="field-stack">
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

          <div className="field-stack">
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

          <div className="field-stack">
            <Label>Dari Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, fromDate: event.target.value }))}
              type="date"
              value={draftFilter.fromDate}
            />
          </div>

          <div className="field-stack">
            <Label>Sampai Tanggal</Label>
            <Input
              onChange={(event) => setDraftFilter((prev) => ({ ...prev, toDate: event.target.value }))}
              type="date"
              value={draftFilter.toDate}
            />
          </div>
        </div>

        <FilterActions
          applyLabel="Terapkan"
          onApply={() => {
            setAppliedFilter({ ...draftFilter });
            setIsFilterOpen(false);
            setPagination((previous) => ({
              ...previous,
              page: 1,
            }));
          }}
          onReset={() => {
            setDraftFilter({ ...EMPTY_FILTER });
            setAppliedFilter({ ...EMPTY_FILTER });
            setIsFilterOpen(false);
            setPagination((previous) => ({
              ...previous,
              page: 1,
            }));
          }}
        />
      </FilterPanel>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        onServerPageChange={handleServerPageChange}
        onServerPageSizeChange={handleServerPageSizeChange}
        serverPagination={pagination}
      />
    </div>
  );
}
