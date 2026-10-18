---
title: "Kinglet Preflight"
seoTitle: "Check and fix laser SVG files online, free · Kinglet Preflight"
heading: "Check and fix laser SVG files"
description: "Find lines your laser would burn twice or too close together, and download a repaired SVG. Free, in your browser: your file never leaves your computer."
lead: "Find lines your laser would burn twice, lines too close together, specks and other problems before you cut, and download a repaired copy. Free, with nothing to install: your file is checked right here in your browser."
layout: preflight
shareImage: "images/preflight-share.png"
shareAlt: "Kinglet Preflight: check and fix laser SVG files in your browser. A design goes in; lines burned twice come out at 0.0 mm."
---

## How it works

Kinglet Preflight runs two free, open-source tools in your browser: [laserlint](/tools/laserlint/) checks the design, and [laserfix](/tools/laserfix/) repairs what it safely can, then measures the repaired copy again. They're the same programs you can download and run on your computer.

## Questions

### Why does my laser cut some lines twice?

When two shapes share an edge, or a shape was pasted in place twice, the laser follows each shape, so the shared line burns twice: it chars the edge, widens the cut and wastes machine time. laserfix removes the copies and trims shared line from the later shape, so each line burns once.

### Is my file uploaded?

No. Both tools run in your browser, and nothing sends your design anywhere. The page's security policy blocks it from connecting anywhere but kinglet.dev, which it contacts only to load the tools: about 3 MB, the first time.

### Which laser software does the repaired copy work with?

Any that opens SVG files, such as xTool Studio, LightBurn, Glowforge and LaserGRBL. laserfix only changes lines of the same color, because laser software picks its settings by color, and it keeps everything else in the file as it was.

### What size is my design checked at?

At the size saved in the file, so scale it to the size you'll burn first. The checks assume a 0.1 mm laser line and a 0.25 mm gap between lines; change them under Advanced settings.

### Is it free?

Yes. laserlint and laserfix are open source under the MIT license, with their source on [GitHub](https://github.com/kinglet-dev). You can also [download them](/tools/) to check files on your computer.
