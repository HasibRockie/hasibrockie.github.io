// app.js - entry point. Paints a skeleton at once, then renders cache -> API -> (snapshot if the API is slow/down).
import { loadBundle, loadPost } from "./data.js?v=202611270222";
import { initSettings, applySeo } from "./theme.js?v=202611270222";
import * as V from "./render.js?v=202611270222";
import { trackView } from "./track.js?v=202611270222";
import { reveal, bindScroll, wireShare, wireGallery, wireContact, wireJourney, wireProjects } from "./enhance.js?v=202611270222";

const P = document.body.dataset.page, R = document.body.dataset.root || "", main = document.getElementById("main");
{ const m = P === "404" && /^\/post\/(\d+)\/?$/.exec(window.location.pathname); if (m) window.location.replace(`/post/?id=${m[1]}`); }   // brand-new post: static page not generated yet
let S = (window.SiteBoot && window.SiteBoot.current()) || window.SiteSettings.validate({}).clean;
let bundle = null, meta = null, post = null, postMeta = null, momentsMounted = false, chromeSig = "", lastHtml = "";
const wstate = { q: "", c: "" };

document.addEventListener("error", (e) => { const t = e.target; if (t && t.tagName === "IMG" && t.hasAttribute("data-hide")) t.remove(); }, true);   // CSP-safe replacement for inline onerror
main.addEventListener("click", (e) => { if (e.target && e.target.id === "retry") window.location.reload(); });

function renderChrome() {
  const site = bundle && bundle.data && bundle.data.site;
  const sig = JSON.stringify([S.nav, S.siteTitle, S.tagline, S.footerText, S.social, S.announcement, site && [site.name, site.social, site.email, site.tagline]]);
  if (sig === chromeSig) return; chromeSig = sig; V.chrome(S, site); bindScroll();
}
async function renderPostPage() {
  if (postMeta && postMeta.notFound) { main.innerHTML = `<div class="wrap err"><h1>Post not found</h1><p><a href="${R}blogs/">Back to all posts</a></p></div>`; return; }
  if (!post) return;
  const info = await V.postPage(post, bundle ? bundle.posts : []);
  main.innerHTML = V.notice(postMeta) + info.html; V.postSeo(post, info); await info.after(); wireShare(post.title); reveal(main);
}
function renderPage() {
  renderChrome(); applySeo(S, P);
  if (OWN) return;
  if (P === "moments") { if (!momentsMounted) { momentsMounted = true; import("./moments.js?v=202611270222").then((m) => { m.mountMoments(main); reveal(main); }); } return; }
  if (P === "post") return renderPostPage();
  if (!bundle) return;
  const fn = V.pages[P]; if (!fn) return;
  const html = V.notice(meta) + fn(bundle.data, bundle.posts, S);
  if (html === lastHtml) return;                        // cache -> API with identical content: don't redraw (no flicker, keeps scroll/inputs)
  lastHtml = html; main.innerHTML = html;
  if (P === "writing") V.wireWriting(bundle.posts, wstate);
  if (P === "gallery") wireGallery(bundle.data.photos || [], V.imageURL);
  if (P === "about") wireContact();
  if (P === "journey") wireJourney();
  if (P === "projects") wireProjects();
  if (P === "home" && S.sections.some((x) => x.key === "moments" && x.visible)) import("./moments.js?v=202611270222").then((m) => m.fillHomeStrip(R)).catch(() => {});
  reveal(main);
}

const OWN = P === "labyrinth";                         // pages that draw their own content
if (P !== "moments" && P !== "404" && !OWN) main.innerHTML = V.skeleton(P);
initSettings((clean) => { S = clean; renderPage(); });
if (OWN) {
  renderChrome();
  loadBundle("404", (b) => { if (b) { bundle = b; renderChrome(); } });
  import("./maze.js?v=202611270222").then((m) => m.mountMaze(main));
} else if (P === "404") {                                   // static message stays; we only add header/footer
  renderChrome();
  loadBundle("404", (b) => { if (b) { bundle = b; renderChrome(); } });
} else if (P !== "moments") {
  loadBundle(P, (b, m) => {
    if (!b) { if (!bundle && !post) { renderChrome(); main.innerHTML = V.errorState(); } return; }
    bundle = b; meta = m; renderPage();
  });
  if (P === "post") {
    const id = new URLSearchParams(window.location.search).get("id") || document.body.dataset.postId;
    if (!/^\d+$/.test(id || "")) { postMeta = { notFound: true }; renderPage(); }
    else loadPost(id, (p, m) => { post = p; postMeta = m; if (p) trackView("post", id); if (!p && !m.notFound && !bundle) { main.innerHTML = V.errorState(); return; } renderPage(); });
  }
} else {
  renderPage();
  loadBundle("moments", (b) => { if (b) { bundle = b; renderChrome(); } });   // footer email/social
}
if (P !== "post") trackView(P);
