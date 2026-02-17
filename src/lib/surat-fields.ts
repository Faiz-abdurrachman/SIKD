import type { SuratJenis } from "@/types/surat.types";

export type SuratDynamicFieldType = "text" | "textarea" | "date" | "number" | "time" | "select";

export type SuratDynamicFieldOption = {
  label: string;
  value: string;
};

export type SuratDynamicField = {
  key: string;
  label: string;
  type: SuratDynamicFieldType;
  required?: boolean;
  placeholder?: string;
  options?: SuratDynamicFieldOption[];
};

export const SURAT_JENIS_OPTIONS: Array<{ value: SuratJenis; label: string; perihalDefault: string }> = [
  { value: "SK_DOMISILI", label: "SK Domisili", perihalDefault: "Permohonan Surat Keterangan Domisili" },
  { value: "SK_TIDAK_MAMPU", label: "SK Tidak Mampu", perihalDefault: "Permohonan Surat Keterangan Tidak Mampu" },
  { value: "SK_USAHA", label: "SK Usaha", perihalDefault: "Permohonan Surat Keterangan Usaha" },
  { value: "SK_KELAHIRAN", label: "SK Kelahiran", perihalDefault: "Permohonan Surat Keterangan Kelahiran" },
  { value: "SK_KEMATIAN", label: "SK Kematian", perihalDefault: "Permohonan Surat Keterangan Kematian" },
  { value: "SK_PINDAH", label: "SK Pindah", perihalDefault: "Permohonan Surat Keterangan Pindah" },
  { value: "SK_DATANG", label: "SK Datang", perihalDefault: "Permohonan Surat Keterangan Datang" },
  {
    value: "SK_BELUM_MENIKAH",
    label: "SK Belum Menikah",
    perihalDefault: "Permohonan Surat Keterangan Belum Menikah",
  },
  { value: "SK_BEDA_NAMA", label: "SK Beda Nama", perihalDefault: "Permohonan Surat Keterangan Beda Nama" },
  { value: "SK_KEHILANGAN", label: "SK Kehilangan", perihalDefault: "Permohonan Surat Keterangan Kehilangan" },
  {
    value: "SK_CATATAN_KEPOLISIAN",
    label: "SK Catatan Kepolisian",
    perihalDefault: "Permohonan Surat Pengantar Catatan Kepolisian",
  },
  { value: "SURAT_PENGANTAR", label: "Surat Pengantar", perihalDefault: "Permohonan Surat Pengantar" },
  { value: "SK_TANAH", label: "SK Tanah", perihalDefault: "Permohonan Surat Keterangan Tanah" },
  { value: "SK_PENGHASILAN", label: "SK Penghasilan", perihalDefault: "Permohonan Surat Keterangan Penghasilan" },
  {
    value: "SK_IZIN_KERAMAIAN",
    label: "SK Izin Keramaian",
    perihalDefault: "Permohonan Surat Izin Keramaian",
  },
  { value: "LAINNYA", label: "Lainnya", perihalDefault: "Permohonan Surat Keterangan Lainnya" },
];

