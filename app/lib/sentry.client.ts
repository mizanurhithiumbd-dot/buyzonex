import * as Sentry from '@sentry/react';

let initialized = false;

export function initSentryBrowser() {
  if (initialized) return;
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) return;

  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: import.meta.env.MODE,
  });

  initialized = true;
}

export function captureError(err: unknown) {
  try {
    Sentry.captureException(err);
  } catch {
    // no-op
  }
}
