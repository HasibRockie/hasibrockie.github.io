// theme.js - applies saved settings; accepts live-preview messages ONLY from the admin origin.
import { loadSettings } from "./data.js?v=202611261734";
const cfg = window.SITE_CONFIG || {};
let previewOn = false;
export const isPreview = () => new URLSearchParams(window.location.search).has("adminPreview");

export function initSettings(onChange) {
  const S = window.SiteSettings;
  loadSettings((clean) => { if (previewOn) return; window.SiteBoot.apply(clean); onChange(clean); });
  const origin = cfg.ADMIN_ORIGIN || "";
  if (isPreview() && /^https:\/\/[a-z0-9.-]+$/i.test(origin) && !/YOUR-/.test(origin) && window.parent !== window) {
    window.addEventListener("message", (e) => {
      if (e.origin !== origin || e.source !== window.parent) return;                       // wrong sender: ignore
      const d = e.data; if (!d || d.source !== "hasib-admin" || d.type !== "preview-settings") return;
      previewOn = true;
      const clean = S.validate(d.settings).clean;                                           // re-validate here, never trust the sender
      window.SiteBoot.apply(clean); onChange(clean);
    });
    try { window.parent.postMessage({ type: "preview-ready" }, origin); } catch (_) {}
  }
}

/** Optional SEO touches from settings (crawlers that don't run JS still see the static tags in each HTML file). */
export function applySeo(S, page) {
  const abs = (p) => { try { return new URL(p, window.location.origin + "/").href; } catch (_) { return ""; } };
  const set = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val) el.setAttribute(attr, val); };
  if (page === "home" && S.seo.description) { set('meta[name="description"]', "content", S.seo.description); set('meta[property="og:description"]', "content", S.seo.description); set('meta[name="twitter:description"]', "content", S.seo.description); }
  if (S.seo.ogImage) set('meta[property="og:image"]', "content", abs(S.seo.ogImage));
  if (S.favicon) set('link[rel="icon"]', "href", abs(S.favicon));
}
