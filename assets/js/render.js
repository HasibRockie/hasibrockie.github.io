// render.js - header/footer and every page. All dynamic text goes through esc(); Markdown goes through the sanitiser in md.js.
import { renderMd } from "./md.js";
const B = document.body, R = B.dataset.root || "", P = B.dataset.page;
export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const imageURL = (src) => (/^https:\/\//i.test(src) ? src : /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(src) ? "" : R + src);
const im = (src, alt, w, h) => { const u = src ? imageURL(src) : ""; return u ? `<img src="${esc(u)}" alt="${esc(alt)}" loading="lazy" decoding="async"${w ? ` width="${w}" height="${h}"` : ""} data-hide>` : ""; };
const link = (l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`;
const href = (h) => (/^https:\/\//i.test(h) ? h : R + h);
export const CAT = { "ফিকশন": "Fiction", "ব্যক্তিগত": "Personal", "ধর্মীয়": "Faith", "ব্লগ": "Blog", "অন্যান্য": "Other" };
const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const PAGE_HREF = { home: "index.html", about: "about.html", journey: "journey.html", skills: "skills.html", projects: "projects.html", achievements: "achievements.html", writing: "blogs/", post: "blogs/", memories: "memories/", gallery: "gallery.html" };
const SHEET = { home: "Home", about: "About", journey: "Journey", skills: "Skills", projects: "Projects", achievements: "Achievements", gallery: "Gallery", writing: "Writing", memories: "Memories", moments: "Moments" };
const sheetNo = (page) => { const k = Object.keys(SHEET), i = k.indexOf(page); return `Sheet ${String(i + 1).padStart(2, "0")} / ${String(k.length).padStart(2, "0")} · ${SHEET[page]}`; };

// ---------- chrome
export function chrome(S, site) {
  const name = S.siteTitle || (site && site.name) || "Md Hasibul Islam", brand = S.siteTitle || "Hasib";
  const nav = S.nav.filter((n) => n.visible), cur = PAGE_HREF[P];
  const social = (S.social.length ? S.social : (site && site.social) || []);
  const head = `<header class="top"><div class="wrap bar"><a class="brand" href="${R}index.html"><img src="${R}assets/imgs/hasib-logo.png" alt="" width="32" height="32">${esc(brand)}</a>
<button class="menu" aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav" aria-label="Primary">${nav.map((n) => `<a href="${esc(href(n.href))}"${n.href === cur ? ' aria-current="page"' : ""}>${esc(n.label)}</a>`).join("")}</nav>
<button class="theme" aria-label="Switch between light and dark colours">Theme</button></div></header>`;
  const foot = `<footer><div class="wrap"><p class="small muted">© ${new Date().getFullYear()} ${esc(name)}${S.footerText ? " · " + esc(S.footerText) : ""}</p><ul>${social.map((l) => `<li>${link(l)}</li>`).join("")}</ul></div></footer>`;
  if (!document.querySelector(".skip")) B.insertAdjacentHTML("afterbegin", '<a class="skip" href="#main">Skip to content</a>');
  const old = document.querySelector("header.top"), oldF = document.querySelector("footer");
  const open = old && old.querySelector(".menu") && old.querySelector(".menu").getAttribute("aria-expanded") === "true";
  if (old) old.outerHTML = head; else document.querySelector(".skip").insertAdjacentHTML("afterend", head);
  if (oldF) oldF.outerHTML = foot; else B.insertAdjacentHTML("beforeend", foot);
  const nv = document.getElementById("nav"), mb = document.querySelector(".menu");
  if (open) { nv.classList.add("open"); mb.setAttribute("aria-expanded", "true"); }
  mb.onclick = () => mb.setAttribute("aria-expanded", nv.classList.toggle("open"));
  document.querySelector(".theme").onclick = () => window.SiteBoot.toggle();
}

// ---------- states
const skel = (n = 3) => Array.from({ length: n }, (_, i) => `<div class="skel ${i % 3 === 2 ? "w3" : ""}"></div>`).join("");
export function skeleton(page) {
  const list = `<ul class="plist skl">${[1, 2, 3, 4].map(() => '<li><div class="skel w1"></div><div><div class="skel h"></div><div class="skel"></div><div class="skel w3"></div></div><div class="skel sq"></div></li>').join("")}</ul>`;
  const body = page === "home" ? `<section class="wrap hero"><div><div class="skel h1"></div><div class="skel w2"></div></div><div class="skel box"></div></section><div class="wrap">${list}</div>`
    : page === "post" ? `<div class="wrap"><div class="article"><div class="skel h1"></div><div class="skel w2"></div>${skel(8)}</div></div>`
    : `<div class="wrap"><div class="pagehead"><div class="skel h1"></div><div class="skel w2"></div></div>${["writing", "memories"].includes(page) ? list : skel(6)}</div>`;
  return `<div class="skeleton" role="status" aria-busy="true" aria-label="Loading content">${body}</div>`;
}
const empty = (msg) => `<div class="wrap"><p class="empty">${esc(msg)}</p></div>`;
export const errorState = (retry) => `<div class="wrap err"><h1>Can’t load this page right now</h1><p>The server didn’t answer and no saved copy is available. Check your connection and try again.</p><p><button class="btn" id="retry">${esc(retry || "Try again")}</button></p></div>`;
export const notice = (meta) => !meta ? "" : meta.source === "snapshot" ? `<div class="wrap"><p class="notice" role="status">Showing a saved copy of this site. The newest edits may be missing.</p></div>`
  : meta.offline ? `<div class="wrap"><p class="notice" role="status">You look offline, or the server is slow. Showing the last copy saved on this device.</p></div>` : "";

const head = (page, t, p) => `<div class="wrap"><div class="pagehead"><p class="sheet">${esc(sheetNo(page))}</p><h1>${t}</h1><p>${p}</p></div></div>`;
const wrap = (h) => `<div class="wrap">${h}</div>`;
const sec = (n, t) => `<h2><span class="sec">§ ${String(n).padStart(2, "0")}</span> ${esc(t)}</h2>`;
const thumbOf = (p) => (p.cover && /^https:\/\//i.test(p.cover) ? p.cover : `assets/imgs/fiction/post${p.id}.png`);
const rows = (ps) => ps.map((p) => `<li><a href="${R}post/?id=${p.id}"><span class="d"><abbr title="Date published">REV</abbr> ${esc(p.date)}</span><div><h3 lang="bn">${esc(p.title)}</h3><p>${esc(p.excerpt || "")}</p><span class="small muted">${CAT[p.category] || esc(p.category)}${p.words ? " · " + Math.max(1, Math.round(p.words / 180)) + " min read" : ""}</span></div>${im(thumbOf(p), "", 96, 96)}</a></li>`).join("");

// ---------- pages (each returns HTML)
export const pages = {
  home(d, posts, S) {
    const s = d.site || {}, tb = d.titleblock || [], hero = S.hero;
    const heroHtml = `<section class="wrap hero" data-layout="${esc(hero)}"><div class="hero-main"><p class="sheet">${esc(sheetNo("home"))}</p><h1>${esc(S.siteTitle || s.name)}</h1><p class="lead">${esc(S.tagline || s.tagline)}</p>
<div class="cta"><a class="btn" href="${R}journey.html">See my journey</a>${s.resume ? `<a class="btn ghost" href="${esc(s.resume)}" target="_blank" rel="noopener">Résumé</a>` : ""}</div>${s.quote ? `<blockquote>${esc(s.quote)}</blockquote>` : ""}</div>
${hero === "minimal" || !tb.length ? "" : `<table class="tb"><caption class="visually-hidden">At a glance</caption><tbody>${tb.map((r) => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table>`}</section>`;
    let n = 0;
    const secs = S.sections.filter((x) => x.visible).map((x) => {
      if (x.key === "explore") return (d.explore || []).length ? `<section class="wrap section">${sec(++n, "Explore")}<ul class="index">${d.explore.map((e) => `<li><a href="${href(e[1])}"><b>${esc(e[0])}</b><span>${esc(e[2])}</span></a></li>`).join("")}</ul></section>` : "";
      if (x.key === "latest") return `<section class="wrap section">${sec(++n, "Latest writing")}${posts.length ? `<ul class="plist">${rows(posts.slice(0, 3))}</ul><p class="after"><a href="${R}blogs/">Browse all posts</a></p>` : '<p class="empty">No posts published yet.</p>'}</section>`;
      return "";
    }).join("");
    return heroHtml + secs;
  },
  about(d) {
    const a = d.about; if (!a) return empty("This section hasn’t been published yet.");
    const s = d.site || {};
    return head("about", "About", esc(a.intro)) + wrap(`<div class="split">${im(a.photo, "Portrait of " + (s.name || "the author"))}<div><div class="prose">${(a.paragraphs || []).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
<dl class="facts">${(a.facts || []).map((f) => `<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join("")}${s.email ? `<dt>Email</dt><dd><a href="mailto:${esc(s.email)}">${esc(s.email)}</a></dd>` : ""}${(s.social || []).filter((l) => /LinkedIn|Scholar/.test(l.label)).map((l) => `<dt>${esc(l.label)}</dt><dd>${link({ label: "Open profile", url: l.url })}</dd>`).join("")}</dl></div></div>`);
  },
  journey(d) {
    const t = d.timeline || [];
    return head("journey", "Journey", "Academic &amp; Professional Life") + (t.length ? wrap(`<ol class="tl">${t.map((x) => `<li>${im(x.img, x.org, 72, 72) || "<span></span>"}<div><p class="when">${esc(x.period)}</p><h3>${esc(x.title)}</h3><p class="muted">${esc(x.org)}</p>${x.text ? `<p>${esc(x.text)}</p>` : ""}${x.points ? `<ul>${x.points.map((y) => `<li>${esc(y)}</li>`).join("")}</ul>` : ""}${x.link ? `<p>${link(x.link)}</p>` : ""}</div></li>`).join("")}</ol>`) : empty("Nothing published here yet."));
  },
  skills(d) {
    const g = d.skills || [];
    return head("skills", "Skills", "Tools I use for engineering, research and the web.") + wrap(g.map((x) => `<div class="skillrow"><h2 class="skh">${esc(x.group)}</h2><ul class="chips">${(x.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("") + (d.interests ? `<div class="skillrow"><h2 class="skh">Interests</h2><p>${esc(d.interests)}</p></div>` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  projects(d) {
    const card = (p) => `<article class="proj"><div class="pimg">${im(p.img, p.title)}</div><div><p class="meta">${esc(p.meta)}</p><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>${(p.people || []).map((x) => `<p class="small"><b>${esc(x[0])}:</b> ${esc(x[1])}</p>`).join("")}${p.tools && p.tools.length ? `<ul class="chips tools-chips">${p.tools.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}<div class="links">${(p.links || []).map(link).join("")}</div></div></article>`;
    const a = d.projects || [], b = d.other_projects || [];
    return head("projects", "Projects", "Research and coursework in fluid and thermal engineering, then web and security work built on the side.") + wrap((a.length ? `${sec(1, "Research and coursework")}${a.map(card).join("")}` : "") + (b.length ? `<h2 class="gap">${'<span class="sec">§ 02</span> '}Web and security projects</h2>${b.map(card).join("")}` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  achievements(d) {
    const a = d.achievements || [];
    return head("achievements", "Achievements", "Awards, leadership and completed training.") + wrap(a.map((x) => `<article class="ach">${im(x.img, x.title, 200, 150)}<div><h3>${esc(x.title)}</h3><p class="muted">${esc(x.text)}</p></div></article>`).join("") || '<p class="empty">Nothing published here yet.</p>');
  },
  gallery(d) {
    const h = d.hobbies || [], p = d.photos || [];
    return head("gallery", "Gallery", "Hobbies and moments from workshops, competitions and campus.") + wrap((h.length ? `${sec(1, "Hobbies")}<ul class="chips">${h.map((x) => `<li>${esc(x.title)}</li>`).join("")}</ul>` : "") + (p.length ? `<h2 class="gap"><span class="sec">§ 02</span> Photographs</h2><div class="cols">${p.map((x) => `<figure>${im(x.img, x.caption)}<figcaption>${esc(x.caption)}</figcaption></figure>`).join("")}</div>` : "") || '<p class="empty">Nothing published here yet.</p>');
  },
  writing(d, posts) {
    const cats = [...new Set(posts.map((p) => p.category))];
    return head("writing", "Writing", "Fiction, essays and personal reflections, mostly in Bangla.") + wrap(`<div class="tools"><input id="q" type="search" placeholder="Search titles" aria-label="Search posts"><ul class="chips" id="cats"><li><button aria-pressed="true" data-c="">All</button></li>${cats.map((c) => `<li><button aria-pressed="false" data-c="${esc(c)}">${CAT[c] || esc(c)}</button></li>`).join("")}</ul></div><p class="small muted" id="n"></p><ul class="plist" id="list"></ul>`);
  },
  memories(d, posts) {
    const ps = posts.filter((p) => p.category === "ব্যক্তিগত"), by = {}; ps.forEach((p) => (by[p.date.slice(0, 4)] ||= []).push(p));
    return head("memories", "Memories", "Personal posts, newest year first: school, college, BUET and the stretches between.") + wrap(Object.keys(by).sort().reverse().map((y) => `<h2 class="year">${y}</h2><ul class="plist">${rows(by[y])}</ul>`).join("") || '<p class="empty">Nothing published here yet.</p>');
  },
  404() { return `<div class="wrap err"><h1>Page not found</h1><p>This address doesn’t exist. Try the <a href="${R}index.html">home page</a> or the <a href="${R}blogs/">writing archive</a>.</p></div>`; }
};

export function wireWriting(posts, state) {
  const list = document.getElementById("list"), n = document.getElementById("n"), q = document.getElementById("q");
  if (!list) return;
  q.value = state.q || "";
  document.querySelectorAll("#cats button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.c === (state.c || ""))));
  const draw = () => { const f = posts.filter((p) => (!state.c || p.category === state.c) && p.title.toLowerCase().includes(state.q || "")); list.innerHTML = rows(f) || `<li class="muted">No posts match. Clear the search or pick another category.</li>`; n.textContent = `${f.length} of ${posts.length} posts`; };
  q.oninput = (e) => { state.q = e.target.value.trim().toLowerCase(); draw(); };
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
  const html = `<div class="wrap"><article class="article" lang="bn"><h1>${esc(p.title)}</h1><p class="meta"><abbr title="Date published">REV</abbr> ${esc(fmt(p.date))} / ${CAT[p.category] || esc(p.category)} / ${Math.max(1, Math.round(words / 180))} min read / ${esc(p.author || "")}</p>${im(coverSrc, (cover && cover.caption) || p.title)}<div class="body">${body}</div>${figs}
<nav class="pn" aria-label="More posts">${pv ? `<a href="${R}post/?id=${pv.id}">Older: ${esc(pv.title)}</a>` : "<span></span>"}${nx ? `<a href="${R}post/?id=${nx.id}">Newer: ${esc(nx.title)}</a>` : ""}</nav></article></div>`;
  return { html, words, coverSrc, async after() { if (p.format === "md") { const el = document.getElementById("mdbody"); if (el) { try { el.innerHTML = await renderMd(p.paragraphs.join("\n\n")); } catch (e) { el.textContent = p.paragraphs.join("\n\n"); } } } } };
}
export function postSeo(p, info) {
  document.title = `${p.title} | Md Hasibul Islam`;
  const desc = (p.paragraphs.find((t) => t.trim().length > 80 && !/^[\[(]/.test(t.trim())) || "").trim().replace(/[#*_`>\[\]]/g, "").slice(0, 160);
  const set = (sel, attr, v) => { const el = document.querySelector(sel); if (el && v) el.setAttribute(attr, v); };
  const url = `${window.location.origin}/post/?id=${p.id}`, img = new URL(info.coverSrc, window.location.origin + "/").href;
  set('link[rel="canonical"]', "href", url); set('meta[name="description"]', "content", desc); set('meta[property="og:title"]', "content", p.title);
  set('meta[property="og:description"]', "content", desc); set('meta[property="og:url"]', "content", url); set('meta[property="og:type"]', "content", "article");
  set('meta[property="og:image"]', "content", img); set('meta[name="twitter:title"]', "content", p.title); set('meta[name="twitter:description"]', "content", desc);
  let ld = document.getElementById("ld-article"); if (!ld) { ld = document.createElement("script"); ld.type = "application/ld+json"; ld.id = "ld-article"; document.head.appendChild(ld); }
  ld.textContent = JSON.stringify({ "@context": "https://schema.org", "@type": "Article", headline: p.title, datePublished: p.date, inLanguage: "bn", author: { "@type": "Person", name: p.author || "Md Hasibul Islam" }, image: img, mainEntityOfPage: url });
}
