export type KeluargaOption = {
  id: string;
  noKK: string;
  alamat: string;
  kepalaKeluargaNama?: string;
  rtNomor: string;
  rwNomor: string;
  dusunNama: string;
};

export type PendudukListItem = {
  id: string;
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: Date | string;
  jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
  agama: "ISLAM" | "KRISTEN" | "KATOLIK" | "HINDU" | "BUDDHA" | "KONGHUCU" | "KEPERCAYAAN";
  statusPerkawinan: "BELUM_KAWIN" | "KAWIN" | "CERAI_HIDUP" | "CERAI_MATI";
  pendidikanTerakhir:
    | "TIDAK_SEKOLAH"
    | "SD"
    | "SMP"
    | "SMA"
    | "D1"
    | "D2"
    | "D3"
    | "S1"
    | "S2"
    | "S3";
  pekerjaan: string;
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
  telepon: string | null;
  keluargaId: string;
  alamatLengkap: string;
  keluarga: {
    id: string;
    noKK: string;
    alamat: string;
    rt: {
      id: string;
      nomor: string;
      rw: {
        id: string;
        nomor: string;
        dusun: {
          id: string;
          nama: string;
        };
      };
    };
  };
};

export type PendudukDetailItem = PendudukListItem & {
  golonganDarah: "A" | "B" | "AB" | "O" | "TIDAK_TAHU" | null;
  statusHubungan:
    | "KEPALA_KELUARGA"
    | "ISTRI"
    | "ANAK"
    | "MENANTU"
    | "CUCU"
    | "ORANG_TUA"
    | "MERTUA"
    | "FAMILI_LAIN"
    | "PEMBANTU"
    | "LAINNYA";
  namaAyah: string | null;
  namaIbu: string | null;
  kewarganegaraan: string;
  catatan: string | null;
  mutasiKeluar: Array<{
    id: string;
    jenisMutasi: "LAHIR" | "MATI" | "PINDAH_KELUAR" | "PINDAH_MASUK";
    tanggalMutasi: Date | string;
    keterangan: string | null;
  }>;
  suratPenduduk: Array<{
    id: string;
    peran: string;
    surat: {
      id: string;
      nomorSurat: string;
      perihal: string;
      status: "DRAFT" | "MENUNGGU_PERSETUJUAN" | "DISETUJUI" | "DITOLAK" | "DICETAK" | "SELESAI";
      tanggalSurat: Date | string;
    };
  }>;
};

export type PendudukListResponse = {
  success: true;
  data: PendudukListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PendudukDetailResponse = {
  success: true;
  data: PendudukDetailItem;
};
