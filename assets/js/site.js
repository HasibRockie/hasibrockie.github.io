(() => {
  const B = document.body, R = B.dataset.root || "", P = B.dataset.page, main = document.getElementById("main");
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const im = (src, alt, w, h) => src ? `<img src="${R}${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async"${w ? ` width="${w}" height="${h}"` : ""} onerror="this.remove()">` : "";
  const link = l => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`;
  const NAV = [["home", "Home", "index.html"], ["about", "About", "about.html"], ["journey", "Journey", "journey.html"], ["skills", "Skills", "skills.html"], ["projects", "Projects", "projects.html"], ["achievements", "Achievements", "achievements.html"], ["writing", "Writing", "blogs/"], ["memories", "Memories", "memories/"], ["gallery", "Gallery", "gallery.html"]];
  const CAT = { "ফিকশন": "Fiction", "ব্যক্তিগত": "Personal", "ধর্মীয়": "Faith", "ব্লগ": "Blog", "অন্যান্য": "Other" };
  const fmt = d => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  async function load(file) {
    try { const r = await fetch(R + file); if (!r.ok) throw new Error(r.status); return await r.json(); }
    catch (e) {
      main.innerHTML = `<div class="wrap err"><h1>Couldn’t load ${esc(file)}</h1><p>Browsers block fetch() on pages opened by double-click (file://). Run <code>python -m http.server</code> in this folder and open <code>http://localhost:8000</code>.</p></div>`;
      throw e;
    }
  }

  function chrome(d) {
    const s = d.site;
    document.body.insertAdjacentHTML("afterbegin", `<a class="skip" href="#main">Skip to content</a>
<header class="top"><div class="wrap bar"><a class="brand" href="${R}index.html"><img src="${R}assets/imgs/hasib-logo.png" alt="" width="32" height="32">Hasib</a>
<button class="menu" aria-expanded="false" aria-controls="nav">Menu</button>
<nav id="nav" aria-label="Primary">${NAV.map(([k, t, h]) => `<a href="${R}${h}"${k === P ? ' aria-current="page"' : ""}>${t}</a>`).join("")}</nav>
<button class="theme" aria-label="Switch colour theme">Theme</button></div></header>`);
    document.body.insertAdjacentHTML("beforeend", `<footer><div class="wrap"><p class="small muted">© ${new Date().getFullYear()} ${esc(s.name)}</p>
<ul>${s.social.map(l => `<li>${link(l)}</li>`).join("")}</ul></div></footer>`);
    const nav = document.getElementById("nav"), mb = document.querySelector(".menu");
    mb.onclick = () => mb.setAttribute("aria-expanded", nav.classList.toggle("open"));
    document.querySelector(".theme").onclick = () => {
      const root = document.documentElement, dark = (root.dataset.theme || (matchMedia("(prefers-color-scheme:dark)").matches ? "dark" : "light")) === "dark";
      root.dataset.theme = dark ? "light" : "dark";
      try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    };
  }

  const head = (t, p) => `<div class="wrap"><div class="pagehead"><h1>${t}</h1><p>${p}</p></div></div>`;
  const wrap = h => `<div class="wrap">${h}</div>`;
  const excerpt = p => { for (let i = 1; i <= 100; i++) { const t = (p["para" + i] || "").trim(); if (t.length > 80 && !/^[\[(]/.test(t)) return t.slice(0, 220); } return ""; };
  const thumb = p => `assets/imgs/fiction/post${p.id}.png`;
  const posts = async () => (await load("posts.json")).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  const rows = ps => ps.map(p => `<li><a href="${R}post/?id=${p.id}"><span class="d">${fmt(p.date)}</span><div><h3 lang="bn">${esc(p.title)}</h3><p>${esc(excerpt(p))}</p><span class="small muted">${CAT[p.category] || esc(p.category)}</span></div>${im(thumb(p), "", 96, 96)}</a></li>`).join("");

  const pages = {
    async home(d) {
      const s = d.site, ps = (await posts()).slice(0, 3);
      main.innerHTML = `<section class="wrap hero"><div><h1>${esc(s.name)}</h1><p class="lead">${esc(s.tagline)}</p>
<div class="cta"><a class="btn" href="${R}journey.html">See my journey</a><a class="btn ghost" href="${esc(s.resume)}" target="_blank" rel="noopener">Résumé</a></div>
<blockquote>${esc(s.quote)}</blockquote></div>
<table class="tb"><caption class="small muted" style="text-align:left;padding-bottom:.4rem"></caption><tbody>${d.titleblock.map(r => `<tr><th scope="row">${esc(r[0])}</th><td>${esc(r[1])}</td></tr>`).join("")}</tbody></table></section>
<section class="wrap section"><h2>Explore</h2><ul class="index">${d.explore.map(e => `<li><a href="${R}${e[1]}"><b>${esc(e[0])}</b><span>${esc(e[2])}</span></a></li>`).join("")}</ul></section>
<section class="wrap section"><h2>Latest writing</h2><ul class="plist">${rows(ps)}</ul><p style="margin-top:1.5rem"><a href="${R}blogs/">Browse all posts</a></p></section>`;
    },
    about(d) {
      const a = d.about;
      main.innerHTML = head("About", esc(a.intro)) + wrap(`<div class="split">${im(a.photo, "Portrait of Md Hasibul Islam")}<div><div class="prose">${a.paragraphs.map(p => `<p>${esc(p)}</p>`).join("")}</div>
<dl class="facts">${a.facts.map(f => `<dt>${esc(f[0])}</dt><dd>${esc(f[1])}</dd>`).join("")}<dt>Email</dt><dd><a href="mailto:${esc(d.site.email)}">${esc(d.site.email)}</a></dd>${d.site.social.filter(l => /LinkedIn|Scholar/.test(l.label)).map(l => `<dt>${esc(l.label)}</dt><dd>${link({ label: "Open profile", url: l.url })}</dd>`).join("")}</dl></div></div>`);
    },
    journey(d) {
      main.innerHTML = head("Journey", "Academic & Professional Life") + wrap(`<ol class="tl">${d.timeline.map(t => `<li>${im(t.img, t.org, 72, 72) || "<span></span>"}<div><p class="when">${esc(t.period)}</p><h3>${esc(t.title)}</h3><p class="muted">${esc(t.org)}</p>${t.text ? `<p>${esc(t.text)}</p>` : ""}${t.points ? `<ul>${t.points.map(x => `<li>${esc(x)}</li>`).join("")}</ul>` : ""}${t.link ? `<p>${link(t.link)}</p>` : ""}</div></li>`).join("")}</ol>`);
    },
    skills(d) {
      main.innerHTML = head("Skills", "Tools I use for engineering, research and the web.") + wrap(d.skills.map(g => `<div class="skillrow"><h2 style="font-size:1.35rem;margin:0">${esc(g.group)}</h2><ul class="chips">${g.items.map(i => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("") + `<div class="skillrow"><h2 style="font-size:1.35rem;margin:0">Interests</h2><p>${esc(d.interests)}</p></div>`);
    },
    projects(d) {
      const card = p => `<article class="proj"><div class="pimg">${im(p.img, p.title)}</div><div><p class="meta">${esc(p.meta)}</p><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p>${(p.people || []).map(x => `<p class="small"><b>${esc(x[0])}:</b> ${esc(x[1])}</p>`).join("")}${p.tools ? `<ul class="chips" style="margin-top:.75rem">${p.tools.map(t => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}<div class="links">${(p.links || []).map(link).join("")}</div></div></article>`;
      main.innerHTML = head("Projects", "Research and coursework in fluid and thermal engineering, then web and security work built on the side.") + wrap(`<h2>Research and coursework</h2>${d.projects.map(card).join("")}<h2 style="margin-top:4rem">Web and security projects</h2>${d.other_projects.map(card).join("")}`);
    },
    achievements(d) {
      main.innerHTML = head("Achievements", "Awards, leadership and completed training.") + wrap(d.achievements.map(a => `<article class="ach">${im(a.img, a.title, 200, 150)}<div><h3>${esc(a.title)}</h3><p class="muted">${esc(a.text)}</p></div></article>`).join(""));
    },
    gallery(d) {
      main.innerHTML = head("Gallery", "Hobbies and moments from workshops, competitions and campus.") + wrap(`<h2>Hobbies</h2><ul class="chips">${d.hobbies.map(h => `<li>${esc(h.title)}</li>`).join("")}</ul><h2 style="margin-top:3rem">Photographs</h2><div class="cols">${d.photos.map(p => `<figure>${im(p.img, p.caption)}<figcaption>${esc(p.caption)}</figcaption></figure>`).join("")}</div>`);
    },
    async writing() {
      const all = await posts(), cats = [...new Set(all.map(p => p.category))];
      main.innerHTML = head("Writing", "Fiction, essays and personal reflections, mostly in Bangla.") + wrap(`<div class="tools"><input id="q" type="search" placeholder="Search titles" aria-label="Search posts"><ul class="chips" id="cats"><li><button aria-pressed="true" data-c="">All</button></li>${cats.map(c => `<li><button aria-pressed="false" data-c="${esc(c)}">${CAT[c] || esc(c)}</button></li>`).join("")}</ul></div><p class="small muted" id="n"></p><ul class="plist" id="list"></ul>`);
      let c = "", q = ""; const list = document.getElementById("list"), n = document.getElementById("n");
      const draw = () => { const f = all.filter(p => (!c || p.category === c) && p.title.toLowerCase().includes(q)); list.innerHTML = rows(f) || `<li class="muted">No posts match. Clear the search or pick another category.</li>`; n.textContent = `${f.length} of ${all.length} posts`; };
      document.getElementById("q").oninput = e => { q = e.target.value.trim().toLowerCase(); draw(); };
      document.getElementById("cats").onclick = e => { const b = e.target.closest("button"); if (!b) return; c = b.dataset.c; document.querySelectorAll("#cats button").forEach(x => x.setAttribute("aria-pressed", x === b)); draw(); };
      draw();
    },
    async post() {
      const all = await posts(), id = +new URLSearchParams(location.search).get("id"), i = all.findIndex(p => p.id === id), p = all[i];
      if (!p) { main.innerHTML = `<div class="wrap err"><h1>Post not found</h1><p><a href="${R}blogs/">Back to all posts</a></p></div>`; return; }
      document.title = `${p.title} | Md Hasibul Islam`;
      document.querySelector('link[rel=canonical]').href = `${location.origin}/post/?id=${p.id}`;
      const body = []; let words = 0;
      for (let k = 1; k <= 100; k++) { const t = (p["para" + k] || "").trim(); if (t) { words += t.split(/\s+/).length; body.push(t.split(/\r?\n+/).map(x => x.trim()).filter(Boolean).map(x => `<p>${esc(x)}</p>`).join("")); } }
      const figs = []; for (let k = 2; k <= 10; k++) if (p["img" + k]) figs.push(`<figure>${im("assets/imgs/fiction/" + p["img" + k].split("/").pop(), p["img" + k + "caption"] || p.title)}${p["img" + k + "caption"] ? `<figcaption>${esc(p["img" + k + "caption"])}</figcaption>` : ""}</figure>`);
      const nx = all[i - 1], pv = all[i + 1];
      main.innerHTML = `<div class="wrap"><article class="article" lang="bn"><h1>${esc(p.title)}</h1><p class="meta">${fmt(p.date)} / ${CAT[p.category] || esc(p.category)} / ${Math.max(1, Math.round(words / 180))} min read / ${esc(p.author)}</p>${im(thumb(p), p.img1caption || p.title)}<div style="margin-top:2rem">${body.join("")}</div>${figs.join("")}
<nav class="pn" aria-label="More posts">${pv ? `<a href="${R}post/?id=${pv.id}">Older: ${esc(pv.title)}</a>` : "<span></span>"}${nx ? `<a href="${R}post/?id=${nx.id}">Newer: ${esc(nx.title)}</a>` : ""}</nav></article></div>`;
    },
    async memories() {
      const ps = (await posts()).filter(p => p.category === "ব্যক্তিগত"), by = {};
      ps.forEach(p => (by[p.date.slice(0, 4)] ||= []).push(p));
      main.innerHTML = head("Memories", "Personal posts, newest year first: school, college, BUET and the stretches between.") + wrap(Object.keys(by).sort().reverse().map(y => `<h2 class="year">${y}</h2><ul class="plist">${rows(by[y])}</ul>`).join(""));
    }
  };

  (async () => {
    const d = await load("data.json");
    chrome(d);
    if (pages[P]) await pages[P](d);
  })();
})();
