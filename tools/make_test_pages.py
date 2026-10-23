"""Writes the online phone test pages (test/*.html) from the texts below.

The site has no build step: run this by hand after changing a text, then commit the HTML.
    python tools/make_test_pages.py
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://usergc101.github.io"
APK = "https://github.com/usergc101/usergc101.github.io/releases/latest/download/knowfone.apk"
UPDATED = "2026-10-24"

ICONS = {
    "screen": '<path d="M4 4h16v13H4z"/><path d="M9 21h6M12 17v4"/><path d="M8 8h2v2H8zM14 11h2v2h-2z" fill="currentColor" stroke="none"/>',
    "touch": '<circle cx="12" cy="12" r="3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="10.5" opacity=".45"/>',
    "multitouch": '<circle cx="6" cy="9" r="2.6"/><circle cx="12" cy="6" r="2.6"/><circle cx="18" cy="9" r="2.6"/><circle cx="12" cy="16" r="2.6"/>',
    "refresh": '<path d="M4 16a8 8 0 1 1 16 0"/><path d="M12 16l4.5-5.5"/><circle cx="12" cy="16" r="1.4" fill="currentColor" stroke="none"/>',
    "speaker": '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    "camera": '<path d="M3.5 7.5h4l1.5-2.5h6l1.5 2.5h4V19h-17z"/><circle cx="12" cy="13" r="3.6"/>',
    "vibrate": '<rect x="8" y="3.5" width="8" height="17" rx="2"/><path d="M4.5 8v8M2 10v4M19.5 8v8M22 10v4"/>',
    "sensors": '<circle cx="12" cy="12" r="8.5"/><path d="M14.8 9.2l-1.6 4-4 1.6 1.6-4z" fill="currentColor"/>',
    "charging": '<rect x="3" y="7" width="16" height="10" rx="2.2"/><path d="M21 10.5v3"/><path d="M11.5 8.6L9 12.4h3.4L10.5 15.4" stroke-linejoin="round"/>',
}


def icon(test_id, size=28):
    return (f'<svg width="{size}" height="{size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" aria-hidden="true">{ICONS[test_id]}</svg>')


# Order matches the run-all order in assets/phone-tests.js.
TESTS = [
    {
        "id": "screen", "file": "dead-pixel-test.html", "short": "Dead pixels and screen",
        "card": "Full-screen colours for dead pixels, lines, stains and burn-in.",
        "title": "Dead pixel test for phones: full-screen colours online (free)",
        "h1": "Dead pixel and screen test",
        "desc": "Fill your phone screen with black, white, red, green, blue and grey to find dead or stuck pixels, lines, yellow stains and burn-in. Free, online, for Android and iPhone.",
        "lede": "Seven full-screen colours, one tap each. Every colour shows a different fault: black shows stuck pixels and light leaking at the edges, white shows dead pixels and stains, grey shows burn-in.",
        "steps": ["Turn the brightness all the way up and wipe the screen.",
                  "Tap Start, then tap anywhere to change the colour.",
                  "Look at each colour closely, corners and edges too. Tilt the phone a little."],
        "meaning": [("A tiny black dot on every colour", "a dead pixel. It does not come back."),
                    ("A dot that stays red, green, blue or white", "a stuck pixel. Sometimes it recovers, often not."),
                    ("Thin lines across the screen", "a damaged panel or a loose screen cable."),
                    ("Yellow, pink or dark patches on white", "pressure damage or a worn or cheap replacement screen."),
                    ("Faint shapes on grey (keyboard, status bar)", "burn-in, common on older OLED screens."),
                    ("Light glowing from the edges on black", "backlight bleed on an LCD screen. A little is normal; bright patches are not.")],
        "faq": [("What is the difference between a dead pixel and a stuck pixel?",
                 "A dead pixel gives no light, so it shows as a black dot on every colour. A stuck pixel is lit in one colour all the time, so it shows on the colours that do not match it."),
                ("Can dead pixels be fixed?",
                 "A dead pixel cannot be fixed; the screen has to be replaced. A stuck pixel sometimes recovers on its own, but when you buy a phone, price it as if it will stay."),
                ("How can I tell if a phone has an AMOLED or an LCD screen?",
                 "Show the black colour in a dark room at full brightness. An AMOLED screen is completely black; an LCD glows grey because of its backlight. Check which one the model should have before you buy.")],
    },
    {
        "id": "touch", "file": "touch-screen-test.html", "short": "Touch screen",
        "card": "Swipe until every square lights up. Dead zones stay dark.",
        "title": "Touch screen test online: free full-screen grid for any phone",
        "h1": "Touch screen test",
        "desc": "Free online touch screen test for Android and iPhone: swipe until every square lights up and dead zones show at once. Runs full screen in your browser, nothing to install.",
        "lede": "Swipe your finger over the grid until every square lights up. A square that stays dark when you swipe it is a dead zone. Edges and corners matter most: that is where worn and cheap replacement screens fail first.",
        "steps": ["Tap Start. The grid fills the whole screen.",
                  "Swipe slowly over every square, row by row, right to the edges.",
                  "At 100% the grid turns green. If squares stay dark, tap Finish: they turn red so you can try them again."],
        "meaning": [("Every square lit", "the touch layer responds everywhere."),
                    ("Squares stay red after several tries", "that part of the touch layer is dead. Typing and swiping there will fail."),
                    ("Squares light up on their own", "ghost touch, often after a crack or a cheap screen replacement.")],
        "faq": [("Is there a code for the touch screen test?",
                 "On many Samsung phones *#0*# opens a test menu with a Touch grid; other brands use other codes (see the phone test codes guide). This online test works on any phone with a browser, without a code."),
                ("What is ghost touch?",
                 "The screen reacts when nobody touches it: apps open and letters type themselves. It usually comes from a damaged or poor replacement screen, sometimes from a bad charger. Here it shows as squares that light up while your finger is away."),
                ("Does this test work on an iPhone?",
                 "Yes, in Safari. iPhones do not let web pages cover the browser's own bars, so the thin strip under them cannot be tested here.")],
    },
    {
        "id": "multitouch", "file": "multi-touch-test.html", "short": "Multi-touch",
        "card": "Put several fingers down. Each one should get its own dot.",
        "title": "Multi-touch test online: how many fingers does your screen see?",
        "h1": "Multi-touch test",
        "desc": "Put your fingers on the screen and see each touch as a numbered dot. Checks multi-touch and touches that jump or vanish. Free online multi-touch test for any phone.",
        "lede": "Most phones follow 5 to 10 fingers at once. Here each finger gets its own coloured dot. Dots that jump, flicker or vanish while your fingers stay still point to a failing touch layer.",
        "steps": ["Tap Start.", "Put one finger down, then add more, up to all ten.",
                  "Hold still for a few seconds and watch the dots, then slide your fingers around."],
        "meaning": [("Every finger has a steady dot", "multi-touch works."),
                    ("Dots jump or vanish while you hold still", "the touch layer is failing or the screen was badly replaced."),
                    ("Two fingers close together merge into one", "normal on many phones when fingers touch each other.")],
        "faq": [("How many touch points should a phone have?",
                 "Most Android phones and iPhones follow at least 5 fingers, and many follow 10. A browser can report fewer than the phone supports, so a count of 5 here is fine."),
                ("Why do I need multi-touch?",
                 "Zooming with two fingers, many games and some keyboards need it. A phone that loses a second finger often has a damaged touch layer.")],
    },
    {
        "id": "refresh", "file": "refresh-rate-test.html", "short": "Refresh rate",
        "card": "How fast the screen redraws: 60, 90 or 120 Hz.",
        "title": "Screen refresh rate test online: is it 60, 90 or 120 Hz?",
        "h1": "Refresh rate test",
        "desc": "Measure how fast your phone screen redraws in the browser: 60, 90, 120 Hz or more. A quick way to spot a copy of a 120 Hz phone that runs at 60 Hz.",
        "lede": "Phones sold with smooth 90 or 120 Hz screens are a favourite for copies, which often run at 60 Hz. This test counts how many times per second the browser draws the page.",
        "steps": ["Turn battery saver off and set the screen to its highest refresh rate in Settings, Display.",
                  "Tap Start and keep one finger moving on the screen while it measures (4 seconds).",
                  "Compare the result with the refresh rate of the model the phone claims to be."],
        "meaning": [("The same as the model's rate", "the screen runs at the speed it should, at least in the browser."),
                    ("60 Hz on a phone sold as 90 or 120 Hz", "worth a closer look: check Settings, Display first, then test the phone with the Knowfone app."),
                    ("An odd number like 57 or 112", "the browser was busy; measure again.")],
        "faq": [("How do I check the refresh rate in settings?",
                 "Open Settings, Display. Samsung calls it Motion smoothness, Xiaomi and Redmi call it Refresh rate, Tecno and Infinix list it under Display as Screen refresh rate."),
                ("Is a 60 Hz result proof that a phone is a copy?",
                 "No. Battery saver, the refresh setting and some phones' power rules hold browsers at 60 Hz. It is a reason to check further, not proof. The Knowfone app also reads the screen's own modes and compares them with the model.")],
    },
    {
        "id": "speaker", "file": "speaker-test.html", "short": "Speakers",
        "card": "Left, right and a rising sweep that shows rattles.",
        "title": "Phone speaker test online: left, right and a frequency sweep",
        "h1": "Speaker test",
        "desc": "Play test sounds from your phone's left and right speakers and an 80 Hz to 12 kHz sweep that shows rattles, buzzing and blown speakers. Free online phone speaker test.",
        "lede": "A short chime from the left, from the right and from both, then a sweep that rises from a low hum to a high whistle. A worn or water-damaged speaker buzzes, crackles or goes quiet somewhere on the way.",
        "steps": ["Turn the volume all the way up.", "Tap Start, then Left, Right, Both and Sweep.",
                  "Listen with the phone flat on a table and again in your hand. Hold it sideways for Left and Right."],
        "meaning": [("Clear at every pitch", "the speaker works."),
                    ("Buzzing or crackling at some pitches", "a torn or dirty speaker, or one damaged by water."),
                    ("Left and Right sound the same", "normal on phones with one speaker. Check the model: many cheaper phones have only one.")],
        "faq": [("How do I test the earpiece speaker?",
                 "A web page plays through the main speaker. To test the earpiece, call someone or play a voice message with the phone held to your ear."),
                ("Why is one side quieter?",
                 "On phones with two speakers, the earpiece doubles as the second speaker and is often quieter. A big difference, or crackling from one side, points to a problem.")],
    },
    {
        "id": "mic", "file": "microphone-test.html", "short": "Microphone",
        "card": "A live level meter and a 3-second recording played back.",
        "title": "Microphone test online for phones: live level and playback",
        "h1": "Microphone test",
        "desc": "See your phone's microphone level live and record 3 seconds to play back. Finds muffled, crackling or dead microphones. Free, and nothing is uploaded.",
        "lede": "The bars move with every sound the microphone hears. Then record yourself for 3 seconds and listen back: a healthy microphone sounds clear, without hiss, crackle or a muffled tone.",
        "steps": ["Tap Start and allow the microphone.", "Speak, or blow gently near the bottom of the phone, and watch the bars.",
                  "Tap Record, speak for 3 seconds and listen to the playback."],
        "meaning": [("The bars move and the voice sounds clear", "the microphone works."),
                    ("The bars barely move", "a blocked or dead microphone. Clean the hole gently and test again."),
                    ("Hiss, crackle or a muffled voice", "a damaged microphone, often after water.")],
        "faq": [("Is my recording uploaded?",
                 "No. The sound stays in your phone's memory and is gone when you close the page."),
                ("My phone has several microphones. Which one is tested?",
                 "Usually the main one at the bottom. Browsers cannot pick a microphone. The Knowfone app plays a tone from the speaker and listens with the microphones to test them.")],
    },
    {
        "id": "camera", "file": "camera-test.html", "short": "Cameras and flash",
        "card": "Opens each camera the browser can reach, and the flash.",
        "title": "Phone camera and flash test online: every lens the browser can open",
        "h1": "Camera and flash test",
        "desc": "Open your phone's front and back cameras and the flash from the browser, see the video size, and check for spots, haze, tint and dead lenses. Free, nothing uploaded.",
        "lede": "Opens the cameras the browser can reach and switches the flash on. Look for a black picture, spots, haze, a pink or green tint, and focus that never gets sharp.",
        "steps": ["Tap Start and allow the camera.", "Switch between the cameras at the bottom. Point each one at small text.",
                  "Tap Flash if it shows, and check the front camera too."],
        "meaning": [("Sharp and clean on every camera", "the cameras the browser opened work."),
                    ("Spots or haze in the same place", "dust or damage inside the lens, or a scratched cover glass."),
                    ("Black picture", "a dead camera or a camera another app is using.")],
        "faq": [("Why can I not see all of my phone's lenses?",
                 "Many phones only give browsers the main back and front cameras. Open the phone's camera app to try the ultra-wide and zoom lenses."),
                ("Are pictures saved or uploaded?",
                 "No. The picture is shown live and nothing is recorded or sent.")],
    },
    {
        "id": "vibrate", "file": "vibration-test.html", "short": "Vibration",
        "card": "A firm buzz and pulses from the motor.",
        "title": "Vibration test online for Android phones",
        "h1": "Vibration test",
        "desc": "Test your phone's vibration motor from the browser with a long buzz and pulses. Feel for weak, rattling or missing vibration. Works in Android browsers.",
        "lede": "A long buzz and a row of short pulses. A healthy motor feels firm and even. A weak, rattling or missing buzz means a worn motor or a loose part inside.",
        "steps": ["Turn off silent and do-not-disturb modes.", "Tap Start and hold the phone in your hand.",
                  "Try Long buzz and Pulses."],
        "meaning": [("Firm and even", "the vibration motor works."),
                    ("Weak or rattling", "a worn motor or something loose inside the phone."),
                    ("Nothing at all", "check that vibration is on in Settings, Sound; if it is, the motor or its contact has failed.")],
        "faq": [("Does this work on an iPhone?",
                 "No. iPhones do not let web pages use the vibration motor. Turn on vibration and ask someone to call the phone."),
                ("Is there a vibration test code?",
                 "Many Samsung phones open a test menu with *#0*# that includes Vibration; other brands use other codes. See the phone test codes guide.")],
    },
    {
        "id": "sensors", "file": "sensor-test.html", "short": "Sensors",
        "card": "Tilt, compass and shake, read live.",
        "title": "Phone sensor test online: tilt, compass and shake",
        "h1": "Sensor test",
        "desc": "Check your phone's accelerometer, gyroscope and compass in the browser with a live bubble level, a compass needle and a shake counter. Free online sensor test.",
        "lede": "A bubble level shows the tilt sensors, a needle shows the compass and a counter catches shakes. Screen rotation, maps and games all depend on these sensors.",
        "steps": ["Tap Start. On an iPhone, allow motion access.", "Tilt the phone slowly: the dot should follow smoothly.",
                  "Turn around once, then shake the phone twice."],
        "meaning": [("Everything responds smoothly", "the motion sensors work."),
                    ("The dot jumps or freezes", "a failing accelerometer or gyroscope."),
                    ("The needle never moves", "no compass, or the browser does not share it. Check a maps app.")],
        "faq": [("Why does the compass not move?",
                 "Some phones have no compass, and some browsers do not share it with web pages. Open a maps app and see if the arrow turns with you."),
                ("Which sensors can a browser not test?",
                 "The proximity sensor, the light sensor and the fingerprint reader. The Knowfone app tests the proximity and light sensors.")],
    },
    {
        "id": "charging", "file": "charging-port-test.html", "short": "Charging port",
        "card": "Shows if charging cuts out while you wiggle the plug.",
        "title": "Charging port test online: does charging cut out?",
        "h1": "Charging port test",
        "desc": "Plug in the charger and wiggle the plug: this online test shows live if charging cuts in and out, a sign of a loose or dirty port or a bad cable. Works in Chrome on Android.",
        "lede": "A loose or dirty charging port is one of the most common faults in used phones, and sellers rarely mention it. Plug in, wiggle the plug gently, and watch: charging should never stop.",
        "steps": ["Tap Start.", "Plug in a charger you trust.",
                  "Wiggle the plug gently up, down and sideways for a few seconds."],
        "meaning": [("Charging the whole time", "the port and cable hold well."),
                    ("Charging cuts in and out", "a loose or dirty port, or a bad cable. Try another cable before you blame the port."),
                    ("Never shows charging", "a dead port, cable or charger. Try another charger.")],
        "faq": [("Why does it say this browser cannot see the charger?",
                 "Only Chrome-based browsers on Android tell web pages about charging. On an iPhone, watch the battery icon while you wiggle the plug."),
                ("Can a dirty port cause charging problems?",
                 "Yes. Pocket lint packs into the port so the plug no longer sits fully. A careful clean with a wooden toothpick often fixes it.")],
    },
]

HEADER = """<header class="top">
  <div class="wrap">
    <a class="brand" href="/" aria-label="Knowfone"><span class="mark" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.6" fill="none" stroke="#020409" stroke-width="2.2"/><rect x="3" y="11" width="18" height="2" fill="#020409"/></svg></span>knowfone</a>
    <nav aria-label="Main"><a href="/test/">Phone tests</a><a class="hide-sm" href="/guide/">Guides</a><a href="/">The app</a></nav>
  </div>
