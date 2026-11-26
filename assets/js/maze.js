// maze.js - "The Labyrinth": an unlisted mini-game. Walk a generated maze; locked gates on the true path ask riddles about Hasib
// and this site. Reach the core to win. Riddles come from the database (answers are checked server-side, never sent to the
// browser); if the database is unreachable a built-in set is used whose answers are stored only as salted hashes.
const cfg = window.SITE_CONFIG || {};
const apiOn = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(cfg.SUPABASE_URL || "") && !!cfg.SUPABASE_ANON_KEY;
const FALLBACK = [{"q": "Four letters, Dhaka's engineering pride: the university where Hasib studied mechanical engineering.", "h": "Check the Journey page, 2019 to 2024.", "a": ["5431e6061e72b8bb2e6d3c3d", "57cce5ee0704d9aa2252a3ec"]}, {"q": "His thesis made incompressible flow visible using this branch of AI. (two words)", "h": "Projects page, Thesis 2024.", "a": ["5845be4d2b78a4c20d92861c", "a0f22ae203ee81ff144dd8a3"]}, {"q": "Besides engineering he studies business. At which three-letter institute in Dhaka is he doing his MBA?", "h": "About page, first paragraph.", "a": ["2c8ce2ad731978383e052db5", "72a66f5c95507c39006db4aa", "b00fd2bf05d47759f69ad967"]}, {"q": "It flies with no one on board. Name the three-letter project he built in 2022.", "h": "Projects page.", "a": ["3d61f67906e8dc389a3da2de", "4691f9a22f733d3d37929099", "2bfedb6e73c7bfdaff498b51"]}, {"q": "A cooler with no compressor: which module did his air conditioner project use?", "h": "Projects page, 2023.", "a": ["ceb8e9472af6121d1ed86dc6", "a8730ab7f1333961aaca32e5", "8a7a1260345d4c5fd3b0fa03"]}, {"q": "Scouting's highest honour he earned carries the title of this office.", "h": "Achievements page.", "a": ["c084d9fa6fd442d82439f640", "f1f5c63777632aa71e04d612", "f1f5c63777632aa71e04d612"]}, {"q": "In November 2023 he did his industrial training at RahimAfrooz. What does that company make?", "h": "Journey page, industrial training.", "a": ["e60d80e2885ea6f74f5a3cd7", "371dc4d5d9579d5ccf032bc8", "94637fa220fd2ca7665d2f5a"]}, {"q": "Four letters: the institution where he checks the nation's standards.", "h": "Journey page, 2025.", "a": ["f869e1acdf176812a900c738", "e4b956757f39b77b101f4834"]}, {"q": "He was Vice President of this campus press society. Give its initials.", "h": "Achievements or Projects page.", "a": ["558ff243badba2e0f359ca22", "2e0e29fcd580b5891572147c"]}, {"q": "Which BCS batch recommended him for the Administration cadre? (a number)", "h": "Journey page, last entry.", "a": ["b027dcc1aa123f2b1c567895", "529adf30d15cf388673bf3ed", "0de70880b1d3467fa1dbc043"]}];
const LEVELS = { easy: { n: 8, gates: 3, fog: false, label: "Easy" }, medium: { n: 12, gates: 4, fog: true, label: "Medium" }, hard: { n: 16, gates: 6, fog: true, label: "Hard" } };
const norm = (t) => String(t || "").toLowerCase().replace(/[\s.,'"!?()/:;_-]+/g, "");
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const N = 1, E = 2, S = 4, W = 8, DIRS = { [N]: [0, -1, S], [E]: [1, 0, W], [S]: [0, 1, N], [W]: [-1, 0, E] };

async function sha(t) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("").slice(0, 24); }
async function rpc(name, body) {
  const r = await fetch(`${cfg.SUPABASE_URL}/rest/v1/rpc/${name}`, { method: "POST", headers: { apikey: cfg.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  if (!r.ok) throw new Error("HTTP " + r.status); return r.json();
}
async function loadRiddles() {
  if (apiOn) { try { const rows = await rpc("get_riddles"); if (Array.isArray(rows) && rows.length) return rows.map((r) => ({ id: r.id, q: r.question, h: r.hint, remote: true })); } catch (_) {} }
  return FALLBACK.map((r, i) => ({ id: "f" + i, q: r.q, h: r.h, a: r.a, remote: false }));
}
async function check(r, answer) {
  if (!norm(answer)) return false;
  if (r.remote) { try { return (await rpc("check_riddle", { p_id: r.id, p_answer: answer })) === true; } catch (_) { return false; } }
  return r.a.includes(await sha("hm:" + norm(answer)));
}

function rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e9) / 1e9; }; }
function shuffle(a, r) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function generate(n, r) {
  const g = Array.from({ length: n }, () => new Array(n).fill(0)), seen = Array.from({ length: n }, () => new Array(n).fill(false));
  const stack = [[0, 0]]; seen[0][0] = true;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const opts = shuffle([N, E, S, W], r).filter((d) => { const nx = x + DIRS[d][0], ny = y + DIRS[d][1]; return nx >= 0 && ny >= 0 && nx < n && ny < n && !seen[ny][nx]; });
    if (!opts.length) { stack.pop(); continue; }
    const d = opts[0], nx = x + DIRS[d][0], ny = y + DIRS[d][1];
    g[y][x] |= d; g[ny][nx] |= DIRS[d][2]; seen[ny][nx] = true; stack.push([nx, ny]);
  }
  // a few extra openings so it isn't a single corridor (loops make the fog more interesting)
  for (let k = 0; k < Math.floor(n * n * 0.06); k++) { const x = Math.floor(r() * (n - 1)), y = Math.floor(r() * (n - 1)), d = r() < 0.5 ? E : S; g[y][x] |= d; g[y + DIRS[d][1]][x + DIRS[d][0]] |= DIRS[d][2]; }
  return g;
}
function solve(g, n, gates) {   // BFS shortest path start -> goal; gates (if given) are walls
  const prev = new Map(), q = [[0, 0]], key = (x, y) => y * n + x; prev.set(0, -1);
  while (q.length) { const [x, y] = q.shift(); if (x === n - 1 && y === n - 1) break;
    for (const d of [N, E, S, W]) if (g[y][x] & d) { const nx = x + DIRS[d][0], ny = y + DIRS[d][1], k = key(nx, ny); if (!prev.has(k) && !(gates && gates.has(k))) { prev.set(k, key(x, y)); q.push([nx, ny]); } } }
  const path = []; let k = key(n - 1, n - 1); if (!prev.has(k)) return null;
  while (k !== -1) { path.unshift(k); k = prev.get(k); } return path;
}

