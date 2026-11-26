// lightbox.js - full-screen photo viewer. Keyboard (Esc, ←, →), swipe, focus returns to the opener. Built with DOM APIs (no innerHTML of data).
let dlg = null, items = [], idx = 0, opener = null, onChange = null;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

function build() {
  dlg = el("dialog", "lb"); dlg.setAttribute("aria-label", "Photo viewer");
  const stage = el("div", "stage"), img = el("img"); img.alt = ""; stage.append(img);
  const cap = el("div", "cap"), b = el("b"), s = el("span"); cap.append(b, s);
  const count = el("p", "count"), close = el("button", "close", "×"), prev = el("button", "nav-b prev", "‹"), next = el("button", "nav-b next", "›");
  close.type = prev.type = next.type = "button"; close.setAttribute("aria-label", "Close"); prev.setAttribute("aria-label", "Previous photo"); next.setAttribute("aria-label", "Next photo");
  dlg.append(stage, cap, count, close, prev, next); document.body.append(dlg);
  close.onclick = () => dlg.close(); prev.onclick = () => go(-1); next.onclick = () => go(1);
  stage.onclick = (e) => { if (e.target === stage) dlg.close(); };
  dlg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") go(-1); else if (e.key === "ArrowRight") go(1); });
  dlg.addEventListener("close", () => { document.documentElement.classList.remove("lb-open"); if (opener && opener.focus) opener.focus(); if (onChange) onChange(null); });
  let x0 = null; dlg.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  dlg.addEventListener("touchend", (e) => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); x0 = null; });
  dlg._ui = { img, b, s, count, prev, next };
}
function draw() {
  const it = items[idx], u = dlg._ui;
  u.img.src = it.src; u.img.alt = it.alt || it.title || "";
  u.b.textContent = it.title || ""; u.s.textContent = it.sub || "";
  u.count.textContent = items.length > 1 ? `${idx + 1} / ${items.length}` : "";
  u.prev.hidden = u.next.hidden = items.length < 2;
  [items[idx + 1], items[idx - 1]].forEach((n) => { if (n) { const p = new Image(); p.src = n.src; } });   // preload neighbours
  if (onChange) onChange(it);
}
function go(d) { if (items.length < 2) return; idx = (idx + d + items.length) % items.length; draw(); }

/** open([{src, alt, title, sub, id}], index, {onChange}) */
export function openLightbox(list, i = 0, opts = {}) {
  if (!list.length) return;
  if (!dlg) build();
  items = list; idx = Math.max(0, Math.min(i, list.length - 1)); opener = document.activeElement; onChange = opts.onChange || null;
  draw();
  if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
  document.documentElement.classList.add("lb-open");
}