</header>"""

FOOTER = """<footer>
  <div class="wrap">
    <a href="/">Knowfone</a>
    <a href="/test/">Phone tests</a>
    <a href="/phones/">Phone models</a>
    <a href="/guide/">Guides</a>
    <a href="/privacy.html">Privacy</a>
    <a href="/terms.html">Terms</a>
    <a href="/am/" lang="am">አማርኛ</a>
  </div>
</footer>"""

APP_BOX = f"""<div class="callout"><p><strong>What a browser cannot see:</strong> whether the phone is really the model it claims (copies run on a different processor), how worn the battery is, whether the storage is as big as it says, and whether the system was modified. The free Knowfone app for Android checks all of that and every part above in about 7 minutes, then answers: good to buy, buy only at a lower price, or don't buy.</p></div>
    <div class="cta">
      <a class="btn btn-primary" href="{APK}">Download Knowfone for Android (free)</a>
      <a class="btn btn-ghost" href="/#install">How to install</a>
    </div>"""


def head(title, desc, url, ld):
    t, d = html.escape(title), html.escape(desc)
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{t}</title>
<meta name="description" content="{d}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#060a13">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Knowfone">
<meta property="og:title" content="{t}">
<meta property="og:description" content="{d}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/icon-180.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
{json.dumps(ld, indent=2, ensure_ascii=False)}
</script>
<script src="/assets/phone-tests.js" defer></script>
</head>"""


