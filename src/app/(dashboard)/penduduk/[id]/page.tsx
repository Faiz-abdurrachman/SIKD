import { ShieldAlert } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { PendudukDetail } from "@/components/penduduk/penduduk-detail";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { isPendudukServiceError, pendudukService } from "@/services/penduduk.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export default async function DetailPendudukPage({ params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "penduduk", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat detail penduduk.</AlertDescription>
      </Alert>
    );
  }

  const { id } = await params;
  let penduduk: Awaited<ReturnType<typeof pendudukService.getById>>;

  try {
    penduduk = await pendudukService.getById(id);
  } catch (error) {
    if (isPendudukServiceError(error) && error.code === ERROR_CODES.NOT_FOUND) {
      notFound();
    }

    throw error;
  }

  return (
    <PendudukDetail
      canUpdate={canAccess(session.user.role, "penduduk", "update")}
      penduduk={penduduk}
    />
  );
}
