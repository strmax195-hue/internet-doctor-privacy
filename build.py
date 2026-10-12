#!/usr/bin/env python3
"""Builds the site: index.html (Russian) and en/index.html (English) from src/.

Run after changing src/page.html or src/text.py:  python3 build.py
The generated pages are committed, so GitHub Pages serves them as they are.
"""
import html
import json
import os
import re
import sys

sys.dont_write_bytecode = True

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ROOT, "src"))
from text import DEMO, GOOGLE_PLAY, RUSTORE, SITE, T  # noqa: E402

VERSION = "1.3"

ALT = {
    "ru": {
        "alt_result": "Экран результата: «Wi‑Fi слабый, проблема внутри домашней сети», ниже скорость, задержка и стабильность",
        "alt_enough": "Экран «Хватит ли интернета»: видеозвонки, онлайн-игры и видео 4K с выводами",
        "alt_map": "Карта сигнала квартиры: зелёные и красные зоны, отмечено, куда поставить роутер",
        "alt_history": "История за неделю: интернет чаще ухудшается вечером, с 21:00 до 23:00",
    },
    "en": {
        "alt_result": "Result screen: “Wi‑Fi is weak, the problem is inside your home network”, with speed, latency and stability below",
        "alt_enough": "“Is it fast enough” screen: video calls, online games and 4K video with verdicts",
        "alt_map": "Signal map of a home: green and red zones and a mark where to put the router",
        "alt_history": "Weekly history: the internet gets worse in the evening",
    },
}

# A few of the app's 37 languages, written in their own script, for the language tile.
LANG_CLOUD = ["Русский", "English", "Deutsch", "Español", "Français", "Português", "Türkçe",
              "العربية", "हिन्दी", "日本語", "한국어", "中文", "Українська", "Polski", "Italiano",
              "Bahasa", "Tiếng Việt", "فارسی", "עברית", "Қазақ"]


def store_buttons(lang):
    rustore = (f'<a class="store" href="{RUSTORE}" rel="noopener">'
               f'<span class="store-ico store-ru" aria-hidden="true">R</span>'
               f'<span><small>{T[lang]["store_rustore_small"]}</small>RuStore</span></a>')
    gp = (f'<a class="store" href="{GOOGLE_PLAY}" rel="noopener">'
          f'<span class="store-ico store-gp" aria-hidden="true"><svg><use href="#i-download"/></svg></span>'
          f'<span><small>{T[lang]["store_gp_small"]}</small>Google Play</span></a>')
    return rustore + gp if lang == "ru" else gp + rustore


def ld_json(lang):
    t = T[lang]
    data = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": t["app_name"],
        "operatingSystem": "Android 8.0+",
        "applicationCategory": "UtilitiesApplication",
        "description": t["description"],
        "softwareVersion": VERSION + ".0",
        "offers": {"@type": "Offer", "price": "0", "priceCurrency": "USD"},
        "url": t["url"],
        "image": t["og_image"],
        "inLanguage": lang,
    }
    return json.dumps(data, ensure_ascii=False).replace("</", "<\\/")


def render(lang):
    page = open(os.path.join(ROOT, "src", "page.html"), encoding="utf-8").read()
    values = dict(T[lang])
    values.update(ALT[lang])
    values.update({
        "site": SITE,
        "version": VERSION,
        "other_lang_code_lc": values["other_lang_code"].lower(),
        "privacy_hash": "#en" if lang == "en" else "",
        "store_buttons": store_buttons(lang),
        "ld_json": ld_json(lang),
        "demo_json": html.escape(json.dumps(DEMO[lang], ensure_ascii=False), quote=True),
        "lang_cloud": "".join(f"<span>{l}</span>" for l in LANG_CLOUD),
        "stat_4_num": "1,7" if lang == "ru" else "1.7",
    })
    if lang == "ru":
        # Russian typography: no dash at the start of a line, no one-letter word at the end of one.
        for key, v in values.items():
            if isinstance(v, str) and key not in ("ld_json", "demo_json", "store_buttons", "lang_cloud"):
                v = v.replace(" — ", "\u00a0— ")
                values[key] = re.sub(r"(?<=[\s>«(])([вксуоаиВКСУОАИ]) ", "\\1\u00a0", v)
    # Plain attribute values must not carry markup or quotes.
    for key in ("title", "description", "alt_result", "alt_enough", "alt_map", "alt_history",
                "lang_suggest", "lang_suggest_btn"):
        values[key] = html.escape(values[key], quote=True)

    def sub(m):
        key = m.group(1)
        if key not in values:
            raise KeyError(f"{lang}: no text for {{{{{key}}}}}")
        return str(values[key])

    return re.sub(r"\{\{(\w+)\}\}", sub, page)


def main():
    for lang, path in (("ru", "index.html"), ("en", os.path.join("en", "index.html"))):
        out = os.path.join(ROOT, path)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        with open(out, "w", encoding="utf-8") as f:
            f.write(render(lang))
        print("wrote", path)


if __name__ == "__main__":
    main()
