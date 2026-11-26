#!/usr/bin/env python3
"""Daily snapshot: reads the PUBLIC Supabase API (anon key, published rows only) and rewrites the static files the public site
falls back to, plus sitemap.xml. Writes a file only when its content really changed. Standard library only.

  env  SUPABASE_URL, SUPABASE_ANON_KEY     (public values; nothing secret is ever needed)
       SITE_URL   default https://hasibrockie.github.io
       OUT_DIR    default . (repo root)
       ALLOW_SHRINK=1  accept a much smaller post list (use only after deleting many posts on purpose)

Writes: data.json, posts.json (same legacy format as before), posts-index.json (light list), site-settings.json, sitemap.xml,
and post/<id>/index.html (a static page per published post for search engines and link previews).
Never writes moment rows into the JSON snapshots (the Moments page loads them live). Exit codes: 0 ok, 1 error, 2 refused to overwrite (safety guard).
"""
import datetime, json, os, re, sys, time, urllib.error, urllib.parse, urllib.request
from pathlib import Path

URL = os.environ.get("SUPABASE_URL", "").rstrip("/"); KEY = os.environ.get("SUPABASE_ANON_KEY", "").strip()
SITE = os.environ.get("SITE_URL", "https://hasibrockie.github.io").rstrip("/") or "https://hasibrockie.github.io"
OUT = Path(os.environ.get("OUT_DIR", "."))

def die(msg, code=1): print("ERROR:", msg, file=sys.stderr); sys.exit(code)

if not re.fullmatch(r"https?://[A-Za-z0-9.\-]+(:\d+)?", URL): die("SUPABASE_URL is missing or malformed (set it in repo Settings > Variables).")
if not KEY or KEY.startswith("sb_secret_"): die("SUPABASE_ANON_KEY is missing, or is a secret key. Use the public anon/publishable key.")
if KEY.count(".") == 2:
    import base64
    try:
        pl = KEY.split(".")[1]; role = json.loads(base64.urlsafe_b64decode(pl + "=" * (-len(pl) % 4))).get("role")
        if role == "service_role": die("That is the service_role key. Use the anon key.")
    except (ValueError, json.JSONDecodeError): pass

def get(table, query, page=1000):
    out, off = [], 0
    while True:
        q = f"{URL}/rest/v1/{table}?{query}&limit={page}&offset={off}"
        for attempt in range(4):
            try:
                with urllib.request.urlopen(urllib.request.Request(q, headers={"apikey": KEY, "Accept": "application/json"}), timeout=30) as r:
                    chunk = json.load(r); break
            except (urllib.error.URLError, TimeoutError, ValueError) as e:
                if isinstance(e, urllib.error.HTTPError) and e.code < 500: die(f"{table}: HTTP {e.code} (check URL/key and that sql/02_security.sql ran)")
                if attempt == 3: die(f"{table}: {e}")
                time.sleep(2 ** attempt * 2)
        out += chunk
        if len(chunk) < page: return out
        off += page

# ---- rows -> legacy shape (same rules as migrate.py / admin backup.js / public legacy.js)
SPEC = {"timeline": (["period", "title", "org", "text", "points", "link", "img"], {}), "skills": (["group", "items"], {"group": "grp"}),
        "projects": (["title", "meta", "img", "text", "people", "tools", "links"], {}), "achievements": (["title", "text", "img"], {}),
        "hobbies": (["title"], {}), "photos": (["img", "caption"], {})}
def back_item(t, r):
    cols, alias = SPEC[t]; o = {}
    for k in cols:
        v = r.get(alias.get(k, k))
        if v is not None: o[k] = v
    o.update(r.get("extra") or {}); return o
def back_post(r):
    o = {"id": r["id"], "view_count": r.get("view_count") or 0, "date": r["date"], "created": r.get("created_legacy") or r.get("created_at"),
         "category": r["category"], "title": r["title"]}
    ps = r.get("paragraphs") or []
    for k in range(1, 101): o[f"para{k}"] = ps[k - 1] if k <= len(ps) else ""
    slots = {m["slot"]: m for m in (r.get("media") or [])}
    for k in range(1, 11):
        o[f"img{k}"] = slots[k]["path"] if k in slots and slots[k].get("path") else None
        o[f"img{k}caption"] = slots[k].get("caption", "") if k in slots else ""
    o["author"] = r.get("author") or ""; o.update(r.get("extra") or {}); return o
def excerpt_words(r):
    ps = r.get("paragraphs") or []
    ex = next((p.strip()[:220] for p in ps if len(p.strip()) > 80 and not re.match(r"[\[(]", p.strip())), "")
    return ex, sum(len(p.strip().split()) for p in ps if p.strip())
def list_item(r):
    ex, words = excerpt_words(r); cov = next((m.get("path") for m in (r.get("media") or []) if m.get("slot") == 1), None)
    return {"id": r["id"], "date": r["date"], "category": r["category"], "title": r["title"], "author": r.get("author"), "cover": cov, "excerpt": ex, "words": words}

