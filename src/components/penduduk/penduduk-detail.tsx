import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LABEL_MAP } from "@/lib/constants";
import { formatEnumLabel, formatTanggalIndonesia } from "@/lib/format";

type PendudukDetailData = {
  id: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: Date | string;
  jenisKelamin: keyof typeof LABEL_MAP.jenisKelamin;
  agama: keyof typeof LABEL_MAP.agama;
  statusPerkawinan: keyof typeof LABEL_MAP.statusPerkawinan;
  pendidikanTerakhir: keyof typeof LABEL_MAP.pendidikan;
  pekerjaan: string;
  golonganDarah: string | null;
  statusHubungan: keyof typeof LABEL_MAP.statusHubungan;
  namaAyah: string | null;
  namaIbu: string | null;
  kewarganegaraan: string;
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
  telepon: string | null;
  catatan: string | null;
  alamatLengkap: string;
  keluarga: {
    id: string;
    noKK: string;
    alamat: string;
    rt: {
      nomor: string;
      rw: {
        nomor: string;
        dusun: {
          nama: string;
        };
      };
    };
  };
  suratPenduduk: Array<{
    id: string;
    peran: string;
    surat: {
      id: string;
      nomorSurat: string;
      perihal: string;
      status: string;
      tanggalSurat: Date | string;
    };
  }>;
  mutasiKeluar: Array<{
    id: string;
    jenisMutasi: string;
    tanggalMutasi: Date | string;
    keterangan: string | null;
  }>;
};

type PendudukDetailProps = {
  penduduk: PendudukDetailData;
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

export function PendudukDetail({ penduduk, canUpdate }: PendudukDetailProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        description={`NIK ${penduduk.nik}`}
        title={penduduk.nama}
      >
        <Button asChild variant="outline">
          <Link href="/penduduk">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Kembali
          </Link>
        </Button>

        {canUpdate ? (
          <Button asChild>
            <Link href={`/penduduk/${penduduk.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        ) : null}
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Status Kependudukan</CardTitle>
          </CardHeader>
          <CardContent>
            <StatusBadge status={penduduk.statusKependudukan} type="kependudukan" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Jenis Kelamin</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">{LABEL_MAP.jenisKelamin[penduduk.jenisKelamin]}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">No. KK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-semibold text-slate-900">{penduduk.keluarga.noKK}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-slate-600">Alamat</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="line-clamp-2 text-sm text-slate-700">{penduduk.alamatLengkap}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="NIK" value={penduduk.nik} />
          <DetailItem label="Nama" value={penduduk.nama} />
          <DetailItem label="Tempat Lahir" value={penduduk.tempatLahir} />
          <DetailItem label="Tanggal Lahir" value={formatTanggalIndonesia(penduduk.tanggalLahir)} />
          <DetailItem label="Agama" value={LABEL_MAP.agama[penduduk.agama]} />
          <DetailItem label="Status Perkawinan" value={LABEL_MAP.statusPerkawinan[penduduk.statusPerkawinan]} />
          <DetailItem label="Pendidikan" value={LABEL_MAP.pendidikan[penduduk.pendidikanTerakhir]} />
          <DetailItem label="Pekerjaan" value={penduduk.pekerjaan} />
          <DetailItem label="Golongan Darah" value={penduduk.golonganDarah ?? "-"} />
          <DetailItem label="Status Hubungan" value={LABEL_MAP.statusHubungan[penduduk.statusHubungan]} />
          <DetailItem label="Nama Ayah" value={penduduk.namaAyah ?? "-"} />
          <DetailItem label="Nama Ibu" value={penduduk.namaIbu ?? "-"} />
          <DetailItem label="Kewarganegaraan" value={penduduk.kewarganegaraan} />
          <DetailItem label="Telepon" value={penduduk.telepon ?? "-"} />
          <DetailItem label="Catatan" value={penduduk.catatan ?? "-"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <DetailItem label="No. KK" value={penduduk.keluarga.noKK} />
          <DetailItem label="Alamat KK" value={penduduk.keluarga.alamat} />
          <DetailItem
            label="Wilayah"
            value={`RT ${penduduk.keluarga.rt.nomor}/RW ${penduduk.keluarga.rt.rw.nomor}, Dusun ${penduduk.keluarga.rt.rw.dusun.nama}`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Surat</CardTitle>
        </CardHeader>
        <CardContent>
          {penduduk.suratPenduduk.length ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor Surat</TableHead>
                    <TableHead>Perihal</TableHead>
                    <TableHead>Peran</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penduduk.suratPenduduk.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.surat.nomorSurat}</TableCell>
                      <TableCell>{item.surat.perihal}</TableCell>
                      <TableCell>{formatEnumLabel(item.peran)}</TableCell>
                      <TableCell>{formatTanggalIndonesia(item.surat.tanggalSurat)}</TableCell>
                      <TableCell>
                        <StatusBadge status={item.surat.status} type="surat" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Belum ada riwayat surat untuk penduduk ini.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Mutasi</CardTitle>
        </CardHeader>
        <CardContent>
          {penduduk.mutasiKeluar.length ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Mutasi</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penduduk.mutasiKeluar.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{formatEnumLabel(item.jenisMutasi)}</TableCell>
                      <TableCell>{formatTanggalIndonesia(item.tanggalMutasi)}</TableCell>
                      <TableCell>{item.keterangan ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-slate-600">Belum ada riwayat mutasi untuk penduduk ini.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
