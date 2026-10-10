"""Run in a venv with Pillow and rcssmin after editing style.css or artwork.

Keeps the original artwork and complete Font Awesome fonts/CSS unchanged.
"""

from pathlib import Path

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
}


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
                resized.save(target, "WEBP", quality=86, method=6)
                print(f"{target.relative_to(ROOT)}: {target.stat().st_size} bytes")


def build_styles():
    icons = (ROOT / "fontawesome/css/all.css").read_text()
    # The combined stylesheet lives at the site root instead of fontawesome/css/.
    icons = icons.replace("../webfonts/", "fontawesome/webfonts/")
    styles = (ROOT / "style.css").read_text()
    combined = cssmin(icons + "\n" + styles, keep_bang_comments=True)
    (ROOT / "site.min.css").write_text(combined + "\n")
    print(f"site.min.css: {len(combined.encode())} bytes")


if __name__ == "__main__":
    build_images()
    build_styles()
