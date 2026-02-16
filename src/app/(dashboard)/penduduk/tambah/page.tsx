import { ArrowLeft, ShieldAlert, Users } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PendudukForm } from "@/components/penduduk/penduduk-form";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { canAccess } from "@/lib/rbac";
import { listKeluargaOptions } from "@/services/keluarga.service";

export default async function TambahPendudukPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "penduduk", "create")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk menambah data penduduk.</AlertDescription>
      </Alert>
    );
  }

  const keluargaOptions = await listKeluargaOptions();

  return (
    <div className="space-y-6">
      <PageHeader
        description="Isi data penduduk baru secara lengkap sesuai dokumen resmi."
        title="Tambah Penduduk"
      >
        <Button asChild variant="outline">
          <Link href="/penduduk">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      {keluargaOptions.length ? (
        <PendudukForm keluargaOptions={keluargaOptions} mode="create" />
      ) : (
        <EmptyState
          action={
            <Button asChild>
              <Link href="/keluarga">Buka Modul Keluarga</Link>
            </Button>
          }
          description="Data keluarga belum tersedia. Tambahkan data keluarga terlebih dahulu sebelum menambah penduduk."
          icon={Users}
          title="Belum Ada Data Keluarga"
        />
      )}
    </div>
  );
}
