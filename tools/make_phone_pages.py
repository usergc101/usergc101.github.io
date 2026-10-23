"""Writes one page per popular phone model (phones/*.html) and the list page (phones/index.html).

The facts come from tools/phones-2026.json, a copy of the Knowfone app's reference data
(app repo: app/src/main/assets/specs/popular-2026.json). Every page cites the sources stored there.
The site has no build step: run this by hand after the data changes, then commit the HTML.
    python tools/make_phone_pages.py
"""
import html
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE = "https://usergc101.github.io"
APK = "https://github.com/usergc101/usergc101.github.io/releases/latest/download/knowfone.apk"
UPDATED = "2026-10-24"

NAMES = {  # store names are upper case; people search them in normal case
    "TECNO SPARK 20": "Tecno Spark 20", "TECNO SPARK 30": "Tecno Spark 30", "TECNO CAMON 30": "Tecno Camon 30",
    "TECNO POP 8": "Tecno Pop 8", "Infinix HOT 40i": "Infinix Hot 40i", "Infinix HOT 40": "Infinix Hot 40",
    "Infinix HOT 50": "Infinix Hot 50", "Infinix SMART 8": "Infinix Smart 8", "Redmi Note 13 (4G)": "Redmi Note 13 4G",
}
BRAND = {"samsung": "Samsung", "tecno": "Tecno", "infinix": "Infinix", "xiaomi": "Redmi", "redmi": "Redmi"}
GROUPS = [("Samsung", "Samsung Galaxy"), ("Tecno", "Tecno"), ("Infinix", "Infinix"), ("Redmi", "Xiaomi Redmi")]
FINGER = {
    "SIDE": "In the power button, on the side", "UNDER_DISPLAY_OPTICAL": "Under the screen (optical)",
    "UNDER_DISPLAY_ULTRASONIC": "Under the screen (ultrasonic)", "REAR": "On the back", "NONE": "None",
}
ROLE = {"main": "main", "ultra_wide": "ultra-wide", "macro": "macro", "depth": "depth", "tele": "zoom"}

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


def name_of(d):
    return NAMES.get(d["marketingName"], d["marketingName"])


def brand_of(d):
    return BRAND.get(d["manufacturer"].lower(), d["manufacturer"].title())


def join_or(items):
    items = [str(i) for i in items]
    return items[0] if len(items) == 1 else ", ".join(items[:-1]) + " or " + items[-1]


def gb(v):
    return "1 TB" if v == 1024 else f"{v} GB"


def chip_short(c):
    return c.split(" (")[0]


def chips(d):
    return [s["name"] for s in d["socOptions"]]


def codes(d):
    exact = [c for c in d["modelCodes"] if not c.endswith("*")]
    wild = [c[:-1] for c in d["modelCodes"] if c.endswith("*")]
    text = ", ".join(exact)
    if wild:
        text += f" (and other {wild[0]}... versions)"
    return text


def screen_type(d):
    return "AMOLED" if d["display"]["type"] == "OLED" else "LCD"


def cams(d, facing):
    parts = []
    extra = 0
    for c in d["cameras"]:
        if c["facing"] != facing:
            continue
        if c.get("marketingMp") and c["role"] != "other":
            parts.append(f'{c["marketingMp"]:g} MP {ROLE.get(c["role"], c["role"])}')
        elif c.get("marketingMp"):
            parts.append(f'{c["marketingMp"]:g} MP')
        else:
            extra += 1
    text = " + ".join(parts) if parts else "none"
    if extra:
        text += " + a small helper lens" if extra == 1 else f" + {extra} small helper lenses"
    return text


def about_path(d):
    b = brand_of(d)
    if b == "Samsung":
        return "Settings, About phone, Model number"
    if b == "Redmi":
        return "Settings, About phone, All specs, Model"
    return "Settings, About phone, Model"


def code_tip(d):
    b = brand_of(d)
    if b == "Samsung":
        return 'Dial <strong>*#0*#</strong>: on many Galaxy phones it opens a test menu for the screen colours, touch grid, speaker, vibration and sensors (some versions block it). Samsung Members, Phone diagnostics, is the official alternative.'
    if b == "Redmi":
        return 'Dial <strong>*#*#6484#*#*</strong> to open Xiaomi\'s hardware test menu (CIT) on most Redmi phones, or open Settings, About phone, All specs and tap Kernel version five times.'
    return 'Most Tecno and Infinix models have no public test code (see <a href="/guide/phone-test-codes.html">phone test codes by brand</a>). Our <a href="/test/">online phone test</a> checks the screen, touch, speakers, microphone, cameras and sensors on any phone without a code.'


