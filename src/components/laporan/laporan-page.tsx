"use client";

import { FileText, FileSpreadsheet } from "lucide-react";
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
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

import { FilterActions, FilterPanel, FilterToggleButton } from "@/components/shared/filter-panel";
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

type ReportTab = "penduduk" | "mutasi" | "surat" | "piramida";

function defaultPeriod() {
  const now = new Date();
  const from = new Date(now.getFullYear(), 0, 1);

  return {
    fromDate: from.toISOString().slice(0, 10),
    toDate: now.toISOString().slice(0, 10),
  };
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function toHtmlTable(title: string, rows: string[][], periodLabel: string) {
  const safe = (value: string) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");

  const bodyRows = rows
    .map(
      (row) =>
        `<tr><td>${safe(row[0] ?? "")}</td><td>${safe(row[1] ?? "")}</td><td>${safe(row[2] ?? "")}</td></tr>`,
    )
    .join("");

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
      </head>
      <body>
        <h2>${safe(title)}</h2>
        <p>Periode: ${safe(periodLabel)}</p>
        <table border="1" cellspacing="0" cellpadding="4">
          <thead>
            <tr>
              <th>Kategori</th>
              <th>Label</th>
              <th>Nilai</th>
            </tr>
          </thead>
          <tbody>
            ${bodyRows}
          </tbody>
        </table>
      </body>
    </html>
  `;
}

function getReportRows(summary: LaporanSummary, tab: ReportTab) {
  if (tab === "penduduk") {
    return {
      title: "Laporan Penduduk",
      rows: [
        ...summary.penduduk.byGender.map((item) => ["Gender", item.label, String(item.value)]),
        ...summary.penduduk.byAgama.map((item) => ["Agama", item.label, String(item.value)]),
        ...summary.penduduk.byPendidikan.map((item) => ["Pendidikan", item.label, String(item.value)]),
        ...summary.penduduk.byPekerjaan.map((item) => ["Pekerjaan", item.label, String(item.value)]),
        ...summary.penduduk.byDusun.map((item) => ["Dusun", item.label, String(item.value)]),
      ],
    };
  }

  if (tab === "mutasi") {
    return {
      title: "Laporan Mutasi",
      rows: [
        ...summary.mutasi.byJenis.map((item) => ["Jenis Mutasi", item.label, String(item.value)]),
        ...summary.mutasi.byBulan.map((item) => ["Bulan", item.label, String(item.value)]),
      ],
    };
  }

  if (tab === "surat") {
    return {
      title: "Laporan Surat",
      rows: [
        ...summary.surat.byJenis.map((item) => ["Jenis Surat", item.label, String(item.value)]),
        ...summary.surat.byStatus.map((item) => ["Status", item.label, String(item.value)]),
      ],
    };
  }

  return {
    title: "Laporan Piramida Penduduk",
    rows: summary.piramida.map((item) => ["Kelompok Umur", item.label, String(item.lakiLaki + item.perempuan)]),
  };
}

export function LaporanPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("penduduk");
  const [defaultRange] = useState(() => defaultPeriod());
  const [period, setPeriod] = useState(() => ({ ...defaultRange }));
  const [appliedPeriod, setAppliedPeriod] = useState(() => ({ ...defaultRange }));
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<LaporanSummary | null>(null);

  const loadSummary = useCallback(async () => {
    setIsLoading(true);

    try {
      const params = new URLSearchParams({
        fromDate: appliedPeriod.fromDate,
        toDate: appliedPeriod.toDate,
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
  }, [appliedPeriod.fromDate, appliedPeriod.toDate]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  const handleApplyPeriod = useCallback(() => {
    const isSamePeriod =
      appliedPeriod.fromDate === period.fromDate && appliedPeriod.toDate === period.toDate;

    if (isSamePeriod) {
      setIsFilterOpen(false);
      void loadSummary();
      return;
    }

    setAppliedPeriod({ ...period });
    setIsFilterOpen(false);
  }, [appliedPeriod.fromDate, appliedPeriod.toDate, loadSummary, period]);

  const handleResetPeriod = useCallback(() => {
    const nextPeriod = { ...defaultRange };
    const isSamePeriod =
      appliedPeriod.fromDate === nextPeriod.fromDate && appliedPeriod.toDate === nextPeriod.toDate;

    setPeriod(nextPeriod);
    setAppliedPeriod(nextPeriod);
    setIsFilterOpen(false);

    if (isSamePeriod) {
      void loadSummary();
    }
  }, [appliedPeriod.fromDate, appliedPeriod.toDate, defaultRange, loadSummary]);

  const activeFilterCount = useMemo(() => {
    const candidates = [
      appliedPeriod.fromDate !== defaultRange.fromDate ? appliedPeriod.fromDate : "",
      appliedPeriod.toDate !== defaultRange.toDate ? appliedPeriod.toDate : "",
    ];

    return candidates.filter((value) => value.length > 0).length;
  }, [appliedPeriod.fromDate, appliedPeriod.toDate, defaultRange.fromDate, defaultRange.toDate]);

  const periodeLabel = useMemo(() => {
    if (!summary) {
      return "-";
    }

    return `${formatTanggalIndonesia(summary.periode.fromDate)} s/d ${formatTanggalIndonesia(summary.periode.toDate)}`;
  }, [summary]);

  const exportPdf = () => {
    if (!summary) {
      return;
    }

    const report = getReportRows(summary, activeTab);
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    doc.setFontSize(14);
    doc.text(report.title, 14, 16);
    doc.setFontSize(10);
    doc.text(`Periode: ${periodeLabel}`, 14, 22);

    autoTable(doc, {
      startY: 28,
      head: [["Kategori", "Label", "Nilai"]],
      body: report.rows,
      styles: {
        fontSize: 9,
      },
      headStyles: {
        fillColor: [29, 78, 216],
      },
    });

    const blob = doc.output("blob");
    downloadBlob(blob, `laporan-${activeTab}.pdf`);
  };

  const exportExcel = () => {
    if (!summary) {
      return;
    }

    const report = getReportRows(summary, activeTab);
    const html = toHtmlTable(report.title, report.rows, periodeLabel);
    const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
    downloadBlob(blob, `laporan-${activeTab}.xls`);
  };

  return (
    <div className="dashboard-layout">
      <PageHeader description="Rekap dan analisis data kependudukan, mutasi, dan surat." title="Laporan & Statistik">
        <FilterToggleButton
          activeCount={activeFilterCount}
          isOpen={isFilterOpen}
          onToggle={() => setIsFilterOpen((previous) => !previous)}
        />
        <Button onClick={exportPdf} type="button" variant="outline">
          <FileText className="mr-2 h-4 w-4" />
          Export PDF
        </Button>
        <Button onClick={exportExcel} type="button">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </PageHeader>

      <FilterPanel contentClassName="space-y-4" isOpen={isFilterOpen} title="Filter Laporan">
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Periode aktif: {periodeLabel}</p>

          <div className="form-grid md:grid-cols-2 xl:grid-cols-4">
            <div className="field-stack">
              <Label>Dari</Label>
              <Input
                onChange={(event) => setPeriod((prev) => ({ ...prev, fromDate: event.target.value }))}
                type="date"
                value={period.fromDate}
              />
            </div>
            <div className="field-stack">
              <Label>Sampai</Label>
              <Input
                onChange={(event) => setPeriod((prev) => ({ ...prev, toDate: event.target.value }))}
                type="date"
                value={period.toDate}
              />
            </div>
          </div>

          <FilterActions onApply={handleApplyPeriod} onReset={handleResetPeriod} />
        </div>
      </FilterPanel>

      {isLoading ? <p className="text-sm text-slate-600">Memuat data laporan...</p> : null}

      {summary ? (
        <Tabs onValueChange={(value) => setActiveTab(value as ReportTab)} value={activeTab}>
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
