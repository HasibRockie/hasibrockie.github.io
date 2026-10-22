# Md Hasibul Islam: Personal Portfolio

A multi-page static portfolio for GitHub Pages. Plain HTML, CSS and vanilla JavaScript. No build step, no server code.

Live site: https://hasibrockie.github.io/

## Pages

| Page | File | Content source |
|---|---|---|
| Home | `index.html` | `data.json`, latest 3 from `posts.json` |
| About | `about.html` | `data.json` > `about` |
| Journey | `journey.html` | `data.json` > `timeline` |
| Skills | `skills.html` | `data.json` > `skills`, `interests` |
| Projects | `projects.html` | `data.json` > `projects`, `other_projects` |
| Achievements | `achievements.html` | `data.json` > `achievements` |
| Gallery | `gallery.html` | `data.json` > `hobbies`, `photos` |
| Writing | `blogs/index.html` | `posts.json` |
| Post | `post/index.html` (`?id=N`) | `posts.json` |
| Memories | `memories/index.html` | `posts.json`, personal category |
| Not found | `404.html` | static |

Each HTML file is a small shell. `assets/js/site.js` adds the header and footer and renders the page from JSON, chosen by `<body data-page="...">`. `data-root` is `""` for top-level pages and `"../"` for nested ones, so every path stays relative.

## Structure

```
.
├── index.html, about.html, journey.html, skills.html,
│   projects.html, achievements.html, gallery.html, 404.html
├── blogs/index.html
├── post/index.html
├── memories/index.html
├── data.json          site content
├── posts.json         blog posts (original schema, unchanged)
├── sitemap.xml, robots.txt, .nojekyll
└── assets/
    ├── css/site.css
    ├── js/site.js
    └── imgs/          your existing images (not included in this package)
```

## Run locally

`fetch()` is blocked on `file://`, so serve the folder:

```
python -m http.server
```

Open http://localhost:8000.

## Edit content

- **Profile, timeline, skills, projects, achievements, photos:** edit `data.json`, then refresh.
- **New post:** append an object to `posts.json` using the existing keys (`id`, `date` as `YYYY-MM-DD`, `category`, `title`, `para1`...`para100`, `img1`, `img1caption`, `author`). The cover image is read from `assets/imgs/fiction/post<id>.png`.
- **New post in the sitemap:** add `<url><loc>https://hasibrockie.github.io/post/?id=N</loc>...</url>` to `sitemap.xml`.
- **Categories:** Bangla category names map to English labels in `CAT` at the top of `assets/js/site.js`.

## Design

- **Palette (CSS variables in `site.css`):** drafting-paper grey, navy ink, cobalt accent and amber signal, with a dark theme. Contrast meets WCAG AA.
- **Theme:** follows `prefers-color-scheme`, toggle saved in `localStorage` (guarded with try/catch).
- **Fonts:** Bricolage Grotesque (headings), IBM Plex Sans (body), IBM Plex Mono (title block), Anek Bangla (Bangla text), loaded from Google Fonts with `display=swap`.
- **Motion:** one load animation on the hero title block. All motion is disabled under `prefers-reduced-motion`.
- **Accessibility:** skip link, ordered headings, visible focus, keyboard navigation, 44px minimum touch targets.

## Deploy to GitHub Pages

1. Copy these files into the repo root, merging with the existing `assets/` folder.
2. Commit to `main`.
3. In **Settings > Pages**, serve from `main`, root.
4. Hard-refresh and confirm `data.json` and `posts.json` load.

If the site moves to another domain, replace `hasibrockie.github.io` in the HTML files, `sitemap.xml` and `robots.txt`:

```
grep -rl hasibrockie . | xargs sed -i 's#hasibrockie#NEWNAME#g'
```

## Notes

- Posts 16, 22 and 30 are missing from `posts.json`, so they are not in the sitemap.
- The Memories page lists personal-category posts by year.
- Images that fail to load hide themselves rather than showing broken icons.
