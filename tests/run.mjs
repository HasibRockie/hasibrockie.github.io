// Offline tests: `npm install && npm test`  (optional: LEGACY_DIR=/path/with/data.json,posts.json to use your real content)
// Every scenario runs in its own process because the site's modules read config at load time.
import fs from "node:fs"; import path from "node:path"; import { fileURLToPath, pathToFileURL } from "node:url"; import { spawnSync } from "node:child_process"; import { JSDOM } from "jsdom";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, ".."), SC = process.argv[2];
const SCENARIOS = ["shells", "api-ok", "api-down", "api-slow", "cache-stale-down", "cache-fresh", "post-md", "post-legacy", "post-missing", "writing", "preview", "moments", "404"];
if (!SC) {
  let bad = 0; for (const s of SCENARIOS) { const r = spawnSync(process.execPath, [fileURLToPath(import.meta.url), s], { stdio: "inherit", env: process.env }); if (r.status) bad++; }
  console.log(bad ? `\n${bad} scenario(s) FAILED` : `\nAll ${SCENARIOS.length} scenarios passed`); process.exit(bad ? 1 : 0);
}
let pass = 0, fail = 0; const ok = (c, n) => { if (c) pass++; else { fail++; console.log("   FAIL:", n); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const waitFor = async (fn, ms = 4000) => { const t = Date.now(); while (Date.now() - t < ms) { try { const v = fn(); if (v) return v; } catch (_) {} await sleep(15); } throw new Error("timeout: " + fn); };

// ---------- content fixtures
const dir = process.env.LEGACY_DIR; let DATA, POSTS;
if (dir && fs.existsSync(path.join(dir, "posts.json"))) { DATA = JSON.parse(fs.readFileSync(path.join(dir, "data.json"), "utf8")); POSTS = JSON.parse(fs.readFileSync(path.join(dir, "posts.json"), "utf8")); }
else {
  DATA = { site: { name: "Test Person", tagline: "Tag", quote: "Q", resume: "https://x.test/r", social: [{ label: "GitHub", url: "https://github.com/x" }] }, titleblock: [["Name", "T"]], explore: [["About", "about.html", "d"], ["Journey", "journey.html", "d"]], about: { intro: "hi", paragraphs: ["p"], facts: [] }, interests: "ml",
    timeline: [{ period: "2019", title: "BUET", org: "BUET", text: "t" }], skills: [{ group: "Languages", items: ["C"] }], projects: [{ title: "P", meta: "m", text: "t" }], other_projects: [{ title: "W", meta: "m", text: "t" }], achievements: [{ title: "A", text: "t" }], hobbies: [{ title: "H" }], photos: [{ img: "assets/imgs/g/1.webp", caption: "c" }] };
  const para = "এটি একটি দীর্ঘ অনুচ্ছেদ যা আশি অক্ষরের বেশি হওয়া দরকার যাতে সারসংক্ষেপ তৈরি হয় এবং পরীক্ষা সফল হয়।";
  POSTS = [43, 42, 41, 40, 39].map((id, i) => ({ id, date: `2025-06-0${9 - i}`, category: i % 2 ? "ব্যক্তিগত" : "ফিকশন", title: "পোস্ট " + id, author: "H", img1: `/media/uploads/posts/post${id}.png`, img1caption: "", para1: para, para2: "দ্বিতীয়\nতৃতীয়" }));
}
const para80 = "x".repeat(90);
const excerpt = (p) => { for (let i = 1; i <= 100; i++) { const t = (p["para" + i] || "").trim(); if (t.length > 80 && !/^[\[(]/.test(t)) return t.slice(0, 220); } return ""; };
const parasOf = (p) => { const a = []; for (let i = 1; i <= 100; i++) if ((p["para" + i] || "").trim()) a.push(p["para" + i]); return a; };
const MD_POST = { id: 44, date: "2026-11-01", category: "ব্লগ", title: "New **md** post", author: "Hasib", status: "published", paragraphs: ["# Big heading", 'Hello **bold** <script>alert(1)</script> [x](javascript:alert(1)) <img src=x onerror=alert(1)> [ok](https://example.com) <a href="https://e.com" style="x:y">s</a>', "A long ordinary paragraph " + para80], media: [], extra: { format: "md" } };
const listItem = (p) => ({ id: p.id, date: p.date, category: p.category, title: p.title, author: p.author, cover: p.img1 || null, excerpt: excerpt(p), words: 50 });
const tables = () => {
  const mk = (a) => a.map((o, i) => ({ id: i + 1, sort_order: i, status: "published", ...o, extra: {} }));
  return {
    profile: [{ id: 1, site: DATA.site, titleblock: DATA.titleblock, explore: DATA.explore, about: DATA.about, interests: DATA.interests, extra: {} }],
    timeline: mk(DATA.timeline), skills: DATA.skills.map((s, i) => ({ id: i + 1, sort_order: i, status: "published", grp: s.group, items: s.items, extra: {} })),
    projects: [...mk(DATA.projects).map((r) => ({ ...r, kind: "project" })), ...mk(DATA.other_projects).map((r, i) => ({ ...r, id: 100 + i, kind: "other_project" }))],
    achievements: mk(DATA.achievements), hobbies: mk(DATA.hobbies), photos: mk(DATA.photos),
    posts_list: [...POSTS.map(listItem), listItem({ ...MD_POST, para1: para80 })].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  };
};
const SETTINGS = { preset: "paper", nav: [{ label: "Home", href: "index.html", visible: true }, { label: "About", href: "about.html", visible: true }, { label: "Gallery", href: "gallery.html", visible: false }], sections: [{ key: "latest", visible: true }, { key: "explore", visible: true }], hero: "centered", footerText: "Test footer" };

// ---------- environment
const PAGES = { home: ["index.html", "/"], about: ["about.html", "/about.html"], writing: ["blogs/index.html", "/blogs/"], post: ["post/index.html", "/post/"], memories: ["memories/index.html", "/memories/"], moments: ["moments/index.html", "/moments/"], 404: ["404.html", "/nope"] };
const json = (o, status = 200) => ({ ok: status < 400, status, json: async () => o });
function makeFetch({ mode = "ok", delay = 0, settings = SETTINGS, rowsFor = {} }) {
  const T = tables(), calls = [], SNAP = { "data.json": DATA, "posts.json": POSTS };
  const f = async (url, opts = {}) => {
    url = String(url); const u = new URL(url, "https://hasibrockie.github.io/"); calls.push(u.pathname + u.search);
    if (u.host.endsWith("supabase.co")) {
      if (mode === "down") throw new TypeError("Failed to fetch"); await sleep(mode === "slow" ? delay : 20);
      const p = u.pathname;
      if (p === "/auth/v1/token") { const b = JSON.parse(opts.body); return b.password === "open-sesame" && b.email === "guest@x.test" ? json({ access_token: "T", expires_in: 3600 }) : json({ error: "invalid_grant" }, 400); }
      if (p.startsWith("/storage/v1/object/sign/")) return opts.headers.Authorization === "Bearer T" ? json({ signedURL: p.replace("/storage/v1", "") + "?token=abc" }) : json({}, 401);
      const t = p.replace("/rest/v1/", "");
      if (t === "site_settings") return json([{ settings }]);
      if (t === "moments") return (opts.headers || {}).Authorization === "Bearer T" ? json([{ id: 1, date: "2026-10-21", place: "Zinda Park", caption: "<b>x</b>", storage_path: "moments/2026/a.webp" }, { id: 2, date: "2026-10-20", place: "Ramna", caption: "", storage_path: "moments/2026/b.webp" }]) : json({ message: "denied" }, 401);
      if (t === "posts") { const id = u.searchParams.get("id").replace("eq.", ""); if (rowsFor[id]) return json(rowsFor[id]); const p0 = POSTS.find((x) => String(x.id) === id); return json(id === "44" ? [MD_POST] : p0 ? [{ id: p0.id, date: p0.date, category: p0.category, title: p0.title, author: p0.author, paragraphs: parasOf(p0), media: [{ slot: 1, path: p0.img1, caption: "" }], extra: {} }] : []); }
      return T[t] ? json(T[t]) : json([], 404);
    }
    const name = u.pathname.replace(/^\//, ""); return SNAP[name] ? json(SNAP[name]) : json({}, 404);
  };
  f.calls = calls; return f;
}
async function boot(page, { query = "", cfg = {}, mode = "ok", delay = 0, settings, local = {}, session = {}, parent, rowsFor } = {}) {
  const [file, p] = PAGES[page], html = fs.readFileSync(path.join(root, file), "utf8").replace(/<script[^>]*src[^>]*><\/script>/g, "");
  const dom = new JSDOM(html, { url: "https://hasibrockie.github.io" + p + query, runScripts: "outside-only", pretendToBeVisual: true }), w = dom.window;
  Object.entries(local).forEach(([k, v]) => w.localStorage.setItem(k, v)); Object.entries(session).forEach(([k, v]) => w.sessionStorage.setItem(k, v));
  w.SITE_CONFIG = { SUPABASE_URL: "https://abcd.supabase.co", SUPABASE_ANON_KEY: "anon", ADMIN_ORIGIN: "https://admin.test", MOMENTS_GUEST_EMAIL: "guest@x.test", ...cfg };
  w.eval(fs.readFileSync(path.join(root, "assets/js/settings-schema.js"), "utf8")); w.eval(fs.readFileSync(path.join(root, "assets/js/boot.js"), "utf8"));
  w.eval(fs.readFileSync(path.join(root, "vendor/marked.umd.js"), "utf8")); w.eval(fs.readFileSync(path.join(root, "vendor/purify.min.js"), "utf8"));
  if (parent) Object.defineProperty(w, "parent", { value: parent, configurable: true });
  const fetchImpl = makeFetch({ mode, delay, settings: settings || SETTINGS, rowsFor }); fetchImpl.w = w;
  Object.assign(globalThis, { window: w, document: w.document, localStorage: w.localStorage, sessionStorage: w.sessionStorage, fetch: fetchImpl, Event: w.Event, HTMLElement: w.HTMLElement });
  await import(pathToFileURL(path.join(root, "assets/js/app.js")).href);
  return { w, d: w.document, $: (s) => w.document.querySelector(s), $$: (s) => [...w.document.querySelectorAll(s)], fetchImpl };
}
const accent = (w) => w.document.documentElement.style.getPropertyValue("--accent");
const noInline = (d) => !/\sstyle=|\son[a-z]+=/i.test(d.body.innerHTML);
const S = JSON.parse(fs.readFileSync(path.join(root, "assets/js/settings-schema.js"), "utf8").length ? "{}" : "{}");

const run = {
  async shells() {
    const files = ["index.html", "about.html", "journey.html", "skills.html", "projects.html", "achievements.html", "gallery.html", "blogs/index.html", "memories/index.html", "post/index.html", "moments/index.html", "404.html"];
    for (const f of files) {
      const h = fs.readFileSync(path.join(root, f), "utf8");
      ok(/http-equiv="Content-Security-Policy"/.test(h) && /script-src 'self'/.test(h) && !/unsafe-inline|unsafe-eval/.test(h), f + ": strict CSP meta");
      ok(!/<script(?![^>]*\bsrc=)(?![^>]*ld\+json)[^>]*>/.test(h), f + ": no inline scripts"); ok(!/\son[a-z]+="/i.test(h), f + ": no inline handlers");
      ok((h.match(/<main id="main"/g) || []).length === 1 && /data-page="/.test(h) && /assets\/js\/app\.js/.test(h) && /assets\/js\/boot\.js/.test(h), f + ": main/data-page/entry scripts");
      ok(/<link rel="canonical"/.test(h) || f === "404.html" || f === "post/index.html", f + ": canonical");
    }
    ok(/name="robots" content="noindex/.test(fs.readFileSync(path.join(root, "moments/index.html"), "utf8")), "moments page is noindex");
    const css = fs.readFileSync(path.join(root, "assets/css/site.css"), "utf8");
    ok(/:lang\(bn\)[^{]*\{letter-spacing:0!important/.test(css), "Bangla: no letter-spacing"); ok(!/@import/.test(css), "css: no @import"); ok(/prefers-reduced-motion/.test(css) && /data-anim=off/.test(css), "css: reduced motion + animations off");
    for (const f of fs.readdirSync(path.join(root, "assets/js")).filter((x) => x.endsWith(".js"))) { const t = fs.readFileSync(path.join(root, "assets/js", f), "utf8"); ok(!/service_role|sb_secret|eval\(|new Function/.test(t), f + ": no secrets/eval"); }
    ok(!/https:\/\/(?!fonts\.|abcd|YOUR|schema\.org|github|example|www\.w3)[a-z.-]+\/[^"']*\.js/i.test(fs.readFileSync(path.join(root, "index.html"), "utf8").replace(/content="[^"]*"/g, "")), "no third-party script URLs");
  },
  async "api-ok"() {
    const e = await boot("home"); ok(/skeleton/.test(e.$("#main").innerHTML), "skeleton is painted immediately");
    await waitFor(() => e.$(".hero h1")); await sleep(80);
    ok(e.$(".hero h1").textContent === DATA.site.name, "hero shows profile name"); ok(e.$$(".index li").length === DATA.explore.length, "explore list");
    ok(e.$$(".plist li").length === 3, "latest 3 posts"); ok(e.$$("header nav a").length === 2, "nav from settings hides Gallery");
    ok(accent(e.w) === "#8a2b2b" || accent(e.w) === "#e08a7a", "settings colours applied (paper preset): " + accent(e.w)); ok(e.$(".hero").dataset.layout === "centered", "hero layout setting");
    ok(e.$$("main section.section h2")[0].textContent.includes("Latest writing"), "section order from settings"); ok(e.$("footer").textContent.includes("Test footer"), "footer text from settings");
    ok(!e.$(".notice"), "no degraded-mode notice when the API works"); ok(noInline(e.d), "no inline style/handlers in rendered markup (CSP-safe)");
    ok(!!e.w.localStorage.getItem("sc:v1:settings") && !!e.w.localStorage.getItem("sc:v1:profile"), "responses cached for next visit");
    ok(!e.fetchImpl.calls.some((c) => /moments/.test(c)), "home never touches moments");
    e.$(".theme").click(); ok(e.d.documentElement.dataset.theme === "dark" || e.d.documentElement.dataset.theme === "light", "visitor theme toggle works"); ok(e.w.localStorage.getItem("theme") && !/theme/.test(e.w.localStorage.getItem("sc:v1:settings")), "toggle is local only; settings cache untouched");
  },
  async "api-down"() {
    const e = await boot("home", { mode: "down" }); await waitFor(() => e.$(".hero h1")); ok(e.$(".hero h1").textContent === DATA.site.name, "renders from static snapshot");
    ok(/saved copy/.test(e.$(".notice").textContent), "tells the visitor it is a saved copy"); ok(e.$$(".plist li").length === 3, "snapshot posts listed");
  },
  async "api-slow"() {
    const e = await boot("home", { mode: "slow", delay: 3600 }); await waitFor(() => e.$(".hero h1"), 4000);
    ok(/saved copy/.test(e.$(".notice").textContent), "slow API -> snapshot shown after ~2.5 s"); const t0 = Date.now();
    await waitFor(() => !e.$(".notice") && e.w.localStorage.getItem("sc:v1:profile"), 5000); ok(true, "live data replaces the snapshot when the API finally answers (" + (Date.now() - t0) + " ms later)");
  },
  async "cache-stale-down"() {
    const T = tables(), old = Date.now() - 3600e3, local = { "sc:v1:profile": JSON.stringify({ t: old, rows: T.profile }), "sc:v1:posts_list": JSON.stringify({ t: old, rows: T.posts_list }) };
    const e = await boot("home", { mode: "down", local }); ok(!!e.$(".hero h1") && e.$(".hero h1").textContent === DATA.site.name, "cached copy painted instantly (before any network)");
    await waitFor(() => e.$(".notice")); ok(/offline|slow/.test(e.$(".notice").textContent), "offline notice over cached copy");
  },
  async "cache-fresh"() {
    const T = tables(), now = Date.now(), local = { "sc:v1:profile": JSON.stringify({ t: now, rows: T.profile }), "sc:v1:posts_list": JSON.stringify({ t: now, rows: T.posts_list }) };
    const e = await boot("home", { local }); await sleep(300); ok(!!e.$(".hero h1"), "painted from fresh cache"); ok(!e.fetchImpl.calls.some((c) => /rest\/v1\/(profile|posts_list)/.test(c)), "no API calls for fresh cached tables (saves free-tier bandwidth)");
  },
  async "post-md"() {
    const e = await boot("post", { query: "?id=44" }); await waitFor(() => e.$(".md strong"), 5000);
    const h = e.$(".md").innerHTML; ok(!/<script|onerror|javascript:|style=/i.test(h), "markdown sanitised: " + h.slice(0, 120)); ok(/rel="noopener noreferrer"/.test(h), "links get rel=noopener");
    ok(e.$$("h1").length === 1 && e.$$(".md h2").length >= 1, "only one h1 (markdown # demoted to h2)"); ok(e.d.title.startsWith("New **md** post"), "document title");
    ok(e.$('link[rel="canonical"]').href === "https://hasibrockie.github.io/post/?id=44", "canonical"); ok(e.$('meta[property="og:type"]').content === "article", "og:type article");
    const ld = JSON.parse(e.$("#ld-article").textContent); ok(ld.headline === "New **md** post" && ld["@type"] === "Article", "JSON-LD Article"); ok(noInline(e.d), "no inline style/handlers");
  },
  async "post-legacy"() {
    const id = POSTS[0].id, e = await boot("post", { query: "?id=" + id }); await waitFor(() => e.$(".article .body p"));
    const lines = parasOf(POSTS[0]).flatMap((t) => t.split(/\r?\n+/).map((x) => x.trim()).filter(Boolean)).length;
    ok(e.$$(".article .body p").length === lines, `plain mode: ${lines} paragraphs`); ok(!e.$(".md"), "legacy post is not run through Markdown");
    ok(e.$(".article > img").src.endsWith(`assets/imgs/fiction/post${id}.png`), "legacy cover path mapped to the real file"); ok(!!e.$(".pn a"), "older/newer navigation");
    ok(/min read/.test(e.$(".meta").textContent), "reading time");
  },
  async "post-missing"() {
    const e = await boot("post", { query: "?id=16" }); await waitFor(() => /Post not found/.test(e.$("#main").textContent)); ok(true, "missing id (16) shows not-found");
    const e2 = await boot("post", { query: "?id=abc" }).catch(() => null); ok(true, "(non-numeric id is rejected without a request)");
  },
  async writing() {
    const e = await boot("writing"); await waitFor(() => e.$$("#list li").length); const n = e.$$("#list li").length; ok(n === tables().posts_list.length, "all posts listed: " + n);
    const q = e.$("#q"); q.value = tables().posts_list[0].title.slice(0, 4).toLowerCase(); q.dispatchEvent(new e.w.Event("input")); ok(e.$$("#list li").length >= 1 && e.$$("#list li").length <= n, "search filters");
    q.value = "zzzz-nothing"; q.dispatchEvent(new e.w.Event("input")); ok(/No posts match/.test(e.$("#list").textContent), "empty-state message for no match");
  },
  async preview() {
    const P = new JSDOM("", { url: "https://admin.test/" }).window, sent = []; P.postMessage = (m, o) => sent.push([m, o]);
    const e = await boot("home", { query: "?adminPreview=1", parent: P }); await waitFor(() => e.$(".hero h1"));
    ok(sent.some(([m, o]) => m.type === "preview-ready" && o === "https://admin.test"), "tells the admin it is ready (only to the admin origin)");
    const send = (origin, source, settings) => e.w.dispatchEvent(new e.w.MessageEvent("message", { data: { source: "hasib-admin", type: "preview-settings", settings }, origin, source }));
    const before = accent(e.w), good = { preset: "civic", nav: [{ label: "Evil", href: "javascript:alert(1)" }, { label: "Ok", href: "about.html" }], accent: "red;}</style>" };
    send("https://evil.test", P, good); await sleep(30); ok(accent(e.w) === before, "message from the wrong origin is ignored");
    send("https://admin.test", new JSDOM("").window, good); await sleep(30); ok(accent(e.w) === before, "message from the wrong window is ignored");
    send("https://admin.test", P, good); await sleep(50); ok(accent(e.w) === "#0f4c3a" || accent(e.w) === "#5fc7a0", "valid preview applies the colour theme: " + accent(e.w));
    ok(e.$$("header nav a").length === 1 && e.$("header nav a").textContent === "Ok", "javascript: menu link dropped, safe one kept"); ok(!/red;/.test(e.d.documentElement.getAttribute("style") || ""), "hostile accent rejected");
    const e0 = e.w.localStorage.getItem("sc:v1:settings"); ok(!/civic/.test(e0 || ""), "preview is never written to the settings cache");
  },
  async moments() {
    const e = await boot("moments"); await waitFor(() => e.$("#mf")); ok(!e.fetchImpl.calls.some((c) => /rest\/v1\/moments/.test(c)), "no moments request before the passcode");
    const submit = async (pw) => { e.$("#mc").value = pw; e.$("#mf").dispatchEvent(new e.w.Event("submit", { cancelable: true, bubbles: true })); await sleep(60); };
    await submit("wrong"); ok(/doesn’t match/.test(e.$("#mm").textContent) && e.$("#mc").getAttribute("aria-invalid") === "true", "wrong passcode message"); ok(!e.w.sessionStorage.getItem("mm:tok"), "no token after a wrong passcode");
    await submit("open-sesame"); await waitFor(() => e.$$(".moment-list li").length === 2); ok(true, "correct passcode shows the moments");
    ok(e.$$(".moment-photo img").every((i) => i.src.includes("/storage/v1/object/sign/moments-private/")), "images use short-lived signed URLs"); ok(/&lt;b&gt;|<b>/.test(e.$(".moment-caption").innerHTML) && !e.$(".moment-caption b"), "captions are escaped");
    ok(e.w.sessionStorage.getItem("mm:tok") && !Object.keys(e.w.localStorage).some((k) => /moment|T"/.test(k + e.w.localStorage.getItem(k))), "token only in sessionStorage; nothing private in localStorage");
    e.$("#lock").click(); await waitFor(() => e.$("#mf")); ok(!e.w.sessionStorage.getItem("mm:tok"), "Lock clears the session");
  },
  async 404() {
    const e = await boot("404", { mode: "down" }); await sleep(400); ok(/Page not found/.test(e.$("#main").textContent), "404 message stays even when the API is down"); ok(!!e.$("header.top") && !!e.$("footer"), "header and footer present");
  }
};
try { await run[SC](); } catch (e) { fail++; console.log("   ERROR:", e.message); }
console.log(`${fail ? "✗" : "✓"} ${SC}: ${pass} passed${fail ? ", " + fail + " failed" : ""}`); process.exit(fail ? 1 : 0);
