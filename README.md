# Knowfone: used phone checker for Android

Knowfone is a free Android app that checks a used phone before you buy it. In about 7 minutes it
tests every part (whether it is really the model it claims, security, touch screen, display,
speakers, cameras, battery, processor, storage, sensors, buttons, charging port, wireless) and
answers **Good to buy**, **Buy only at a lower price** or **Don't buy**, with the reasons. No
account; reports stay on the phone.

- Website: https://usergc101.github.io (Amharic: https://usergc101.github.io/am/)
- Download the APK: https://github.com/usergc101/usergc101.github.io/releases/latest/download/knowfone.apk
- APKPure: https://apkpure.com/knowfone-used-phone-checker/app.knowfone
- Works on Android 8.0 and newer, all brands (Samsung, Tecno, Infinix, itel, Xiaomi, Oppo, Realme and more).

Free tools on the site:
- [Online phone test](https://usergc101.github.io/test/): 10 tests in any phone's browser (dead pixels, touch screen, multi-touch, refresh rate, speakers, microphone, cameras and flash, vibration, sensors, charging port)
- [Is my phone original?](https://usergc101.github.io/phones/): real specs and a 10-minute check for 24 popular Samsung, Tecno, Infinix and Redmi phones

Guides:
- [How to check a used phone before you buy it](https://usergc101.github.io/guide/check-used-phone-before-buying.html)
- [Original or clone: what is really inside a phone](https://usergc101.github.io/guide/is-my-phone-original-or-a-clone.html)
- [How to check if a Tecno or Infinix phone is original](https://usergc101.github.io/guide/check-tecno-infinix-original.html)
- [How to check if a Samsung phone is original](https://usergc101.github.io/guide/samsung-original-check.html)
- [Phone test codes by brand](https://usergc101.github.io/guide/phone-test-codes.html)
- [All guides](https://usergc101.github.io/guide/)

## This repository

The website's files. Static files only, served by GitHub Pages from `main`. Preview locally:
`python -m http.server 8765` in this folder, then http://127.0.0.1:8765/.

- `index.html` (English) and `am/index.html` (Amharic): the landing page and download button.
- `r/index.html`: opens report links shared from the app (`/r/#r1.<data>`). The report is read
  from the part of the link after `#`, in the browser; nothing is sent to a server. The format is
  defined in the app's `share/ReportLink.kt`; change both together.
- `guide/`: buying guides (search traffic).
- `test/`: online phone tests (`assets/phone-tests.js`; pages written by `tools/make_test_pages.py`).
- `phones/`: model pages written by `tools/make_phone_pages.py` from `tools/phones-2026.json`.
- `privacy.html`, `terms.html`: required by Google Play and AdMob.
- `app-ads.txt`: AdMob's seller check; written by the app repo's `scripts/set-admob-ids.ps1`.
- `google4039bdc75cf29da7.html`: Google Search Console ownership file. Keep it.
- `a326a4d2db2ccdcae8b46408abab8aa1.txt`: IndexNow key (Bing, Yandex). Keep it.
- The download button points at `releases/latest/download/knowfone.apk` of this repo
  (uploaded by the app repo's `scripts/publish-apk.ps1`).

The app's source is private: https://github.com/usergc101/knowfone
