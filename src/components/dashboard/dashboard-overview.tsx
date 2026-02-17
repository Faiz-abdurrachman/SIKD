"use client";

import { FileText, Home, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";

import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";
import type {
  DashboardDemografi,
  DashboardOverviewData,
  DashboardRecentMutasi,
  DashboardRecentSurat,
  DashboardStats,
} from "@/types/dashboard.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

const DEFAULT_STATS: DashboardStats = {
  totalPenduduk: 0,
  totalKeluarga: 0,
  suratBulanIni: 0,
  mutasiBulanIni: 0,
};

const DEFAULT_DEMOGRAFI: DashboardDemografi = {
  agama: [],
  pendidikan: [],
  gender: [],
  umur: [],
};

const COLORS = ["#1d4ed8", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#14b8a6"];

type DashboardOverviewProps = {
  namaUser: string;
  initialData?: DashboardOverviewData | null;
};

export function DashboardOverview({ namaUser, initialData }: DashboardOverviewProps) {
  const [stats, setStats] = useState<DashboardStats>(() => initialData?.stats ?? DEFAULT_STATS);
  const [demografi, setDemografi] = useState<DashboardDemografi>(() => initialData?.demografi ?? DEFAULT_DEMOGRAFI);
  const [recentMutasi, setRecentMutasi] = useState<DashboardRecentMutasi>(() => initialData?.recentMutasi ?? []);
  const [recentSurat, setRecentSurat] = useState<DashboardRecentSurat>(() => initialData?.recentSurat ?? []);
  const [isLoading, setIsLoading] = useState(!initialData);
  const shouldSkipInitialLoadRef = useRef(Boolean(initialData));

  const loadData = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/dashboard/overview?limit=5", { cache: "no-store" });
      const payload = (await response.json()) as { success: true; data: DashboardOverviewData } | ErrorResponse;

      if (!response.ok || !payload.success) {
        throw new Error(payload.success ? "Gagal memuat data dashboard" : (payload.error?.message ?? "Gagal memuat data dashboard"));
      }

      setStats(payload.data.stats);
      setDemografi(payload.data.demografi);
      setRecentMutasi(payload.data.recentMutasi);
      setRecentSurat(payload.data.recentSurat);
    } catch (error) {
      console.error("[DashboardOverview.loadData]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat dashboard");
      setStats(DEFAULT_STATS);
      setDemografi(DEFAULT_DEMOGRAFI);
      setRecentMutasi([]);
      setRecentSurat([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (shouldSkipInitialLoadRef.current) {
      shouldSkipInitialLoadRef.current = false;
      return;
    }

    void loadData();
  }, [loadData]);

  const genderChart = useMemo(() => demografi.gender.map((item) => ({ name: item.label, value: item.value })), [demografi.gender]);

  return (
    <div className="space-y-6">
      <PageHeader description={`Selamat datang kembali, ${namaUser}.`} title="Dashboard SIDESA" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard description="Jumlah penduduk saat ini" icon={Users} title="Total Penduduk" value={stats.totalPenduduk} />
        <StatCard description="Jumlah keluarga/KK" icon={Home} title="Total KK" value={stats.totalKeluarga} />
        <StatCard description="Surat yang terbit bulan ini" icon={FileText} title="Surat Bulan Ini" value={stats.suratBulanIni} />
        <StatCard description="Mutasi tercatat bulan ini" icon={RefreshCw} title="Mutasi Bulan Ini" value={stats.mutasiBulanIni} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Komposisi Agama</CardTitle>
            <CardDescription>Distribusi penduduk berdasarkan agama</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat grafik...</p>
            ) : demografi.agama.length ? (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={demografi.agama} dataKey="value" nameKey="label" outerRadius={110}>
                    {demografi.agama.map((item, index) => (
                      <Cell fill={COLORS[index % COLORS.length]} key={item.label} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kelompok Umur</CardTitle>
            <CardDescription>Persebaran penduduk per rentang umur</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat grafik...</p>
            ) : demografi.umur.length ? (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={demografi.umur}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="lakiLaki" fill="#1d4ed8" name="Laki-laki" />
                  <Bar dataKey="perempuan" fill="#ec4899" name="Perempuan" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pendidikan Terakhir</CardTitle>
            <CardDescription>Distribusi tingkat pendidikan penduduk</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat grafik...</p>
            ) : demografi.pendidikan.length ? (
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={demografi.pendidikan} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="label" type="category" width={120} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0ea5e9" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rasio Gender</CardTitle>
            <CardDescription>Perbandingan jumlah laki-laki dan perempuan</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {isLoading ? (
              <p className="text-sm text-slate-500">Memuat grafik...</p>
            ) : genderChart.length ? (
              <ResponsiveContainer height="100%" width="100%">
                <PieChart>
                  <Pie data={genderChart} dataKey="value" innerRadius={70} nameKey="name" outerRadius={110}>
                    <Cell fill="#1d4ed8" key="laki-laki" />
                    <Cell fill="#ec4899" key="perempuan" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">Belum ada data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mutasi Terbaru</CardTitle>
            <CardDescription>5 mutasi terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMutasi.length ? (
                recentMutasi.map((item) => (
                  <div className="rounded-md border p-3" key={item.id}>
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-slate-900">{item.penduduk.nama}</p>
                      <Badge variant="secondary">{formatEnumLabel(item.jenisMutasi)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.penduduk.nik}</p>
                    <p className="mt-1 text-xs text-slate-600">{formatTanggalIndonesia(item.tanggalMutasi)}</p>
                    <p className="mt-1 text-sm text-slate-700">{item.keterangan ?? "-"}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada data mutasi terbaru.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Surat Terbaru</CardTitle>
            <CardDescription>5 surat terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSurat.length ? (
                recentSurat.map((item) => (
                  <div className="rounded-md border p-3" key={item.id}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-slate-900">{item.nomorSurat}</p>
                      <StatusBadge status={item.status} type="surat" />
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{formatEnumLabel(item.jenisSurat)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatTanggalIndonesia(item.tanggalSurat)}</p>
                    <p className="mt-1 text-xs text-slate-600">Pembuat: {item.createdBy.nama}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500">Belum ada data surat terbaru.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
