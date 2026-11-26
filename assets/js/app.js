// app.js - entry point. Paints a skeleton at once, then renders cache -> API -> (snapshot if the API is slow/down).
import { loadBundle, loadPost } from "./data.js";
import { initSettings, applySeo } from "./theme.js";
import * as V from "./render.js";
import { trackView } from "./track.js";

const P = document.body.dataset.page, main = document.getElementById("main");
let S = (window.SiteBoot && window.SiteBoot.current()) || window.SiteSettings.validate({}).clean;
let bundle = null, meta = null, post = null, postMeta = null, momentsMounted = false, chromeSig = "";
const wstate = { q: "", c: "" };

document.addEventListener("error", (e) => { const t = e.target; if (t && t.tagName === "IMG" && t.hasAttribute("data-hide")) t.remove(); }, true);   // CSP-safe replacement for inline onerror
main.addEventListener("click", (e) => { if (e.target && e.target.id === "retry") window.location.reload(); });

function renderChrome() {
  const site = bundle && bundle.data && bundle.data.site;
  const sig = JSON.stringify([S.nav, S.siteTitle, S.footerText, S.social, site && [site.name, site.social]]);
  if (sig === chromeSig) return; chromeSig = sig; V.chrome(S, site);
}
async function renderPostPage() {
  if (postMeta && postMeta.notFound) { main.innerHTML = `<div class="wrap err"><h1>Post not found</h1><p><a href="${document.body.dataset.root || ""}blogs/">Back to all posts</a></p></div>`; return; }
  if (!post) return;
  const info = await V.postPage(post, bundle ? bundle.posts : []);
  main.innerHTML = V.notice(postMeta) + info.html; V.postSeo(post, info); await info.after();
}
function renderPage() {
  renderChrome(); applySeo(S, P);
  if (P === "moments") { if (!momentsMounted) { momentsMounted = true; import("./moments.js").then((m) => m.mountMoments(main)); } return; }
  if (P === "post") return renderPostPage();
  if (!bundle) return;
  const fn = V.pages[P]; if (!fn) return;
  main.innerHTML = V.notice(meta) + fn(bundle.data, bundle.posts, S);
  if (P === "writing") V.wireWriting(bundle.posts, wstate);
}

if (P !== "moments" && P !== "404") main.innerHTML = V.skeleton(P);
initSettings((clean) => { S = clean; renderPage(); });
if (P === "404") {                                   // static message stays; we only add header/footer
  renderChrome();
  loadBundle("404", (b) => { if (b) { bundle = b; renderChrome(); } });
} else if (P !== "moments") {
  loadBundle(P, (b, m) => {
    if (!b) { if (!bundle && !post) { renderChrome(); main.innerHTML = V.errorState(); } return; }
    bundle = b; meta = m; renderPage();
  });
  if (P === "post") {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!/^\d+$/.test(id || "")) { postMeta = { notFound: true }; renderPage(); }
    else loadPost(id, (p, m) => { post = p; postMeta = m; if (p) trackView("post", id); if (!p && !m.notFound && !bundle) { main.innerHTML = V.errorState(); return; } renderPage(); });
  }
} else renderPage();
if (P !== "post") trackView(P);
