#!/usr/bin/env python3
"""Offline tests for scripts/snapshot.py and scripts/snapshot-commit.sh using a local stand-in for the Supabase REST API.
   python3 tests/test_snapshot.py            (set LEGACY_DIR=/path/with/data.json,posts.json to use your real content)
"""
import json, os, re, shutil, subprocess, sys, tempfile, threading, urllib.parse
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LEG = os.environ.get("LEGACY_DIR")
ok_n = fail_n = 0
def ok(c, name):
    global ok_n, fail_n
    if c: ok_n += 1
    else: fail_n += 1; print("  FAIL:", name)

# ---------- content (real files if provided, otherwise a small sample)
if LEG and (Path(LEG) / "posts.json").exists():
    DATA = json.loads((Path(LEG) / "data.json").read_text(encoding="utf-8")); POSTS = json.loads((Path(LEG) / "posts.json").read_text(encoding="utf-8"))
else:
    DATA = {"site": {"name": "T"}, "titleblock": [["a", "b"]], "explore": [], "about": {"intro": "x"}, "interests": "i", "timeline": [{"period": "1", "title": "t", "org": "o"}],
            "skills": [{"group": "g", "items": ["a"]}], "projects": [{"title": "p", "meta": "m"}], "other_projects": [{"title": "w", "meta": "m"}], "achievements": [{"title": "a", "text": "t"}], "hobbies": [{"title": "h"}], "photos": [{"img": "i.webp", "caption": "c"}]}
    big = "দীর্ঘ " * 30
    POSTS = [{"id": i, "view_count": 0, "date": f"2025-06-{i:02d}", "created": f"2025-06-{i:02d}T00:00:00+06:00", "category": "ব্যক্তিগত", "title": f"পোস্ট {i}", **{f"para{k}": (big if k == 1 else "") for k in range(1, 101)}, **{f"img{k}": None for k in range(1, 11)}, **{f"img{k}caption": "" for k in range(1, 11)}, "author": "H"} for i in range(30, 10, -1)]
    for p in POSTS: p["img1"] = f"/media/uploads/posts/post{p['id']}.png"

# ---------- rows as the migration stores them (same transform rules as migrate.py)
SPEC = {"timeline": (["period", "title", "org", "text", "points", "link", "img"], {}), "skills": (["group", "items"], {"group": "grp"}), "projects": (["title", "meta", "img", "text", "people", "tools", "links"], {}),
        "achievements": (["title", "text", "img"], {}), "hobbies": (["title"], {}), "photos": (["img", "caption"], {})}
def rows_for(t, items, kind=None, start=1):
    cols, alias = SPEC[t]; out = []
    for i, o in enumerate(items):
        r = {"id": start + i, "sort_order": i, "status": "published", "updated_at": "2026-11-18T09:00:00+00:00", "created_at": "2026-11-18T09:00:00+00:00", "extra": {k: v for k, v in o.items() if k not in cols}}
        r.update({alias.get(k, k): o[k] for k in cols if k in o})
        if kind: r["kind"] = kind
        out.append(r)
    return out
def post_row(p, i):
    paras = [p.get(f"para{k}", "") for k in range(1, 101)]
    while paras and paras[-1] == "": paras.pop()
    media = [{"slot": k, "path": p.get(f"img{k}"), "caption": p.get(f"img{k}caption", "")} for k in range(1, 11) if p.get(f"img{k}") or p.get(f"img{k}caption")]
    known = {"id", "view_count", "date", "created", "category", "title", "author"} | {f"para{k}" for k in range(1, 101)} | {f"img{k}" for k in range(1, 11)} | {f"img{k}caption" for k in range(1, 11)}
    return {"id": p["id"], "sort_order": i, "status": "published", "date": p["date"], "category": p["category"], "title": p["title"], "paragraphs": paras, "media": media, "author": p.get("author", ""),
            "view_count": p.get("view_count", 0), "created_legacy": p.get("created"), "publish_at": p["date"] + "T00:00:00+06:00", "created_at": "2026-11-18T09:00:00+00:00", "updated_at": "2026-11-18T09:00:00+00:00",
            "extra": {k: v for k, v in p.items() if k not in known}}
