// Wave 1.5 controlled beta client: access gate + usage beacon + submission client.
// Included by navigator.html, vehicle-profile.html and silhouette-explorer.html,
// after beta-config.js. Fails OPEN (no gate, no network calls) whenever
// BETA_API_BASE is blank — see beta-config.js.
const BETA_TOKEN_KEY = 'maintenance-dashboard-beta-token-v1';
const BETA_APP_VERSION = '1.5.0-beta';
const BETA_USAGE_THROTTLE_KEY = 'maintenance-dashboard-beta-usage-v1';
const BETA_USAGE_THROTTLE_MS = 60 * 60 * 1000; // one usage beacon per token per hour
const BETA_DEVICE_ID_KEY = 'maintenance-dashboard-beta-device-id-v1';

function betaReadToken() {
  const params = new URLSearchParams(window.location.search);
  const fromUrl = params.get('beta');
  if (fromUrl) {
    try { localStorage.setItem(BETA_TOKEN_KEY, fromUrl); } catch (e) {}
    return fromUrl;
  }
  try { return localStorage.getItem(BETA_TOKEN_KEY) || ''; } catch (e) { return ''; }
}

// A stable per-browser device id, generated once and persisted so the same
// browser always registers as the same device (repeat registrations don't
// count against the identity's max-device cap -- see BetaGate.registerDevice()).
function betaGetDeviceId() {
  try {
    const existing = localStorage.getItem(BETA_DEVICE_ID_KEY);
    if (existing) return existing;
    const fresh = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(BETA_DEVICE_ID_KEY, fresh);
    return fresh;
  } catch (e) {
    // localStorage unavailable (e.g. private mode): fall back to a per-load id
    // rather than throwing -- this device just won't be recognized as the same
    // one across reloads, which only affects the max-device count, not access.
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

// A short human-readable label for the device list Gregg sees via
// `scripts/beta-token.sh devices` -- best-effort OS/browser sniffing, not meant
// to be precise, just enough to tell testers' devices apart.
function betaDeviceLabel() {
  const ua = (navigator.userAgent || '');
  let os = 'Unknown OS';
  if (/iphone/i.test(ua)) os = 'iPhone';
  else if (/ipad/i.test(ua)) os = 'iPad';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/mac os x/i.test(ua)) os = 'Mac';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/linux/i.test(ua)) os = 'Linux';
  let browser = 'Unknown browser';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome\//i.test(ua) && !/edg\//i.test(ua)) browser = 'Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Firefox';
  else if (/safari\//i.test(ua) && !/chrome\//i.test(ua)) browser = 'Safari';
  return `${browser} on ${os}`;
}

const BetaGate = {
  token: betaReadToken(),

  async check() {
    if (!BETA_API_BASE) return { enabled: true };
    if (!this.token) {
      return { enabled: false, message: 'This build requires a beta access link. Contact the developer for one.' };
    }
    try {
      const res = await fetch(`${BETA_API_BASE}/api/beta/config?token=${encodeURIComponent(this.token)}`);
      return await res.json();
    } catch (e) {
      return { enabled: false, message: 'Could not verify beta access (no connection). Try again once online.' };
    }
  },

  // Client-side half of the one-event-per-hour throttle: keyed by token (not by
  // route/page), so navigating between navigator/profile/silhouette within the same
  // hour still only sends one beacon. This is a courtesy to stay well inside
  // Cloudflare KV's free-tier write quota — the worker also coalesces defensively
  // server-side (see beta-worker/src/worker.js) in case this is bypassed.
  _dueForUsageBeacon() {
    try {
      const all = JSON.parse(localStorage.getItem(BETA_USAGE_THROTTLE_KEY) || '{}');
      const last = all[this.token];
      return !last || (Date.now() - last) >= BETA_USAGE_THROTTLE_MS;
    } catch (e) { return true; }
  },
  _markUsageBeaconSent() {
    try {
      const all = JSON.parse(localStorage.getItem(BETA_USAGE_THROTTLE_KEY) || '{}');
      all[this.token] = Date.now();
      localStorage.setItem(BETA_USAGE_THROTTLE_KEY, JSON.stringify(all));
    } catch (e) {}
  },

  sendEvent(route) {
    if (!BETA_API_BASE || !this.token) return;
    if (!this._dueForUsageBeacon()) return;
    this._markUsageBeaconSent();
    const payload = JSON.stringify({
      token: this.token,
      appVersion: BETA_APP_VERSION,
      route,
      ua: navigator.userAgent,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(`${BETA_API_BASE}/api/beta/event`, new Blob([payload], { type: 'application/json' }));
    } else {
      fetch(`${BETA_API_BASE}/api/beta/event`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true,
      }).catch(() => {});
    }
  },

  // Best-effort submit to the beta worker; always resolves (never throws) so callers
  // can keep their existing local-write-first behavior unconditionally.
  async submit(path, data) {
    if (!BETA_API_BASE) return { ok: false, offline: true };
    try {
      const res = await fetch(`${BETA_API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token, ...data }),
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },

  // Cross-device profile fetch: same beta link/token used on a second device reads
  // back what was saved from the first. Best-effort, never throws.
  async fetchProfile(vehicleKey) {
    if (!BETA_API_BASE || !this.token) return { ok: false, found: false };
    try {
      const res = await fetch(
        `${BETA_API_BASE}/api/beta/profile?token=${encodeURIComponent(this.token)}&vehicleKey=${encodeURIComponent(vehicleKey)}`
      );
      return await res.json();
    } catch (e) {
      return { ok: false, found: false, error: String(e) };
    }
  },

  // Cross-device self-report fastener readback: same identity's records for a
  // vehicle, saved from any device, so navigator.html can merge them with this
  // device's localStorage copy instead of only ever showing local submissions.
  // Best-effort, never throws — see mergeSelfReports() in self-report-merge.js
  // for the de-dupe rule applied to the { reports } this returns.
  async fetchSelfReports(vehicleKey) {
    if (!BETA_API_BASE || !this.token) return { ok: false, reports: [] };
    try {
      const res = await fetch(
        `${BETA_API_BASE}/api/beta/selfreports?token=${encodeURIComponent(this.token)}&vehicleKey=${encodeURIComponent(vehicleKey)}`
      );
      return await res.json();
    } catch (e) {
      return { ok: false, reports: [], error: String(e) };
    }
  },

  // Tester contact registry (name/email/optional device+phone), keyed server-side
  // by the same identity as profile/selfreport. Best-effort, never throws — a
  // failed fetch/save should not block the rest of the app.
  async fetchContact() {
    if (!BETA_API_BASE || !this.token) return { ok: false, found: false, required: false };
    try {
      const res = await fetch(`${BETA_API_BASE}/api/beta/contact?token=${encodeURIComponent(this.token)}`);
      return await res.json();
    } catch (e) {
      return { ok: false, found: false, required: false, error: String(e) };
    }
  },

  // Registers this browser as a device under the current identity, right after
  // a successful config check (see betaEnforceGate()). Fails OPEN on a network
  // error (a temporary outage should not lock out a device that's already
  // registered), but surfaces an explicit ok:false from the worker (e.g. the
  // identity's max-device cap was reached by a brand-new device) so the caller
  // can block access with a clear message instead of silently granting it.
  async registerDevice() {
    if (!BETA_API_BASE || !this.token) return { ok: true, skipped: true };
    try {
      const res = await fetch(`${BETA_API_BASE}/api/beta/device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token, deviceId: betaGetDeviceId(), label: betaDeviceLabel() }),
      });
      return await res.json();
    } catch (e) {
      return { ok: true, offline: true };
    }
  },

  async submitContact(contact) {
    if (!BETA_API_BASE || !this.token) return { ok: false, offline: true };
    try {
      const res = await fetch(`${BETA_API_BASE}/api/beta/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: this.token, contact }),
      });
      return await res.json();
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  },
};

// Shows/hides the page's #betaGate overlay (markup lives in each host page) around
// a BetaGate.check() call, and fires one usage event per page load on success.
// Returns true if the page should proceed to its normal init/render, false if the
// gate is blocking (overlay stays up with the returned message).
async function betaEnforceGate() {
  if (!BETA_API_BASE) return true;
  const gateEl = document.getElementById('betaGate');
  if (gateEl) gateEl.style.display = 'flex';
  const result = await BetaGate.check();
  if (result.enabled) {
    const deviceResult = await BetaGate.registerDevice();
    if (deviceResult.ok === false) {
      if (gateEl) {
        gateEl.style.display = 'flex';
        const msgEl = gateEl.querySelector('.betaMessage');
        if (msgEl) msgEl.textContent = deviceResult.error || 'This beta link has reached its device limit. Contact the developer for help.';
      }
      return false;
    }
    if (gateEl) gateEl.style.display = 'none';
    BetaGate.sendEvent(window.location.pathname.split('/').pop() || 'navigator.html');
    return true;
  }
  if (gateEl) {
    const msgEl = gateEl.querySelector('.betaMessage');
    if (msgEl) msgEl.textContent = result.message || 'Beta access is not available right now.';
  }
  return false;
}

// Wave 1.6 (all-pages gate close): the mandatory tester-contact landing gate
// used to exist only in navigator.html's inline script, so a direct link to
// vehicle-profile.html / silhouette-explorer.html / a3-explorer-standalone.html
// — all of which already call betaEnforceGate() above — could reach real app
// content without ever passing it. This section is the single shared
// implementation of the gate's validation/save/readback behavior, so it isn't
// copy-pasted per page. Host pages provide the markup (an overlay with
// id="betaContactGate" containing #bcFirstName, #bcLastInitial, #bcEmail,
// #bcDeviceType, #bcPhone, #bcError and a #bcSaveBtn button — see
// navigator.html for the reference markup/copy, which every gated page reuses
// verbatim).
//
// navigator.html keeps its own local requireBetaContactBeforeApp() wrapper
// (its exact shape is pinned by test/navigator-contact-gate.test.mjs) built on
// top of hideBetaContactGate()/showBetaContactGate()/wireBetaContactSaveButton()
// below; vehicle-profile.html, silhouette-explorer.html and
// a3-explorer-standalone.html instead call the all-in-one
// requireBetaContactGate(onReady) further down, which covers the same
// found/fail-open/fresh-save paths without needing a page-local wrapper.
BetaGate.contactSaved = false;
BetaGate.contactRecord = null;

function hideBetaContactGate() {
  const el = document.getElementById('betaContactGate');
  if (el) el.style.display = 'none';
}

function showBetaContactGate() {
  const el = document.getElementById('betaContactGate');
  if (el) el.style.display = 'flex';
  const errEl = document.getElementById('bcError');
  if (errEl) errEl.style.display = 'none';
}

// Wires #bcSaveBtn's click handler exactly once per page load. `onSaved` is
// called after a successful save, once the gate overlay has already been
// hidden, so the host page can reveal its own content / re-run its init.
let _betaContactSaveWired = false;
function wireBetaContactSaveButton(onSaved) {
  const btn = document.getElementById('bcSaveBtn');
  if (!btn || _betaContactSaveWired) return;
  _betaContactSaveWired = true;
  btn.addEventListener('click', async () => {
    const firstName = document.getElementById('bcFirstName').value.trim();
    const lastInitial = document.getElementById('bcLastInitial').value.trim();
    const email = document.getElementById('bcEmail').value.trim();
    const deviceType = document.getElementById('bcDeviceType').value;
    const phone = document.getElementById('bcPhone').value.trim();
    const errEl = document.getElementById('bcError');
    if (!firstName || !/^[A-Za-z]$/.test(lastInitial) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter your first name, a single-letter last initial, and a valid email.';
      errEl.style.display = 'block';
      return;
    }
    const result = await BetaGate.submitContact({ firstName, lastInitial, email, deviceType, phone });
    if (result.ok) {
      BetaGate.contactRecord = result.contact;
      BetaGate.contactSaved = true;
      hideBetaContactGate();
      if (onSaved) await onSaved();
    } else {
      errEl.textContent = result.error || 'Could not save your info. Please try again.';
      errEl.style.display = 'block';
    }
  });
}

// All-in-one mandatory landing gate for pages that don't need navigator.html's
// exact legacy function shape (see the comment above). Resolves true once the
// app should render and calls `onReady` exactly once to do so — either
// immediately (an existing contact record was found on readback, or
// BETA_API_BASE is unset so the build fails open) or later, when the save
// button succeeds. Resolves false while the gate overlay is blocking (caller
// does not need to act further in that case; the button click handler takes
// over from here). Unlike navigator.html (whose #app stays CSS-hidden by
// default until shown), these host pages' main content isn't necessarily
// hidden ahead of time, so the overlay is shown synchronously up front —
// before the fetchContact() round-trip — rather than only after a "not found"
// result, closing the brief gap where nothing would otherwise be blocking it.
async function requireBetaContactGate(onReady) {
  if (!BETA_API_BASE) { if (onReady) await onReady(); return true; }
  wireBetaContactSaveButton(onReady);
  showBetaContactGate();
  const result = await BetaGate.fetchContact();
  if (result.found && result.contact) {
    BetaGate.contactRecord = result.contact;
    BetaGate.contactSaved = true;
    hideBetaContactGate();
    if (onReady) await onReady();
    return true;
  }
  BetaGate.contactSaved = false;
  showBetaContactGate();
  return false;
}
