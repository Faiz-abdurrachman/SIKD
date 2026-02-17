const WINDOW_MS = 5 * 60 * 1000;
const BLOCK_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS_PER_WINDOW = 20;
const MAX_TRACKED_KEYS = 5000;

type AttemptState = {
  count: number;
  windowStartedAt: number;
  blockedUntil?: number;
};

const attemptsByKey = new Map<string, AttemptState>();

function getNow() {
  return Date.now();
}

function purgeExpired(now: number) {
  for (const [key, state] of attemptsByKey.entries()) {
    const isBlockExpired = !state.blockedUntil || state.blockedUntil <= now;
    const isWindowExpired = state.windowStartedAt + WINDOW_MS <= now;

    if (isBlockExpired && isWindowExpired) {
      attemptsByKey.delete(key);
    }
  }

  if (attemptsByKey.size <= MAX_TRACKED_KEYS) {
    return;
  }

  // Remove oldest window entries first when map grows too large.
  const entries = [...attemptsByKey.entries()].sort((a, b) => a[1].windowStartedAt - b[1].windowStartedAt);
  const overflow = attemptsByKey.size - MAX_TRACKED_KEYS;

  for (const [key] of entries.slice(0, overflow)) {
    attemptsByKey.delete(key);
  }
}

function getAttemptState(key: string, now: number): AttemptState {
  const existing = attemptsByKey.get(key);

  if (!existing) {
    const created: AttemptState = {
      count: 0,
      windowStartedAt: now,
    };
    attemptsByKey.set(key, created);

    return created;
  }

  if (existing.windowStartedAt + WINDOW_MS <= now) {
    existing.count = 0;
    existing.windowStartedAt = now;
  }

  if (existing.blockedUntil && existing.blockedUntil <= now) {
    delete existing.blockedUntil;
  }

  return existing;
}

export function buildLoginRateLimitKey(clientIp: string | undefined, username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  if (clientIp && clientIp !== "unknown") {
    return `ip:${clientIp}`;
  }

  return `username:${normalizedUsername}`;
}

export function isLoginRateLimited(key: string) {
  const now = getNow();
  purgeExpired(now);
  const state = getAttemptState(key, now);

  return Boolean(state.blockedUntil && state.blockedUntil > now);
}

export function registerLoginRateLimitFailure(key: string) {
  const now = getNow();
  purgeExpired(now);

  const state = getAttemptState(key, now);
  state.count += 1;

  if (state.count >= MAX_ATTEMPTS_PER_WINDOW) {
    state.count = 0;
    state.windowStartedAt = now;
    state.blockedUntil = now + BLOCK_MS;
  }
}

export function clearLoginRateLimit(key: string) {
  attemptsByKey.delete(key);
}
