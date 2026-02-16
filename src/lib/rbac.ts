export type UserRole = "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";

type PermissionMap = {
  [resource: string]: {
    [action: string]: UserRole[];
  };
};

export const PERMISSIONS: PermissionMap = {
  dashboard: { view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"] },
  penduduk: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    create: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
    update: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
    delete: ["SUPER_ADMIN", "SEKRETARIS"],
  },
  keluarga: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    create: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
    update: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
    delete: ["SUPER_ADMIN", "SEKRETARIS"],
  },
  surat: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    create: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    update: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
    delete: ["SUPER_ADMIN", "SEKRETARIS"],
    approve: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS"],
    print: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
  },
  mutasi: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    create: ["SUPER_ADMIN", "SEKRETARIS", "OPERATOR"],
  },
  laporan: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS"],
    export: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS"],
  },
  wilayah: {
    view: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS", "OPERATOR"],
    manage: ["SUPER_ADMIN", "SEKRETARIS"],
  },
  users: { manage: ["SUPER_ADMIN"] },
  settings: { manage: ["SUPER_ADMIN", "KEPALA_DESA"] },
  audit: { view: ["SUPER_ADMIN", "KEPALA_DESA"] },
};

export type SidebarMenuItem = {
  label: string;
  href: string;
  roles: Array<UserRole | "*">;
};

const SIDEBAR_MENU: SidebarMenuItem[] = [
  { label: "Dashboard", href: "/", roles: ["*"] },
  { label: "Penduduk", href: "/penduduk", roles: ["*"] },
  { label: "Keluarga", href: "/keluarga", roles: ["*"] },
  { label: "Surat", href: "/surat", roles: ["*"] },
  { label: "Mutasi", href: "/mutasi", roles: ["*"] },
  { label: "Laporan", href: "/laporan", roles: ["SUPER_ADMIN", "KEPALA_DESA", "SEKRETARIS"] },
  { label: "Wilayah", href: "/wilayah", roles: ["SUPER_ADMIN", "SEKRETARIS"] },
  { label: "Pengguna", href: "/pengguna", roles: ["SUPER_ADMIN"] },
  { label: "Pengaturan", href: "/pengaturan", roles: ["SUPER_ADMIN", "KEPALA_DESA"] },
  { label: "Audit Log", href: "/audit-log", roles: ["SUPER_ADMIN", "KEPALA_DESA"] },
];

export function canAccess(role: UserRole, resource: string, action: string): boolean {
  const resourcePermissions = PERMISSIONS[resource];
  if (!resourcePermissions) {
    return false;
  }

  const allowedRoles = resourcePermissions[action];
  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(role);
}

export function getAccessibleMenuItems(role: UserRole): SidebarMenuItem[] {
  return SIDEBAR_MENU.filter((item) => item.roles.includes("*") || item.roles.includes(role));
}
