// data.js - API first, cache for instant paint, static snapshot if the API is slow/down/paused.
import { dataFromTables, listItemFromLegacy, normPost } from "./legacy.js?v=202611261701";

const cfg = window.SITE_CONFIG || {};
const R = (document.body && document.body.dataset.root) || "";
export const apiOn = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") && !!cfg.SUPABASE_ANON_KEY && !/YOUR-/.test(cfg.SUPABASE_ANON_KEY);
const LS = "sc:v1:", FRESH_MS = 120000, SLOW_MS = 2500, TIMEOUT_MS = 6000;

const lget = (k) => { try { return JSON.parse(localStorage.getItem(LS + k)); } catch (_) { return null; } };
const lset = (k, v) => { try { const s = JSON.stringify(v); if (s.length < 600000) localStorage.setItem(LS + k, s); } catch (_) {} };

async function getJSON(url, headers, ms = TIMEOUT_MS) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), ms);
  try { const r = await fetch(url, { headers, signal: ctl.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.json(); } finally { clearTimeout(t); }
}
const api = (q) => getJSON(`${cfg.SUPABASE_URL}/rest/v1/${q}`, { apikey: cfg.SUPABASE_ANON_KEY, Accept: "application/json" });
const snap = (f) => getJSON(R + f, {}, 8000);

const QUERY = {
  profile: "profile?select=site,titleblock,explore,about,interests,extra&id=eq.1",
  timeline: "timeline?select=*&order=sort_order.asc", skills: "skills?select=*&order=sort_order.asc", projects: "projects?select=*&order=sort_order.asc",
  achievements: "achievements?select=*&order=sort_order.asc", hobbies: "hobbies?select=*&order=sort_order.asc", photos: "photos?select=*&order=sort_order.asc",
  posts_list: "posts_list?select=id,date,category,title,author,cover,excerpt,words&order=date.desc,id.desc"
};
export const NEEDS = { home: ["profile", "posts_list", "projects", "achievements"], about: ["profile"], journey: ["timeline", "profile"], skills: ["skills", "profile"], projects: ["projects", "profile"],
  achievements: ["achievements", "profile"], gallery: ["hobbies", "photos", "profile"], writing: ["posts_list", "profile"], memories: ["posts_list", "profile"],
  post: ["posts_list", "profile"], moments: ["profile"], 404: ["profile"] };

const toBundle = (T) => ({ data: dataFromTables(T), posts: T.posts_list || [] });
const sortList = (a) => a.slice().sort((x, y) => String(y.date).localeCompare(String(x.date)) || y.id - x.id);

async function snapshotBundle(needs) {
  const out = { data: await snap("data.json"), posts: [] };
  if (needs.includes("posts_list")) {
    let idx; try { idx = await snap("posts-index.json"); } catch (_) { idx = null; }
    if (!Array.isArray(idx)) idx = (await snap("posts.json")).map(listItemFromLegacy);
    out.posts = sortList(idx);
  }
  return out;
}

/** cb(bundle, {source:'cache'|'api'|'snapshot', offline:boolean}) may be called several times; later calls are better/fresher. */
export async function loadBundle(page, cb) {
  const needs = NEEDS[page] || ["profile"];
  let shown = null, sig = "", last = null;
  const emit = (bundle, meta) => {
    const s = JSON.stringify(bundle);
    if (s === sig && meta.source === shown && !meta.force) return;
    sig = s; shown = meta.source; last = bundle; cb(bundle, meta);
  };
  const cached = {}; let all = true;
  needs.forEach((t) => { const c = lget(t); if (c && c.rows) cached[t] = c; else all = false; });
  if (all) emit(toBundle(Object.fromEntries(needs.map((t) => [t, cached[t].rows]))), { source: "cache", offline: false });
  if (all && needs.every((t) => Date.now() - cached[t].t < FRESH_MS)) return;

  let snapTried = false;
  const useSnapshot = async () => {
    if (snapTried) return; snapTried = true;
    try { const b = await snapshotBundle(needs); if (!shown) emit(b, { source: "snapshot", offline: true }); }
    catch (e) { if (!shown) cb(null, { source: "none", offline: true, error: e }); }
  };
  const slow = setTimeout(() => { if (!shown) useSnapshot(); }, SLOW_MS);
  try {
    if (!apiOn) throw new Error("API not configured");
    const rows = await Promise.all(needs.map((t) => api(QUERY[t])));
    const T = Object.fromEntries(needs.map((t, i) => [t, rows[i]]));
    needs.forEach((t) => lset(t, { t: Date.now(), rows: T[t] }));
    clearTimeout(slow); emit(toBundle(T), { source: "api", offline: false });
  } catch (_) {
    clearTimeout(slow);
    if (!shown) await useSnapshot(); else emit(last, { source: shown, offline: true, force: true });
  }
}

/** Single post. cb(post|null, {source, offline, notFound}) */
export async function loadPost(id, cb) {
  const key = "post:" + id;
  let shown = null, sig = "";
  const emit = (p, meta) => { const s = JSON.stringify(p); if (s === sig && meta.source === shown && !meta.force) return; sig = s; shown = meta.source; cb(p, meta); };
  const c = lget(key); if (c && c.row) emit(normPost(c.row), { source: "cache", offline: false });
  try {
    if (!apiOn) throw new Error("API not configured");
    const rows = await api(`posts?id=eq.${encodeURIComponent(id)}&select=*`);
    if (!rows.length) { try { localStorage.removeItem(LS + key); } catch (_) {} return cb(null, { source: "api", notFound: true }); }
    lset(key, { t: Date.now(), row: rows[0] });
    const idx = lget("post:index") || []; const next = [id, ...idx.filter((x) => x !== id)].slice(0, 6);
    idx.filter((x) => !next.includes(x)).forEach((x) => { try { localStorage.removeItem(LS + "post:" + x); } catch (_) {} }); lset("post:index", next);
    emit(normPost(rows[0]), { source: "api", offline: false });
  } catch (_) {
    if (shown) return emit(normPost(c.row), { source: shown, offline: true, force: true });
    try {
      const all = await snap("posts.json"), p = all.find((x) => String(x.id) === String(id));
      if (!p) return cb(null, { source: "snapshot", notFound: true });
      emit(normPost(p), { source: "snapshot", offline: true });
    } catch (e) { cb(null, { source: "none", offline: true, error: e }); }
  }
}

/** Settings: cache -> API -> optional site-settings.json snapshot. cb(rawSettings) */
export async function loadSettings(cb) {
  const S = window.SiteSettings, c = lget("settings");
  if (c && c.v) cb(S.validate(c.v).clean, "cache");
  const give = (raw, src) => { const clean = S.validate(raw).clean; lset("settings", { t: Date.now(), v: clean }); cb(clean, src); };
  try {
    if (!apiOn) throw new Error("API not configured");
    const rows = await api(QUERY_SETTINGS);
    give((rows[0] && rows[0].settings) || {}, "api");
  } catch (_) {
    if (c && c.v) return;
    try { give(await snap("site-settings.json"), "snapshot"); } catch (__) { /* defaults are fine */ }
  }
}
const QUERY_SETTINGS = "site_settings?select=settings&id=eq.1";
