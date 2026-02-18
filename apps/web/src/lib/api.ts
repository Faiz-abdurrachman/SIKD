import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  AuditLogItem,
  DashboardOverviewData,
  KeluargaListItem,
  LaporanSummary,
  MutasiListItem,
  PaginatedResponse,
  PendudukListItem,
  SettingsPayload,
  SuratListItem,
  UserListItem,
  UserRole,
  WilayahOverview,
} from "./types";

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const API_BASE_URL = viteEnv.VITE_API_BASE_URL ?? "http://localhost:3001";
const DEV_USER_ID = viteEnv.VITE_DEV_USER_ID;
const DEV_USER_ROLE = viteEnv.VITE_DEV_USER_ROLE ?? "SUPER_ADMIN";

type QueryValue = string | number | boolean | undefined | null;
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type RequestOptions = {
  method?: HttpMethod;
  body?: unknown;
};

function withQuery(path: string, query?: Record<string, QueryValue>) {
  if (!query) {
    return path;
  }

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || String(value).trim().length === 0) {
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return queryString.length ? `${path}?${queryString}` : path;
}

function buildHeaders() {
  return {
    ...(DEV_USER_ID ? { "x-user-id": DEV_USER_ID } : {}),
    "x-user-role": DEV_USER_ROLE,
  };
}

async function requestJson<T>(path: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...buildHeaders(),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Permintaan gagal" : (payload.error?.message ?? "Permintaan gagal");
    throw new Error(message);
  }

  return payload.data;
}

async function requestPaginated<T>(path: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: {
      ...buildHeaders(),
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = (await response.json()) as PaginatedResponse<T> | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Permintaan gagal" : (payload.error?.message ?? "Permintaan gagal");
    throw new Error(message);
  }

  return payload;
}

export const apiClient = {
  getDashboardOverview(limit = 5) {
    return requestJson<DashboardOverviewData>(withQuery("/api/v1/dashboard/overview", { limit }));
  },

  getPenduduk(query: { q?: string; page?: number; limit?: number } = {}) {
    return requestPaginated<PendudukListItem>(withQuery("/api/v1/penduduk", query));
  },

  getKeluarga(query: { q?: string; page?: number; limit?: number } = {}) {
    return requestPaginated<KeluargaListItem>(withQuery("/api/v1/keluarga", query));
  },

  getLaporanSummary(query?: { fromDate?: string; toDate?: string }) {
    return requestJson<LaporanSummary>(withQuery("/api/v1/laporan/summary", query));
  },

  getMutasi(query: { q?: string; page?: number; limit?: number } = {}) {
    return requestPaginated<MutasiListItem>(withQuery("/api/v1/mutasi", query));
  },

  getSurat(query: { q?: string; page?: number; limit?: number } = {}) {
    return requestPaginated<SuratListItem>(withQuery("/api/v1/surat", query));
  },

  getWilayahOverview() {
    return requestJson<WilayahOverview>("/api/v1/wilayah/overview");
  },

  getUsers(query: { q?: string; role?: UserRole; isActive?: boolean; page?: number; limit?: number } = {}) {
    return requestPaginated<UserListItem>(withQuery("/api/v1/users", query));
  },

  createUser(payload: {
    username: string;
    nama: string;
    email?: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
  }) {
    return requestJson<UserListItem>("/api/v1/users", {
      method: "POST",
      body: payload,
    });
  },

  toggleUser(userId: string) {
    return requestJson<UserListItem>(`/api/v1/users/${userId}/toggle`, {
      method: "PATCH",
    });
  },

  resetUserPassword(userId: string, password: string) {
    return requestJson<{ id: string }>(`/api/v1/users/${userId}/reset-password`, {
      method: "POST",
      body: { password },
    });
  },

  getSettings() {
    return requestJson<SettingsPayload>("/api/v1/settings");
  },

  updateSettings(payload: {
    desa?: Partial<{
      nama: string;
      kecamatan: string;
      kabupaten: string;
      provinsi: string;
      kodePos: string;
      alamatKantor: string;
      telepon: string;
      email: string;
      website: string;
      namaKepalaDesa: string;
      nipKepalaDesa: string;
    }>;
    settings?: Record<string, string>;
  }) {
    return requestJson<SettingsPayload>("/api/v1/settings", {
      method: "PUT",
      body: payload,
    });
  },

  getAuditLogs(query: {
    q?: string;
    userId?: string;
    entity?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  } = {}) {
    return requestPaginated<AuditLogItem>(withQuery("/api/v1/audit-logs", query));
  },
};
