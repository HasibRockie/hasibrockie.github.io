// track.js - per-page visitor counter. Counts each page at most once per browser per day (Bangladesh time).
// Nothing is shown to visitors; only the admin can read the numbers (see hasib-admin/sql/07_page_views.sql).
// No cookies, no IDs, no personal data: just "page X was viewed on day Y" (+1). Failures are silent.
const cfg = window.SITE_CONFIG || {};
const KEY = "sc:v1:seen";
const today = () => new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 10);   // UTC+6, matches the database

export function trackView(page, id) {
  try {
    if (!/^[a-z0-9]{1,20}$/.test(page || "") || page === "404") return;
    if (id != null && !/^\d{1,9}$/.test(String(id))) return;
    if (window.top !== window.self) return;                                   // admin preview frame
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") || !cfg.SUPABASE_ANON_KEY) return;
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1" || h === "[::1]" || /\.(localhost|test)$/.test(h) || window.location.protocol === "file:") return;
    if (navigator.webdriver) return;                                            // automated browsers

    const key = id != null ? `${page}:${id}` : page, d = today();
    let seen = {}; try { seen = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) { seen = {}; }
    if (seen[key] === d) return;
    for (const k of Object.keys(seen)) if (seen[k] !== d) delete seen[k];     // keep only today's marks
    seen[key] = d;
    try { localStorage.setItem(KEY, JSON.stringify(seen)); } catch (_) {}

    let fresh = false; try { fresh = !localStorage.getItem("sc:v1:vis"); localStorage.setItem("sc:v1:vis", "1"); } catch (_) {}
    fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/track_view`, {
      method: "POST", keepalive: true,
      headers: { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ p_page: key, p_ref: source(), p_device: device(), p_new: fresh })
    }).catch(() => {});
  } catch (_) { /* never break the page */ }
}

// Traffic source as a coarse category only (never the full referring URL).
export function source(ref = document.referrer, here = window.location.hostname) {
  let h = ""; try { h = new URL(ref).hostname.replace(/^www\./, "").toLowerCase(); } catch (_) { return "direct"; }
  if (!h) return "direct";
  if (h === here) return "internal";
  const M = [["google", /(^|\.)google\./], ["scholar", /scholar\.google/], ["bing", /(^|\.)bing\.com$/], ["messenger", /messenger\.com$/], ["facebook", /(^|\.)(facebook|fb)\.com$|^l\.facebook|^lm\.facebook/],
    ["linkedin", /linkedin\.com$|^lnkd\.in$/], ["twitter", /(^|\.)(twitter|x)\.com$|^t\.co$/], ["github", /github\.(com|io)$/], ["whatsapp", /whatsapp\./], ["instagram", /instagram\.com$/], ["youtube", /youtube\.com$|youtu\.be$/]];
  const hit = M.filter(([, re]) => re.test(h)).map(([k]) => k);
  return hit.includes("scholar") ? "scholar" : hit[0] || "other";
}
export function device() {
  const w = Math.min(window.screen ? window.screen.width : 9999, window.innerWidth || 9999), touch = navigator.maxTouchPoints > 0;
  return w < 640 ? "mobile" : touch && w < 1100 ? "tablet" : "desktop";
}
