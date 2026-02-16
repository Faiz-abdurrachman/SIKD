export type SettingsData = {
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
  settings: Array<{
    id: string;
    key: string;
    value: string;
    group: string;
    updatedAt: Date | string;
  }>;
  grouped: Record<string, Record<string, string>>;
};

export type SettingsResponse = {
  success: true;
  data: SettingsData;
};
