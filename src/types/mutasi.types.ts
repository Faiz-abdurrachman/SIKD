export type MutasiListItem = {
  id: string;
  jenisMutasi: "LAHIR" | "MATI" | "PINDAH_KELUAR" | "PINDAH_MASUK";
  tanggalMutasi: Date | string;
  keterangan: string | null;
  alamatTujuan: string | null;
  alamatAsal: string | null;
  alasanPindah: string | null;
  tempatLahir: string | null;
  namaAyah: string | null;
  namaIbu: string | null;
  penyebabKematian: string | null;
  tempatKematian: string | null;
  createdAt: Date | string;
  penduduk: {
    id: string;
    nik: string;
    nama: string;
    keluargaId: string;
    statusKependudukan: "TETAP" | "SEMENTARA" | "PINDAH" | "MENINGGAL";
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
};

export type MutasiListResponse = {
  success: true;
  data: MutasiListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
