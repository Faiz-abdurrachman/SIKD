import type { Request } from "express";

function toStringValue(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return first === undefined || first === null ? undefined : String(first);
  }

  if (typeof value === "object") {
    return undefined;
  }

  return String(value);
}

export function extractQueryParams(request: Request): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(request.query)) {
    const normalized = toStringValue(value);

    if (normalized !== undefined) {
      result[key] = normalized;
    }
  }

  return result;
}
