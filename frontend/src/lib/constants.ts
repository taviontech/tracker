// ── Query cache timing ────────────────────────────────────────────────────────
export const STALE_TIME_DEFAULT_MS  = 30_000;        // 30s  — QueryClient default
export const STALE_TIME_LONG_MS     = 5 * 60 * 1000; // 5min — auth / plans / subscription

// ── Jobs polling intervals ────────────────────────────────────────────────────
export const JOBS_REFETCH_ACTIVE_MS  = 3_000;  // while any job is QUEUED or RUNNING
export const JOBS_REFETCH_IDLE_MS    = 30_000; // all jobs settled
export const JOB_DETAIL_REFETCH_MS   = 2_000;  // single-job detail page

// ── Upload progress steps (%) ─────────────────────────────────────────────────
export const PROGRESS_START           = 10;
export const PROGRESS_PRESIGNED       = 20;
export const PROGRESS_UPLOAD_DONE     = 82;
export const PROGRESS_COMPLETE        = 100;
export const PROGRESS_RESET_DELAY_MS  = 800;

// ── UI animation delays ───────────────────────────────────────────────────────
export const MODAL_CLOSE_ANIMATION_MS = 300;
export const COPY_SUCCESS_DURATION_MS = 2_000;
export const DROPDOWN_FOCUS_DELAY_MS  = 40;
export const COUNTRY_SELECT_FOCUS_DELAY_MS = 50;

// ── Contact form ──────────────────────────────────────────────────────────────
export const CONTACT_MESSAGE_PREVIEW_MAX = 80;

// ── External service URLs ─────────────────────────────────────────────────────
export const FLAG_CDN_BASE_URL  = 'https://flagcdn.com/w20/';
export const QR_CODE_API_URL    = 'https://api.qrserver.com/v1/create-qr-code/';
