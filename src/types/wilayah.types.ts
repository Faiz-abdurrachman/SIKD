export type DesaItem = {
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
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type DusunItem = {
  id: string;
  nama: string;
  desaId: string;
  createdAt: Date | string;
  _count: {
    rwList: number;
  };
};

export type RWItem = {
  id: string;
  nomor: string;
  dusunId: string;
  createdAt: Date | string;
  dusun: {
    id: string;
    nama: string;
    desaId: string;
  };
  _count: {
    rtList: number;
  };
};

export type RTItem = {
  id: string;
  nomor: string;
  rwId: string;
  createdAt: Date | string;
  rw: {
    id: string;
    nomor: string;
    dusun: {
      id: string;
      nama: string;
      desaId: string;
    };
  };
  _count: {
    keluarga: number;
  };
};

export type WilayahOverviewResponse = {
  success: true;
  data: {
    desa: DesaItem | null;
    dusun: DusunItem[];
    rw: RWItem[];
    rt: RTItem[];
  };
};
