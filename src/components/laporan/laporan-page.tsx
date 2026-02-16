"use client";

import { Download, FileSpreadsheet, Filter } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatTanggalIndonesia } from "@/lib/format";
import type { LaporanSummary, LaporanSummaryResponse } from "@/types/laporan.types";

type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

function defaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

function downloadFile(content: string, fileName: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: string[][]) {
  return rows
    .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
    .join("\n");
}

export function LaporanPage() {
  const [activeTab, setActiveTab] = useState("penduduk");
  const [period, setPeriod] = useState(defaultPeriod());
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<LaporanSummary | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        fromDate: period.fromDate,
        toDate: period.toDate,
      });

      const response = await fetch(`/api/v1/laporan/summary?${params.toString()}`, {
        cache: "no-store",
      });

      const payload = (await response.json()) as LaporanSummaryResponse | ErrorResponse;

      if (!response.ok || !payload.success) {
        const message = payload.success ? "Gagal memuat laporan" : (payload.error?.message ?? "Gagal memuat laporan");
        throw new Error(message);
      }

      setSummary(payload.data);
    } catch (error) {
      console.error("[LaporanPage.loadSummary]", error);
      toast.error(error instanceof Error ? error.message : "Gagal memuat laporan");
      setSummary(null);
    } finally {
      setIsLoading(false);
    }
  }, [period.fromDate, period.toDate]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const periodeLabel = useMemo(() => {
    if (!summary) {
      return "-";
    }

    return `${formatTanggalIndonesia(summary.periode.fromDate)} s/d ${formatTanggalIndonesia(summary.periode.toDate)}`;
  }, [summary]);

  const exportJson = () => {
    if (!summary) {
      return;
    }

    downloadFile(JSON.stringify(summary, null, 2), `laporan-${activeTab}.json`, "application/json");
  };

  const exportCsv = () => {
    if (!summary) {
      return;
    }

    let rows: string[][] = [["Kategori", "Label", "Nilai"]];

    if (activeTab === "penduduk") {
      rows = rows.concat(summary.penduduk.byGender.map((item) => ["Gender", item.label, String(item.value)]));
      rows = rows.concat(summary.penduduk.byAgama.map((item) => ["Agama", item.label, String(item.value)]));
      rows = rows.concat(summary.penduduk.byPendidikan.map((item) => ["Pendidikan", item.label, String(item.value)]));
      rows = rows.concat(summary.penduduk.byDusun.map((item) => ["Dusun", item.label, String(item.value)]));
    } else if (activeTab === "mutasi") {
      rows = rows.concat(summary.mutasi.byJenis.map((item) => ["Jenis Mutasi", item.label, String(item.value)]));
      rows = rows.concat(summary.mutasi.byBulan.map((item) => ["Bulan", item.label, String(item.value)]));
    } else if (activeTab === "surat") {
      rows = rows.concat(summary.surat.byJenis.map((item) => ["Jenis Surat", item.label, String(item.value)]));
      rows = rows.concat(summary.surat.byStatus.map((item) => ["Status", item.label, String(item.value)]));
    } else {
      rows = rows.concat(summary.piramida.map((item) => ["Umur", item.label, String(item.lakiLaki + item.perempuan)]));
    }

    downloadFile(toCsv(rows), `laporan-${activeTab}.csv`, "text/csv;charset=utf-8");
  };

  return (
    <div className="space-y-6">
      <PageHeader description="Rekap dan analisis data kependudukan, mutasi, dan surat." title="Laporan & Statistik">
        <Button onClick={exportJson} type="button" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export JSON
        </Button>
        <Button onClick={exportCsv} type="button">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filter Periode</CardTitle>
          <CardDescription>{periodeLabel}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="space-y-2">
            <Label>Dari</Label>
            <Input
              onChange={(event) => setPeriod((prev) => ({ ...prev, fromDate: event.target.value }))}
              type="date"
              value={period.fromDate}
            />
          </div>
          <div className="space-y-2">
            <Label>Sampai</Label>
            <Input
              onChange={(event) => setPeriod((prev) => ({ ...prev, toDate: event.target.value }))}
              type="date"
              value={period.toDate}
            />
          </div>
          <Button onClick={() => void loadSummary()} type="button">
            <Filter className="mr-2 h-4 w-4" />
            Terapkan
          </Button>
        </CardContent>
      </Card>

      {isLoading ? <p className="text-sm text-slate-600">Memuat data laporan...</p> : null}

      {summary ? (
        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList>
            <TabsTrigger value="penduduk">Penduduk</TabsTrigger>
            <TabsTrigger value="mutasi">Mutasi</TabsTrigger>
            <TabsTrigger value="surat">Surat</TabsTrigger>
            <TabsTrigger value="piramida">Piramida</TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-4" value="penduduk">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Komposisi Agama</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie data={summary.penduduk.byAgama} dataKey="value" nameKey="label" outerRadius={110} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pendidikan</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={summary.penduduk.byPendidikan} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="label" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1d4ed8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rekap Penduduk Per Dusun</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {summary.penduduk.byDusun.map((item) => (
                    <div className="flex items-center justify-between rounded-md border px-3 py-2" key={item.label}>
                      <p className="text-sm text-slate-700">{item.label}</p>
                      <p className="font-medium text-slate-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-4" value="mutasi">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Mutasi per Jenis</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={summary.mutasi.byJenis}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0ea5e9" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mutasi per Bulan</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={summary.mutasi.byBulan}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="surat">
            <div className="grid gap-4 xl:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Surat per Jenis</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart data={summary.surat.byJenis} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="label" type="category" width={120} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status Surat</CardTitle>
                </CardHeader>
                <CardContent className="h-[320px]">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie data={summary.surat.byStatus} dataKey="value" nameKey="label" outerRadius={110} />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent className="space-y-4" value="piramida">
            <Card>
              <CardHeader>
                <CardTitle>Piramida Penduduk</CardTitle>
                <CardDescription>Laki-laki tampil di sisi kiri (nilai negatif), perempuan di kanan.</CardDescription>
              </CardHeader>
              <CardContent className="h-[420px]">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={summary.piramida} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="label" type="category" width={70} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="lakiLakiNegatif" fill="#1d4ed8" name="Laki-laki" />
                    <Bar dataKey="perempuan" fill="#ec4899" name="Perempuan" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-slate-600">Data laporan belum tersedia.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
