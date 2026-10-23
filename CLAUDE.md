# knowfone-site - AI assistant guide

Public GitHub Pages site for the Knowfone app (repo usergc101/usergc101.github.io, served at
https://usergc101.github.io). It must be public for free GitHub Pages; never put secrets,
the app's source or private notes here. The app repo is `C:\Users\asusv\Code\active\knowfone`.

Rules:
- Static HTML and one stylesheet (`assets/site.css`), no build step, no trackers or analytics.
- Look matches the app's "X-ray" design (ink, x-ray cyan, ember, Sora + JetBrains Mono).
- Wording follows the app's honesty rules: never claim a phone is "fake" or "genuine"; say what
  is measured; say what no app can check.
- English and Amharic pages carry the same content; update both (Amharic needs a native read).
- `r/index.html` decodes the app's report link format (app `share/ReportLink.kt`).
- `_preview/` holds local design sources (store graphics) and is gitignored.
- Generated pages: `test/*.html` (online phone tests; `tools/make_test_pages.py`, behaviour in
  `assets/phone-tests.js`) and `phones/*.html` (one page per model from `tools/phones-2026.json`, a copy of
  the app's `assets/specs/popular-2026.json`; `tools/make_phone_pages.py`). Edit the generator, rerun it,
  then `python tools/make_sitemap.py`, and commit the HTML. No build step at serve time.
- The owner does not want Knowfone tied to Telegram (2026-10-24): no Telegram promotion, links or
  mentions on the site.