def facts(d):
    dsp = d["display"]
    c = chips(d)
    soc = ("the " + chip_short(c[0])) if len(c) == 1 else ("either the " + " or the ".join(chip_short(x) for x in c) + ", depending on the version")
    ram = join_or(d["ramOptionsGb"]) + " GB"
    rom = join_or([gb(v) for v in d["storageOptionsGb"]])
    return {
        "soc": soc, "ram": ram, "rom": rom,
        "screen": f'{dsp["sizeInches"]:g}-inch {screen_type(d)}',
        "pixels": f'{dsp["widthPx"]} x {dsp["heightPx"]}',
        "hz": dsp["maxRefreshHz"],
        "mah": d["batteryDesignMah"],
    }


def spec_rows(d):
    f = facts(d)
    dsp = d["display"]
    rows = [
        ("Processor", " or ".join(chips(d))),
        ("Memory (RAM)", f["ram"]),
        ("Storage", f["rom"]),
        ("Screen", f'{dsp["sizeInches"]:g}-inch {dsp.get("panelFamily") or screen_type(d)}, {f["pixels"]} pixels'),
        ("Refresh rate", f'up to {f["hz"]} Hz'),
        ("Battery", f'{f["mah"]} mAh'),
        ("Back cameras", cams(d, "back")),
        ("Front camera", cams(d, "front")),
        ("Fingerprint reader", FINGER.get(d.get("fingerprint") or "", "Not listed")),
    ]
    if d.get("headphoneJack") is not None:
        rows.append(("Headphone jack", "Yes" if d["headphoneJack"] else "No"))
    if d.get("nfc") is not None:
        rows.append(("NFC", "Yes" if d["nfc"] else "No"))
    rows.append(("Model code", f'<span class="mono">{html.escape(codes(d))}</span>'))
    return rows