def tables(extra=True):
    pr = rows_for("projects", DATA["projects"], "project"); pr += rows_for("projects", DATA["other_projects"], "other_project", len(pr) + 1)
    posts = [post_row(p, i) for i, p in enumerate(POSTS)]
    if extra:
        posts.append({**post_row({"id": 44, "date": "2026-11-01", "created": None, "category": "ব্লগ", "title": "New post", "para1": "x" * 100, "author": "H"}, 0), "created_legacy": None, "extra": {"format": "md"}, "updated_at": "2026-11-02T10:00:00+00:00", "created_at": "2026-11-02T10:00:00+00:00"})
        posts.append({**post_row({"id": 45, "date": "2026-11-03", "category": "ব্লগ", "title": "DRAFT", "para1": "x" * 100}, 0), "status": "draft"})
        posts.append({**post_row({"id": 46, "date": "2031-01-01", "category": "ব্লগ", "title": "FUTURE", "para1": "x" * 100}, 0), "publish_at": "2031-01-01T00:00:00+00:00"})
    T = {"profile": [{"id": 1, "status": "published", "site": DATA["site"], "titleblock": DATA["titleblock"], "explore": DATA["explore"], "about": DATA["about"], "interests": DATA["interests"], "extra": {}, "updated_at": "2026-11-18T09:00:00+00:00", "created_at": "2026-11-18T09:00:00+00:00"}],
         "projects": pr, "posts": posts, "site_settings": [{"id": 1, "settings": {"preset": "paper"}}]}
    for t in ("timeline", "skills", "achievements", "hobbies", "photos"): T[t] = rows_for(t, DATA[t])
    T["timeline"].append({**rows_for("timeline", [{"title": "DRAFT"}])[0], "id": 99, "status": "draft"})
    return T

# ---------- fake Supabase (mimics RLS: anon sees published rows only; posts also not scheduled in the future)
STATE = {"mode": "ok", "limit_posts": None, "hits": []}
class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        u = urllib.parse.urlparse(self.path); q = urllib.parse.parse_qs(u.query); t = u.path.replace("/rest/v1/", ""); STATE["hits"].append((t, self.headers.get("apikey")))
        if STATE["mode"] == "401": return self._send(401, {"message": "Invalid API key"})
        if STATE["mode"] == "empty": return self._send(200, [])
        rows = tables()[t]
        if t == "posts" and STATE["limit_posts"]: rows = rows[: STATE["limit_posts"]]
        rows = [r for r in rows if r.get("status", "published") == "published" and (t != "posts" or r["publish_at"] <= "2030-01-01")]
        if "id" in q: rows = [r for r in rows if str(r["id"]) == q["id"][0].replace("eq.", "")]
        off, lim = int(q.get("offset", ["0"])[0]), int(q.get("limit", ["1000"])[0]); self._send(200, rows[off: off + lim])
    def _send(self, code, obj):
        b = json.dumps(obj).encode(); self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
srv = HTTPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start(); URL = f"http://127.0.0.1:{srv.server_port}"
KEYV = "anon-test-key-123"

def snap(out, mode="ok", **env):
    STATE["mode"] = mode; STATE["limit_posts"] = env.pop("limit_posts", None)
    e = {**os.environ, "SUPABASE_URL": URL, "SUPABASE_ANON_KEY": KEYV, "OUT_DIR": str(out), "SITE_URL": "https://hasibrockie.github.io", **{k: v for k, v in env.items() if v is not None}}
    for k in [k for k, v in env.items() if v is None]: e.pop(k, None)
    return subprocess.run([sys.executable, str(ROOT / "scripts/snapshot.py")], env=e, capture_output=True, text=True)
rd = lambda p: json.loads(p.read_text(encoding="utf-8"))

