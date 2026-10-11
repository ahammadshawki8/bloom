"""Build the demo catalogue fixture for the frontend.

Pulls a curated set of wig styles and head wraps from a public Shopify catalogue,
downloads each colour variant image, crops the caption strip, measures the hair /
fabric colour (median CIELAB of foreground pixels), and writes
frontend/public/fixtures/catalog.json plus local webp images.

Usage:  PYTHONUTF8=1 python tools/build_catalog.py
"""
from __future__ import annotations

import io
import json
import math
import pathlib
import re
import statistics
import urllib.request

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "frontend" / "public" / "fixtures" / "catalog"
OUT_JSON = ROOT / "frontend" / "public" / "fixtures" / "catalog.json"
STORE = "https://godivassecretwigs.com"
RETAILER = "Godiva's Secret Wigs"
UA = {"User-Agent": "Mozilla/5.0"}

WIG_STYLES = [
    "tracy-short-wig", "cristi-short-wig", "kelly-short-wig",
    "hope-medium-wig", "alana-medium-wig", "abigail-lf-medium-wig",
    "monroe-medium-wig", "nina-medium-wig",
    "jenna-long-wig", "rochelle-long-wig", "diana-lf-long-wig",
]
WRAP_STYLES = ["bamboo-turban", "3-seam-turban-cotton", "3-seam-turban-sweater-knit", "long-wrap-lycra"]
MAX_VARIANTS = 6


def fetch(url: str) -> bytes:
    return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()


def all_products() -> list[dict]:
    products: list[dict] = []
    for page in range(1, 5):
        batch = json.loads(fetch(f"{STORE}/products.json?limit=250&page={page}"))["products"]
        if not batch:
            break
        products += batch
    return products


# --- colour maths (sRGB D65 -> CIELAB) ---------------------------------------
def _lin(c: float) -> float:
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgb_to_lab(r: int, g: int, b: int) -> tuple[float, float, float]:
    rl, gl, bl = _lin(r), _lin(g), _lin(b)
    x = (rl * 0.4124 + gl * 0.3576 + bl * 0.1805) / 0.95047
    y = rl * 0.2126 + gl * 0.7152 + bl * 0.0722
    z = (rl * 0.0193 + gl * 0.1192 + bl * 0.9505) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    fx, fy, fz = f(x), f(y), f(z)
    return 116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)


def lab_to_hex(L: float, a: float, b: float) -> str:
    fy = (L + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    inv = lambda t: t ** 3 if t ** 3 > 0.008856 else (t - 16 / 116) / 7.787
    x, y, z = inv(fx) * 0.95047, inv(fy), inv(fz) * 1.08883
    rl = x * 3.2406 + y * -1.5372 + z * -0.4986
    gl = x * -0.9689 + y * 1.8758 + z * 0.0415
    bl = x * 0.0557 + y * -0.2040 + z * 1.0570
    g = lambda c: 255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055)
    return "#" + "".join(f"{max(0, min(255, round(g(c)))):02x}" for c in (rl, gl, bl))


def measure(im: Image.Image, kind: str) -> tuple[float, float, float]:
    """Median Lab of foreground pixels in the upper region (hair or fabric)."""
    small = im.convert("RGB").resize((120, int(120 * im.height / im.width)))
    w, h = small.size
    px = small.load()
    border = [px[x, y] for x in range(w) for y in (0, 1)] + [px[x, y] for y in range(h) for x in (0, 1, w - 2, w - 1)]
    bg = rgb_to_lab(*[statistics.median(c[i] for c in border) for i in range(3)])
    top = int(h * (0.62 if kind == "wig" else 0.45))
    Ls, As, Bs = [], [], []
    for y in range(top):
        for x in range(w):
            L, a, b = rgb_to_lab(*px[x, y])
            chroma = math.hypot(a, b)
            if math.dist((L, a, b), bg) < 12:
                continue  # background
            if L > 78 and chroma < 10:
                continue  # white mannequin
            if a > 30 and L < 60:
                continue  # painted lips
            Ls.append(L); As.append(a); Bs.append(b)
    if len(Ls) < 50:
        return bg
    return statistics.median(Ls), statistics.median(As), statistics.median(Bs)


def slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def tags_info(p: dict) -> dict:
    tags = set(p["tags"])
    ptype = p["product_type"].lower()
    length = "short" if "short" in ptype else "long" if "long" in ptype else "medium"
    texture = "wavy" if {"Wavy & Curly", "Wavy", "Curly"} & tags else "straight"
    cap = next((t.replace(" Cap Size", "").lower() for t in tags if t.endswith("Cap Size")), "average")
    return {
        "length": length,
        "texture": texture,
        "bangs": "With Bangs" in tags,
        "capSize": cap,
        "laceFront": "Lace Front" in tags,
        "rooted": "Rooted" in tags,
    }


def build_item(p: dict, kind: str) -> list[dict]:
    items = []
    seen_images = set()
    for v in p["variants"]:
        img = v.get("featured_image")
        if not img or img["src"] in seen_images:
            continue
        seen_images.add(img["src"])
        raw = Image.open(io.BytesIO(fetch(img["src"].split("?")[0] + "?width=900"))).convert("RGB")
        if kind == "wig":  # remove the caption strip at the bottom
            raw = raw.crop((0, 0, raw.width, int(raw.height * 0.84)))
        L, a, b = measure(raw, kind)
        colour = v["option1"] or v["title"]
        style_slug = slug(p["handle"])
        file = f"{style_slug}--{slug(colour)}.webp"
        disp = raw.copy()
        disp.thumbnail((640, 800))
        disp.save(OUT_DIR / file, "WEBP", quality=82)
        items.append({
            "id": f"{style_slug}--{slug(colour)}",
            "colorName": colour.replace("-H", " (highlighted)").replace("-R", " (rooted)"),
            "hex": lab_to_hex(L, a, b),
            "lab": [round(L, 2), round(a, 2), round(b, 2)],
            "image": f"/fixtures/catalog/{file}",
            "refImageUrl": img["src"].split("?")[0],
            "price": float(v["price"]),
        })
        if len(items) >= MAX_VARIANTS:
            break
    return items


def clean_title(t: str) -> str:
    return re.sub(r"\s*\(.*?\)\s*", " ", t).replace(" Wig", "").strip()


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    by_handle = {p["handle"]: p for p in all_products()}
    styles = []
    for kind, handles in (("wig", WIG_STYLES), ("wrap", WRAP_STYLES)):
        for h in handles:
            p = by_handle.get(h)
            if not p:
                print("missing", h)
                continue
            variants = build_item(p, kind)
            if not variants:
                print("no images", h)
                continue
            info = tags_info(p) if kind == "wig" else {}
            styles.append({
                "id": slug(h),
                "kind": kind,
                "name": clean_title(p["title"]),
                "retailer": RETAILER,
                "url": f"{STORE}/products/{h}",
                "finalSale": "Final Sale" in p["tags"],
                **info,
                "variants": variants,
            })
            print(kind, h, len(variants))
    OUT_JSON.write_text(json.dumps({"generatedAt": "2026-10-11", "styles": styles}, indent=1), encoding="utf8")
    print("wrote", OUT_JSON, sum(len(s["variants"]) for s in styles), "variants")


if __name__ == "__main__":
    main()
