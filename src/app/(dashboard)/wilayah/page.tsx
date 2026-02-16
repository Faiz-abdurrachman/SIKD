import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { WilayahManager } from "@/components/wilayah/wilayah-manager";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export default async function WilayahPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "wilayah", "view")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk melihat modul wilayah.</AlertDescription>
      </Alert>
    );
  }

  return <WilayahManager canManage={canAccess(session.user.role, "wilayah", "manage")} />;
}
