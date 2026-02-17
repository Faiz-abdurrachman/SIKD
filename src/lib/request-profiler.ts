type ProfileMetaValue = string | number | boolean | null | undefined;

type ProfileMeta = Record<string, ProfileMetaValue>;

type ProfilePoint = {
  label: string;
  at: bigint;
};

const SHOULD_LOG_PROFILE = process.env.API_PROFILE_LOG === "1" || process.env.NODE_ENV !== "production";

function toDurationMs(startAt: bigint, endAt: bigint) {
  return Number(endAt - startAt) / 1_000_000;
}

function roundMs(ms: number) {
  return Number(ms.toFixed(2));
}

function toMetricName(label: string, index: number) {
  const normalized = label.toLowerCase().replace(/[^a-z0-9_]/g, "_");
  return normalized.length > 0 ? normalized : `step_${index}`;
}

function getPathname(request: Request) {
  try {
    return new URL(request.url).pathname;
  } catch {
    return request.url;
  }
}

type Segment = {
  name: string;
  durationMs: number;
};

export function createRequestProfiler(request: Request, routeName: string) {
  const points: ProfilePoint[] = [{ label: "start", at: process.hrtime.bigint() }];

  function mark(label: string) {
    points.push({ label, at: process.hrtime.bigint() });
  }

  function finish(response: Response, meta: ProfileMeta = {}) {
    const endAt = process.hrtime.bigint();
    const segments: Segment[] = [];

    for (let index = 1; index < points.length; index += 1) {
      segments.push({
        name: points[index].label,
        durationMs: toDurationMs(points[index - 1].at, points[index].at),
      });
    }

    const lastPoint = points[points.length - 1] ?? points[0];
    segments.push({
      name: "response",
      durationMs: toDurationMs(lastPoint.at, endAt),
    });

    const totalMs = toDurationMs(points[0].at, endAt);
    const serverTiming = [
      `total;dur=${roundMs(totalMs)}`,
      ...segments.map((segment, index) => `${toMetricName(segment.name, index)};dur=${roundMs(segment.durationMs)}`),
    ].join(", ");

    response.headers.set("Server-Timing", serverTiming);

    if (SHOULD_LOG_PROFILE) {
      const durationMap = Object.fromEntries(
        segments.map((segment) => [`${segment.name}Ms`, roundMs(segment.durationMs)]),
      ) as Record<string, number>;

      console.info("[API PERF]", {
        method: request.method,
        path: getPathname(request),
        route: routeName,
        status: response.status,
        totalMs: roundMs(totalMs),
        ...durationMap,
        ...meta,
      });
    }

    return response;
  }

  return { mark, finish };
}
