"""Rewrites sitemap.xml from the HTML files in the repo.

lastmod: today for files git sees as new or changed, otherwise the date already in the sitemap.
    python tools/make_sitemap.py
"""
import datetime
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://usergc101.github.io"
SKIP_DIRS = {"r", "_preview", "tools", "download", ".git"}
SKIP_FILES = {"google4039bdc75cf29da7.html"}
HREFLANG = {"index.html": "am/index.html", "am/index.html": "index.html"}


def url_of(rel):
    if rel == "index.html":
        return SITE + "/"
    if rel.endswith("/index.html"):
        return f"{SITE}/{rel[:-len('index.html')]}"
    return f"{SITE}/{rel}"


def main():
    today = datetime.date.today().isoformat()
    old = {}
    sm = ROOT / "sitemap.xml"
    if sm.exists():
        for loc, mod in re.findall(r"<loc>([^<]+)</loc><lastmod>([^<]+)</lastmod>", sm.read_text(encoding="utf-8")):
            old[loc] = mod
    changed = set()
    out = subprocess.run(["git", "status", "--porcelain", "--untracked-files=all"], cwd=ROOT, capture_output=True, text=True).stdout
    for line in out.splitlines():
        changed.add(line[3:].strip().strip('"'))
    pages = []
    for p in sorted(ROOT.rglob("*.html")):
        rel = p.relative_to(ROOT).as_posix()
        if rel.split("/")[0] in SKIP_DIRS or rel in SKIP_FILES:
            continue
        loc = url_of(rel)
        mod = today if rel in changed or loc not in old else old[loc]
        pages.append((rel, loc, mod))
    order = {"index.html": 0, "am/index.html": 1, "test/index.html": 2, "phones/index.html": 3, "guide/index.html": 4}
    pages.sort(key=lambda x: (order.get(x[0], 9), x[0].split("/")[0], x[0]))
    lines = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for rel, loc, mod in pages:
        if rel in HREFLANG:
            lines.append(f"  <url><loc>{loc}</loc><lastmod>{mod}</lastmod>")
            lines.append(f'    <xhtml:link rel="alternate" hreflang="en" href="{SITE}/"/>')
            lines.append(f'    <xhtml:link rel="alternate" hreflang="am" href="{SITE}/am/"/></url>')
        else:
            lines.append(f"  <url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>")
    lines.append("</urlset>")
    sm.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
    print(f"{len(pages)} urls")


if __name__ == "__main__":
    main()
