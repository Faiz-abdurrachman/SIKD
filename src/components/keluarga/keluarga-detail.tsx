import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { AnggotaList } from "@/components/keluarga/anggota-list";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTanggalIndonesia } from "@/lib/format";
import type { KeluargaDetailItem } from "@/types/keluarga.types";

type KeluargaDetailProps = {
  keluarga: KeluargaDetailItem;
  canUpdate: boolean;
};

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

export function KeluargaDetail({ keluarga, canUpdate }: KeluargaDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader description={`Nomor KK ${keluarga.noKK}`} title="Detail Kartu Keluarga">
        <Button asChild variant="outline">
          <Link href="/keluarga">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>

        {canUpdate ? (
          <Button asChild>
            <Link href={`/keluarga/${keluarga.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit KK
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">No. KK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-bold text-slate-900">{keluarga.noKK}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Jumlah Anggota</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">{keluarga.jumlahAnggota} orang</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Kepala Keluarga</CardTitle>
          </CardHeader>
          <CardContent>
            {keluarga.kepalaKeluarga ? (
              <div>
                <p className="font-semibold text-slate-900">{keluarga.kepalaKeluarga.nama}</p>
                <p className="text-xs text-slate-500">{keluarga.kepalaKeluarga.nik}</p>
              </div>
            ) : (
              <Badge variant="secondary">Belum ditentukan</Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Wilayah</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-800">Dusun {keluarga.rt.rw.dusun.nama}</p>
            <p className="text-xs text-slate-500">
              RT {keluarga.rt.nomor}/RW {keluarga.rt.rw.nomor}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informasi KK</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="Nomor KK" value={keluarga.noKK} />
          <DetailItem label="Alamat" value={keluarga.alamat} />
          <DetailItem
            label="Wilayah"
            value={`RT ${keluarga.rt.nomor}/RW ${keluarga.rt.rw.nomor}, Dusun ${keluarga.rt.rw.dusun.nama}`}
          />
          <DetailItem label="Dibuat" value={formatTanggalIndonesia(keluarga.createdAt)} />
          <DetailItem label="Terakhir Update" value={formatTanggalIndonesia(keluarga.updatedAt)} />
          <DetailItem label="Total Anggota" value={`${keluarga.jumlahAnggota} orang`} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota KK</CardTitle>
        </CardHeader>
        <CardContent>
          <AnggotaList anggota={keluarga.anggota} canUpdate={canUpdate} keluargaId={keluarga.id} />
        </CardContent>
      </Card>
    </div>
  );
}
