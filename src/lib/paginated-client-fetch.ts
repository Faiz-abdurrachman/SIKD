type ErrorResponse = {
  success: false;
  error?: {
    message?: string;
  };
};

type PaginatedResponse<T> = {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type QueryValue = string | number | boolean | null | undefined;

type FetchAllPagesOptions = {
  endpoint: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  errorMessage: string;
  query?: Record<string, QueryValue>;
  limit?: number;
  cache?: RequestCache;
};

const MAX_LIMIT = 100;
const MAX_PAGES = 100;

function toNonEmptyString(value: QueryValue) {
  if (value === undefined || value === null) {
    return null;
  }

  const normalized = String(value).trim();

  return normalized.length ? normalized : null;
}

function createQueryString(
  page: number,
  limit: number,
  sortBy: string,
  sortOrder: "asc" | "desc",
  query: Record<string, QueryValue> | undefined,
) {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    sortBy,
    sortOrder,
  });

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      const normalized = toNonEmptyString(value);

      if (normalized !== null) {
        params.set(key, normalized);
      }
    }
  }

  return params.toString();
}

function resolveErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "success" in payload &&
    (payload as ErrorResponse).success === false
  ) {
    return (payload as ErrorResponse).error?.message ?? fallback;
  }

  return fallback;
}

export async function fetchAllPages<T>({
  endpoint,
  sortBy,
  sortOrder,
  errorMessage,
  query,
  limit = MAX_LIMIT,
  cache = "no-store",
}: FetchAllPagesOptions): Promise<T[]> {
  const pageSize = Math.min(Math.max(1, Math.trunc(limit)), MAX_LIMIT);
  const allRows: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages && page <= MAX_PAGES) {
    const queryString = createQueryString(page, pageSize, sortBy, sortOrder, query);
    const response = await fetch(`${endpoint}?${queryString}`, { cache });
    let payload: PaginatedResponse<T> | ErrorResponse;

    try {
      payload = (await response.json()) as PaginatedResponse<T> | ErrorResponse;
    } catch {
      throw new Error(`${errorMessage} (respon server tidak valid)`);
    }

    if (!response.ok || !payload.success) {
      throw new Error(resolveErrorMessage(payload, errorMessage));
    }

    allRows.push(...payload.data);
    totalPages = Math.max(1, payload.meta.totalPages);
    page += 1;
  }

  if (totalPages > MAX_PAGES) {
    throw new Error("Data terlalu besar untuk dimuat sekaligus. Gunakan filter agar hasil lebih spesifik.");
  }

  return allRows;
}
