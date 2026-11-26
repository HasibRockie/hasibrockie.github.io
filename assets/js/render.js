// render.js - header/footer and every page. All dynamic text goes through esc(); Markdown goes through the sanitiser in md.js.
import { renderMd } from "./md.js?v=202611270253";
const B = document.body, R = B.dataset.root || "", P = B.dataset.page;
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
export const imageURL = (src) => (/^https:\/\//i.test(src) ? src : /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src) ? "" : R + src);
const im = (src, alt, w, h, cls) => { const u = src ? imageURL(src) : ""; return u ? `<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy" decoding="async"${w ? ` width="${w}" height="${h}"` : ""}${cls ? ` class="${cls}"` : ""} data-hide>` : ""; };
const link = (l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`;
const href = (h) => (/^https:\/\//i.test(h) ? h : R + h);
export const CAT = { "ফিকশন": "Fiction", "ব্যক্তিগত": "Personal", "ধর্মীয়": "Faith", "ব্লগ": "Blog", "অন্যান্য": "Other" };
export const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const PAGE_HREF = { home: "index.html", about: "about.html", journey: "journey.html", skills: "skills.html", projects: "projects.html", achievements: "achievements.html", writing: "blogs/", post: "blogs/", memories: "memories/", gallery: "gallery.html", moments: "moments/" };
const SHEET = { home: "Home", about: "About", journey: "Journey", skills: "Skills", projects: "Projects", achievements: "Achievements", gallery: "Gallery", writing: "Writing", memories: "Memories", moments: "Moments" };
const KICKER = { home: "Welcome", about: "About me", journey: "Education & career", skills: "Toolkit", projects: "Selected work", achievements: "Recognition",
  gallery: "Photographs", writing: "Stories & essays", memories: "Personal archive", moments: "Photo journal" };
export const sheetNo = (page) => KICKER[page] || SHEET[page] || "";
// Built-in page text; Site settings > Page text can override each line.
export const COPY = {
  journey: "From a primary school in Lakshmipur to BUET, public service and the 47th BCS: the milestones of my education and career, in order.",
  skills: "The engineering software, programming languages and research methods I rely on, and the fields I keep learning.",
  projects: "Research in fluid and thermal engineering alongside software and security work. Filter by tool to see where each one was used.",
  achievements: "Recognition, leadership roles and training that shaped how I work with people and with problems.",
  gallery: "Workshops, competitions, campus life, and the hobbies that keep me curious.",
  writing: "Fiction, essays and reflections, mostly in Bangla: stories about people, memory and faith.",
  memories: "Personal pieces arranged by year: school days, college, BUET, and the stretches in between.",
  moments: "Little pieces of time, kept in one place: travels, campus days, family and the ordinary afternoons worth remembering.",
  explore: "Pick a starting point: my background, my work, or my writing.", latest: "New stories and essays, mostly in Bangla.",
  projectsHome: "Engineering research first, web and security work on the side.", momentsHome: "Little pieces of time, kept in one place."
};
export const copy = (S, k) => esc((S && S.copy && S.copy[k]) || COPY[k] || "");
const readMin = (words) => Math.max(1, Math.round((words || 0) / 180));

// tiny inline icons (markup only; no inline styles or handlers)
const svg = (d, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
export const ICON = {
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', "sun"),
  moon: svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', "moon"),
  burger: svg('<path d="M4 7h16M4 12h16M4 17h16"/>', "burger"), x: svg('<path d="M6 6l12 12M18 6L6 18"/>', "x"),
  up: svg('<path d="M12 19V5M5 12l7-7 7 7"/>'), arrow: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  grid: svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
  list: svg('<path d="M12 3v18M7 7h-3M7 12h-3M7 17h-3M20 7h-4M20 12h-4M20 17h-4"/>'), play: svg('<path d="M7 4l13 8-13 8z"/>'), pause: svg('<path d="M8 4v16M16 4v16"/>')
};

// ---------- chrome
export function chrome(S, site) {
  const name = S.siteTitle || (site && site.name) || "Md Hasibul Islam", brand = S.siteTitle || "Hasib";
  const nav = S.nav.filter((n) => n.visible), cur = PAGE_HREF[P];
  const social = (S.social.length ? S.social : (site && site.social) || []);
  const a = S.announcement || {}, today = new Date().toISOString().slice(0, 10);
  const annKey = "ann:" + hash(a.text + a.link), dismissed = (() => { try { return localStorage.getItem("sc:v1:ann") === annKey; } catch (_) { return false; } })();
  const showAnn = a.enabled && a.text && (!a.until || a.until >= today) && !dismissed;
  const ann = showAnn ? `<div class="announce" data-tone="${esc(a.tone)}" role="region" aria-label="Announcement"><div class="wrap"><p>${esc(a.text)}${a.link ? `<a href="${esc(href(a.link))}">${esc(a.linkLabel || "Learn more")} →</a>` : ""}</p><button type="button" class="ann-x" aria-label="Dismiss announcement" data-key="${esc(annKey)}">×</button></div></div>` : "";
  const head = `${ann}<header class="top"><div class="wrap bar"><a class="brand" href="${R}index.html"><img src="${R}assets/imgs/hasib-logo.png" alt="" width="34" height="34"><span>${esc(brand)}</span></a>
<nav id="nav" class="nav" aria-label="Primary">${nav.map((n) => `<a href="${esc(href(n.href))}"${n.href === cur ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`).join("")}</nav>
<div class="actions"><button class="theme icon-btn" type="button" aria-label="Switch between light and dark colours">${ICON.sun}${ICON.moon}</button><button class="menu icon-btn" type="button" aria-expanded="false" aria-controls="nav" aria-label="Menu">${ICON.burger}${ICON.x}</button></div></div></header>`;
  const foot = `<footer><div class="wrap"><div class="fgrid"><div><p class="fbrand"><img src="${R}assets/imgs/hasib-logo.png" alt="" width="40" height="40">${esc(brand)}</p><p class="muted">${esc(S.tagline || (site && site.tagline) || "")}</p>${site && site.email ? `<p class="after"><a class="btn sm ghost" href="${R}about.html#contact">Get in touch</a></p>` : ""}</div>
<div><h2>Explore</h2><ul>${nav.slice(0, 10).map((n) => `<li><a href="${esc(href(n.href))}">${esc(n.label)}</a></li>`).join("")}</ul></div>
<div><h2>Connect</h2><ul>${social.map((l) => `<li>${link(l)}</li>`).join("")}</ul></div></div>
<div class="fbot"><p>© ${new Date().getFullYear()} ${esc(name)}${S.footerText ? " · " + esc(S.footerText) : ""}</p><p><a href="#main" class="totop-link">Back to top ↑</a></p></div></div></footer>`;
  if (!document.querySelector(".skip")) B.insertAdjacentHTML("afterbegin", '<a class="skip" href="#main">Skip to content</a>');
  const old = document.querySelector("header.top"), oldF = document.querySelector("footer"), oldA = document.querySelector(".announce");
  const open = old && old.querySelector(".menu") && old.querySelector(".menu").getAttribute("aria-expanded") === "true";
  if (oldA) oldA.remove();
  if (old) old.outerHTML = head; else document.querySelector(".skip").insertAdjacentHTML("afterend", head);
  if (oldF) oldF.outerHTML = foot; else B.insertAdjacentHTML("beforeend", foot);
  if (!document.querySelector(".totop")) B.insertAdjacentHTML("beforeend", `<button class="totop" type="button" aria-label="Back to top">${ICON.up}</button>`);
  const nv = document.getElementById("nav"), mb = document.querySelector(".menu"), top = document.querySelector("header.top");
  const setOpen = (on) => { if (on) nv.style.setProperty("--nav-top", Math.round(top.getBoundingClientRect().bottom) + "px"); nv.classList.toggle("open", on); mb.setAttribute("aria-expanded", String(on)); };
  if (open) setOpen(true);
  mb.onclick = () => setOpen(!nv.classList.contains("open"));
  nv.onclick = (e) => { if (e.target.closest("a")) setOpen(false); };
  document.onkeydown = (e) => { if (e.key === "Escape" && nv.classList.contains("open")) { setOpen(false); mb.focus(); } };
  document.querySelector(".theme").onclick = () => window.SiteBoot.toggle();
  const ax = document.querySelector(".ann-x"); if (ax) ax.onclick = () => { try { localStorage.setItem("sc:v1:ann", ax.dataset.key); } catch (_) {} ax.closest(".announce").remove(); };
}
function hash(s) { let h = 0; for (let i = 0; i < String(s).length; i++) h = (h * 31 + String(s).charCodeAt(i)) | 0; return (h >>> 0).toString(36); }

// ---------- states
const skel = (n = 3) => Array.from({ length: n }, (_, i) => `<div class="skel ${i % 3 === 2 ? "w3" : ""}"></div>`).join("");
const skelCards = (n = 6) => `<ul class="skl">${Array.from({ length: n }, () => '<li><div class="skel sq"></div><div class="skel h"></div><div class="skel"></div><div class="skel w3"></div></li>').join("")}</ul>`;
export function skeleton(page) {
  const body = page === "home" ? `<section class="hero"><div class="wrap hero-grid"><div><div class="skel w2"></div><div class="skel h1"></div><div class="skel w1"></div><div class="skel w2"></div></div><div class="skel box"></div></div></section><div class="wrap">${skelCards(3)}</div>`
    : page === "post" ? `<div class="wrap"><div class="article"><div class="skel h1"></div><div class="skel w2"></div><div class="skel box"></div>${skel(8)}</div></div>`
    : `<section class="phead"><div class="wrap"><div class="skel w2"></div><div class="skel h1"></div><div class="skel w1"></div></div></section><div class="wrap">${skelCards(6)}</div>`;
  return `<div class="skeleton" role="status" aria-busy="true" aria-label="Loading content">${body}</div>`;
}
const empty = (msg) => `<div class="wrap"><p class="empty">${esc(msg)}</p></div>`;
export const errorState = (retry) => `<div class="wrap err"><h1>Can’t load this page right now</h1><p>The server didn’t answer and no saved copy is available. Check your connection and try again.</p><p><button class="btn" id="retry">${esc(retry || "Try again")}</button></p></div>`;
export const notice = (meta) => !meta ? "" : meta.source === "snapshot" ? `<div class="wrap"><p class="notice" role="status">Showing a saved copy of this site. The newest edits may be missing.</p></div>`
  : meta.offline ? `<div class="wrap"><p class="notice" role="status">You look offline, or the server is slow. Showing the last copy saved on this device.</p></div>` : "";

export const head = (page, t, p, extra = "") => `<section class="phead"><div class="pattern" aria-hidden="true"></div><div class="wrap"><p class="sheet">${esc(sheetNo(page))}</p><h1>${t}</h1>${p ? `<p class="lead">${p}</p>` : ""}${extra}</div></section>`;
const wrap = (h) => `<div class="wrap">${h}</div>`;
const sec = (n, t, sub, more) => `<div class="section-head rv"><div><h2>${esc(t)}</h2>${sub ? `<p>${sub}</p>` : ""}</div>${more || ""}</div>`;
const thumbOf = (p) => (p.cover && /^https:\/\//i.test(p.cover) ? p.cover : `assets/imgs/fiction/post${p.id}.png`);
export const postCards = (ps) => ps.map((p) => `<li class="rv"><a class="card pcard" href="${R}post/${p.id}/"><div class="media">${im(thumbOf(p), "")}<span class="tag">${esc(CAT[p.category] || p.category)}</span></div><div class="body"><h3 lang="bn">${esc(p.title)}</h3>${p.excerpt ? `<p lang="bn">${esc(p.excerpt)}</p>` : ""}<div class="foot"><time datetime="${esc(p.date)}">${esc(fmt(p.date))}</time>${p.words ? `<span>${readMin(p.words)} min read</span>` : ""}</div></div></a></li>`).join("");
const projCard = (p, i) => `<article class="card proj hov rv" data-tools="${esc((p.tools || []).join("|"))}"><div class="media">${im(p.img, p.title)}</div><div class="body"><p class="meta">${esc(p.meta)}</p><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>${(p.people || []).map((x) => `<p class="people"><b>${esc(x[0])}:</b> ${esc(x[1])}</p>`).join("")}${p.tools && p.tools.length ? `<ul class="chips">${p.tools.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}${(p.links || []).length ? `<div class="links">${p.links.map(link).join("")}</div>` : ""}</div></article>`;
const traits = (q) => String(q || "").split("|").map((x) => x.trim()).filter(Boolean);

// ---------- pages (each returns HTML)
export const pages = {
  home(d, posts, S) {
    const s = d.site || {}, tb = d.titleblock || [], hero = S.hero, photo = S.heroPhoto && d.about && d.about.photo;
    const brand = S.siteTitle || s.name || "", nameRow = tb.find((r) => /^name$/i.test(String(r[0]).trim())), title = (nameRow && nameRow[1]) || brand, tr = traits(s.quote);
    const role = S.heroRole || "", quote = S.tagline || s.tagline || "", rows = tb.filter((r) => r !== nameRow);
    const social = (S.social.length ? S.social : s.social || []).slice(0, 5);
    const card = hero === "minimal" ? "" : `<aside class="profile rv${photo ? "" : " nophoto"}" aria-label="Profile">${photo ? `<div class="pf-photo">${im(d.about.photo, "Portrait of " + title)}</div>` : ""}
<div class="pf-body"><p class="sheet">Profile</p><h2 class="pf-name">${esc(title)}</h2>${role ? `<p class="pf-role">${esc(role)}</p>` : ""}
${rows.length ? `<dl class="pf-grid">${rows.map((r) => `<div><dt>${esc(r[0])}</dt><dd>${esc(r[1])}</dd></div>`).join("")}</dl>` : ""}
<div class="pf-links">${s.email ? `<a class="btn sm" href="mailto:${esc(s.email)}">Email me</a>` : ""}${s.resume ? `<a class="btn sm ghost" href="${esc(s.resume)}" target="_blank" rel="noopener">Résumé</a>` : ""}${social.map((l) => `<a class="pf-chip" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("")}</div></div></aside>`;
    const heroHtml = `<section class="hero" data-layout="${esc(hero)}"><div class="pattern" aria-hidden="true"></div><div class="wrap"><div class="hero-main"><p class="sheet">${esc(brand && brand !== title ? brand : "Welcome")}</p><h1><span class="hl">${esc(title)}</span></h1>${role ? `<p class="lead role">${esc(role)}</p>` : ""}${quote ? `<p class="${role ? "quote" : "lead"}">${esc(quote)}</p>` : ""}
<div class="cta"><a class="btn" href="${R}projects.html">See my work <span class="arrow">→</span></a><a class="btn ghost" href="${R}blogs/">Read my stories</a></div>${tr.length ? `<ul class="traits" aria-label="In a few words">${tr.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}</div>
${card}</div></section>`;
    let n = 0;
    const secs = S.sections.filter((x) => x.visible).map((x) => {
      if (x.key === "explore") return (d.explore || []).length ? `<section class="wrap section explore">${sec(++n, "Explore", copy(S, "explore"))}<ul class="grid g3 plist">${d.explore.map((e, i) => `<li class="rv"><a class="card" href="${href(e[1])}"><span class="go">${ICON.arrow}</span><div class="body"><h3>${esc(e[0])}</h3><p>${esc(e[2])}</p></div></a></li>`).join("")}</ul></section>` : "";
      if (x.key === "latest") return `<section class="wrap section">${sec(++n, "Latest writing", copy(S, "latest"), `<a class="link-arrow" href="${R}blogs/">All posts</a>`)}${posts.length ? `<ul class="grid g3 plist">${postCards(posts.slice(0, 3))}</ul>` : '<p class="empty">No posts published yet.</p>'}</section>`;
      if (x.key === "projects") { const ps = [...(d.projects || []), ...(d.other_projects || [])].slice(0, 3); return ps.length ? `<section class="wrap section">${sec(++n, "Selected projects", copy(S, "projectsHome"), `<a class="link-arrow" href="${R}projects.html">All projects</a>`)}<ul class="grid g3 plist">${ps.map((p) => `<li class="rv"><a class="card" href="${R}projects.html"><div class="media">${im(p.img, p.title)}</div><div class="body"><p class="num">${esc(p.meta)}</p><h3>${esc(p.title)}</h3></div></a></li>`).join("")}</ul></section>` : ""; }
      if (x.key === "moments") return `<section class="wrap section" id="home-moments" hidden>${sec(++n, "Moments", copy(S, "momentsHome"), `<a class="link-arrow" href="${R}moments/">Open the gallery</a>`)}<div class="strip" id="strip"></div></section>`;
      return "";
    }).join("");
    return heroHtml + secs;
  },
  about(d) {
    const a = d.about; if (!a) return empty("This section hasn’t been published yet.");
    const s = d.site || {};
    const facts = [...(a.facts || []).map((f) => [f[0], esc(f[1])]), ...(s.email ? [["Email", `<a href="mailto:${esc(s.email)}">${esc(s.email)}</a>`]] : []), ...(s.social || []).filter((l) => /LinkedIn|Scholar|GitHub/.test(l.label)).map((l) => [l.label, link({ label: "Open profile ↗", url: l.url })])];
    return head("about", "About", esc(a.intro || "A BUET-trained mechanical engineer working where engineering, research and software meet.")) + wrap(`<div class="split"><div class="portrait rv">${im(a.photo, "Portrait of " + (s.name || "the author"))}</div><div><div class="prose rv">${(a.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
<dl class="facts">${facts.map((f) => `<div class="rv"><dt>${esc(f[0])}</dt><dd>${f[1]}</dd></div>`).join("")}</dl></div></div>
<section class="section more">${sec(1, "More about me")}<ul class="grid g3 plist">${[["skills.html", "Skills", "Languages, software and tools I work with."], ["achievements.html", "Achievements", "Awards, leadership and training."], ["memories/", "Memories", "Personal posts from school, college and BUET."]].map(([u, t, d]) => `<li class="rv"><a class="card" href="${R}${u}"><span class="go">${ICON.arrow}</span><div class="body"><h3>${t}</h3><p>${d}</p></div></a></li>`).join("")}</ul></section>${contactForm()}`);
  },
  journey(d, posts, S) {
    const t = d.timeline || [];
    return head("journey", "Journey", copy(S, "journey"), '<div class="seg jf" role="group" aria-label="Show"><button type="button" data-f="" aria-pressed="true">Everything</button><button type="button" data-f="edu" aria-pressed="false">Education</button><button type="button" data-f="work" aria-pressed="false">Career</button></div>') + (t.length ? wrap(`<ol class="tl">${t.map((x) => `<li class="rv" data-k="${/school|college|ssc|hsc|b\.?\s?sc|bachelor|master|mba|university|degree|primary|secondary/i.test(x.title + " " + x.org) && !/officer|commissioner|training|engineer at/i.test(x.title) ? "edu" : "work"}"><span class="logo${x.img ? "" : " dot"}">${im(x.img, x.org, 56, 56)}</span><div class="card"><div class="body"><p class="when">${esc(x.period)}</p><h3>${esc(x.title)}</h3><p class="org">${esc(x.org)}</p>${x.text ? `<p>${esc(x.text)}</p>` : ""}${x.points ? `<ul>${x.points.map((y) => `<li>${esc(y)}</li>`).join("")}</ul>` : ""}${x.link ? `<p>${link(x.link)}</p>` : ""}</div></div></li>`).join("")}</ol>`) : empty("Nothing published here yet."));
  },
  skills(d, posts, S) {
    const g = d.skills || [];
    const cards = g.map((x, i) => `<section class="card skillcard rv"><div class="body"><h2>${esc(x.group)}</h2><ul class="chips">${(x.items || []).map((it) => `<li>${esc(it)}</li>`).join("")}</ul></div></section>`).join("");
    return head("skills", "Skills", copy(S, "skills")) + wrap((cards ? `<div class="grid g2">${cards}</div>` : "") + (d.interests ? `<section class="card skillcard rv gap"><div class="body"><h2>Interests</h2><p>${esc(d.interests)}</p></div></section>` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  projects(d, posts, S) {
    const a = d.projects || [], b = d.other_projects || [];
    return head("projects", "Projects", copy(S, "projects"), '<div class="seg pf" id="pf" role="group" aria-label="Filter by tool"></div>') + wrap((a.length ? `${sec(1, "Research and coursework")}<div class="grid g2">${a.map(projCard).join("")}</div>` : "") + (b.length ? `<div class="gap">${sec(2, "Web and security projects")}</div><div class="grid g2">${b.map(projCard).join("")}</div>` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  achievements(d, posts, S) {
    const a = d.achievements || [];
    return head("achievements", "Achievements", copy(S, "achievements")) + wrap(a.length ? `<div class="grid g3">${a.map((x) => `<article class="card ach hov rv">${x.img ? `<div class="media">${im(x.img, x.title, 400, 300)}</div>` : ""}<div class="body"><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></div></article>`).join("")}</div>` : '<p class="empty">Nothing published here yet.</p>');
  },
  gallery(d, posts, S) {
    const h = d.hobbies || [], p = d.photos || [];
    return head("gallery", "Gallery", copy(S, "gallery")) + wrap((h.length ? `${sec(1, "Hobbies")}<ul class="chips rv">${h.map((x) => `<li>${esc(x.title)}</li>`).join("")}</ul>` : "") + (p.length ? `<div class="gap">${sec(2, "Photographs", "Tap a photo to view it larger.")}</div><div class="cols" id="gal">${p.map((x, i) => `<figure class="rv"><button type="button" data-i="${i}" aria-label="View photo: ${esc(x.caption || "photo " + (i + 1))}">${im(x.img, x.caption)}</button>${x.caption ? `<figcaption>${esc(x.caption)}</figcaption>` : ""}</figure>`).join("")}</div>` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  writing(d, posts, S) {
    const cats = [...new Set(posts.map((p) => p.category))];
    return head("writing", "Writing", copy(S, "writing")) + wrap(`<div class="tools"><input id="q" type="search" placeholder="Search titles and excerpts" aria-label="Search posts"><button class="btn sm ghost" type="button" id="rnd">Surprise me</button><ul class="seg" id="cats"><li><button aria-pressed="true" data-c="">All</button></li>${cats.map((c) => `<li><button aria-pressed="false" data-c="${esc(c)}">${CAT[c] || esc(c)}</button></li>`).join("")}</ul></div><p class="small muted" id="n" aria-live="polite"></p><ul class="grid g3 plist" id="list"></ul><p class="after"><a class="link-arrow" href="${R}memories/">Personal memories, year by year</a></p>`);
  },
  memories(d, posts, S) {
    const ps = posts.filter((p) => p.category === "ব্যক্তিগত"), by = {}; ps.forEach((p) => (by[p.date.slice(0, 4)] ||= []).push(p));
    return head("memories", "Memories", copy(S, "memories")) + wrap(Object.keys(by).sort().reverse().map((y) => `<h2 class="year rv">${y}</h2><ul class="grid g3 plist">${postCards(by[y])}</ul>`).join("") || '<p class="empty">Nothing published here yet.</p>');
  },
  404() { return `<div class="wrap err"><h1>Page not found</h1><p>This address doesn’t exist. Try the <a href="${R}index.html">home page</a> or the <a href="${R}blogs/">writing archive</a>.</p></div>`; }
};

function contactForm() {
  return `<section class="contact rv" id="contact" aria-labelledby="ct"><div class="pattern" aria-hidden="true"></div><div><p class="sheet">Correspondence</p><h2 id="ct">Get in touch</h2><p class="muted">Questions, collaborations, or just a hello. Messages come straight to my inbox; I usually reply within a few days.</p></div>
<form id="cf" novalidate><div class="row2"><div class="field"><label for="cf-n">Your name</label><input id="cf-n" name="name" autocomplete="name" maxlength="80" required></div><div class="field"><label for="cf-e">Email <span class="muted">(so I can reply)</span></label><input id="cf-e" name="email" type="email" autocomplete="email" maxlength="120"></div></div>
<div class="field"><label for="cf-b">Message</label><textarea id="cf-b" name="body" maxlength="4000" required></textarea></div><div class="hp" aria-hidden="true"><label for="cf-w">Website</label><input id="cf-w" name="website" tabindex="-1" autocomplete="off"></div>
<div class="cta"><button class="btn" type="submit">Send message <span class="arrow">→</span></button></div><p class="form-msg" id="cf-m" role="status" aria-live="polite"></p></form></section>`;
}

export function wireWriting(posts, state) {
  const list = document.getElementById("list"), n = document.getElementById("n"), q = document.getElementById("q");
  if (!list) return;
  q.value = state.q || "";
  document.querySelectorAll("#cats button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === (state.c || ""))));
  const draw = () => { const f = posts.filter((p) => (!state.c || p.category === state.c) && (p.title + " " + (p.excerpt || "")).toLowerCase().includes(state.q || "")); list.innerHTML = postCards(f).replace(/class="rv"/g, "") || `<li class="muted">No posts match. Clear the search or pick another category.</li>`; n.textContent = `${f.length} of ${posts.length} posts`; };
  q.oninput = (e) => { state.q = e.target.value.trim().toLowerCase(); draw(); };
  const rnd = document.getElementById("rnd"); if (rnd) rnd.onclick = () => { const pick = posts[Math.floor(Math.random() * posts.length)]; if (pick) window.location.href = `${R}post/${pick.id}/`; };
  document.getElementById("cats").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; state.c = b.dataset.c; document.querySelectorAll("#cats button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(); };
  draw();
}

// ---------- post page
export async function postPage(p, all) {
  const i = all.findIndex((x) => x.id === p.id), nx = all[i - 1], pv = all[i + 1];
  const words = p.paragraphs.reduce((n, s) => n + s.trim().split(/\s+/).length, 0);
  const cover = p.media.find((m) => m.slot === 1);
  const coverSrc = cover && /^https:\/\//i.test(cover.path) ? cover.path : `assets/imgs/fiction/post${p.id}.png`;
  const figs = p.media.filter((m) => m.slot >= 2).map((m) => `<figure>${im(/^https:\/\//i.test(m.path) ? m.path : "assets/imgs/fiction/" + m.path.split("/").pop(), m.caption || p.title)}${m.caption ? `<figcaption>${esc(m.caption)}</figcaption>` : ""}</figure>`).join("");
  const body = p.format === "md" ? '<div class="md" id="mdbody"></div>' : p.paragraphs.map((t) => t.split(/\r?\n+/).map((x) => x.trim()).filter(Boolean).map((x) => `<p>${esc(x)}</p>`).join("")).join("");
  const html = `<div class="progress" id="progress" aria-hidden="true"></div><div class="wrap"><article class="article" lang="bn"><a class="back" href="${R}blogs/" lang="en">← All writing</a><h1>${esc(p.title)}</h1><p class="meta" lang="en"><span class="tag">${CAT[p.category] || esc(p.category)}</span><span class="tag sig">${readMin(words)} min read</span><span class="muted small">${esc(fmt(p.date))}${p.author ? " · " + esc(p.author) : ""}</span></p>${im(coverSrc, p.coverAlt || (cover && cover.caption) || p.title, null, null, "cover")}<div class="body">${body}</div>${figs}
<div class="share" lang="en"><span>Share</span><button class="btn sm ghost" type="button" id="share">Share this post</button><button class="btn sm ghost" type="button" id="copy">Copy link</button></div>
<nav class="pn" aria-label="More posts" lang="en">${pv ? `<a href="${R}post/${pv.id}/"><small>← Older</small><b lang="bn">${esc(pv.title)}</b></a>` : ""}${nx ? `<a class="next" href="${R}post/${nx.id}/"><small>Newer →</small><b lang="bn">${esc(nx.title)}</b></a>` : ""}</nav></article></div>`;
  return { html, words, coverSrc, async after() { if (p.format === "md") { const el = document.getElementById("mdbody"); if (el) { try { el.innerHTML = await renderMd(p.paragraphs.join("\n\n")); } catch (e) { el.textContent = p.paragraphs.join("\n\n"); } } } } };
}
export function postSeo(p, info) {
  document.title = `${p.title} | Md Hasibul Islam`;
  const desc = (p.seoDescription || p.paragraphs.find((t) => t.trim().length > 80 && !/^[\[(]/.test(t.trim())) || "").trim().replace(/[#*_`>\[\]]/g, "").slice(0, 160);
  const set = (sel, attr, v) => { const el = document.querySelector(sel); if (el && v) el.setAttribute(attr, v); };
  const url = `${window.location.origin}/post/${p.id}/`, img = new URL(info.coverSrc, window.location.origin + "/").href;
  set('link[rel="canonical"]', "href", url); set('meta[name="description"]', "content", desc); set('meta[property="og:title"]', "content", p.title);
  set('meta[property="og:description"]', "content", desc); set('meta[property="og:url"]', "content", url); set('meta[property="og:type"]', "content", "article");
  set('meta[property="og:image"]', "content", img); set('meta[name="twitter:title"]', "content", p.title); set('meta[name="twitter:description"]', "content", desc);
  let ld = document.getElementById("ld-article"); if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; ld.id = "ld-article"; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: p.title, datePublished: p.date, inLanguage: "bn", author: { "@type": "Person", name: p.author || "Md Hasibul Islam" }, image: img, mainEntityOfPage: url });
}