def main():
    by = lambda rows: sorted(rows, key=lambda r: (r.get("sort_order", 0), r["id"]))
    prof = get("profile", "select=*&id=eq.1")
    if not prof: die("profile row is empty; refusing to overwrite the snapshot.", 2)
    T = {t: by(get(t, "select=*")) for t in SPEC}
    posts = sorted(get("posts", "select=*&order=id.asc"), key=lambda r: (r["date"], r["id"]), reverse=True)
    sett = get("site_settings", "select=settings&id=eq.1")

    p = prof[0]; data = {k: p[k] for k in ("site", "titleblock", "explore", "about", "interests") if k in p}; data.update(p.get("extra") or {})
    for t in ("timeline", "skills", "achievements", "hobbies", "photos"): data[t] = [back_item(t, r) for r in T[t]]
    data["projects"] = [back_item("projects", r) for r in T["projects"] if r.get("kind") == "project"]
    data["other_projects"] = [back_item("projects", r) for r in T["projects"] if r.get("kind") == "other_project"]
    legacy_posts = [back_post(r) for r in posts]; index = [list_item(r) for r in posts]; settings = (sett[0]["settings"] if sett else {}) or {}

    # ---- safety guard: a misconfigured URL/outage must never wipe the fallback
    old = OUT / "posts.json"
    if old.exists() and not os.environ.get("ALLOW_SHRINK"):
        n_old = len(json.loads(old.read_text(encoding="utf-8")))
        if n_old >= 5 and len(posts) < max(1, int(n_old * 0.7)):
            die(f"API returned {len(posts)} posts but the snapshot has {n_old}. Refusing to overwrite (set ALLOW_SHRINK=1 if you deleted posts on purpose).", 2)
    if not data["timeline"] and not posts: die("API returned no timeline and no posts; refusing to overwrite.", 2)

    changed = []
    def put(name, obj):
        f = OUT / name; new = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
        if f.exists():
            try:
                if json.loads(f.read_text(encoding="utf-8")) == obj: return
            except ValueError: pass
        f.write_text(new, encoding="utf-8"); changed.append(name)
    put("data.json", data); put("posts.json", legacy_posts); put("posts-index.json", index); put("site-settings.json", settings)

    # ---- static post pages: post/<id>/index.html with real title, description, cover and text, so search engines and
    # link previews (Facebook, LinkedIn, WhatsApp) see the story without running JavaScript. The page script takes over for people.
    changed += write_post_pages(posts, settings)

    # ---- sitemap (deterministic: lastmod comes from the content, so an unchanged site produces no diff)
    day = lambda rows: max((str(r.get("updated_at") or r.get("created_at") or "")[:10] for r in rows), default="") or datetime.date.today().isoformat()
    personal = [r for r in posts if r["category"] == "ব্যক্তিগত"]
    pages = [("", "weekly", "1.0", day(posts + prof)), ("about.html", "monthly", "0.8", day(prof)), ("journey.html", "monthly", "0.8", day(T["timeline"])),
             ("skills.html", "monthly", "0.8", day(T["skills"] + prof)), ("projects.html", "monthly", "0.8", day(T["projects"])),
             ("achievements.html", "monthly", "0.8", day(T["achievements"])), ("gallery.html", "monthly", "0.8", day(T["photos"] + T["hobbies"])),
             ("blogs/", "weekly", "0.9", day(posts)), ("memories/", "monthly", "0.7", day(personal or posts)),
             ("moments/", "weekly", "0.7", day(T["photos"] + T["hobbies"]))]
    esc = lambda s: s.replace("&", "&amp;").replace("<", "&lt;")
    rows = [f"<url><loc>{esc(SITE + '/' + p)}</loc><lastmod>{lm}</lastmod><changefreq>{cf}</changefreq><priority>{pr}</priority></url>" for p, cf, pr, lm in pages]
    rows += [f"<url><loc>{esc(SITE)}/post/{r['id']}/</loc><lastmod>{day([r])}</lastmod><changefreq>yearly</changefreq><priority>0.6</priority></url>" for r in sorted(posts, key=lambda r: -r["id"])]
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(rows) + "\n</urlset>\n"
    f = OUT / "sitemap.xml"
    if not f.exists() or f.read_text(encoding="utf-8") != sm: f.write_text(sm, encoding="utf-8"); changed.append("sitemap.xml")

    print(f"posts={len(posts)} timeline={len(data['timeline'])} projects={len(data['projects'])}+{len(data['other_projects'])} photos={len(data['photos'])} sitemap_urls={len(rows)}")
    print("changed:", ", ".join(changed) if changed else "nothing")
    if os.environ.get("GITHUB_OUTPUT"):
        with open(os.environ["GITHUB_OUTPUT"], "a") as g: g.write(f"changed={'true' if changed else 'false'}\n")

