from datetime import date

urls = [
    "https://hasibrockie.github.io/",
]

sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n'
sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'

for url in urls:
    sitemap += f"  <url>\n"
    sitemap += f"    <loc>{url}</loc>\n"
    sitemap += f"    <lastmod>{date.today()}</lastmod>\n"
    sitemap += f"    <changefreq>monthly</changefreq>\n"
    sitemap += f"    <priority>0.8</priority>\n"
    sitemap += f"  </url>\n"

sitemap += '</urlset>'

with open("sitemap.xml", "w") as file:
    file.write(sitemap)

print("Sitemap generated: sitemap.xml")
