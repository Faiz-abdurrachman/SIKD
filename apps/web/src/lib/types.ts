export type ApiErrorResponse = {
  success: false;
  error?: {
    code?: string;
    message?: string;
    details?: Array<{ field: string; message: string }>;
  };
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type DashboardOverviewData = {
  stats: {
    totalPenduduk: number;
    totalKeluarga: number;
    suratBulanIni: number;
    mutasiBulanIni: number;
  };
  demografi: {
    agama: Array<{ label: string; value: number }>;
    pendidikan: Array<{ label: string; value: number }>;
    gender: Array<{ label: string; value: number }>;
    umur: Array<{ label: string; total: number; lakiLaki: number; perempuan: number }>;
  };
  recentMutasi: Array<{
    id: string;
    jenisMutasi: string;
    tanggalMutasi: string;
    keterangan: string | null;
    penduduk: { nik: string; nama: string };
  }>;
  recentSurat: Array<{
    id: string;
    nomorSurat: string;
    jenisSurat: string;
    status: string;
    tanggalSurat: string;
    createdBy: { nama: string };
  }>;
};

export type PendudukListItem = {
  id: string;
  nik: string;
  nama: string;
  jenisKelamin: string;
  statusKependudukan: string;
  tanggalLahir: string;
  keluarga: {
    noKK: string;
    rt: {
      nomor: string;
      rw: { nomor: string; dusun: { nama: string } };
    };
  };
};

export type KeluargaListItem = {
  id: string;
  noKK: string;
  alamat: string;
  jumlahAnggota: number;
  kepalaKeluarga: { nik: string; nama: string } | null;
  rt: {
    nomor: string;
    rw: { nomor: string; dusun: { nama: string } };
  };
};

export type LaporanSummary = {
  periode: { fromDate: string; toDate: string };
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
};

export type MutasiListItem = {
  id: string;
  jenisMutasi: string;
  tanggalMutasi: string;
  keterangan: string | null;
  penduduk: { nik: string; nama: string };
};

export type SuratListItem = {
  id: string;
  nomorSurat: string;
  jenisSurat: string;
  status: string;
  tanggalSurat: string;
  perihal: string;
};