import html as _html
CAT_EN = {"ফিকশন": "Fiction", "ব্যক্তিগত": "Personal", "ধর্মীয়": "Faith", "ব্লগ": "Blog", "অন্যান্য": "Other"}
def post_meta(r, settings):
    ex, words = excerpt_words(r); extra = r.get("extra") or {}
    desc = re.sub(r"[#*_`>\[\]]", "", (extra.get("seoDescription") or ex or "")).strip()
    desc = (desc[:157] + "…") if len(desc) > 160 else desc
    cov = next((m for m in (r.get("media") or []) if m.get("slot") == 1), None)
    cpath = (cov or {}).get("path") or ""
    img = cpath if cpath.startswith("https://") else (f"{SITE}/assets/imgs/fiction/post{r['id']}.png" if cpath else ((settings.get("seo") or {}).get("ogImage") or ""))
    alt = extra.get("coverAlt") or (cov or {}).get("caption") or r["title"]
    return desc, img, alt, max(1, round(words / 180))
def render_post_page(tpl, r, settings):
    e = lambda t: _html.escape(str(t or ""), quote=True)
    desc, img, alt, mins = post_meta(r, settings); url = f"{SITE}/post/{r['id']}/"; title = f"{r['title']} | Md Hasibul Islam"
    t = tpl.replace('href="../', 'href="../../').replace('src="../', 'src="../../').replace('data-root="../"', f'data-root="../../" data-post-id="{r["id"]}"')
    t = re.sub(r"<title>.*?</title>", f"<title>{e(title)}</title>", t, count=1, flags=re.S)
    t = re.sub(r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{e(desc)}">', t, count=1)
    t = re.sub(r'<link rel="canonical" href="[^"]*">', f'<link rel="canonical" href="{e(url)}">', t, count=1)
    t = re.sub(r'<meta property="og:type" content="[^"]*">', '<meta property="og:type" content="article">', t, count=1)
    t = re.sub(r'<meta property="og:title" content="[^"]*">', f'<meta property="og:title" content="{e(r["title"])}">', t, count=1)
    t = re.sub(r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{e(desc)}">', t, count=1)
    t = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{e(url)}">', t, count=1)
    t = re.sub(r'<meta property="og:image" content="[^"]*">', f'<meta property="og:image" content="{e(img)}"><meta property="og:image:alt" content="{e(alt)}"><meta property="article:published_time" content="{e(r["date"])}">', t, count=1)
    t = re.sub(r'<meta name="twitter:card" content="[^"]*">', '<meta name="twitter:card" content="summary_large_image">', t, count=1)
    t = re.sub(r'<meta name="twitter:title" content="[^"]*">', f'<meta name="twitter:title" content="{e(r["title"])}">', t, count=1)
    t = re.sub(r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{e(desc)}">', t, count=1)
    ld = json.dumps({"@context": "https://schema.org", "@type": "Article", "headline": r["title"], "description": desc, "datePublished": r["date"], "inLanguage": "bn",
                     "author": {"@type": "Person", "name": r.get("author") or "Md Hasibul Islam", "url": SITE + "/"}, "image": img or None, "mainEntityOfPage": url}, ensure_ascii=False).replace("</", "<\\/")
    t = t.replace("</head>", f'<script type="application/ld+json" id="ld-article">{ld}</script>\n</head>', 1)
    paras = "".join(f"<p>{e(x.strip())}</p>" for p in (r.get("paragraphs") or []) for x in re.split(r"\r?\n+", p) if x.strip())
    body = (f'<div class="wrap"><article class="article" lang="bn"><a class="back" href="../../blogs/" lang="en">← All writing</a><h1>{e(r["title"])}</h1>'
            f'<p class="meta" lang="en"><span class="tag">{e(CAT_EN.get(r["category"], r["category"]))}</span><span class="tag sig">{mins} min read</span><span class="muted small">{e(r["date"])}{" · " + e(r.get("author")) if r.get("author") else ""}</span></p>'
            + (f'<img class="cover" src="{e(img)}" alt="{e(alt)}" width="1200" height="675">' if img and img.startswith("https://") else "") + f'<div class="body">{paras}</div></article></div>')
    t = re.sub(r'<main id="main" tabindex="-1">.*?</main>', lambda m: f'<main id="main" tabindex="-1">{body}</main>', t, count=1, flags=re.S)
    return t
def write_post_pages(posts, settings):
    tplf = OUT / "post" / "index.html"
    if not tplf.exists(): return []
    tpl, out, keep = tplf.read_text(encoding="utf-8"), [], set()
    for r in posts:
        keep.add(str(r["id"])); d = OUT / "post" / str(r["id"]); d.mkdir(parents=True, exist_ok=True); f = d / "index.html"
        page = render_post_page(tpl, r, settings)
        if not f.exists() or f.read_text(encoding="utf-8") != page: f.write_text(page, encoding="utf-8"); out.append(f"post/{r['id']}/")
    for d in (OUT / "post").iterdir():                       # drafts or deleted posts: remove their static page
        if d.is_dir() and d.name.isdigit() and d.name not in keep:
            for x in d.iterdir(): x.unlink()
            d.rmdir(); out.append(f"post/{d.name}/ (removed)")
    return out

if __name__ == "__main__": main()