export const SURAT_DYNAMIC_FIELDS: Record<SuratJenis, SuratDynamicField[]> = {
  SK_DOMISILI: [{ key: "keperluan", label: "Keperluan", type: "text", required: true }],
  SK_TIDAK_MAMPU: [
    { key: "keperluan", label: "Keperluan", type: "text", required: true },
    {
      key: "penghasilanPerBulan",
      label: "Penghasilan per Bulan",
      type: "text",
      placeholder: "Contoh: 1500000",
      required: false,
    },
  ],
  SK_USAHA: [
    { key: "namaUsaha", label: "Nama Usaha", type: "text", required: true },
    { key: "jenisUsaha", label: "Jenis Usaha", type: "text", required: true },
    { key: "alamatUsaha", label: "Alamat Usaha", type: "textarea", required: true },
    { key: "sejakTahun", label: "Berdiri Sejak", type: "text", required: false, placeholder: "Contoh: 2018" },
  ],
  SK_KELAHIRAN: [
    { key: "namaAnak", label: "Nama Anak", type: "text", required: true },
    {
      key: "jenisKelaminAnak",
      label: "Jenis Kelamin Anak",
      type: "select",
      required: true,
      options: [
        { label: "Laki-laki", value: "LAKI_LAKI" },
        { label: "Perempuan", value: "PEREMPUAN" },
      ],
    },
    { key: "tanggalLahirAnak", label: "Tanggal Lahir Anak", type: "date", required: true },
    { key: "tempatLahirAnak", label: "Tempat Lahir Anak", type: "text", required: true },
    { key: "anakKe", label: "Anak Ke", type: "number", required: true },
    { key: "namaAyah", label: "Nama Ayah", type: "text", required: true },
    { key: "namaIbu", label: "Nama Ibu", type: "text", required: true },
  ],
  SK_KEMATIAN: [
    { key: "tanggalKematian", label: "Tanggal Kematian", type: "date", required: true },
    { key: "tempatKematian", label: "Tempat Kematian", type: "text", required: true },
    { key: "penyebab", label: "Penyebab", type: "text", required: true },
  ],
  SK_PINDAH: [
    { key: "alamatTujuan", label: "Alamat Tujuan", type: "textarea", required: true },
    { key: "alasanPindah", label: "Alasan Pindah", type: "text", required: true },
  ],
  SK_DATANG: [
    { key: "alamatAsal", label: "Alamat Asal", type: "textarea", required: true },
    { key: "alasanDatang", label: "Alasan Datang", type: "text", required: true },
    { key: "tanggalDatang", label: "Tanggal Datang", type: "date", required: false },
  ],
  SK_BELUM_MENIKAH: [{ key: "keperluan", label: "Keperluan", type: "text", required: true }],
  SK_BEDA_NAMA: [
    { key: "namaDocument", label: "Nama Dokumen", type: "text", required: true },
    { key: "namaLain", label: "Nama Pada Dokumen", type: "text", required: true },
    { key: "keperluan", label: "Keperluan", type: "text", required: true },
  ],
  SK_KEHILANGAN: [
    { key: "barangHilang", label: "Barang Hilang", type: "textarea", required: true },
    { key: "tanggalHilang", label: "Tanggal Hilang", type: "date", required: true },
    { key: "lokasiHilang", label: "Lokasi Hilang", type: "text", required: false },
  ],
  SK_CATATAN_KEPOLISIAN: [
    { key: "keperluan", label: "Keperluan", type: "text", required: true },
    { key: "tujuan", label: "Tujuan", type: "text", required: true },
  ],
  SURAT_PENGANTAR: [
    { key: "keperluan", label: "Keperluan", type: "text", required: true },
    { key: "tujuan", label: "Tujuan", type: "text", required: true },
  ],
  SK_TANAH: [
    { key: "luasTanah", label: "Luas Tanah", type: "text", required: true },
    { key: "lokasi", label: "Lokasi Tanah", type: "text", required: true },
    { key: "batasUtara", label: "Batas Utara", type: "text", required: true },
    { key: "batasSelatan", label: "Batas Selatan", type: "text", required: true },
    { key: "batasTimur", label: "Batas Timur", type: "text", required: true },
    { key: "batasBarat", label: "Batas Barat", type: "text", required: true },
    { key: "dasarKepemilikan", label: "Dasar Kepemilikan", type: "text", required: true },
  ],
  SK_PENGHASILAN: [
    { key: "penghasilanPerBulan", label: "Penghasilan per Bulan", type: "text", required: true },
    { key: "pekerjaan", label: "Pekerjaan", type: "text", required: true },
    { key: "keperluan", label: "Keperluan", type: "text", required: true },
  ],
  SK_IZIN_KERAMAIAN: [
    { key: "namaAcara", label: "Nama Acara", type: "text", required: true },
    { key: "tanggalAcara", label: "Tanggal Acara", type: "date", required: true },
    { key: "waktuMulai", label: "Waktu Mulai", type: "time", required: true },
    { key: "waktuSelesai", label: "Waktu Selesai", type: "time", required: true },
    { key: "tempatAcara", label: "Tempat Acara", type: "textarea", required: true },
    { key: "jumlahUndangan", label: "Jumlah Undangan", type: "number", required: false },
  ],
  LAINNYA: [
    { key: "judulSurat", label: "Judul Surat", type: "text", required: true },
    { key: "isiCustom", label: "Isi Surat", type: "textarea", required: true },
  ],
};

function toDisplayValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

export function createEmptyIsiSurat(jenisSurat: SuratJenis): Record<string, string> {
  const fields = SURAT_DYNAMIC_FIELDS[jenisSurat] ?? [];

  return fields.reduce<Record<string, string>>((accumulator, field) => {
    accumulator[field.key] = "";

    return accumulator;
  }, {});
}

export function normalizeIsiSuratInput(
  jenisSurat: SuratJenis,
  rawValue: Record<string, unknown> | null | undefined,
): Record<string, string> {
  const base = createEmptyIsiSurat(jenisSurat);

  if (!rawValue) {
    return base;
  }

  const fields = SURAT_DYNAMIC_FIELDS[jenisSurat] ?? [];

  for (const field of fields) {
    base[field.key] = toDisplayValue(rawValue[field.key]);
  }

  return base;
}

export function buildPerihalDefault(jenisSurat: SuratJenis): string {
  return SURAT_JENIS_OPTIONS.find((item) => item.value === jenisSurat)?.perihalDefault ?? "Permohonan Surat";
}
