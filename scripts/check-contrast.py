#!/usr/bin/env python3
"""Checks WCAG 2.2 AA contrast of the site's colour tokens in light and dark themes.

Reads the built stylesheet, takes the custom properties declared on :root
(light theme) and inside @media (prefers-color-scheme: dark) (dark theme), and
checks each foreground token against the background token.
Standard library only. Usage: check-contrast.py <stylesheet.css>
"""
import re
import sys

# (foreground token, minimum ratio, why): WCAG 2.2 SC 1.4.3 and 1.4.11.
PAIRS = [
    ("--fg", 4.5, "body text"),
    ("--muted", 4.5, "secondary text"),
    ("--link", 4.5, "link text"),
    ("--focus", 3.0, "focus indicator"),
]
BACKGROUND = "--bg"

HEX = re.compile(r"^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")
DARK_BLOCK = re.compile(r"@media\s*\(\s*prefers-color-scheme\s*:\s*dark\s*\)\s*\{\s*:root\s*\{([^}]*)\}")
ROOT_BLOCK = re.compile(r"(?<![\w-]):root\s*\{([^}]*)\}")
DECLARATION = re.compile(r"(--[\w-]+)\s*:\s*([^;]+)")


def tokens(block):
    return {name: value.strip() for name, value in DECLARATION.findall(block)}


def luminance(colour):
    match = HEX.match(colour)
    if not match:
        raise ValueError(f"not a hex colour: {colour!r}")
    digits = match.group(1)
    if len(digits) == 3:
        digits = "".join(d * 2 for d in digits)
    channels = [int(digits[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    linear = [c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in channels]
    return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]


def ratio(a, b):
    high, low = sorted((luminance(a), luminance(b)), reverse=True)
    return (high + 0.05) / (low + 0.05)


def themes(css):
    dark_match = DARK_BLOCK.search(css)
    without_dark = DARK_BLOCK.sub("", css)
    light = {}
    for block in ROOT_BLOCK.findall(without_dark):
        light.update(tokens(block))
    dark = dict(light)
    if dark_match:
        dark.update(tokens(dark_match.group(1)))
    return {"light": light, "dark": dark if dark_match else None}


def main(path):
    with open(path, encoding="utf-8") as handle:
        css = handle.read()
    failures = 0
    for theme, values in themes(css).items():
        if values is None:
            print(f"FAIL  {theme} theme: no @media (prefers-color-scheme: dark) :root block")
            failures += 1
            continue
        for token, minimum, why in PAIRS:
            if token not in values or BACKGROUND not in values:
                print(f"FAIL  {theme} {why}: {token} or {BACKGROUND} is not defined")
                failures += 1
                continue
            value = ratio(values[token], values[BACKGROUND])
            status = "ok  " if value >= minimum else "FAIL"
            failures += status == "FAIL"
            print(f"{status}  {theme} {why}: {token} {values[token]} on {values[BACKGROUND]} "
                  f"is {value:.2f}:1 (needs {minimum}:1)")
    return 1 if failures else 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: check-contrast.py <stylesheet.css>")
    sys.exit(main(sys.argv[1]))
