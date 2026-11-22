/* boot.js - tiny blocking script (runs before first paint). Applies cached settings + theme so there is no colour flash.
 * Exposes window.SiteBoot {apply, toggle, scheme}. Visitor's light/dark choice is stored ONLY in their own browser. */
(function () {
  "use strict";
  var S = window.SiteSettings, root = document.documentElement, cur = S.validate({}).clean, fontLink = null;
  root.classList.add("js");
  function readCache() { try { var j = JSON.parse(localStorage.getItem("sc:v1:settings") || "null"); return j && j.v ? S.validate(j.v).clean : null; } catch (e) { return null; } }
  function local() { try { var t = localStorage.getItem("theme"); return t === "dark" || t === "light" ? t : null; } catch (e) { return null; } }
  function scheme() {
    var t = local() || (cur.mode !== "auto" ? cur.mode : null);
    return t || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function apply(clean) {
    cur = clean || cur;
    var sch = scheme(), vars = S.toCssVars(cur, sch), attrs = S.toAttrs(cur), k;
    for (k in vars) root.style.setProperty(k, vars[k]);
    for (k in attrs) root.setAttribute(k, attrs[k]);
    root.setAttribute("data-theme", sch);
    var meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.setAttribute("content", vars["--bg"]);
    var D = S.DEFAULTS, href = (cur.headingFont !== D.headingFont || cur.bodyFont !== D.bodyFont || cur.bnFont !== D.bnFont) ? S.googleFontsHref(cur) : "";
    if (href) { if (!fontLink) { fontLink = document.createElement("link"); fontLink.rel = "stylesheet"; document.head.appendChild(fontLink); } if (fontLink.getAttribute("href") !== href) fontLink.setAttribute("href", href); }
    else if (fontLink) { fontLink.parentNode.removeChild(fontLink); fontLink = null; }
    return sch;
  }
  function toggle() { var next = scheme() === "dark" ? "light" : "dark"; try { localStorage.setItem("theme", next); } catch (e) {} apply(); return next; }
  apply(readCache() || cur);
  if (window.matchMedia) { var mq = matchMedia("(prefers-color-scheme: dark)"), h = function () { if (!local()) apply(); }; mq.addEventListener ? mq.addEventListener("change", h) : mq.addListener(h); }
  window.SiteBoot = { apply: apply, toggle: toggle, scheme: scheme, current: function () { return cur; } };
})();
