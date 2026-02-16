import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { KeluargaForm } from "@/components/keluarga/keluarga-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { listPendudukOptions, listRtOptions } from "@/services/keluarga.service";

export default async function TambahKeluargaPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "keluarga", "create")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk menambah data keluarga.</AlertDescription>
      </Alert>
    );
  }

  const [rtOptions, pendudukOptions] = await Promise.all([
    listRtOptions(),
    listPendudukOptions(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader description="Isi data Kartu Keluarga (KK) baru dengan lengkap." title="Tambah Kartu Keluarga">
        <Button asChild variant="outline">
          <Link href="/keluarga">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <KeluargaForm mode="create" pendudukOptions={pendudukOptions} rtOptions={rtOptions} />
    </div>
  );
}