export function mountMaze(root) {
  const st = { lvl: "easy", seed: 0, n: 8, g: null, px: 0, py: 0, ax: 0, ay: 0, gates: new Map(), seen: new Set(), moves: 0, t0: 0, tEnd: 0, pen: 0, riddles: [], fog: false, busy: false, won: false, anim: 0 };
  root.innerHTML = `<section class="lab-hero"><div class="pattern" aria-hidden="true"></div><div class="wrap"><p class="sheet">Hidden page</p><h1>The Labyrinth</h1>
<p class="lead">Somewhere in this maze is the core. Gates along the true path stay sealed until you answer a riddle about Hasib and this website. The answers are hidden in plain sight on the other pages.</p></div></section>
<div class="wrap lab"><div class="lab-bar"><div class="mview" role="group" aria-label="Difficulty">${Object.entries(LEVELS).map(([k, v]) => `<button type="button" data-l="${k}" aria-pressed="${k === "easy"}">${v.label}</button>`).join("")}</div>
<label class="lab-fog"><input type="checkbox" id="fog"> Fog of war</label><button class="btn sm ghost" type="button" id="new">New maze</button></div>
<div class="lab-hud" aria-live="polite"><div><span>Time</span><b id="t">0:00</b></div><div><span>Moves</span><b id="mv">0</b></div><div><span>Gates</span><b id="gt">0/0</b></div><div><span>Best</span><b id="best">–</b></div></div>
<div class="lab-stage"><canvas id="cv" role="img" aria-label="Maze. Use the arrow keys, WASD, swipe, or the on-screen buttons to move."></canvas><div class="lab-win" id="win" hidden></div></div>
<div class="pad" aria-label="Move"><button type="button" data-d="${N}" aria-label="Up">▲</button><button type="button" data-d="${W}" aria-label="Left">◀</button><button type="button" data-d="${S}" aria-label="Down">▼</button><button type="button" data-d="${E}" aria-label="Right">▶</button></div>
<p class="small muted lab-help">Arrow keys or WASD to move · swipe on the maze · the glowing ring is the core · <span class="lockkey">?</span> marks a sealed gate.</p></div>
<dialog class="riddle" id="rd" aria-labelledby="rq"><form method="dialog" id="rf"><p class="sheet" id="rn">Gate</p><h2 id="rq"></h2><label class="visually-hidden" for="ra">Your answer</label><input id="ra" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Your answer" required>
<p class="rmsg" id="rm" role="status" aria-live="polite"></p><p class="rhint" id="rh" hidden></p><div class="cta"><button class="btn" type="submit" id="rs">Unlock</button><button class="btn ghost" type="button" id="rhb">Hint (+30s)</button><button class="btn ghost" type="button" id="rc">Step back</button></div></form></dialog>`;
  const cv = document.getElementById("cv"), ctx = cv.getContext("2d"), $ = (id) => document.getElementById(id), dlg = $("rd"), confetti = [];
  let cell = 20, pad = 10, timer = null;
  const css = () => { const s = getComputedStyle(document.documentElement), v = (k, d) => (s.getPropertyValue(k) || d).trim(); return { bg: v("--surface", "#fff"), page: v("--bg", "#eee"), text: v("--text", "#000"), muted: v("--muted", "#666"), border: v("--border", "#ccc"), accent: v("--accent", "#1d4fa3"), signal: v("--signal", "#d98a00") }; };
  const fmtT = (ms) => { const s = Math.floor(ms / 1000); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`; };
  const elapsed = () => (st.t0 ? (st.tEnd || Date.now()) - st.t0 : 0) + st.pen * 1000;
  const bestKey = () => "sc:v1:maze:" + st.lvl, best = () => { try { return Number(localStorage.getItem(bestKey())) || 0; } catch (_) { return 0; } };
  const hud = () => { $("t").textContent = fmtT(elapsed()); $("mv").textContent = st.moves; const open = [...st.gates.values()].filter((x) => x.open).length; $("gt").textContent = `${open}/${st.gates.size}`; const b = best(); $("best").textContent = b ? fmtT(b) : "–"; };

  function size() {
    const w = Math.min(root.querySelector(".lab-stage").clientWidth, 760), dpr = window.devicePixelRatio || 1;
    cell = Math.floor((w - 16) / st.n); pad = Math.floor((w - cell * st.n) / 2);
    cv.width = w * dpr; cv.height = w * dpr; cv.style.width = w + "px"; cv.style.height = w + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function newGame(seed) {
    const L = LEVELS[st.lvl]; st.n = L.n; st.seed = seed || (Date.now() ^ Math.floor(Math.random() * 1e9)); const r = rng(st.seed);
    st.g = generate(st.n, r); st.px = st.py = st.ax = st.ay = 0; st.moves = 0; st.t0 = 0; st.tEnd = 0; st.pen = 0; st.won = false; st.seen = new Set([0]); st.gates = new Map();
    const path = solve(st.g, st.n), pool = shuffle(st.riddles.slice(), r), k = Math.min(L.gates, pool.length, Math.max(0, path.length - 3));
    for (let i = 1; i <= k; i++) { const idx = Math.round((i * (path.length - 1)) / (k + 1)); st.gates.set(path[idx], { r: pool[i - 1], open: false, no: i }); }
    st.fog = $("fog").checked; $("win").hidden = true; size(); reveal(); hud(); if (!st.loop) { st.loop = true; draw(); }
  }
  function reveal() { const R = 2; for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) { const x = st.px + dx, y = st.py + dy; if (x >= 0 && y >= 0 && x < st.n && y < st.n && Math.abs(dx) + Math.abs(dy) <= R + 1) st.seen.add(y * st.n + x); } }

  function draw() {
    const c = css(), n = st.n, W2 = cell * n + pad * 2, now = performance.now();
    ctx.clearRect(0, 0, W2, W2); ctx.fillStyle = c.bg; ctx.fillRect(0, 0, W2, W2);
    ctx.strokeStyle = c.border; ctx.globalAlpha = 0.35; ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i <= n; i++) { ctx.moveTo(pad + i * cell + 0.5, pad); ctx.lineTo(pad + i * cell + 0.5, pad + n * cell); ctx.moveTo(pad, pad + i * cell + 0.5); ctx.lineTo(pad + n * cell, pad + i * cell + 0.5); }
    ctx.stroke(); ctx.globalAlpha = 1;
    // visited trail
    ctx.fillStyle = c.accent; ctx.globalAlpha = 0.09; st.seen.forEach((k) => { const x = k % n, y = Math.floor(k / n); if (st.fog) ctx.fillRect(pad + x * cell, pad + y * cell, cell, cell); }); ctx.globalAlpha = 1;
    // walls
    ctx.strokeStyle = c.text; ctx.lineWidth = Math.max(2, cell / 9); ctx.lineCap = "round"; ctx.beginPath();
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      if (st.fog && !st.seen.has(y * n + x)) continue;
      const v = st.g[y][x], X = pad + x * cell, Y = pad + y * cell;
      if (!(v & N)) { ctx.moveTo(X, Y); ctx.lineTo(X + cell, Y); } if (!(v & W)) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cell); }
      if (x === n - 1 && !(v & E)) { ctx.moveTo(X + cell, Y); ctx.lineTo(X + cell, Y + cell); } if (y === n - 1 && !(v & S)) { ctx.moveTo(X, Y + cell); ctx.lineTo(X + cell, Y + cell); }
    }
    ctx.stroke();
    // fog veil
    if (st.fog) { ctx.fillStyle = c.page; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!st.seen.has(y * n + x)) { ctx.globalAlpha = 0.92; ctx.fillRect(pad + x * cell - 1, pad + y * cell - 1, cell + 2, cell + 2); } ctx.globalAlpha = 1; }
    // gates
    st.gates.forEach((gt, k) => { const x = k % n, y = Math.floor(k / n), X = pad + x * cell, Y = pad + y * cell; if (st.fog && !st.seen.has(k)) return;
      if (gt.open) { ctx.strokeStyle = c.signal; ctx.setLineDash([3, 4]); ctx.lineWidth = 2; ctx.strokeRect(X + 4, Y + 4, cell - 8, cell - 8); ctx.setLineDash([]); return; }
      ctx.fillStyle = c.signal; ctx.globalAlpha = 0.18; ctx.fillRect(X + 2, Y + 2, cell - 4, cell - 4); ctx.globalAlpha = 1;
      ctx.strokeStyle = c.signal; ctx.lineWidth = 2; ctx.strokeRect(X + 3, Y + 3, cell - 6, cell - 6);
      ctx.fillStyle = c.signal; ctx.font = `700 ${Math.floor(cell * 0.55)}px ui-monospace, monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", X + cell / 2, Y + cell / 2 + 1); });
    // core (goal)
    { const X = pad + (n - 0.5) * cell, Y = pad + (n - 0.5) * cell, p = (Math.sin(now / 400) + 1) / 2;
      { ctx.strokeStyle = c.signal; ctx.lineWidth = 2; ctx.globalAlpha = 0.35 + p * 0.5; ctx.beginPath(); ctx.arc(X, Y, cell * (0.28 + p * 0.12), 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
        ctx.fillStyle = c.signal; ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 - Math.PI / 2, rr = i % 2 ? cell * 0.11 : cell * 0.24; ctx.lineTo(X + Math.cos(a) * rr, Y + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); } }
    // player (eased)
    st.ax += (st.px - st.ax) * 0.35; st.ay += (st.py - st.ay) * 0.35;
    { const X = pad + (st.ax + 0.5) * cell, Y = pad + (st.ay + 0.5) * cell; ctx.shadowColor = c.accent; ctx.shadowBlur = 14; ctx.fillStyle = c.accent; ctx.beginPath(); ctx.arc(X, Y, cell * 0.3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = c.bg; ctx.beginPath(); ctx.arc(X - cell * 0.08, Y - cell * 0.08, cell * 0.08, 0, Math.PI * 2); ctx.fill(); }
    // confetti
    for (let i = confetti.length - 1; i >= 0; i--) { const p = confetti[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.r += p.vr; p.life--; if (p.life <= 0) { confetti.splice(i, 1); continue; }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-3, -5, 6, 10); ctx.restore(); }
    st.anim = requestAnimationFrame(draw);   // continuous: the core pulses and the player glides
  }

  async function move(d) {
    if (st.busy || st.won || dlg.open) return;
    const v = st.g[st.py][st.px]; if (!(v & d)) { nudge(); return; }
    const nx = st.px + DIRS[d][0], ny = st.py + DIRS[d][1], k = ny * st.n + nx, gt = st.gates.get(k);
    if (gt && !gt.open) { ask(gt, () => { gt.open = true; step(nx, ny); }); return; }
    step(nx, ny);
  }
  function step(nx, ny) {
    if (!st.t0) { st.t0 = Date.now(); timer = setInterval(hud, 500); }
    st.px = nx; st.py = ny; st.moves++; reveal(); hud();
    if (nx === st.n - 1 && ny === st.n - 1) win();
  }
  function nudge() { cv.classList.remove("bump"); void cv.offsetWidth; cv.classList.add("bump"); }
  function ask(gt, ok) {
    $("rn").textContent = `Gate ${gt.no} of ${st.gates.size}`; $("rq").textContent = gt.r.q; $("rm").textContent = ""; $("rh").hidden = true; $("rh").textContent = gt.r.h ? "Hint: " + gt.r.h : "No hint for this one."; $("ra").value = ""; $("rhb").disabled = false;
    if (typeof dlg.showModal === "function") dlg.showModal(); else dlg.setAttribute("open", "");
    $("ra").focus();
    $("rf").onsubmit = async (e) => {
      e.preventDefault(); const btn = $("rs"); btn.disabled = true; $("rm").textContent = "Checking…"; $("rm").className = "rmsg";
      const good = await check(gt.r, $("ra").value); btn.disabled = false;
      if (good) { $("rm").textContent = "The gate grinds open."; $("rm").className = "rmsg ok"; setTimeout(() => { dlg.close(); ok(); }, 450); }
      else { $("rm").textContent = "The gate stays shut. Try again."; $("rm").className = "rmsg err"; dlg.classList.remove("shake"); void dlg.offsetWidth; dlg.classList.add("shake"); $("ra").select(); }
    };
    $("rhb").onclick = () => { if ($("rh").hidden) { $("rh").hidden = false; st.pen += 30; $("rhb").disabled = true; hud(); } };
    $("rc").onclick = () => dlg.close();
  }
  function win() {
    st.won = true; st.tEnd = Date.now(); clearInterval(timer); const t = elapsed(), b = best(), rec = !b || t < b;
    if (rec) { try { localStorage.setItem(bestKey(), String(t)); } catch (_) {} }
    hud();
    const W2 = cell * st.n + pad * 2, cols = [css().accent, css().signal, "#22c55e", "#e11d48", "#a855f7"];
    for (let i = 0; i < 160; i++) confetti.push({ x: W2 / 2, y: W2 / 2, vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 10 - 2, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.3, c: cols[i % cols.length], life: 90 + Math.random() * 60 });
    const box = $("win"); box.hidden = false;
    box.innerHTML = `<div class="lab-card"><p class="sheet">Core reached</p><h2>You solved the Labyrinth</h2><p class="muted">${esc(LEVELS[st.lvl].label)} · ${fmtT(t)} · ${st.moves} moves · ${st.gates.size} riddle${st.gates.size === 1 ? "" : "s"}${st.pen ? ` · +${st.pen}s hints` : ""}</p>${rec ? '<p class="tag sig">New personal best</p>' : ""}
<div class="cta"><button class="btn" type="button" id="again">Play again</button>${st.lvl !== "hard" ? '<button class="btn ghost" type="button" id="harder">Try harder</button>' : ""}<button class="btn ghost" type="button" id="copyr">Copy result</button></div></div>`;
    $("again").onclick = () => newGame(); if ($("harder")) $("harder").onclick = () => setLevel(st.lvl === "easy" ? "medium" : "hard");
    $("copyr").onclick = async () => { try { await navigator.clipboard.writeText(`I solved The Labyrinth (${LEVELS[st.lvl].label}) in ${fmtT(t)} with ${st.moves} moves. ${location.href}`); $("copyr").textContent = "Copied ✓"; } catch (_) {} };
    import("./track.js?v=202611270253").then((m) => m.trackView("mazewin")).catch(() => {});
    $("again").focus();
  }
  function setLevel(l) { st.lvl = l; $("fog").checked = LEVELS[l].fog; root.querySelectorAll("[data-l]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.l === l))); clearInterval(timer); newGame(); }

  const KEYS = { ArrowUp: N, ArrowRight: E, ArrowDown: S, ArrowLeft: W, w: N, d: E, s: S, a: W, W: N, D: E, S: S, A: W };
  document.addEventListener("keydown", (e) => { if (dlg.open || /INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || "")) return; const d = KEYS[e.key]; if (d) { e.preventDefault(); move(d); } });
  root.querySelector(".pad").onclick = (e) => { const b = e.target.closest("button[data-d]"); if (b) move(Number(b.dataset.d)); };
  let t0 = null; cv.addEventListener("touchstart", (e) => { t0 = [e.touches[0].clientX, e.touches[0].clientY]; }, { passive: true });
  cv.addEventListener("touchend", (e) => { if (!t0) return; const dx = e.changedTouches[0].clientX - t0[0], dy = e.changedTouches[0].clientY - t0[1]; t0 = null; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? E : W) : (dy > 0 ? S : N)); });
  root.querySelector(".lab-bar .mview").onclick = (e) => { const b = e.target.closest("[data-l]"); if (b) setLevel(b.dataset.l); };
  $("new").onclick = () => { clearInterval(timer); newGame(); };
  $("fog").onchange = () => { st.fog = $("fog").checked; };
  window.addEventListener("resize", () => size());

  cv.setAttribute("aria-busy", "true");
  loadRiddles().then((list) => { st.riddles = list; cv.removeAttribute("aria-busy"); newGame(); });
}