def faq_ld(faq):
    return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq],
    }


def app_ld(name, url, desc):
    return {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": name,
        "url": url,
        "description": desc,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any (runs in a web browser)",
        "browserRequirements": "Requires JavaScript",
        "isAccessibleForFree": True,
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "publisher": {"@type": "Organization", "name": "Knowfone", "url": SITE + "/"},
        "dateModified": UPDATED,
    }


def test_page(t):
    url = f"{SITE}/test/{t['file']}"
    ld = [app_ld(t["h1"] + " (Knowfone)", url, t["desc"]), faq_ld(t["faq"])]
    steps = "\n".join(f"      <li>{html.escape(s)}</li>" for s in t["steps"])
    meaning = "\n".join(f"      <li><strong>{html.escape(a)}:</strong> {html.escape(b)}</li>" for a, b in t["meaning"])
    faq = "\n".join(f"    <h3>{html.escape(q)}</h3>\n    <p>{html.escape(a)}</p>" for q, a in t["faq"])
    others = "".join(f'<a href="/test/{o["file"]}">{html.escape(o["short"])}</a>' for o in TESTS if o["id"] != t["id"])
    return f"""{head(t['title'], t['desc'], url, ld)}
<body>
{HEADER}
<main class="article">
  <div class="narrow">
    <div class="pt-hero">
      <div>
        <h1>{html.escape(t['h1'])}</h1>
        <p class="meta">Free. Runs in your phone's browser. Nothing to install, nothing uploaded.</p>
      </div>
      <div class="pt-orb">{icon(t['id'], 54)}</div>
    </div>
    <p style="margin-top:18px">{html.escape(t['lede'])}</p>
    <div class="pt-start">
      <button class="btn btn-primary" type="button" data-run="{t['id']}">Start the test</button>
      <a class="btn btn-ghost" href="/test/">All 10 phone tests</a>
    </div>
    <p class="pt-safe">Open this page on the phone you want to test. Press Back or the close button to stop at any time.</p>
    <div id="pt-results" class="pt-results" hidden></div>
    <h2>How to do it</h2>
    <ol>
{steps}
    </ol>
    <h2>What the result means</h2>
    <ul>
{meaning}
    </ul>
    {APP_BOX}
    <h2>Questions</h2>
{faq}
    <h2>More phone tests</h2>
    <div class="pt-tags">{others}</div>
    <p class="also">Buying a used phone? Read <a href="/guide/check-used-phone-before-buying.html">the 14-step checklist</a> or look up <a href="/phones/">the real specs of popular models</a>.</p>
  </div>
</main>
{FOOTER}
</body>
</html>
"""


