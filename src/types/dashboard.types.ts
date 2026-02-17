export type DashboardStats = {
  totalPenduduk: number;
  totalKeluarga: number;
  suratBulanIni: number;
  mutasiBulanIni: number;
};

export type DashboardDemografi = {
  agama: Array<{ label: string; value: number }>;
  pendidikan: Array<{ label: string; value: number }>;
  gender: Array<{ label: string; value: number }>;
  umur: Array<{
    label: string;
    total: number;
    lakiLaki: number;
    perempuan: number;
  }>;
};

export type DashboardRecentMutasi = Array<{
  id: string;
  jenisMutasi: "LAHIR" | "MATI" | "PINDAH_KELUAR" | "PINDAH_MASUK";
  tanggalMutasi: Date | string;
  keterangan: string | null;
  penduduk: {
    id: string;
    nik: string;
    nama: string;
  };
}>;

export type DashboardRecentSurat = Array<{
  id: string;
  nomorSurat: string;
  jenisSurat:
    | "SK_DOMISILI"
    | "SK_TIDAK_MAMPU"
    | "SK_USAHA"
    | "SK_KELAHIRAN"
    | "SK_KEMATIAN"
    | "SK_PINDAH"
    | "SK_DATANG"
    | "SK_BELUM_MENIKAH"
    | "SK_BEDA_NAMA"
    | "SK_KEHILANGAN"
    | "SK_CATATAN_KEPOLISIAN"
    | "SURAT_PENGANTAR"
    | "SK_TANAH"
    | "SK_PENGHASILAN"
    | "SK_IZIN_KERAMAIAN"
    | "LAINNYA";
  status: "DRAFT" | "MENUNGGU_PERSETUJUAN" | "DISETUJUI" | "DITOLAK" | "DICETAK" | "SELESAI";
  tanggalSurat: Date | string;
  createdBy: {
    nama: string;
  };
}>;

export type DashboardOverviewData = {
  stats: DashboardStats;
  demografi: DashboardDemografi;
  recentMutasi: DashboardRecentMutasi;
  recentSurat: DashboardRecentSurat;
};
