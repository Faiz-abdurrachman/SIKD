export type AppRole = "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";

type PermissionMap = {
  [resource: string]: {
    [action: string]: AppRole[];
  };
};

const PERMISSIONS: PermissionMap = {
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

export function canAccess(role: AppRole, resource: string, action: string) {
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
