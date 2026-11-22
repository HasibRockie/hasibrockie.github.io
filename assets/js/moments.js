// moments.js - private gallery. The passcode is the password of a Supabase "guest" account; the server (RLS + private bucket) enforces it.
// Nothing here is cached on disk, nothing is in the public JSON snapshots, and the token lives only in this tab (sessionStorage).
const cfg = window.SITE_CONFIG || {};
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const TOK = "mm:tok";
const on = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") && !!cfg.SUPABASE_ANON_KEY && !/YOUR-/.test(cfg.SUPABASE_ANON_KEY);

const saved = () => { try { const j = JSON.parse(sessionStorage.getItem(TOK)); return j && j.exp > Date.now() ? j.t : null; } catch (_) { return null; } };
const forget = () => { try { sessionStorage.removeItem(TOK); } catch (_) {} };

export function mountMoments(main) {
  const shell = (inner) => { main.innerHTML = `<section class="wrap moments-shell"><div class="pagehead moments-head"><p class="sheet">Private collection</p><h1>Moments</h1><p>Little pieces of time, kept in one place.</p></div>${inner}</section>`; };
  if (!on) return shell('<p class="notice" role="status">Private moments are unavailable right now.</p>');

  const gate = (msg = "") => {
    shell(`<section class="moments-gate" aria-labelledby="mg"><div class="moments-seal" aria-hidden="true">M</div><h2 id="mg">For invited eyes</h2><p>Enter the passcode to open this collection.</p>
<form id="mf" class="moments-form"><label for="mc">Passcode</label><div class="moments-form-row"><input id="mc" type="password" autocomplete="current-password" required><button class="btn" type="submit">Open moments</button></div><p id="mm" class="moments-message" role="status" aria-live="polite">${esc(msg)}</p></form></section>`);
    const f = document.getElementById("mf"), i = document.getElementById("mc"), m = document.getElementById("mm");
    i.addEventListener("input", () => { m.textContent = ""; i.removeAttribute("aria-invalid"); });
    f.addEventListener("submit", async (e) => {
      e.preventDefault(); const btn = f.querySelector("button"); btn.disabled = true;
      try {
        const r = await fetch(`${cfg.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: cfg.MOMENTS_GUEST_EMAIL, password: i.value }) });
        if (r.status === 429) { m.textContent = "Too many attempts. Please wait a few minutes."; return; }
        if (!r.ok) { i.setAttribute("aria-invalid", "true"); m.textContent = "That passcode doesn’t match. Please try again."; i.focus(); return; }
        const j = await r.json();
        try { sessionStorage.setItem(TOK, JSON.stringify({ t: j.access_token, exp: Date.now() + (j.expires_in || 3600) * 1000 - 60000 })); } catch (_) {}
        i.value = ""; show(j.access_token);
      } catch (_) { m.textContent = "Couldn’t reach the server. Check your connection and try again."; }
      finally { btn.disabled = false; }
    });
    i.focus();
  };

  const show = async (token) => {
    shell('<p class="muted" role="status">Opening…</p>');
    const H = { apikey: cfg.SUPABASE_ANON_KEY, Authorization: "Bearer " + token };
    try {
      const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/moments?select=id,date,place,caption,storage_path&status=eq.published&order=date.desc,id.desc`, { headers: H });
      if (r.status === 401 || r.status === 403) { forget(); return gate("Your session ended. Please enter the passcode again."); }
      if (!r.ok) throw new Error("HTTP " + r.status);
      const rows = await r.json();
      const urls = await Promise.all(rows.map(async (m) => {
        if (!m.storage_path) return "";
        try {
          const s = await fetch(`${cfg.SUPABASE_URL}/storage/v1/object/sign/moments-private/${m.storage_path.split("/").map(encodeURIComponent).join("/")}`, { method: "POST", headers: { ...H, "Content-Type": "application/json" }, body: JSON.stringify({ expiresIn: 3600 }) });
          if (!s.ok) return ""; const j = await s.json(), p = j.signedURL || j.signedUrl || "";
          return p.startsWith("https://") ? p : `${cfg.SUPABASE_URL}/storage/v1${p.startsWith("/") ? p : "/" + p}`;
        } catch (_) { return ""; }
      }));
      const items = rows.map((m, k) => `<li class="moment-item"><article class="moment-card"><div class="moment-photo">${urls[k] ? `<img src="${esc(urls[k])}" alt="${esc(m.caption || "Moment from " + m.place)}" loading="lazy" decoding="async" data-hide>` : ""}</div>
<div class="moment-copy"><p class="moment-meta"><time datetime="${esc(m.date)}">${esc(fmt(m.date))}</time><span aria-hidden="true"> | </span><span>${esc(m.place)}</span></p>${m.caption && m.caption.trim() ? `<p class="moment-caption">${esc(m.caption)}</p>` : ""}</div></article></li>`).join("");
      shell(`<p class="after"><button class="btn ghost sm" id="lock" type="button">Lock this page</button></p><section class="moments-timeline" aria-label="Moments, newest first">${items ? `<ol class="moment-list">${items}</ol>` : '<div class="moments-empty"><span class="moments-empty-mark" aria-hidden="true">✳</span><h2>Nothing here yet</h2><p>New moments will appear here.</p></div>'}</section>`);
      document.getElementById("lock").onclick = () => { forget(); gate(); };
    } catch (_) { shell('<p class="notice" role="status">Couldn’t load the moments. Please try again in a moment.</p>'); }
  };
  const t = saved(); if (t) show(t); else gate();
}