# ---------- 1. round trip from an empty folder
print("snapshot.py")
tmp = Path(tempfile.mkdtemp()); out = tmp / "a"; out.mkdir()
r = snap(out); ok(r.returncode == 0, "run succeeds: " + r.stderr[-200:])
d, p = rd(out / "data.json"), rd(out / "posts.json")
ok(d == DATA, "data.json identical to the original legacy file" + ("" if d == DATA else " (keys differing: %s)" % [k for k in DATA if d.get(k) != DATA.get(k)]))
orig_ids = [x["id"] for x in POSTS]; got_ids = [x["id"] for x in p]
ok(got_ids == [44] + orig_ids, "posts ordered date desc, id desc; new post first")
ok(p[1:] == POSTS, "existing posts byte-for-byte equal to the originals (all para/img fields)")
ok(p[0].get("format") == "md" and p[0]["para1"].startswith("xxx"), "new Markdown post exported with format=md")
ok(not any(x["id"] in (45, 46) for x in p), "draft and scheduled-in-future posts are NOT exported")
ok(not any(x.get("title") == "DRAFT" for x in d["timeline"]), "draft timeline row not exported")
idx = rd(out / "posts-index.json"); ok(len(idx) == len(POSTS) + 1 and {"id", "date", "category", "title", "cover", "excerpt", "words"} <= set(idx[0]), "posts-index.json: light list")
ok(all("para1" not in x for x in idx), "index carries no bodies (small fallback)")
ex43 = next(x for x in idx if x["id"] == POSTS[0]["id"]); body = POSTS[0]["para1"]
ok(ex43["excerpt"] == (body.strip()[:220] if len(body.strip()) > 80 else ex43["excerpt"]), "excerpt rule matches the site")
ok(rd(out / "site-settings.json") == {"preset": "paper"}, "site-settings.json")
ok(not (out / "moments.json").exists(), "moments are never exported")
sm = (out / "sitemap.xml").read_text(encoding="utf-8"); locs = re.findall(r"<loc>([^<]*)</loc>", sm)
ok(len(locs) == 9 + len(POSTS) + 1 and "https://hasibrockie.github.io/post/?id=44" in locs and not any("moments" in l or "id=45" in l or "id=46" in l for l in locs), "sitemap: 9 pages + all published posts, no moments/drafts")
ok(sm.startswith('<?xml') and "<urlset" in sm and "&" not in sm.replace("&amp;", ""), "sitemap is valid-looking XML")
ok(all(h[1] == KEYV for h in STATE["hits"]), "every request used the public key only")

# ---------- 2. idempotent: second run changes nothing (no daily noise commits)
before = {f: (out / f).read_bytes() for f in ("data.json", "posts.json", "posts-index.json", "sitemap.xml", "site-settings.json")}
r2 = snap(out); ok(r2.returncode == 0 and "changed: nothing" in r2.stdout, "second run: nothing changed"); ok(all((out / f).read_bytes() == b for f, b in before.items()), "files identical after second run")

