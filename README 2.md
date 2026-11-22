# Step 6: daily snapshot, sitemap and keep-alive (GitHub Action)

Once a day (03:17 Bangladesh time) GitHub reads your **public** Supabase API with the public key, rewrites the static fallback files your site uses when the API is slow or down, regenerates `sitemap.xml`, and commits **only if something really changed**.

| File written | Purpose |
|---|---|
| `data.json`, `posts.json` | Same legacy format as your originals. Fallback + backup of published content. |
| `posts-index.json` | Light list (no post bodies). The public site uses it so the fallback doesn't download 1 MB. |
| `site-settings.json` | Fallback for the appearance settings. |
| `sitemap.xml` | 9 pages + every published post (new posts appear automatically). `/moments/` is never listed. |

**Moments are deliberately NOT exported.** Your original plan listed `moments.json`, but moments are now private (guest passcode, private bucket). The public site no longer reads `moments.json`, so exporting it would only leak it.

Only published rows are visible to the public key, so drafts and not-yet-due scheduled posts never reach these files.

## Setup (about 5 minutes)
1. **Copy** into the root of your `hasibrockie.github.io` repo (same folders):
   `.github/workflows/snapshot.yml`, `scripts/snapshot.py`, `scripts/snapshot-commit.sh` (and `tests/test_snapshot.py` if you like).
2. GitHub repo > **Settings > Secrets and variables > Actions > Variables** tab > **New repository variable**:
   - `SUPABASE_URL` = `https://YOUR-REF.supabase.co`
   - `SUPABASE_ANON_KEY` = your **anon / publishable** key (public by design, so a *Variable* is fine; no Secrets are needed)
   - optional `SITE_URL` = `https://hasibrockie.github.io` (that is already the default)
   Never put the secret / service_role key anywhere here. The script refuses it.
3. **Settings > Actions > General > Workflow permissions**: choose **Read and write permissions** (the workflow also asks for `contents: write` and nothing more).
4. **Merge to the default branch** (`main`). GitHub runs scheduled workflows only from the default branch.
5. **Actions** tab > **Content snapshot** > **Run workflow**. Open the run: the log should say something like `posts=41 … changed: posts-index.json, site-settings.json, sitemap.xml` and then `Snapshot committed.`
6. **Check**: open `https://hasibrockie.github.io/posts-index.json` and `/sitemap.xml`. Then add a test draft post in the admin, publish it, press **Run workflow** again, confirm it appears in the sitemap, then unpublish/delete it and run once more.

## What protects you
- **Never wipes the fallback.** If the API answers empty, the profile is missing, or the number of posts suddenly drops by more than 30%, the run stops with exit 2 and the files stay as they were. If you really did delete many posts, run with `ALLOW_SHRINK=1`.
- **No noise commits.** Files are rewritten only when their content changed; sitemap dates come from the content, not from "today".
- **Keep-alive.** The daily API read counts as activity for Supabase's inactivity pause (check your dashboard's wording on pausing). GitHub also disables scheduled workflows after about 60 days without repo activity, so if the repo has been quiet for 45 days the job makes one tiny `.snapshot-heartbeat` commit.
- **Least privilege.** `contents: write` only; the action is pinned to a full commit SHA (v6.0.2; I could not check release dates from here, so I chose a release older than the newest ones; refresh later with `git ls-remote --tags https://github.com/actions/checkout`). Fork copies of the workflow don't run. A human push in the middle of a run is rebased, not overwritten.
- Commits by the Action use the built-in token, which does not trigger more workflow runs. GitHub Pages rebuilds as usual.

## Troubleshooting
- **Red run, `HTTP 401`**: wrong key or URL in the Variables, or `sql/02_security.sql` was not run.
- **Red run, exit 2 "Refusing to overwrite"**: the safety guard (see above). Check the API in the admin; use `ALLOW_SHRINK=1` only if deliberate.
- **`git push` rejected**: branch protection on `main` blocks the bot. Allow GitHub Actions to push, or exclude the five generated files from the rule.
- **Nothing runs overnight**: the workflow is only on a non-default branch, or Actions were disabled after inactivity (Actions tab > enable).
- GitHub emails you when a scheduled run fails.
- Change the time by editing the `cron` line (UTC).

## Rollback
Disable the workflow (Actions > Content snapshot > ... > Disable) or delete `snapshot.yml`. The generated files are ordinary commits, so `git revert` any of them restores the previous fallback. The public site keeps working from the live API either way.

## Tests (offline)
`LEGACY_DIR=/path/to/repo python3 tests/test_snapshot.py`: 38 checks against a stand-in API and throw-away git repos. They confirm your real `data.json` and all 40 `posts.json` entries round-trip identically, drafts/scheduled posts are excluded, a second run changes nothing, the safety guards refuse bad input, the secret-key checks work, and the commit script handles first commit, no-change, heartbeat after 50 quiet days, and a human push in between. They do **not** exercise GitHub's runners or your real Supabase project; the first manual run (step 5) is that test.
