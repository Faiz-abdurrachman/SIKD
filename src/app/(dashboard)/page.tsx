import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { dashboardService } from "@/services/dashboard.service";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "dashboard", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat dashboard.</AlertDescription>
      </Alert>
    );
  }

  const namaUser = session?.user?.nama ?? session?.user?.name ?? "Pengguna";
  let initialData = null;

  try {
    initialData = await dashboardService.getOverview(5);
  } catch (error) {
    console.error("[DashboardPage.initialData]", error);
  }

  return <DashboardOverview initialData={initialData} namaUser={namaUser} />;
}
