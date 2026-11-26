// moments.js - public photo collection. Views: grid (masonry), timeline (by year), story (slideshow).
// Search, year/place filters, sort, lightbox, and shareable links (#m-<id>). Rows are cached on this device for an instant repaint.
import { openLightbox } from "./lightbox.js?v=202611270310";
import { head, esc, fmt, imageURL, ICON, copy } from "./render.js?v=202611270310";
const cfg = window.SITE_CONFIG || {};
const on = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") && !!cfg.SUPABASE_ANON_KEY && !/YOUR-/.test(cfg.SUPABASE_ANON_KEY);
const KEY = "sc:v1:moments", FRESH = 120000;
const lget = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (_) { return null; } };
const lset = (rows) => { try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), rows })); } catch (_) {} };

export const photoURL = (m) => m.storage_path ? `${cfg.SUPABASE_URL}/storage/v1/object/public/moments-private/${String(m.storage_path).split("/").map(encodeURIComponent).join("/")}` : m.image ? imageURL(m.image) : "";

/** cb(rows, {source}) - cache first, then the API. Throws only through cb(null, {error}). */
export async function loadMoments(cb) {
  const c = lget(); if (c && Array.isArray(c.rows)) cb(c.rows, { source: "cache" });
  if (c && Date.now() - c.t < FRESH) return;
  if (!on) { if (!c) cb(null, { error: "off" }); return; }
  try {
    const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/moments?select=id,date,place,caption,storage_path,image&status=eq.published&order=date.desc,id.desc`, { headers: { apikey: cfg.SUPABASE_ANON_KEY, Accept: "application/json" } });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const rows = await r.json(); lset(rows); cb(rows, { source: "api" });
  } catch (e) { if (!c) cb(null, { error: String(e.message || e) }); }
}

export function mountMoments(main) {
  const st = { rows: [], q: "", year: "", place: "", sort: "new", view: (() => { try { return localStorage.getItem("sc:v1:mview") || "grid"; } catch (_) { return "grid"; } })(), timer: null, story: 0 };
  main.innerHTML = head("moments", "Moments", copy(window.SiteBoot && window.SiteBoot.current(), "moments")) +
    `<div class="wrap" id="mroot"><div class="skl">${'<div class="skel sq"></div>'.repeat(8)}</div></div>`;
  const root = document.getElementById("mroot");

  const filtered = () => {
    const q = st.q.toLowerCase();
    const f = st.rows.filter((m) => (!st.year || String(m.date).startsWith(st.year)) && (!st.place || m.place === st.place) && (!q || `${m.place} ${m.caption} ${m.date}`.toLowerCase().includes(q)));
    return st.sort === "old" ? f.slice().reverse() : f;
  };
  const items = (list) => list.map((m) => ({ src: photoURL(m), alt: m.caption || `Moment from ${m.place}`, title: m.place || fmt(m.date), sub: [fmt(m.date), m.caption].filter(Boolean).join(" · "), id: m.id })).filter((x) => x.src);
  const openAt = (list, id) => { const it = items(list), i = it.findIndex((x) => x.id === id); if (i >= 0) openLightbox(it, i, { onChange: (x) => { try { history.replaceState(null, "", x ? "#m-" + x.id : location.pathname + location.search); } catch (_) {} } }); };

  const shell = () => {
    const years = [...new Set(st.rows.map((m) => String(m.date).slice(0, 4)))].sort().reverse();
    const places = [...new Set(st.rows.map((m) => m.place).filter(Boolean))].sort((a, b) => a.localeCompare(b));
    root.innerHTML = `<div class="mtools"><input id="mq" type="search" placeholder="Search places, captions, dates" aria-label="Search moments" value="${esc(st.q)}">
<select id="my" aria-label="Filter by year"><option value="">All years</option>${years.map((y) => `<option${y === st.year ? " selected" : ""}>${y}</option>`).join("")}</select>
<select id="mp" aria-label="Filter by place"><option value="">All places</option>${places.map((p) => `<option${p === st.place ? " selected" : ""} value="${esc(p)}">${esc(p)}</option>`).join("")}</select>
<select id="ms" aria-label="Sort"><option value="new"${st.sort === "new" ? " selected" : ""}>Newest first</option><option value="old"${st.sort === "old" ? " selected" : ""}>Oldest first</option></select>
<div class="mview" role="group" aria-label="View">${[["grid", "Grid", ICON.grid], ["timeline", "Timeline", ICON.list], ["story", "Slideshow", ICON.play]].map(([k, l, ic]) => `<button type="button" data-v="${k}" aria-pressed="${st.view === k}">${ic}<span>${l}</span></button>`).join("")}</div></div>
<p class="mstat" id="mn" aria-live="polite"></p><div id="mbody"></div>`;
    const $ = (id) => document.getElementById(id);
    $("mq").oninput = (e) => { st.q = e.target.value.trim(); draw(); };
    $("my").onchange = (e) => { st.year = e.target.value; draw(); };
    $("mp").onchange = (e) => { st.place = e.target.value; draw(); };
    $("ms").onchange = (e) => { st.sort = e.target.value; draw(); };
    root.querySelector(".mview").onclick = (e) => { const b = e.target.closest("button[data-v]"); if (!b) return; st.view = b.dataset.v; try { localStorage.setItem("sc:v1:mview", st.view); } catch (_) {} root.querySelectorAll(".mview button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
    draw();
  };

  const draw = () => {
    clearInterval(st.timer); st.timer = null;
    const list = filtered(), body = document.getElementById("mbody"), n = document.getElementById("mn");
    const places = new Set(list.map((m) => m.place).filter(Boolean)).size;
    n.textContent = list.length ? `${list.length} moment${list.length === 1 ? "" : "s"} · ${places} place${places === 1 ? "" : "s"}${list.length ? ` · ${String(list[list.length - 1].date).slice(0, 4)}–${String(list[0].date).slice(0, 4)}`.replace(/(\d{4})–\1/, "$1") : ""}` : "";
    if (!list.length) { body.innerHTML = `<div class="mempty"><b>${st.rows.length ? "No moments match" : "Nothing here yet"}</b><p class="muted">${st.rows.length ? "Try clearing the search or filters." : "New moments will appear here."}</p></div>`; return; }
    if (st.view === "timeline") {
      let year = ""; const out = [];
      list.forEach((m) => { const y = String(m.date).slice(0, 4); if (y !== year) { year = y; out.push(`<li class="myear-row"><div class="myear"><span>${y}</span></div></li>`); }
        const u = photoURL(m); out.push(`<li><article class="card"><button class="media" type="button" data-id="${m.id}" aria-label="View larger: ${esc(m.place || fmt(m.date))}">${u ? `<img src="${esc(u)}" alt="${esc(m.caption || "Moment from " + m.place)}" loading="lazy" decoding="async" data-hide>` : ""}</button><div class="body"><p class="when"><time datetime="${esc(m.date)}">${esc(fmt(m.date))}</time></p><h3>${esc(m.place || "Untitled")}</h3>${m.caption ? `<p>${esc(m.caption)}</p>` : ""}</div></article></li>`); });
      body.innerHTML = `<ol class="mtl">${out.join("")}</ol>`;
    } else if (st.view === "story") {
      const it = items(list); if (!it.length) { body.innerHTML = '<div class="mempty"><b>No photos to play</b></div>'; return; }
      st.story = Math.min(st.story, it.length - 1);
      body.innerHTML = `<div class="mstory" tabindex="0" aria-roledescription="slideshow" aria-label="Moments slideshow"><div class="bar2"><i id="sbar"></i></div>${it.map((x, i) => `<img src="${esc(x.src)}" alt="${esc(x.alt)}" ${i === st.story ? 'class="on"' : 'loading="lazy"'} decoding="async" data-hide>`).join("")}
<div class="cap"><b id="st"></b><span id="ss"></span></div><div class="ctl"><button type="button" id="sp" aria-label="Previous">‹</button><button type="button" id="sx" aria-label="Pause">${ICON.pause}</button><button type="button" id="sn" aria-label="Next">›</button></div></div>`;
      const imgs = body.querySelectorAll(".mstory img"), bar = document.getElementById("sbar"), box = body.querySelector(".mstory");
      let playing = true, t0 = 0; const DUR = 5000;
      const show = (i) => { imgs[st.story].classList.remove("on"); st.story = (i + it.length) % it.length; imgs[st.story].classList.add("on"); document.getElementById("st").textContent = it[st.story].title; document.getElementById("ss").textContent = `${st.story + 1}/${it.length} · ${it[st.story].sub}`; t0 = Date.now(); };
      const tick = () => { if (!playing) return; const p = Math.min(1, (Date.now() - t0) / DUR); bar.style.transform = `scaleX(${p})`; if (p >= 1) show(st.story + 1); };
      show(st.story); st.timer = setInterval(tick, 100);
      const pp = document.getElementById("sx");
      pp.onclick = () => { playing = !playing; pp.innerHTML = playing ? ICON.pause : ICON.play; pp.setAttribute("aria-label", playing ? "Pause" : "Play"); t0 = Date.now(); bar.style.transform = "scaleX(0)"; };
      document.getElementById("sp").onclick = () => show(st.story - 1); document.getElementById("sn").onclick = () => show(st.story + 1);
      box.onkeydown = (e) => { if (e.key === "ArrowLeft") show(st.story - 1); else if (e.key === "ArrowRight") show(st.story + 1); else if (e.key === " ") { e.preventDefault(); pp.click(); } };
      box.querySelectorAll("img").forEach((im) => { im.onclick = () => openAt(list, it[st.story].id); });
      let x0 = null; box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true }); box.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(st.story + (dx < 0 ? 1 : -1)); x0 = null; });
      return;
    } else {
      body.innerHTML = `<div class="mgrid">${list.map((m) => { const u = photoURL(m); return `<div class="mtile"><button type="button" data-id="${m.id}" aria-label="View larger: ${esc(m.place || fmt(m.date))}">${u ? `<img src="${esc(u)}" alt="${esc(m.caption || "Moment from " + m.place)}" loading="lazy" decoding="async" data-hide>` : '<span class="noimg">No photo</span>'}<span class="ov"><b>${esc(m.place || "Untitled")}</b><span>${esc(fmt(m.date))}${m.caption ? " · " + esc(m.caption) : ""}</span></span></button></div>`; }).join("")}</div>`;
    }
    body.onclick = (e) => { const b = e.target.closest("button[data-id]"); if (b) openAt(list, Number(b.dataset.id)); };
  };

  let first = true;
  loadMoments((rows, meta) => {
    if (!rows) { root.innerHTML = `<div class="mempty"><b>Moments are unavailable right now</b><p class="muted">Please try again in a little while.</p></div>`; return; }
    st.rows = rows; shell();
    if (first) { first = false; const m = /^#m-(\d+)$/.exec(location.hash); if (m) openAt(filtered(), Number(m[1])); }
  });
}

/** Home page strip: the latest few moments, if the section is enabled. */
export function fillHomeStrip(R) {
  const sec = document.getElementById("home-moments"), strip = document.getElementById("strip"); if (!sec || !strip) return;
  loadMoments((rows) => {
    const list = (rows || []).filter((m) => photoURL(m)).slice(0, 10); if (!list.length) return;
    strip.innerHTML = list.map((m) => `<a href="${R}moments/#m-${m.id}"><img src="${esc(photoURL(m))}" alt="${esc(m.caption || "Moment from " + m.place)}" loading="lazy" decoding="async" data-hide><span>${esc(m.place || "")} · ${esc(fmt(m.date))}</span></a>`).join("");
    sec.hidden = false;
  });
}
