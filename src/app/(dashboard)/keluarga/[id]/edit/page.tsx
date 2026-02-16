import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { KeluargaForm } from "@/components/keluarga/keluarga-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import {
  isKeluargaServiceError,
  keluargaService,
  listPendudukOptions,
  listRtOptions,
} from "@/services/keluarga.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export default async function EditKeluargaPage({ params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "keluarga", "update")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk mengubah data keluarga.</AlertDescription>
      </Alert>
    );
  }

  const { id } = await params;
  let keluarga: Awaited<ReturnType<typeof keluargaService.getById>>;
  let rtOptions: Awaited<ReturnType<typeof listRtOptions>>;
  let pendudukOptions: Awaited<ReturnType<typeof listPendudukOptions>>;

  try {
    [keluarga, rtOptions, pendudukOptions] = await Promise.all([
      keluargaService.getById(id),
      listRtOptions(),
      listPendudukOptions(),
    ]);
  } catch (error) {
    if (isKeluargaServiceError(error) && error.code === ERROR_CODES.NOT_FOUND) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader description={`Perbarui data KK ${keluarga.noKK}.`} title="Edit Kartu Keluarga">
        <Button asChild variant="outline">
          <Link href={`/keluarga/${keluarga.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <KeluargaForm
        defaultValues={{
          noKK: keluarga.noKK,
          alamat: keluarga.alamat,
          rtId: keluarga.rtId,
          kepalaKeluargaId: keluarga.kepalaKeluargaId ?? "",
        }}
        keluargaId={keluarga.id}
        mode="edit"
        pendudukOptions={pendudukOptions}
        rtOptions={rtOptions}
      />
    </div>
  );
}