# ---------- 3. starting from the repo's original files: only the new files/the new post differ
out2 = tmp / "b"; out2.mkdir(); json.dump(DATA, open(out2 / "data.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2); json.dump(POSTS, open(out2 / "posts.json", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
r3 = snap(out2, ); ok("data.json" not in r3.stdout.split("changed:")[1], "data.json untouched when content is unchanged (no formatting churn)"); ok("posts.json" in r3.stdout.split("changed:")[1], "posts.json updated because a new post exists")

# ---------- 4. safety guards
out3 = tmp / "c"; out3.mkdir(); (out3 / "posts.json").write_text((out / "posts.json").read_text(encoding="utf-8"), encoding="utf-8"); keep = (out3 / "posts.json").read_bytes()
r = snap(out3, "empty"); ok(r.returncode == 2 and (out3 / "posts.json").read_bytes() == keep and not (out3 / "data.json").exists(), "empty API response refused (exit 2), fallback files untouched")
r = snap(out3, limit_posts=3); ok(r.returncode == 2 and "Refusing" in r.stderr and (out3 / "posts.json").read_bytes() == keep, "sudden drop in post count refused")
r = snap(out3, limit_posts=3, ALLOW_SHRINK="1"); ok(r.returncode == 0, "ALLOW_SHRINK=1 accepts a deliberate drop")
r = snap(tmp / "d", "401"); ok(r.returncode == 1 and KEYV not in r.stderr + r.stdout, "HTTP 401: clear error, key never printed")
r = snap(out, SUPABASE_ANON_KEY="sb_secret_abc"); ok(r.returncode == 1 and "secret" in r.stderr.lower(), "secret-style key refused")
sr = "eyJhbGciOiJIUzI1NiJ9." + __import__("base64").urlsafe_b64encode(b'{"role":"service_role"}').decode().rstrip("=") + ".sig"
r = snap(out, SUPABASE_ANON_KEY=sr); ok(r.returncode == 1 and "service_role" in r.stderr, "service_role JWT refused")
r = snap(out, SUPABASE_URL="not-a-url"); ok(r.returncode == 1, "malformed URL refused")

# ---------- 5. snapshot-commit.sh in throw-away git repos
print("snapshot-commit.sh")
def git(cwd, *a, env=None): return subprocess.run(["git", *a], cwd=cwd, capture_output=True, text=True, env={**os.environ, "GIT_AUTHOR_NAME": "t", "GIT_AUTHOR_EMAIL": "t@t", "GIT_COMMITTER_NAME": "t", "GIT_COMMITTER_EMAIL": "t@t", **(env or {})})
def mkrepo(age_days):
    base = Path(tempfile.mkdtemp()); bare = base / "remote.git"; work = base / "work"; subprocess.run(["git", "init", "-q", "--bare", "-b", "main", str(bare)], check=True)
    work.mkdir(); git(work, "init", "-q", "-b", "main"); (work / "README.md").write_text("x"); (work / "scripts").mkdir(); shutil.copy(ROOT / "scripts/snapshot-commit.sh", work / "scripts/")
    (work / ".gitignore").write_text("*.json\n")                       # the OLD .gitignore: the script must still add the files (git add -f)
    date = subprocess.run(["date", "-u", "-d", f"{age_days} days ago", "+%Y-%m-%dT%H:%M:%S"], capture_output=True, text=True).stdout.strip()
    git(work, "add", "-A"); git(work, "commit", "-q", "-m", "init", env={"GIT_AUTHOR_DATE": date, "GIT_COMMITTER_DATE": date}); git(work, "remote", "add", "origin", str(bare)); git(work, "push", "-q", "-u", "origin", "main"); return work, bare
def runsh(work): return subprocess.run(["sh", "scripts/snapshot-commit.sh"], cwd=work, capture_output=True, text=True, env={**os.environ, "GIT_TERMINAL_PROMPT": "0"})
work, bare = mkrepo(1)
for f in ("data.json", "posts.json", "posts-index.json", "site-settings.json", "sitemap.xml"): shutil.copy(out / f, work / f)
r = runsh(work); log = git(bare, "log", "--format=%s", "main").stdout; ok(r.returncode == 0 and "content snapshot" in log, "changed files are committed and pushed (even with the old *.json ignore rule): " + r.stderr[-150:])
ok(set(git(bare, "ls-tree", "-r", "--name-only", "main").stdout.split()) >= {"data.json", "posts.json", "sitemap.xml"}, "snapshot files present on the remote")
r = runsh(work); ok(r.returncode == 0 and "No changes" in r.stdout and git(bare, "rev-list", "--count", "main").stdout.strip() == "2", "unchanged -> no commit")
work2, bare2 = mkrepo(50); r = runsh(work2); ok(r.returncode == 0 and "heartbeat" in git(bare2, "log", "--format=%s", "main").stdout, "quiet 50 days -> heartbeat commit keeps the schedule alive")
work3, bare3 = mkrepo(10); r = runsh(work3); ok("heartbeat" not in git(bare3, "log", "--format=%s", "main").stdout, "quiet 10 days -> no heartbeat")
work4, bare4 = mkrepo(1); other = Path(tempfile.mkdtemp()) / "o"; git(other.parent, "clone", "-q", str(bare4), "o"); (other / "human.txt").write_text("hi"); git(other, "add", "-A"); git(other, "commit", "-q", "-m", "human push"); git(other, "push", "-q")
for f in ("data.json", "posts.json"): shutil.copy(out / f, work4 / f)
r = runsh(work4); lg = git(bare4, "log", "--format=%s", "main").stdout; ok(r.returncode == 0 and "human push" in lg and "content snapshot" in lg, "a human push in between is rebased, not clobbered: " + r.stderr[-120:])

# ---------- 6. workflow file
print("workflow")
import yaml
wf = yaml.safe_load((ROOT / ".github/workflows/snapshot.yml").read_text(encoding="utf-8")); txt = (ROOT / ".github/workflows/snapshot.yml").read_text(encoding="utf-8"); trig = wf.get(True, wf.get("on"))
ok("schedule" in trig and "workflow_dispatch" in trig, "daily schedule + manual trigger"); ok(wf["permissions"] == {"contents": "write"}, "least privilege: contents: write only")
ok(re.search(r"uses: actions/checkout@[0-9a-f]{40}\b", txt) is not None, "action pinned to a full commit SHA"); ok("secrets." not in txt and "vars.SUPABASE_URL" in txt and "vars.SUPABASE_ANON_KEY" in txt, "uses public repo variables only, no secrets")
ok("github.repository ==" in txt, "forks do not run it"); ok(not re.search(r"\$\{\{\s*github\.event", txt), "no untrusted event data interpolated into shell")
print(f"\n{ok_n} passed, {fail_n} failed"); sys.exit(1 if fail_n else 0)
