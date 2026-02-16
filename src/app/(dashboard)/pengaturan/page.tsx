import { ShieldAlert } from "lucide-react";
import { redirect } from "next/navigation";

import { SettingsPage as SettingsPageContent } from "@/components/pengaturan/settings-page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";

export default async function PengaturanPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "settings", "manage")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk mengelola pengaturan.</AlertDescription>
      </Alert>
    );
  }

  return <SettingsPageContent />;
}
