export type LaporanSummary = {
  periode: {
    fromDate: string;
    toDate: string;
  };
  penduduk: {
    total: number;
    byGender: Array<{ label: string; value: number }>;
    byAgama: Array<{ label: string; value: number }>;
    byPendidikan: Array<{ label: string; value: number }>;
    byPekerjaan: Array<{ label: string; value: number }>;
    byDusun: Array<{ label: string; value: number }>;
  };
  mutasi: {
    total: number;
    byJenis: Array<{ label: string; value: number }>;
    byBulan: Array<{ label: string; value: number }>;
  };
  surat: {
    total: number;
    byJenis: Array<{ label: string; value: number }>;
    byStatus: Array<{ label: string; value: number }>;
  };
  piramida: Array<{
    label: string;
    lakiLaki: number;
    perempuan: number;
    lakiLakiNegatif: number;
  }>;
};

export type LaporanSummaryResponse = {
  success: true;
  data: LaporanSummary;
};
