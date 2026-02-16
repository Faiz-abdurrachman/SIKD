import {
  BarChart3,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Map,
  RefreshCw,
  Settings,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppRole = "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";

export type SidebarMenuItem =
  | {
      type?: "item";
      label: string;
      href: string;
      icon: LucideIcon;
      roles: Array<AppRole | "*">;
    }
  | {
      type: "separator";
    };

export const SIDEBAR_MENU: SidebarMenuItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard, roles: ["*"] },
  { label: "Penduduk", href: "/penduduk", icon: Users, roles: ["*"] },
  { label: "Keluarga", href: "/keluarga", icon: Home, roles: ["*"] },
  { label: "Surat", href: "/surat", icon: FileText, roles: ["*"] },
  { label: "Mutasi", href: "/mutasi", icon: RefreshCw, roles: ["*"] },
  {
    label: "Laporan",
    href: "/laporan",
    icon: BarChart3,
    roles: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS"],
  },
  { type: "separator" },
  { label: "Wilayah", href: "/wilayah", icon: Map, roles: ["SUPER_ADMIN", "SEKRETARIS"] },
  { label: "Pengguna", href: "/pengguna", icon: UserCog, roles: ["SUPER_ADMIN"] },
  {
    label: "Pengaturan",
    href: "/pengaturan",
    icon: Settings,
    roles: ["SUPER_ADMIN", "KEPALA_DESA"],
  },
  {
    label: "Audit Log",
    href: "/audit-log",
    icon: ClipboardList,
    roles: ["SUPER_ADMIN", "KEPALA_DESA"],
  },
];

export const ROLE_LABEL: Record<AppRole, string> = {
  SUPER_ADMIN: "Super Admin",
  KEPALA_DESA: "Kepala Desa",
  SEKRETARIS: "Sekretaris",
  OPERATOR: "Operator",
};

export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  NOT_FOUND: "NOT_FOUND",
  DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
  NIK_ALREADY_EXISTS: "NIK_ALREADY_EXISTS",
  NO_KK_ALREADY_EXISTS: "NO_KK_ALREADY_EXISTS",
  CANNOT_DELETE_KEPALA_KK: "CANNOT_DELETE_KEPALA_KK",
  SURAT_ALREADY_APPROVED: "SURAT_ALREADY_APPROVED",
  SURAT_ALREADY_REJECTED: "SURAT_ALREADY_REJECTED",
  PENDUDUK_NOT_ACTIVE: "PENDUDUK_NOT_ACTIVE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export const KODE_SURAT = {
  SK_DOMISILI: "SKD",
  SK_TIDAK_MAMPU: "SKTM",
  SK_USAHA: "SKU",
  SK_KELAHIRAN: "SKL",
  SK_KEMATIAN: "SKK",
  SK_PINDAH: "SKP",
  SK_DATANG: "SKDT",
  SK_BELUM_MENIKAH: "SKBM",
  SK_BEDA_NAMA: "SKBN",
  SK_KEHILANGAN: "SKH",
  SK_CATATAN_KEPOLISIAN: "PSKCK",
  SURAT_PENGANTAR: "SP",
  SK_TANAH: "SKT",
  SK_PENGHASILAN: "SKPH",
  SK_IZIN_KERAMAIAN: "SIK",
  LAINNYA: "SL",
} as const;

export const BULAN_ROMAWI = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export const LABEL_MAP = {
  jenisKelamin: { LAKI_LAKI: "Laki-laki", PEREMPUAN: "Perempuan" },
  agama: {
    ISLAM: "Islam",
    KRISTEN: "Kristen",
    KATOLIK: "Katolik",
    HINDU: "Hindu",
    BUDDHA: "Buddha",
    KONGHUCU: "Konghucu",
    KEPERCAYAAN: "Kepercayaan",
  },
  statusPerkawinan: {
    BELUM_KAWIN: "Belum Kawin",
    KAWIN: "Kawin",
    CERAI_HIDUP: "Cerai Hidup",
    CERAI_MATI: "Cerai Mati",
  },
  pendidikan: {
    TIDAK_SEKOLAH: "Tidak/Belum Sekolah",
    SD: "SD/Sederajat",
    SMP: "SMP/Sederajat",
    SMA: "SMA/Sederajat",
    D1: "Diploma I",
    D2: "Diploma II",
    D3: "Diploma III",
    S1: "Strata I",
    S2: "Strata II",
    S3: "Strata III",
  },
  statusHubungan: {
    KEPALA_KELUARGA: "Kepala Keluarga",
    ISTRI: "Istri",
    ANAK: "Anak",
    MENANTU: "Menantu",
    CUCU: "Cucu",
    ORANG_TUA: "Orang Tua",
    MERTUA: "Mertua",
    FAMILI_LAIN: "Famili Lain",
    PEMBANTU: "Pembantu",
    LAINNYA: "Lainnya",
  },
};

export const STATUS_SURAT_COLOR = {
  DRAFT: "bg-gray-100 text-gray-700",
  MENUNGGU_PERSETUJUAN: "bg-amber-100 text-amber-700",
  DISETUJUI: "bg-emerald-100 text-emerald-700",
  DITOLAK: "bg-red-100 text-red-700",
  DICETAK: "bg-blue-100 text-blue-700",
  SELESAI: "bg-slate-100 text-slate-700",
} as const;

export const STATUS_KEPENDUDUKAN_COLOR = {
  TETAP: "bg-emerald-100 text-emerald-700",
  SEMENTARA: "bg-amber-100 text-amber-700",
  PINDAH: "bg-gray-100 text-gray-700",
  MENINGGAL: "bg-red-100 text-red-700",
} as const;
