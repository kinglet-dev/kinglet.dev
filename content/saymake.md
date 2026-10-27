---
title: "Kinglet Saymake"
seoTitle: "Make 3D print and laser cut files from a description, free · Kinglet Saymake"
heading: "Describe it, then print or cut it"
description: "Describe a vase, bowl, tray, coaster or tag in plain words and get a file to 3D print or laser cut. Free, and nothing leaves your browser."
lead: "Type what you want to make, like “a tall fluted vase, 20 cm” or “hexagonal coaster with rounded corners, 4in”, and get a shape to adjust with sliders and download as STL, 3MF or SVG. Free, with nothing to install: nothing you type leaves your computer."
layout: saymake
shareImage: "images/saymake-share.png"
shareAlt: "Kinglet Saymake: describe it, then print or cut it. Typing “an oblique vase, 20 cm” gives a vase 200 mm tall with its top cut at a slant, ready to download as STL or 3MF."
---

## How it works

Kinglet Saymake runs [saymake](/tools/saymake/), a free, open-source tool, right here in your browser. It matches your words against the objects and features it knows (forgiving typos, but never mistaking one word it knows for another), shows you how it read them, and builds the shape from equations, so every size and feature is a setting you can change. There's no AI model involved, and nothing is uploaded.

## Questions

### Is anything I type sent anywhere?

No. saymake runs in your browser, and nothing sends your description or your shape anywhere. The page's security policy only lets it load its own files from kinglet.dev, about 6 MB the first time.

### What can it make?

Vessels (vases, bowls, cups, mugs, jars, planters, pitchers and more), trays and dishes, and flat shapes for a laser (coasters, plaques, tags and bookmarks), with features such as flutes, polygon sides, a twist, a slanted or chamfered rim, a raised foot, a handle, drainage and rounded corners. Words it can't act on yet, such as text, lids or legs, are shown with a note rather than ignored.

### Which programs open the files?

STL and 3MF are the files 3D printing slicers open, in millimeters. The SVG for flat shapes is in millimeters too, with cut lines in red and score lines dashed in blue, so laser software that sorts lines by color, such as LightBurn, puts them on separate layers.

### Will it print without supports?

Before offering a file, Saymake checks that the shape is a closed solid with walls of at least 0.8 mm, and it warns about overhangs past 45°, wide flat areas facing down, shapes that don't fit your printer (set its size under Printer) and shapes that would tip over. Your slicer has the last word: check the preview there before you print.

### Can I use it offline?

Yes. Download `saymake_<version>.html` from the [latest release](https://github.com/kinglet-dev/saymake/releases/latest): it's one file with everything inside, and it runs without a network connection.

### Is it free?

Yes. saymake is open source under the MIT license, with its source on [GitHub](https://github.com/kinglet-dev/saymake).
