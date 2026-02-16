import { FileText, Home, RefreshCw, Users } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/auth";

const stats = [
  { label: "Total Penduduk", value: "--", icon: Users, color: "text-blue-700" },
  { label: "Total KK", value: "--", icon: Home, color: "text-emerald-700" },
  { label: "Surat Bulan Ini", value: "--", icon: FileText, color: "text-amber-700" },
  { label: "Mutasi Bulan Ini", value: "--", icon: RefreshCw, color: "text-purple-700" },
];

export default async function DashboardPage() {
  const session = await auth();
  const namaUser = session?.user?.nama ?? session?.user?.name ?? "Pengguna";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-600">Selamat datang di SIDESA, {namaUser}!</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;

          return (
            <Card key={item.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">{item.label}</CardTitle>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-slate-900">{item.value}</p>
                <p className="text-xs text-slate-500">Data akan muncul setelah modul statistik aktif.</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
