---
title: "saymake"
description: "Describe an object in plain words and get a shape to 3D print or laser cut: vases, bowls, mugs, trays, coasters and tags, with every size on a slider, as STL, 3MF or SVG."
hero: "saymake-hero"
heroAlt: "Typing “an oblique vase, 20 cm” into saymake: it reads Vessel › Vase, slanted rim and Height 200 mm, and makes a vase 200 mm tall whose top is cut at a slant, ready to download as STL or 3MF."
download: "https://github.com/kinglet-dev/saymake/releases/latest"
source: "https://github.com/kinglet-dev/saymake"
app: "/saymake/"
weight: 3
---

Most simple objects are a handful of choices: how tall, how wide, round or six-sided, fluted or plain, with a handle or without. saymake lets you say those choices in plain words and gives you a shape you can still adjust, instead of starting from a blank CAD file or hunting for a model that's almost right.

## What it makes

| Family | Objects | Files |
|---|---|---|
| Vessels | vase, bud vase, bottle, bowl, cup, mug, teacup, candle holder, pencil cup, jar, planter, pitcher | STL, 3MF |
| Trays | tray, serving tray, valet tray, dish, open box | STL, 3MF |
| Flat shapes | coaster, plaque, tag, bookmark | SVG |

It knows 46 features, such as flutes, polygon sides, a twist, a slanted or chamfered rim, a lean, a raised foot, a handle, drainage and rounded corners, plus sizes ("20 cm tall", "4in diameter") and counts ("8 flutes"). It shows how it read every word, and says which words it didn't use or can't make yet.

## Example

Typing “an oblique vase, 20 cm” in saymake 0.1.0:

```text
Vessel › Vase · slanted rim · Height 200 mm
Made a vase, 100.8 × 100.8 × 200 mm.
Download STL (.stl) · Download 3MF (.3mf)
```

Every setting, from the height and bulge to the rim's slant, is then on a slider. Before offering files it checks walls, overhangs, flat areas facing down, the printer's size and whether the shape would tip over.

## Install

Nothing to install: [use it in your browser](/saymake/). To use it offline, download `saymake_<version>.html` from the [latest release](https://github.com/kinglet-dev/saymake/releases/latest) and open it: one file with everything inside. Each release has a checksums file and an SBOM to verify the download.

## Privacy

saymake runs entirely in your browser. Nothing you type or make leaves your computer.

## Links

- [Documentation](https://github.com/kinglet-dev/saymake#usage): usage, what it makes, and embedding it in a page
- [Changelog](https://github.com/kinglet-dev/saymake/blob/main/CHANGELOG.md)
- [Source](https://github.com/kinglet-dev/saymake) (MIT license)
- [Security policy](https://github.com/kinglet-dev/saymake/blob/main/SECURITY.md): how to report a vulnerability
- [Issues](https://github.com/kinglet-dev/saymake/issues): report a description it got wrong
