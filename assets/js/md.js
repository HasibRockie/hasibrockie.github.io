// md.js - Markdown for NEW posts only (legacy posts stay plain text). Libraries are self-hosted and loaded on demand.
const R = (document.body && document.body.dataset.root) || "";
const TAGS = ["p", "br", "strong", "em", "b", "i", "u", "s", "del", "code", "pre", "blockquote", "ul", "ol", "li", "h2", "h3", "h4", "hr", "a", "img", "table", "thead", "tbody", "tr", "th", "td", "sup", "sub"];
let loading = null, hooked = false;
function load() {
  if (window.marked && window.DOMPurify) return Promise.resolve();
  return (loading ||= new Promise((res, rej) => {
    let n = 0; ["marked.umd.js", "purify.min.js"].forEach((f) => {
      const s = document.createElement("script"); s.src = R + "vendor/" + f;
      s.onload = () => { if (++n === 2) res(); }; s.onerror = () => rej(new Error("Could not load the text renderer.")); document.head.appendChild(s);
    });
  }));
}
/** Returns sanitised HTML (allow-list tags/attributes; no styles, no scripts, no data: or javascript: URLs). */
export async function renderMd(text) {
  await load();
  const P = window.DOMPurify;
  if (!hooked) { P.addHook("afterSanitizeAttributes", (n) => { if (n.tagName === "A") { n.setAttribute("rel", "noopener noreferrer"); n.setAttribute("target", "_blank"); } }); hooked = true; }
  // markdown "# Heading" becomes h2 (the post title is the page's only h1)
  const raw = window.marked.parse(String(text || ""), { breaks: true, gfm: true }).replace(/<(\/?)h1\b/g, "<$1h2");
  return P.sanitize(raw, { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ["href", "src", "alt", "title"], ALLOW_DATA_ATTR: false, FORBID_ATTR: ["style"] });
}
