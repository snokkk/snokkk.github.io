"""Run in a venv with Pillow and rcssmin after editing style.css or artwork.

Keeps the original artwork and complete Font Awesome fonts/CSS unchanged.
"""

from pathlib import Path
import re

from PIL import Image
from rcssmin import cssmin


ROOT = Path(__file__).resolve().parent.parent
ARTWORK = {
    "media/games/imposter-3d-banner.webp": (480, 768, 1280),
    "media/games/zombie-abc-banner.webp": (480, 768),
    "media/games/rootlings-banner.webp": (480, 525),
    "media/games/loonies-banner.webp": (480, 525),
    "media/games/imposter-3d-sandbox.webp": (480, 525),
    "media/games/space-break-icon.webp": (480, 512),
    "media/games/zombie-abc-icon.webp": (480, 512),
    "media/branding/logo.webp": (64, 128),
    "media/team/danila-demkin.webp": (72, 144),
    "media/team/nedonime.webp": (72, 144),
    "media/series/in-our-midst-poster.webp": (480, 768, 1280),
}
IMAGE_QUALITY = {"media/games/rootlings-banner.webp": 74}

for episode in range(1, 11):
    relative = f"media/series/episode-{episode:02}-preview.webp"
    with Image.open(ROOT / relative) as image:
        ARTWORK[relative] = (320, 480) if image.width <= 480 else (480, 768, 1024)
    IMAGE_QUALITY[relative] = 80


def build_images():
    for relative, widths in ARTWORK.items():
        original = ROOT / relative
        source = next((original.with_suffix(ext) for ext in (".png", ".jpg")
                       if original.with_suffix(ext).exists()), original)
        with Image.open(source) as image:
            for width in widths:
                height = round(image.height * width / image.width)
                resized = image.resize((width, height), Image.Resampling.LANCZOS)
                target = original.with_name(f"{original.stem}-{width}w.webp")
                resized.save(target, "WEBP", quality=IMAGE_QUALITY.get(relative, 86), method=6)
                print(f"{target.relative_to(ROOT)}: {target.stat().st_size} bytes")


def compact_icon_styles(icons):
    # Keep the full font files, font faces, sizing, animation and compatibility
    # styles. Only omit glyph-name rules that no current page or script uses.
    used = set()
    for path in ROOT.rglob("*"):
        relative = path.relative_to(ROOT)
        if (path.suffix not in (".html", ".css", ".js")
                or relative.parts[0] in (".git", "fontawesome")
                or path.name == "site.min.css"):
            continue
        text = path.read_text()
        # Generated rules must not become their own usage input on later runs.
        text = re.sub(r"<!-- Generated (homepage|series) styles:.*?<!-- End generated \1 styles -->", "", text, flags=re.S)
        used.update(re.findall(r"\bfa-[a-z0-9-]+\b", text))

    glyph_rule = re.compile(r'\.(fa-[a-z0-9-]+)\s*\{\s*--fa:\s*"\\[a-fA-F0-9]+";\s*\}')
    return glyph_rule.sub(lambda match: match[0] if match[1] in used else "", icons)


def inline_page_styles(combined, filename, label):
    page = ROOT / filename
    html = page.read_text()
    hero = re.search(r'<img\b[^>]*fetchpriority="high"[^>]*>', html)
    if hero is None:
        raise ValueError(f"Expected a high-priority hero image in {filename}")
    attributes = dict(re.findall(r'([a-z]+)="([^"]*)"', hero[0]))
    start = f"<!-- Generated {label} styles: tools/build-site-assets.py -->"
    end = f"<!-- End generated {label} styles -->"
    block = (f"{start}\n"
             f'  <link rel="preload" as="image" href="{attributes["src"]}" imagesrcset="{attributes["srcset"]}" imagesizes="{attributes["sizes"]}" fetchpriority="high">\n'
             f'  <style id="{label}-styles">{combined}</style>\n'
             f"  {end}")
    if start in html:
        html = re.sub(re.escape(start) + r".*?" + re.escape(end), lambda _: block, html, flags=re.S)
    else:
        html, count = re.subn(r'<link rel="stylesheet" href="site\.min\.css">', lambda _: block, html)
        if count != 1:
            raise ValueError(f"Expected exactly one stylesheet link in {filename}")
    page.write_text(html)


def inline_home_styles(combined):
    inline_page_styles(combined, "index.html", "homepage")


def build_styles():
    icons = (ROOT / "fontawesome/css/all.css").read_text()
    # The combined stylesheet lives at the site root instead of fontawesome/css/.
    icons = icons.replace("../webfonts/", "fontawesome/webfonts/")
    styles = (ROOT / "style.css").read_text()
    combined = cssmin(compact_icon_styles(icons) + "\n" + styles, keep_bang_comments=True)
    (ROOT / "site.min.css").write_text(combined + "\n")
    inline_home_styles(combined)
    inline_page_styles(combined, "in-our-midst.html", "series")
    print(f"site.min.css: {len(combined.encode())} bytes")


if __name__ == "__main__":
    build_images()
    build_styles()