HUB_FAQ = [
    ("Is the online phone test free?", "Yes. All ten tests are free, need no account and run in the browser of the phone you are testing."),
    ("Does it work on an iPhone?", "Most tests do. iPhones do not let web pages use the vibration motor or see the charger, so those two tests ask you to check by hand."),
    ("Is anything uploaded?", "No. The camera picture, the sound and the results stay on the phone. The site has no trackers or analytics."),
    ("Can a browser tell if a phone is a copy?", "Only partly. A refresh rate that is lower than the model's, or fewer cameras, are hints. The real processor, memory, storage and security state need an app: the free Knowfone app for Android compares them with the model the phone claims to be."),
]


def hub_page():
    url = f"{SITE}/test/"
    title = "Phone test online: free screen, touch, speaker, camera and sensor test"
    desc = "10 free phone tests in your browser: dead pixels, touch screen, multi-touch, refresh rate, speakers, microphone, cameras and flash, vibration, sensors and charging port. For checking a used phone before you buy."
    ld = [
        app_ld("Knowfone online phone test", url, desc),
        {
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": "Online phone tests",
            "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/test/{t['file']}", "name": t["h1"]} for i, t in enumerate(TESTS)],
        },
        faq_ld(HUB_FAQ),
    ]
    cards = "\n".join(
        f'      <a class="pt-cardlink" href="/test/{t["file"]}"><span class="ic">{icon(t["id"], 24)}</span><b>{html.escape(t["short"])}</b><span>{html.escape(t["card"])}</span></a>'
        for t in TESTS)
    faq = "\n".join(f"    <h3>{html.escape(q)}</h3>\n    <p>{html.escape(a)}</p>" for q, a in HUB_FAQ)
    return f"""{head(title, desc, url, ld)}
<body>
{HEADER}
<main class="article">
  <div class="narrow">
    <div class="pt-hero">
      <div>
        <h1>Test a phone online</h1>
        <p class="meta">Updated October 2026. Free, for Android and iPhone. Nothing to install, nothing uploaded.</p>
      </div>
      <div class="pt-orb">{icon('touch', 54)}</div>
    </div>
    <p style="margin-top:18px">Ten quick tests that run in the phone's own browser, in about 5 minutes: the screen, touch, speakers, microphone, cameras, sensors and charging port. Made for checking a used phone before you pay, on any brand.</p>
    <div class="pt-start">
      <button class="btn btn-primary" type="button" data-run="all">Run all 10 tests</button>
    </div>
    <p class="pt-safe">Open this page on the phone you want to test. You can skip any test, and Back stops at any time.</p>
    <div id="pt-results" class="pt-results" hidden></div>
    <h2>Or pick one test</h2>
    <div class="pt-cards">
{cards}
    </div>
    {APP_BOX}
    <h2>Questions</h2>
{faq}
    <p class="also">More: <a href="/guide/check-used-phone-before-buying.html">how to check a used phone before buying</a>, <a href="/guide/phone-test-codes.html">phone test codes by brand</a> and <a href="/phones/">real specs of popular models</a>.</p>
  </div>
</main>
{FOOTER}
</body>
</html>
"""


def main():
    out = ROOT / "test"
    out.mkdir(exist_ok=True)
    (out / "index.html").write_text(hub_page(), encoding="utf-8", newline="\n")
    for t in TESTS:
        (out / t["file"]).write_text(test_page(t), encoding="utf-8", newline="\n")
    print(f"wrote {len(TESTS) + 1} pages to {out}")


if __name__ == "__main__":
    main()
