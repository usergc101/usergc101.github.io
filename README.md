# knowfone-site

The public website of Knowfone, the Android app that checks a used phone before you buy it:
https://usergc101.github.io

- `index.html` (English) and `am/index.html` (Amharic): the landing page and download button.
- `r/index.html`: opens report links shared from the app (`/r/#r1.<data>`). The report is read
  from the part of the link after `#`, in the browser; nothing is sent to a server. The format is
  defined in the app's `share/ReportLink.kt`; change both together.
- `guide/`: buying guides (search traffic).
- `privacy.html`, `terms.html`: required by Google Play and AdMob.
- `app-ads.txt`: AdMob's seller check; written by the app repo's `scripts/set-admob-ids.ps1`.
- The download button points at `releases/latest/download/knowfone.apk` of this repo
  (uploaded by the app repo's `scripts/publish-apk.ps1`).

Static files only, served by GitHub Pages from `main`. Preview locally:
`python -m http.server 8765` in this folder, then http://127.0.0.1:8765/.

The app's source is private: https://github.com/usergc101/knowfone
