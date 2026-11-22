// legacy.js - turns database rows into the legacy data.json shape that the renderers use (port of the admin/migration code).
const SPEC = {
  timeline: { cols: ["period", "title", "org", "text", "points", "link", "img"], alias: {} }, skills: { cols: ["group", "items"], alias: { group: "grp" } },
  projects: { cols: ["title", "meta", "img", "text", "people", "tools", "links"], alias: {} }, achievements: { cols: ["title", "text", "img"], alias: {} },
  hobbies: { cols: ["title"], alias: {} }, photos: { cols: ["img", "caption"], alias: {} }
};
export function backItem(t, row) {
  const sp = SPEC[t], out = {};
  sp.cols.forEach((k) => { const v = row[sp.alias[k] || k]; if (v !== null && v !== undefined) out[k] = v; });
  return Object.assign(out, row.extra || {});
}
export function dataFromTables(T) {
  const d = {}, p = T.profile && T.profile[0];
  if (p) { ["site", "titleblock", "explore", "about", "interests"].forEach((k) => { if (p[k] !== undefined) d[k] = p[k]; }); Object.assign(d, p.extra || {}); }
  ["timeline", "skills", "achievements", "hobbies", "photos"].forEach((t) => { if (T[t]) d[t] = T[t].map((r) => backItem(t, r)); });
  if (T.projects) {
    d.projects = T.projects.filter((r) => r.kind === "project").map((r) => backItem("projects", r));
    d.other_projects = T.projects.filter((r) => r.kind === "other_project").map((r) => backItem("projects", r));
  }
  return d;
}
const excerptOf = (paras) => { for (const p of paras) { const t = String(p || "").trim(); if (t.length > 80 && !/^[\[(]/.test(t)) return t.slice(0, 220); } return ""; };
const bodyParas = (p) => { if (Array.isArray(p.paragraphs)) return p.paragraphs; const a = []; for (let i = 1; i <= 100; i++) a.push(p["para" + i] || ""); return a; };
// a legacy-format post (posts.json) -> list item
export function listItemFromLegacy(p) {
  const paras = bodyParas(p);
  return { id: p.id, date: p.date, category: p.category, title: p.title, author: p.author, cover: p.img1 || null, excerpt: excerptOf(paras),
    words: paras.reduce((n, s) => n + (String(s).trim() ? String(s).trim().split(/\s+/).length : 0), 0) };
}
// DB row or legacy post -> what the post page renders
export function normPost(p) {
  const media = [];
  if (Array.isArray(p.media)) p.media.forEach((m) => { if (m && m.path) media.push({ slot: m.slot, path: m.path, caption: m.caption || "" }); });
  else for (let k = 1; k <= 10; k++) if (p["img" + k]) media.push({ slot: k, path: p["img" + k], caption: p[`img${k}caption`] || "" });
  const fmt = (p.extra && p.extra.format) || p.format || "plain";
  return { id: p.id, date: p.date, category: p.category, title: p.title, author: p.author, media,
    paragraphs: bodyParas(p).filter((s) => String(s).trim()), format: fmt === "md" ? "md" : "plain" };
}
