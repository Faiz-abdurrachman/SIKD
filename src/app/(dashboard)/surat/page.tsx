import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { SuratPage as SuratPageContent } from "@/components/surat/surat-page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export default async function SuratPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "surat", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat modul surat.</AlertDescription>
      </Alert>
    );
  }

  return (
    <SuratPageContent
      canApprove={canAccess(session.user.role, "surat", "approve")}
      canCreate={canAccess(session.user.role, "surat", "create")}
      canDelete={canAccess(session.user.role, "surat", "delete")}
      canPrint={canAccess(session.user.role, "surat", "print")}
      canUpdate={canAccess(session.user.role, "surat", "update")}
    />
  );
}
