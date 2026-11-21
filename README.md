# Public site (plan step 5)

Same URLs, same look and feel (Technical Journal), now data-driven. Copy these files over your `hasibrockie.github.io` clone. Images in `assets/imgs/` are untouched and not included.

## What changed
- **Content comes from Supabase** (read-only, published rows only) with three safety nets: instant paint from the visitor's saved copy, a static snapshot (`data.json`, `posts.json`) if the API is slow (>2.5 s) or down, and clear notices/empty states instead of blank screens.
- **Settings from the admin** (colours, fonts, width, spacing, card style, animations, hero layout, section order, menu, footer, SEO image, favicon) are validated and applied through CSS variables. No raw CSS or HTML ever comes from the database.
- **Live preview**: the admin's preview frame can push unsaved settings, accepted only from your admin origin and from the parent window, and re-validated here. Previews are never saved to the visitor's cache.
- **Visitors' light/dark toggle** is stored only in their own browser.
- **Moments** (`/moments/`, new, unlisted, noindex): a real gate. The passcode is the password of the guest account; the database and private bucket enforce it. Photos use 1-hour signed links; nothing private is cached or put in the snapshots.
- **Markdown** for new posts (sanitised, self-hosted libraries, loaded only when needed). Old posts stay plain text exactly as before.
- **Design/accessibility**: skeleton loaders, Bangla-safe typography (no letter-spacing, 1.75 line height in articles), skip link, focus rings, reduced-motion support, revision-stamp dates and sheet numbers, strict Content-Security-Policy (`script-src 'self'`, no inline scripts or handlers).
- **SEO**: per-page title/description/OG as before; post pages update title, canonical, OG and JSON-LD `Article`. (Crawlers that don't run JavaScript see the static tags in each HTML file.)

## Cut-over (about 10 minutes)
Work on a branch first (`git checkout -b v2`) so the live site is untouched until you merge.
1. **Copy** everything in this folder over your clone (overwrite). This replaces `.gitignore` (the old one ignored `*.json`, `/assets/js/` and `/moments/`, which would have silently dropped new files), adds `.nojekyll`, and uses `robots.txt` (with sitemap line) instead of the stray `robot.txt`.
2. **Configure** (public values only; refuses secret keys):
   ```bash
   python scripts/configure.py --url https://YOUR-REF.supabase.co --anon YOUR-ANON-KEY \
          --admin https://YOUR-ADMIN.pages.dev --guest-email THE-GUEST-ACCOUNT-EMAIL
   ```
   It writes `assets/js/config.js` and puts your Supabase address into the CSP of all 12 pages. The guest email is the Moments account you created in SETUP_GUIDE 3.8.
3. **Tidy** (moves, never deletes; keeps a private copy of moments.json outside the repo and removes it from the public tree):
   ```bash
   sh legacy-moves/move_legacy.sh
   ```
   Note: the old `moments.json` and the old passcode remain in git history. Treat both as burned (you already chose a new passcode).
4. `python scripts/configure.py --bump` (refreshes the `?v=` cache number), then `git add -A && git commit -m "v2: Supabase-backed site" && git push -u origin v2`.
5. **Test the branch**: in GitHub > Settings > Pages you can temporarily point Pages at `v2`, or open a PR and merge when ready. After deploying, check the list below.
6. Merge to `main`. GitHub Pages caches for about 10 minutes; hard-refresh (Ctrl+Shift+R) when testing.

## After deploying: checklist
- [ ] Home, About, Journey, Skills, Projects, Achievements, Gallery, Writing, Memories all show your content.
- [ ] `post/?id=43` (old post) and a Markdown test post both open; `post/?id=16` shows "Post not found".
- [ ] DevTools > Console: no red errors; DevTools > Network: requests go to your `*.supabase.co`; nothing blocked by CSP.
- [ ] Turn off Wi-Fi (or block `supabase.co`) and reload: the page still shows content with the "saved copy" or "offline" notice.
- [ ] In the admin: change the colour theme, press Save, reload the public site, colours match. Open the admin preview: it reacts as you edit.
- [ ] `/moments/`: wrong passcode is refused; the right one opens; "Lock this page" closes it. View-source of `/moments/` shows no photos or secrets.
- [ ] Mobile (360 px) and desktop: no sideways scrolling; menu button works; dark mode toggle works.

## Rollback
`git revert` the merge commit (or reset Pages to the previous commit). The old files are in `legacy/` (`site.js.old`, `data-old/`, `memory-old/`, `robot.txt`) and your JSON originals in `legacy/` too. Supabase and the admin are independent of the public repo, so nothing there needs undoing.

## Things step 6 (the daily GitHub Action) will do for this site
- Rewrite `data.json` and `posts.json` from the API (same legacy format), plus two small helper files this site already looks for: `posts-index.json` (light list so the fallback doesn't download 1 MB) and `site-settings.json`.
- Regenerate `sitemap.xml` (new posts appear automatically; `/moments/` is excluded).
- Keep Supabase from pausing.
Until then the snapshots are the migrated copies from your original files.

## Tests (offline, optional)
```bash
npm install
LEGACY_DIR=/path/to/repo npm test      # LEGACY_DIR optional; without it small built-in sample content is used
```
13 scenarios: strict-CSP checks of every page, API ok / down / slow, stale and fresh cache, XSS-laden Markdown, legacy posts, missing posts, search/filter, preview origin checks, Moments gate, 404. They run in jsdom with a stand-in for Supabase, not in a real browser.

## Files
`assets/js/`: `boot.js` (pre-paint theme), `settings-schema.js` (shared validator; keep identical to the admin copy), `data.js` (API + cache + snapshot), `legacy.js`, `render.js`, `theme.js`, `md.js`, `moments.js`, `app.js`, `config.js`. `vendor/` holds pinned marked 18.1.3 and DOMPurify 3.4.17 (see `VERSIONS.txt`).
