import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { KeluargaTable } from "@/components/keluarga/keluarga-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { keluargaService } from "@/services/keluarga.service";

export default async function KeluargaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "keluarga", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat modul keluarga.</AlertDescription>
      </Alert>
    );
  }

  let initialData = null;

  try {
    const result = await keluargaService.list({
      page: 1,
      limit: 20,
      sortBy: "noKK",
      sortOrder: "asc",
    });

    initialData = {
      rows: result.data,
      pagination: {
        page: result.page,
        pageSize: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  } catch (error) {
    console.error("[KeluargaPage.initialData]", error);
  }

  return (
    <KeluargaTable
      canCreate={canAccess(session.user.role, "keluarga", "create")}
      canDelete={canAccess(session.user.role, "keluarga", "delete")}
      initialData={initialData}
      canUpdate={canAccess(session.user.role, "keluarga", "update")}
    />
  );
}
