import { ShieldAlert } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { KeluargaDetail } from "@/components/keluarga/keluarga-detail";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isKeluargaServiceError, keluargaService } from "@/services/keluarga.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export default async function DetailKeluargaPage({ params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "keluarga", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat detail keluarga.</AlertDescription>
      </Alert>
    );
  }

  const { id } = await params;
  let keluarga: Awaited<ReturnType<typeof keluargaService.getById>>;

  try {
    keluarga = await keluargaService.getById(id);
  } catch (error) {
    if (isKeluargaServiceError(error) && error.code === ERROR_CODES.NOT_FOUND) {
      notFound();
    }

    throw error;
  }

  return <KeluargaDetail canUpdate={canAccess(session.user.role, "keluarga", "update")} keluarga={keluarga} />;
}
