---
title: "laserfix"
description: "Repairs an SVG so your laser burns each line once: removes shapes pasted twice, trims line that two shapes share, and joins outlines stored as separate pieces."
hero: "laserfix-hero"
heroAlt: "A tag design whose outline and hole were pasted twice goes into laserfix, which removes the two copies and checks the result again: line burned twice goes from 248.5 mm to 0.0 mm, and crossings stay at 0."
download: "https://github.com/kinglet-dev/laserfix/releases/latest"
source: "https://github.com/kinglet-dev/laserfix"
weight: 2
---

Line burned twice chars the edge, widens the cut and wastes machine time. laserfix finds it and writes a repaired copy of your design, so the laser burns each line once. It's the fix step after [laserlint](/tools/laserlint/)'s check.

## What it fixes

| Fix | What it does |
|---|---|
| Copies | Removes a shape that copies an earlier one, such as an outline pasted in place twice, even when it starts elsewhere or runs the other way |
| Shared line | Trims the line two shapes share from the later one, so neighboring parts, nested shapes and finger joints are cut once; curves stay curves |
| Split outlines | Joins pieces whose ends meet into one path, and closes outlines left open by a tiny gap |

It only changes hairlines of the same color, since laser software picks settings by color, and never cuts into a filled shape. What it can't fix safely, it reports with a fix: three or more ends meeting at one point, gaps too wide to close, and line shared by different colors or filled shapes.

## Example

The [tag example](https://github.com/kinglet-dev/laserfix/blob/main/examples/stacked.svg) from the repository, whose outline and hole were pasted in place twice, repaired with laserfix 0.1.0:

```text
$ laserfix stacked.svg -o stacked-fixed.svg
laserfix 0.1.0 · stacked.svg → stacked-fixed.svg · 80.0 × 60.0 mm

Changed
  Copies   2 shapes removed, 248.5 mm of line burned twice
           at (11.0, 5.0), (18.0, 30.0)

Checked again
  Line burned twice   248.5 mm → 0.0 mm
  Crossings           0 → 0

Wrote stacked-fixed.svg. Check it with: laserlint stacked-fixed.svg
```

Without `-o`, laserfix only shows what it would change. It never changes the file you give it and never replaces an existing file. It exits with 0 when nothing is left to fix, 1 when changes are needed or something was left as it is, and 2 when it can't read or write a file. Add `--json` for a machine-readable report.

## Install

laserfix is a single program for Windows, macOS and Linux, with nothing else to install.

1. Download the file for your computer from the [latest release](https://github.com/kinglet-dev/laserfix/releases/latest): `windows_amd64` for most PCs, `darwin_arm64` for Macs with Apple silicon, `darwin_amd64` for Intel Macs, and `linux_amd64` or `linux_arm64` for Linux.
2. Unpack it and run `laserfix --version` to check it works.

The programs aren't signed with an Apple or Microsoft certificate yet. On a Mac, if macOS says it can't check the program, run `xattr -d com.apple.quarantine laserfix` once; on Windows, SmartScreen may ask you to confirm the first time. Each release has a checksums file and an SBOM to verify the download.

With [Go](https://go.dev/dl/) 1.27 or later you can also run `go install github.com/kinglet-dev/laserfix/cmd/laserfix@latest`.

## Privacy

laserfix runs entirely on your computer. It never connects to the internet, and your designs never leave your machine.

## Links

- [Documentation](https://github.com/kinglet-dev/laserfix#usage): usage, flags and every fix in detail
- [Changelog](https://github.com/kinglet-dev/laserfix/blob/main/CHANGELOG.md)
- [Source](https://github.com/kinglet-dev/laserfix) (MIT license)
- [Security policy](https://github.com/kinglet-dev/laserfix/blob/main/SECURITY.md): how to report a vulnerability
