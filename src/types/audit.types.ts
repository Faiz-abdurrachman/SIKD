export type AuditListItem = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date | string;
  user: {
    id: string;
    username: string;
    nama: string;
    role: "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";
  };
};

export type AuditListResponse = {
  success: true;
  data: AuditListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
