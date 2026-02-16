export type RtOption = {
  id: string;
  nomor: string;
  rwId: string;
  rwNomor: string;
  dusunId: string;
  dusunNama: string;
  label: string;
};

export type PendudukOption = {
  id: string;
  nik: string;
  nama: string;
  keluargaId: string;
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
  statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
};

export type KeluargaListItem = {
  id: string;
  noKK: string;
  alamat: string;
  alamatLengkap: string;
  rtId: string;
  jumlahAnggota: number;
  createdAt: Date | string;
  updatedAt: Date | string;
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
  kepalaKeluarga: {
    id: string;
    nik: string;
    nama: string;
    tanggalLahir: Date | string;
    jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
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
    statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
  } | null;
};

export type KeluargaDetailItem = KeluargaListItem & {
  anggota: Array<{
    id: string;
    nik: string;
    nama: string;
    tempatLahir: string;
    tanggalLahir: Date | string;
    jenisKelamin: "LAKI_LAKI" | "PEREMPUAN";
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
    statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
    telepon: string | null;
    pekerjaan: string;
  }>;
};

export type KeluargaListResponse = {
  success: true;
  data: KeluargaListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type KeluargaDetailResponse = {
  success: true;
  data: KeluargaDetailItem;
};
