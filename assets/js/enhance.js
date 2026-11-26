// enhance.js - progressive touches after each render: scroll reveal, sticky-header shadow, back-to-top, reading progress,
// share buttons, gallery lightbox, contact form. Everything degrades to plain content without it.
import { openLightbox } from "./lightbox.js?v=202611261801";
const cfg = window.SITE_CONFIG || {};
const apiOn = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") && !!cfg.SUPABASE_ANON_KEY;
let io = null, scrollBound = false;

export function reveal(root = document) {
  const els = root.querySelectorAll(".rv:not(.in)");
  if (!("IntersectionObserver" in window) || document.documentElement.getAttribute("data-anim") === "off") { els.forEach((e) => e.classList.add("in")); return; }
  if (!io) io = new IntersectionObserver((ents) => ents.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }), { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });
  els.forEach((e, i) => { const r = e.getBoundingClientRect(); if (r.top < window.innerHeight && r.bottom > 0) setTimeout(() => e.classList.add("in"), Math.min(i, 8) * 50); else io.observe(e); });
}

export function bindScroll() {
  if (scrollBound) return; scrollBound = true;
  let ticking = false;
  const run = () => {
    ticking = false;
    const y = window.scrollY, top = document.querySelector("header.top"), tt = document.querySelector(".totop"), pr = document.getElementById("progress");
    if (top) top.classList.toggle("scrolled", y > 8);
    if (tt) tt.classList.toggle("show", y > 700);
    if (pr) { const art = document.querySelector(".article"); if (art) { const r = art.getBoundingClientRect(), total = r.height - window.innerHeight; pr.style.transform = `scaleX(${Math.max(0, Math.min(1, total > 0 ? -r.top / total : 1))})`; } }
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(run); } }, { passive: true });
  document.addEventListener("click", (e) => {
    if (e.target.closest(".totop")) { window.scrollTo({ top: 0, behavior: "smooth" }); document.getElementById("main").focus({ preventScroll: true }); }
  });
  run();
}

export function wireShare(title) {
  const url = window.location.href.split("#")[0], sh = document.getElementById("share"), cp = document.getElementById("copy");
  if (sh) { if (navigator.share) sh.onclick = () => navigator.share({ title, url }).catch(() => {}); else sh.remove(); }
  if (cp) cp.onclick = async () => { try { await navigator.clipboard.writeText(url); cp.textContent = "Link copied ✓"; } catch (_) { cp.textContent = "Copy failed"; } setTimeout(() => { cp.textContent = "Copy link"; }, 2000); };
}

export function wireGallery(photos, imageURL) {
  const g = document.getElementById("gal"); if (!g) return;
  const list = photos.map((p) => ({ src: imageURL(p.img), alt: p.caption, title: p.caption || "" })).filter((x) => x.src);
  g.onclick = (e) => { const b = e.target.closest("button[data-i]"); if (b) openLightbox(list, Number(b.dataset.i)); };
}

const MSG = { rate_limited: "You’ve sent a few messages already. Please wait a little and try again.", invalid_email: "That email address doesn’t look right.", invalid_name: "Please add your name.", invalid_body: "Please write a slightly longer message." };
export function wireContact() {
  const f = document.getElementById("cf"); if (!f || f.dataset.wired) return; f.dataset.wired = "1";
  const m = document.getElementById("cf-m"), say = (t, ok) => { m.textContent = t; m.className = "form-msg " + (ok ? "ok" : "err"); };
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const $ = (id) => document.getElementById(id), nI = $("cf-n"), eI = $("cf-e"), bI = $("cf-b"), hp = $("cf-w");
    const name = nI.value.trim(), email = eI.value.trim(), body = bI.value.trim(), btn = f.querySelector("button[type=submit]");
    if (!name) { say(MSG.invalid_name); nI.focus(); return; }
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { say(MSG.invalid_email); eI.focus(); return; }
    if (body.length < 5) { say(MSG.invalid_body); bI.focus(); return; }
    if (!apiOn) { say("Messaging is unavailable right now. Please use email instead."); return; }
    btn.disabled = true; say("Sending…", true);
    try {
      const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/submit_message`, { method: "POST", headers: { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ p_name: name, p_email: email, p_body: body, p_page: document.body.dataset.page || "", p_hp: hp.value }) });
      if (!r.ok) { let code = ""; try { const j = await r.json(); code = String(j.message || ""); } catch (_) {} say(MSG[code] || "Couldn’t send right now. Please try again later, or email me directly."); return; }
      f.reset(); say("Thank you! Your message is on its way.", true);
    } catch (_) { say("Couldn’t reach the server. Check your connection and try again."); }
    finally { btn.disabled = false; }
  });
}

/** Journey: Everything / Education / Career filter, and a timeline line that fills as you scroll. */
export function wireJourney() {
  const seg = document.querySelector(".jf"), tl = document.querySelector(".tl"); if (!seg || !tl) return;
  seg.onclick = (e) => { const b = e.target.closest("button[data-f]"); if (!b) return;
    seg.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    tl.querySelectorAll(":scope > li").forEach((li) => { li.hidden = !!b.dataset.f && li.dataset.k !== b.dataset.f; if (!li.hidden) li.classList.add("in"); }); fill(); };
  const fill = () => { const r = tl.getBoundingClientRect(), mid = window.innerHeight * 0.6; tl.style.setProperty("--fill", String(Math.max(0, Math.min(1, (mid - r.top) / Math.max(1, r.height))))); };
  if (!tl.dataset.bound) { tl.dataset.bound = "1"; window.addEventListener("scroll", () => requestAnimationFrame(fill), { passive: true }); window.addEventListener("resize", fill); }
  fill();
}

/** Projects: filter cards by tool (chips built from the tools actually used). */
export function wireProjects() {
  const box = document.getElementById("pf"), cards = [...document.querySelectorAll(".proj[data-tools]")]; if (!box || !cards.length) return;
  const key = (t) => t.trim().toLowerCase(), count = {}, label = {};                       // "Django" and "DJango" are one tool
  cards.forEach((c) => { c.dataset.k = c.dataset.tools.split("|").map(key).join("|"); new Set(c.dataset.tools.split("|").filter(Boolean)).forEach((t) => { const k = key(t); count[k] = (count[k] || 0) + 1; if (!label[k] || /[a-z]/.test(t[0]) === false) label[k] = label[k] || t; }); });
  const tools = Object.keys(count).sort((a, b) => count[b] - count[a] || a.localeCompare(b)).slice(0, 10);
  if (!tools.length) { box.remove(); return; }
  box.innerHTML = "";
  const mk = (label, val) => { const b = document.createElement("button"); b.type = "button"; b.dataset.t = val; b.textContent = label; b.setAttribute("aria-pressed", String(val === "")); box.append(b); };
  mk("All projects", ""); tools.forEach((t) => mk(`${label[t]} (${count[t]})`, t));
  box.onclick = (e) => { const b = e.target.closest("button[data-t]"); if (!b) return;
    box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    cards.forEach((c) => { c.hidden = !!b.dataset.t && !c.dataset.k.split("|").includes(b.dataset.t); if (!c.hidden) c.classList.add("in"); });
    document.querySelectorAll(".gap, .section-head").forEach((h) => { const grid = h.closest(".gap") ? h.closest(".gap").nextElementSibling : h.nextElementSibling; if (grid && grid.classList.contains("grid")) { const any = [...grid.children].some((c) => !c.hidden); (h.closest(".gap") || h).hidden = !any; grid.hidden = !any; } }); };
}