def page(d, all_devices):
    n = name_of(d)
    f = facts(d)
    url = f"{SITE}/phones/{d['id']}.html"
    oled = d["display"]["type"] == "OLED"
    title = f"Is my {n} original? Real specs and a 10-minute check"
    desc = (f"A real {n} has {f['soc']}, {f['ram']} of RAM, {f['rom']} of storage, a {f['screen']} screen at up to "
            f"{f['hz']} Hz and a {f['mah']} mAh battery. How to check a used {n} before you buy it.")
    short = (f"A real {n} has {f['soc']}, {f['ram']} of RAM, {f['rom']} of storage, a {f['screen']} screen "
             f"({f['pixels']}, up to {f['hz']} Hz) and a {f['mah']} mAh battery. Its model code is {codes(d)}. "
             f"A copy can show the right name, but it cannot change the processor, the real storage or the screen.")
    faq = [
        (f"What processor does the {n} have?", f"The {n} uses {f['soc']}. A phone sold as a {n} with a different processor is not one."),
        (f"How much RAM and storage does the {n} have?", f"The {n} comes with {f['ram']} of RAM and {f['rom']} of storage."),
        (f"What is the model number of the {n}?", f"The {n} reports the model code {codes(d)}. You find it in {about_path(d)}. Copies often copy this name too, so check the processor and storage as well."),
        (f"Does the {n} have an AMOLED screen?",
         (f"Yes. The {n} has a {f['screen']} screen that runs at up to {f['hz']} Hz. In a dark room a black picture looks completely black on it."
          if oled else
          f"No. The {n} has a {f['screen']} screen that runs at up to {f['hz']} Hz. An LCD glows slightly grey on a black picture in the dark; that is normal for this model.")),
    ]
    ld = [
        {
            "@context": "https://schema.org", "@type": "Article", "headline": title, "description": desc, "url": url,
            "datePublished": UPDATED, "dateModified": UPDATED, "image": f"{SITE}/assets/og.png",
            "author": {"@type": "Organization", "name": "Knowfone", "url": SITE + "/"},
            "publisher": {"@type": "Organization", "name": "Knowfone", "url": SITE + "/",
                          "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/icon-180.png"}},
            "about": {"@type": "Product", "name": n, "brand": {"@type": "Brand", "name": brand_of(d)}},
        },
        {"@context": "https://schema.org", "@type": "FAQPage",
         "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in faq]},
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Phone models", "item": f"{SITE}/phones/"},
            {"@type": "ListItem", "position": 2, "name": n, "item": url}]},
    ]
    grid = "\n".join(f"      <div><dt>{html.escape(k)}</dt><dd>{v if k == 'Model code' else html.escape(v)}</dd></div>" for k, v in spec_rows(d))
    screen_step = (
        f'<li><strong>Do the black screen test.</strong> The real {html.escape(n)} has an AMOLED screen: open the black colour of the <a href="/test/dead-pixel-test.html">screen test</a> in a dark room. It must be completely black. A grey glow means an LCD, which this model never had.</li>'
        if oled else
        f'<li><strong>Check the screen.</strong> The real {html.escape(n)} has an LCD at {f["pixels"]} pixels. Run the <a href="/test/dead-pixel-test.html">screen colour test</a> for dots, lines and stains.</li>')
    hz_step = (f'<li><strong>Measure the refresh rate.</strong> Set Settings, Display to the highest refresh rate, then run the <a href="/test/refresh-rate-test.html">refresh rate test</a> with a finger moving on the screen. The real phone reaches about {f["hz"]} Hz.</li>'
               if f["hz"] > 60 else "")
    same_brand = [x for x in all_devices if brand_of(x) == brand_of(d) and x["id"] != d["id"]]
    others = "".join(f'<a href="/phones/{x["id"]}.html">{html.escape(name_of(x))}</a>' for x in same_brand)
    srcs = "".join(
        f'<li><a href="{html.escape(s["url"])}" rel="noopener">{html.escape(s["title"])}</a>, checked {html.escape(s.get("retrieved", ""))}</li>'
        for s in d["sources"])
    brand_guide = ('<a href="/guide/samsung-original-check.html">how to check any Samsung phone</a>' if brand_of(d) == "Samsung"
                   else '<a href="/guide/check-tecno-infinix-original.html">how to check any Tecno or Infinix phone</a>' if brand_of(d) in ("Tecno", "Infinix")
                   else '<a href="/guide/is-my-phone-original-or-a-clone.html">original or clone, for any brand</a>')
    notes = f'<p class="also">{html.escape(d["notes"])}</p>' if d.get("notes") else ""
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#060a13">
<meta property="og:type" content="article">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
{json.dumps(ld, indent=2, ensure_ascii=False)}
</script>
</head>
<body>
{HEADER}
<main class="article">
  <div class="narrow">
    <p class="meta"><a href="/phones/">Phone models</a> / {html.escape(brand_of(d))}</p>
    <h1>Is my {html.escape(n)} original?</h1>
    <p class="meta">Updated October 2026. Real specs from the sources below, and how to check a used {html.escape(n)} in about 10 minutes.</p>
    <div class="callout"><p><strong>Short answer:</strong> {html.escape(short)}</p></div>
    <h2>Real {html.escape(n)} specs</h2>
    <dl class="spec-grid">
{grid}
    </dl>
    {notes}
    <h2>How to check a used {html.escape(n)}</h2>
    <ol>
      <li><strong>Read the model code.</strong> Open {html.escape(about_path(d))}. It must say {html.escape(codes(d))}. Copies often copy this name too, so this is only the first check.</li>
      <li><strong>Check the processor.</strong> It must be {html.escape(f['soc'])}. Copies run on a cheaper chip and sometimes rename it, so look at the number of cores and the graphics chip too. The Knowfone app does this for you and compares every part with this exact model.</li>
      {screen_step}
      {hz_step}
      <li><strong>Prove the storage.</strong> Settings shows {html.escape(f['rom'])} on a real {html.escape(n)}. Copies can show any number; only writing data and reading it back proves the real size (<a href="/guide/fake-storage-check.html">how to check fake storage</a>).</li>
      <li><strong>Check the battery.</strong> The real battery holds {f['mah']} mAh when new. See <a href="/guide/check-battery-health-android.html">how to check battery health</a>.</li>
      <li><strong>Test the rest.</strong> {code_tip(d)}</li>
    </ol>
    <div class="callout"><p>Knowfone checks a used {html.escape(n)} against these exact specs in about 7 minutes: the processor, memory, storage, screen and cameras, then every other part, and answers: good to buy, buy only at a lower price, or don't buy. Free for Android.</p></div>
    <div class="cta">
      <a class="btn btn-primary" href="{APK}">Download Knowfone for Android (free)</a>
      <a class="btn btn-ghost" href="/test/">Test it online first</a>
    </div>
    <h2>Questions</h2>
{chr(10).join(f"    <h3>{html.escape(q)}</h3>{chr(10)}    <p>{html.escape(a)}</p>" for q, a in faq)}
    <h2>More {html.escape(brand_of(d))} phones</h2>
    <div class="pt-tags">{others}</div>
    <p class="also">Also read {brand_guide}.</p>
    <div class="sources"><p>Sources:</p><ul>{srcs}</ul></div>
  </div>
