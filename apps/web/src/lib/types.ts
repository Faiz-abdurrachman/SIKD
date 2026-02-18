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

export type UserRole = "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";

export type UserListItem = {
  id: string;
  username: string;
  nama: string;
  email: string | null;
  role: UserRole;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WilayahOverview = {
  desa: {
    id: string;
    kode: string;
    nama: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    kodePos: string | null;
    alamatKantor: string | null;
    telepon: string | null;
    email: string | null;
    website: string | null;
    namaKepalaDesa: string | null;
    nipKepalaDesa: string | null;
  } | null;
  dusun: Array<{
    id: string;
    nama: string;
    _count?: {
      rwList: number;
    };
  }>;
  rw: Array<{
    id: string;
    nomor: string;
    dusunId: string;
    dusun: {
      id: string;
      nama: string;
    };
    _count?: {
      rtList: number;
    };
  }>;
  rt: Array<{
    id: string;
    nomor: string;
    rwId: string;
    rw: {
      id: string;
      nomor: string;
      dusun: {
        id: string;
        nama: string;
      };
    };
    _count?: {
      keluarga: number;
    };
  }>;
};

export type SettingItem = {
  id: string;
  key: string;
  value: string;
  group: string;
};

export type SettingsPayload = {
  desa: {
    id: string;
    kode: string;
    nama: string;
    kecamatan: string;
    kabupaten: string;
    provinsi: string;
    kodePos: string | null;
    alamatKantor: string | null;
    telepon: string | null;
    email: string | null;
    website: string | null;
    namaKepalaDesa: string | null;
    nipKepalaDesa: string | null;
  } | null;
  settings: SettingItem[];
  grouped: Record<string, Record<string, string>>;
};

export type AuditLogItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: string;
    username: string;
    nama: string;
    role: UserRole;
  } | null;
};
