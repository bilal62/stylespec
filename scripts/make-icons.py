#!/usr/bin/env python3
"""Generate the Stylespec icon set.

Draws a white speech bubble on an indigo-to-purple rounded square, rendered at
8x and downsampled so the small sizes stay crisp.

Usage: python3 scripts/make-icons.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

SIZES = (16, 32, 48, 128)
SUPERSAMPLE = 8
START = (99, 102, 241)   # --accent  #6366f1
END = (168, 85, 247)     # #a855f7
OUT_DIR = Path(__file__).resolve().parent.parent / "icons"


def diagonal_gradient(size: int) -> Image.Image:
    """Top-left to bottom-right gradient, built small and scaled for smoothness."""
    seed = Image.new("RGB", (64, 64))
    pixels = seed.load()
    for y in range(64):
        for x in range(64):
            t = (x + y) / 126
            pixels[x, y] = tuple(
                round(START[i] + (END[i] - START[i]) * t) for i in range(3)
            )
    return seed.resize((size, size), Image.LANCZOS)


def rounded_mask(size: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=round(size * 0.22), fill=255
    )
    return mask


def speech_bubble(size: int) -> Image.Image:
    """White bubble with a tail, as an RGBA overlay."""
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    white = (255, 255, 255, 255)

    body = (size * 0.17, size * 0.19, size * 0.83, size * 0.65)
    draw.rounded_rectangle(body, radius=round(size * 0.16), fill=white)
    draw.polygon(
        [
            (size * 0.30, size * 0.60),
            (size * 0.52, size * 0.62),
            (size * 0.31, size * 0.85),
        ],
        fill=white,
    )
    return layer


def build(size: int) -> Image.Image:
    big = size * SUPERSAMPLE
    icon = diagonal_gradient(big).convert("RGBA")
    icon.putalpha(rounded_mask(big))
    icon.alpha_composite(speech_bubble(big))
    return icon.resize((size, size), Image.LANCZOS)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        path = OUT_DIR / f"icon-{size}.png"
        build(size).save(path, "PNG")
        print(f"wrote {path.relative_to(OUT_DIR.parent)}")


if __name__ == "__main__":
    main()