</main>
{FOOTER}
</body>
</html>
"""


def index(devices):
    url = f"{SITE}/phones/"
    title = "Is my phone original? Real specs of popular Samsung, Tecno, Infinix and Redmi phones"
    desc = "The real processor, memory, storage, screen and battery of 24 popular phones, with a 10-minute check for each: Samsung Galaxy A and S, Tecno Spark, Camon and Pop, Infinix Hot and Smart, Redmi."
    ld = {"@context": "https://schema.org", "@type": "CollectionPage", "name": "Phone models", "url": url, "description": desc,
          "mainEntity": {"@type": "ItemList", "itemListElement": [
              {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/phones/{d['id']}.html", "name": name_of(d)} for i, d in enumerate(devices)]}}
    blocks = []
    for key, label in GROUPS:
        items = [d for d in devices if brand_of(d) == key]
        if not items:
            continue
        links = "\n".join(
            f'      <a href="/phones/{d["id"]}.html">{html.escape(name_of(d))}<small>{html.escape(chip_short(chips(d)[0]))}, {facts(d)["screen"]}, {facts(d)["hz"]} Hz</small></a>'
            for d in items)
        blocks.append(f"    <h2>{label}</h2>\n    <div class=\"model-list\">\n{links}\n    </div>")
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(title)}</title>
<meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}">
<meta name="theme-color" content="#060a13">
<meta property="og:type" content="website">
<meta property="og:title" content="{html.escape(title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og.png">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/icon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&family=Sora:wght@400;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
<script type="application/ld+json">
{json.dumps(ld, indent=2, ensure_ascii=False)}
</script>
</head>
<body>
{HEADER}
<main class="article">
  <div class="narrow">
    <h1>Is my phone original?</h1>
    <p class="meta">Updated October 2026. {len(devices)} popular models, with sources.</p>
    <p>Copies of popular phones show the right name and logo, but they cannot change what is inside. Pick your model to see its real processor, memory, storage, screen and battery, and how to check a used one in about 10 minutes.</p>
{chr(10).join(blocks)}
    <div class="callout"><p>Your model is not here? The free Knowfone app knows these models in detail and checks any other Android phone against what it reports about itself. You can also start with the <a href="/test/">online phone test</a>.</p></div>
    <div class="cta">
      <a class="btn btn-primary" href="{APK}">Download Knowfone for Android (free)</a>
      <a class="btn btn-ghost" href="/guide/is-my-phone-original-or-a-clone.html">Original or clone: the guide</a>
    </div>
  </div>
</main>
{FOOTER}
</body>
</html>
"""


def main():
    devices = [d for d in json.loads((ROOT / "tools" / "phones-2026.json").read_text(encoding="utf-8"))["devices"] if not d.get("placeholder")]
    out = ROOT / "phones"
    out.mkdir(exist_ok=True)
    for d in devices:
        (out / f"{d['id']}.html").write_text(page(d, devices), encoding="utf-8", newline="\n")
    (out / "index.html").write_text(index(devices), encoding="utf-8", newline="\n")
    print(f"wrote {len(devices) + 1} pages to {out}")


if __name__ == "__main__":
    main()
