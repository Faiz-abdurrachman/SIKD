import { format } from "date-fns";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PendudukForm } from "@/components/penduduk/penduduk-form";
import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { ERROR_CODES } from "@/lib/constants";
import { canAccess } from "@/lib/rbac";
import { listKeluargaOptions } from "@/services/keluarga.service";
import { isPendudukServiceError, pendudukService } from "@/services/penduduk.service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function toDateInput(value: Date | string) {
  const parsedDate = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return format(parsedDate, "yyyy-MM-dd");
}

export default async function EditPendudukPage({ params }: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  if (!canAccess(session.user.role, "penduduk", "update")) {
    return (
      <Alert className="border-red-200 bg-red-50 text-red-800">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Akses ditolak</AlertTitle>
        <AlertDescription>Kamu tidak punya izin untuk mengubah data penduduk.</AlertDescription>
      </Alert>
    );
  }

  const { id } = await params;
  let penduduk: Awaited<ReturnType<typeof pendudukService.getById>>;
  let keluargaOptions: Awaited<ReturnType<typeof listKeluargaOptions>>;

  try {
    [penduduk, keluargaOptions] = await Promise.all([
      pendudukService.getById(id),
      listKeluargaOptions(),
    ]);
  } catch (error) {
    if (isPendudukServiceError(error) && error.code === ERROR_CODES.NOT_FOUND) {
      notFound();
    }

    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        description={`Perbarui data penduduk untuk ${penduduk.nama}.`}
        title="Edit Penduduk"
      >
        <Button asChild variant="outline">
          <Link href={`/penduduk/${penduduk.id}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>
      </PageHeader>

      <PendudukForm
        defaultValues={{
          nik: penduduk.nik,
          nama: penduduk.nama,
          tempatLahir: penduduk.tempatLahir,
          tanggalLahir: toDateInput(penduduk.tanggalLahir),
          jenisKelamin: penduduk.jenisKelamin,
          agama: penduduk.agama,
          statusPerkawinan: penduduk.statusPerkawinan,
          pendidikanTerakhir: penduduk.pendidikanTerakhir,
          pekerjaan: penduduk.pekerjaan,
          golonganDarah: penduduk.golonganDarah ?? undefined,
          statusHubungan: penduduk.statusHubungan,
          namaAyah: penduduk.namaAyah ?? "",
          namaIbu: penduduk.namaIbu ?? "",
          kewarganegaraan: penduduk.kewarganegaraan,
          telepon: penduduk.telepon ?? "",
          keluargaId: penduduk.keluargaId,
          catatan: penduduk.catatan ?? "",
        }}
        keluargaOptions={keluargaOptions}
        mode="edit"
        pendudukId={penduduk.id}
      />
    </div>
  );
}
