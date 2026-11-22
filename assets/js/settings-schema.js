/* settings-schema.js  (shared by the admin site AND the public site; keep the two copies identical)
 * The ONLY way settings reach the page: validate() -> whitelisted values -> toCssVars() / toAttrs().
 * Never inject raw strings as CSS or HTML. Unknown keys are dropped; bad values fall back to defaults.
 */
(function (root) {
  "use strict";

  var FONTS = {
    "Bricolage Grotesque": { stack: '"Bricolage Grotesque","Anek Bangla",system-ui,sans-serif', gf: "Bricolage+Grotesque:wght@500;700", bn: false },
    "IBM Plex Sans":       { stack: '"IBM Plex Sans","Anek Bangla",system-ui,sans-serif', gf: "IBM+Plex+Sans:wght@400;500;600", bn: false },
    "Newsreader":          { stack: '"Newsreader","Noto Serif Bengali",Georgia,serif', gf: "Newsreader:wght@500;700", bn: false },
    "Source Serif 4":      { stack: '"Source Serif 4","Noto Serif Bengali",Georgia,serif', gf: "Source+Serif+4:wght@400;600;700", bn: false },
    "Public Sans":         { stack: '"Public Sans","Hind Siliguri",system-ui,sans-serif', gf: "Public+Sans:wght@400;600", bn: false },
    "Anek Bangla":         { stack: '"Anek Bangla","IBM Plex Sans",sans-serif', gf: "Anek+Bangla:wght@400;600;700", bn: true },
    "Hind Siliguri":       { stack: '"Hind Siliguri","Anek Bangla",sans-serif', gf: "Hind+Siliguri:wght@400;500;600", bn: true },
    "Noto Serif Bengali":  { stack: '"Noto Serif Bengali","Anek Bangla",serif', gf: "Noto+Serif+Bengali:wght@400;600", bn: true },
    "Noto Sans Bengali":   { stack: '"Noto Sans Bengali","Anek Bangla",sans-serif', gf: "Noto+Sans+Bengali:wght@400;600", bn: true },
    "System UI":           { stack: 'system-ui,-apple-system,"Segoe UI","Noto Sans Bengali",sans-serif', gf: "", bn: true }
  };

  var PRESETS = {
    journal:  { label: "Technical Journal (default)",
      light: { bg: "#edf1f4", surface: "#f9fbfc", text: "#0d2036", muted: "#485a6d", accent: "#1d4fa3", onAccent: "#ffffff", signal: "#d98a00", border: "#c3cfda" },
      dark:  { bg: "#0b1622", surface: "#112133", text: "#e6eef6", muted: "#9db0c4", accent: "#6fa8ff", onAccent: "#0b1622", signal: "#ffb52e", border: "#26384c" } },
    paper:    { label: "Field Notebook",
      light: { bg: "#f6f1e7", surface: "#fffaf0", text: "#1f2a2e", muted: "#575f5c", accent: "#8a2b2b", onAccent: "#ffffff", signal: "#4f6b57", border: "#d9cfbb" },
      dark:  { bg: "#1a1714", surface: "#24201b", text: "#efe8da", muted: "#b3aa98", accent: "#e08a7a", onAccent: "#1a1714", signal: "#9bbf9f", border: "#3a342c" } },
    civic:    { label: "Civic Ledger",
      light: { bg: "#f7f7f2", surface: "#ffffff", text: "#17231d", muted: "#4f5b54", accent: "#0f4c3a", onAccent: "#ffffff", signal: "#b8923a", border: "#d4d6cb" },
      dark:  { bg: "#0e1612", surface: "#15211b", text: "#e8efe9", muted: "#a4b3a9", accent: "#5fc7a0", onAccent: "#0e1612", signal: "#d9b45b", border: "#2a3a31" } },
    midnight: { label: "Midnight Ink",
      light: { bg: "#f3f4f8", surface: "#ffffff", text: "#14151f", muted: "#525670", accent: "#4338ca", onAccent: "#ffffff", signal: "#b7791f", border: "#d3d6e4" },
      dark:  { bg: "#0c0d14", surface: "#14161f", text: "#e9eaf2", muted: "#a3a7bd", accent: "#8b93ff", onAccent: "#0c0d14", signal: "#f5b942", border: "#262a3b" } }
  };

  var CARDS = {
    flat:     { radius: "2px",  border: "0",                     shadow: "none" },
    outlined: { radius: "4px",  border: "1px solid var(--border)", shadow: "none" },
    raised:   { radius: "10px", border: "1px solid var(--border)", shadow: "0 12px 32px rgba(0,0,0,.14)" }
  };
  var DENSITY = { compact: 0.8, comfortable: 1, spacious: 1.25 };
  var HEROES = ["split", "centered", "minimal"];
  var MODES = ["auto", "light", "dark"];
  var SECTION_KEYS = ["explore", "latest"];
  var DEFAULT_NAV = [
    { label: "Home", href: "index.html", visible: true }, { label: "About", href: "about.html", visible: true },
    { label: "Journey", href: "journey.html", visible: true }, { label: "Skills", href: "skills.html", visible: true },
    { label: "Projects", href: "projects.html", visible: true }, { label: "Achievements", href: "achievements.html", visible: true },
    { label: "Writing", href: "blogs/", visible: true }, { label: "Memories", href: "memories/", visible: true },
    { label: "Gallery", href: "gallery.html", visible: true }
  ];

  var DEFAULTS = {
    preset: "journal", accent: "", mode: "auto",
    headingFont: "Bricolage Grotesque", bodyFont: "IBM Plex Sans", bnFont: "Anek Bangla",
    fontScale: 1, width: 1120, card: "outlined", density: "comfortable", animations: true, hero: "split",
    sections: SECTION_KEYS.map(function (k) { return { key: k, visible: true }; }),
    nav: DEFAULT_NAV.map(function (n) { return { label: n.label, href: n.href, visible: n.visible }; }),
    siteTitle: "", tagline: "", footerText: "", social: [],
    seo: { description: "", ogImage: "" }, favicon: ""
  };

  // ---------- coercion helpers ----------
  function str(v, max) {
    if (v == null) return "";
    var s = String(v).replace(/[\u0000-\u001f\u007f\u2028\u2029]/g, " ").trim();
    return s.length > max ? s.slice(0, max) : s;
  }
  function oneOf(v, list, dflt) { return list.indexOf(v) >= 0 ? v : dflt; }
  function num(v, lo, hi, dflt) { var n = parseFloat(v); return isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt; }
  function hex(v) { v = str(v, 7); return /^#[0-9a-fA-F]{6}$/.test(v) ? v.toLowerCase() : ""; }
  // https:// absolute, or a plain relative path (letters, digits, _ - . / ? = & #). Everything else (javascript:, data:, //host) is rejected.
  function safeUrl(v, allowRelative) {
    v = str(v, 500); if (!v) return "";
    if (/^https:\/\/[^\s"'<>\\]+$/i.test(v)) return v;
    if (allowRelative && /^(?![a-z][a-z0-9+.-]*:)(?!\/\/)[A-Za-z0-9_\-./]+(\?[A-Za-z0-9_=&-]*)?(#[A-Za-z0-9_-]*)?$/.test(v)) return v;
    return "";
  }

  function validate(raw) {
    raw = raw && typeof raw === "object" ? raw : {};
    var w = [], c = {}, d = DEFAULTS;
    c.preset = oneOf(raw.preset, Object.keys(PRESETS), d.preset);
    c.accent = hex(raw.accent);
    if (raw.accent && !c.accent) w.push("Accent colour must look like #1d4fa3; ignored.");
    c.mode = oneOf(raw.mode, MODES, d.mode);
    c.headingFont = oneOf(raw.headingFont, Object.keys(FONTS), d.headingFont);
    c.bodyFont = oneOf(raw.bodyFont, Object.keys(FONTS), d.bodyFont);
    c.bnFont = oneOf(raw.bnFont, Object.keys(FONTS), d.bnFont);
    c.fontScale = Math.round(num(raw.fontScale, 0.85, 1.25, 1) * 100) / 100;
    c.width = Math.round(num(raw.width, 880, 1400, 1120));
    c.card = oneOf(raw.card, Object.keys(CARDS), d.card);
    c.density = oneOf(raw.density, Object.keys(DENSITY), d.density);
    c.animations = raw.animations === true || raw.animations === "true" || (raw.animations === undefined);
    c.hero = oneOf(raw.hero, HEROES, d.hero);

    var seen = {}, secs = [];
    (Array.isArray(raw.sections) ? raw.sections : []).forEach(function (s) {
      if (s && SECTION_KEYS.indexOf(s.key) >= 0 && !seen[s.key]) { seen[s.key] = 1; secs.push({ key: s.key, visible: s.visible !== false }); }
    });
    SECTION_KEYS.forEach(function (k) { if (!seen[k]) secs.push({ key: k, visible: true }); });
    c.sections = secs;

    c.nav = (Array.isArray(raw.nav) ? raw.nav : d.nav).slice(0, 12).map(function (n) {
      if (!n) return null; var label = str(n.label, 30), href = safeUrl(n.href, true);
      if (!label || !href) { w.push("A menu link was dropped (needs a label and a relative path or https:// URL)."); return null; }
      return { label: label, href: href, visible: n.visible !== false };
    }).filter(Boolean);
    if (!c.nav.length) c.nav = d.nav.map(function (n) { return { label: n.label, href: n.href, visible: true }; });

    c.siteTitle = str(raw.siteTitle, 80);
    c.tagline = str(raw.tagline, 160);
    c.footerText = str(raw.footerText, 200);
    c.social = (Array.isArray(raw.social) ? raw.social : []).slice(0, 12).map(function (s) {
      if (!s) return null; var label = str(s.label, 30), url = safeUrl(s.url, false);
      return label && url ? { label: label, url: url } : null;
    }).filter(Boolean);
    var seo = raw.seo && typeof raw.seo === "object" ? raw.seo : {};
    c.seo = { description: str(seo.description, 300), ogImage: safeUrl(seo.ogImage, true) };
    c.favicon = safeUrl(raw.favicon, true);
    return { clean: c, warnings: w };
  }

  // ---------- colour maths (WCAG 2.x) ----------
  function lum(h) {
    var n = parseInt(h.slice(1), 16), a = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
  }
  function ratio(a, b) { var x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); }
  function bestText(bg) { return ratio("#ffffff", bg) >= ratio("#0b0b0b", bg) ? "#ffffff" : "#0b0b0b"; }

  function palette(clean, scheme) {
    var p = Object.assign({}, PRESETS[clean.preset][scheme]);
    if (clean.accent) { p.accent = clean.accent; p.onAccent = bestText(clean.accent); }
    return p;
  }
  function contrastReport(clean) {
    var out = [];
    ["light", "dark"].forEach(function (s) {
      var p = palette(clean, s);
      [["text on background", p.text, p.bg, 4.5], ["muted text on background", p.muted, p.bg, 4.5],
       ["accent (links) on background", p.accent, p.bg, 4.5], ["button text on accent", p.onAccent, p.accent, 4.5]].forEach(function (t) {
        var r = ratio(t[1], t[2]); out.push({ scheme: s, pair: t[0], ratio: Math.round(r * 100) / 100, ok: r >= t[3] });
      });
    });
    return out;
  }

  // ---------- output: the only things the page may apply ----------
  function toCssVars(clean, scheme) {
    var p = palette(clean, scheme === "dark" ? "dark" : "light"), card = CARDS[clean.card];
    return {
      "--bg": p.bg, "--surface": p.surface, "--text": p.text, "--muted": p.muted, "--accent": p.accent,
      "--on-accent": p.onAccent, "--signal": p.signal, "--border": p.border,
      "--display": FONTS[clean.headingFont].stack, "--sans": FONTS[clean.bodyFont].stack, "--bn": FONTS[clean.bnFont].stack,
      "--scale": String(clean.fontScale), "--wrap": clean.width + "px", "--density": String(DENSITY[clean.density]),
      "--card-radius": card.radius, "--card-border": card.border, "--card-shadow": card.shadow
    };
  }
  function toAttrs(clean) {
    return { "data-mode": clean.mode, "data-anim": clean.animations ? "on" : "off", "data-hero": clean.hero, "data-card": clean.card };
  }
  function googleFontsHref(clean) {
    var fams = [], seen = {};
    [clean.headingFont, clean.bodyFont, clean.bnFont].forEach(function (n) {
      var f = FONTS[n]; if (f && f.gf && !seen[f.gf]) { seen[f.gf] = 1; fams.push("family=" + f.gf); }
    });
    return fams.length ? "https://fonts.googleapis.com/css2?" + fams.join("&") + "&display=swap" : "";
  }

  var api = { FONTS: FONTS, PRESETS: PRESETS, CARDS: CARDS, DENSITY: DENSITY, HEROES: HEROES, MODES: MODES,
    SECTION_KEYS: SECTION_KEYS, DEFAULTS: DEFAULTS, validate: validate, safeUrl: safeUrl, ratio: ratio,
    contrastReport: contrastReport, toCssVars: toCssVars, toAttrs: toAttrs, googleFontsHref: googleFontsHref };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SiteSettings = api;
})(typeof window !== "undefined" ? window : globalThis);
