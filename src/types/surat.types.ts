export type SuratStatus = "DRAFT" | "MENUNGGU_PERSETUJUAN" | "DISETUJUI" | "DITOLAK" | "DICETAK" | "SELESAI";

export type SuratJenis =
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

export type SuratListItem = {
  id: string;
  nomorSurat: string;
  jenisSurat: SuratJenis;
  perihal: string;
  tanggalSurat: Date | string;
  status: SuratStatus;
  alasanTolak: string | null;
  createdAt: Date | string;
  createdBy: {
    id: string;
    username: string;
    nama: string;
    role: "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";
  };
  approvedBy: {
    id: string;
    username: string;
    nama: string;
  } | null;
  pendudukList: Array<{
    id: string;
    peran: string;
    penduduk: {
      id: string;
      nik: string;
      nama: string;
      keluarga: {
        noKK: string;
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
    };
  }>;
};

export type SuratDetailItem = SuratListItem & {
  isiSurat: Record<string, unknown> | null;
  keterangan: string | null;
  approvedAt: Date | string | null;
  printedAt: Date | string | null;
  updatedAt: Date | string;
};

export type SuratListResponse = {
  success: true;
  data: SuratListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type SuratDetailResponse = {
  success: true;
  data: SuratDetailItem;
};
