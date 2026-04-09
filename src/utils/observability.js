const DEBUG_OBSERVABILITY = import.meta.env.DEV || import.meta.env.VITE_DEBUG_OBSERVABILITY === '1';
const LOGIN_LATENCY_KEY = 'mkd_login_latency_v1';
const MAX_SAMPLES = 120;

export const debugLog = (...args) => {
  if (DEBUG_OBSERVABILITY) {
    console.debug('[observability]', ...args);
  }
};

export const debugWarn = (...args) => {
  if (DEBUG_OBSERVABILITY) {
    console.warn('[observability]', ...args);
  }
};

export const recordLoginLatency = ({ method, action, durationMs, ok, reason }) => {
  try {
    const raw = localStorage.getItem(LOGIN_LATENCY_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    const entry = {
      ts: Date.now(),
      method: method || 'unknown',
      action: action || 'auth',
      durationMs: Number.isFinite(durationMs) ? Math.round(durationMs) : null,
      ok: !!ok,
      reason: reason ? String(reason).slice(0, 120) : null,
    };
    const next = [...existing, entry].slice(-MAX_SAMPLES);
    localStorage.setItem(LOGIN_LATENCY_KEY, JSON.stringify(next));
    debugLog('login-latency', entry);
  } catch {
    // Intentionally no-op; telemetry is best effort and local-only.
  }
};

export const getLoginLatencySummary = () => {
  try {
    const raw = localStorage.getItem(LOGIN_LATENCY_KEY);
    const rows = raw ? JSON.parse(raw) : [];
    if (!rows.length) return null;

    const valid = rows.filter((r) => typeof r.durationMs === 'number');
    if (!valid.length) return null;

    const avg = Math.round(valid.reduce((s, r) => s + r.durationMs, 0) / valid.length);
    const p95 = valid
      .map((r) => r.durationMs)
      .sort((a, b) => a - b)[Math.floor(valid.length * 0.95)] || avg;

    return {
      samples: valid.length,
      avgMs: avg,
      p95Ms: p95,
      last: valid[valid.length - 1],
    };
  } catch {
    return null;
  }
};
