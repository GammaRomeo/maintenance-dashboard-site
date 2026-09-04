// Wave 1.5 controlled beta: base URL of the deployed beta-worker (see
// ../beta-worker/README.md). Leave empty while the worker isn't deployed yet —
// beta.js fails OPEN (no gate, no telemetry, submissions stay local-only) whenever
// this is blank, so the app behaves exactly as before until this is filled in.
// Fill in after `wrangler deploy`, e.g.:
//   const BETA_API_BASE = 'https://maintenance-dashboard-beta.<subdomain>.workers.dev';
const BETA_API_BASE = 'https://maintenance-dashboard-beta.gammaromeo-maintenance.workers.dev';
