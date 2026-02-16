export type UserListItem = {
  id: string;
  username: string;
  nama: string;
  email: string | null;
  role: "SUPER_ADMIN" | "KEPALA_DESA" | "SEKRETARIS" | "OPERATOR";
  isActive: boolean;
  lastLoginAt: Date | string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};

export type UserListResponse = {
  success: true;
  data: UserListItem[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
