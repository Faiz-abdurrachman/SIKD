import type {
  ApiErrorResponse,
  ApiSuccessResponse,
  DashboardOverviewData,
  KeluargaListItem,
  LaporanSummary,
  MutasiListItem,
  PaginatedResponse,
  PendudukListItem,
  SuratListItem,
} from "./types";

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};

const API_BASE_URL = viteEnv.VITE_API_BASE_URL ?? "http://localhost:3001";
const DEV_USER_ID = viteEnv.VITE_DEV_USER_ID;
const DEV_USER_ROLE = viteEnv.VITE_DEV_USER_ROLE ?? "SUPER_ADMIN";

type QueryValue = string | number | boolean | undefined | null;

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

async function requestJson<T>(path: string) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      ...(DEV_USER_ID ? { "x-user-id": DEV_USER_ID } : {}),
      "x-user-role": DEV_USER_ROLE,
    },
  });

  const payload = (await response.json()) as ApiSuccessResponse<T> | ApiErrorResponse;

  if (!response.ok || !payload.success) {
    const message = payload.success ? "Permintaan gagal" : (payload.error?.message ?? "Permintaan gagal");
    throw new Error(message);
  }

  return payload.data;
}

async function requestPaginated<T>(path: string) {
  const url = `${API_BASE_URL}${path}`;
  const response = await fetch(url, {
    headers: {
      ...(DEV_USER_ID ? { "x-user-id": DEV_USER_ID } : {}),
      "x-user-role": DEV_USER_ROLE,
    },
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
};
