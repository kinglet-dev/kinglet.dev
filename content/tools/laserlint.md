---
title: "laserlint"
description: "Checks an SVG before you laser it: score lines too close together, lines that cross, details too small to survive, areas packed too densely, white backgrounds that burn a frame, and line art that burns as double lines."
hero: "laserlint-hero"
heroAlt: "A coaster design goes into laserlint, which reports each check by name: a problem for lines too close, warnings for a crossing, a small detail, density and a white background, OK for line art, and the verdict: not ready to burn."
download: "https://github.com/kinglet-dev/laserlint/releases/latest"
source: "https://github.com/kinglet-dev/laserlint"
---

A burn that goes wrong costs material and machine time. laserlint reads the design the way laser software does and tells you, in plain words, what will go wrong, where, and how to fix it, before you press start.

## What it checks

| Check | What it finds |
|---|---|
| Lines too close | Score lines closer than the line width plus the gap, which merge into a smudge |
| Crossings | Lines that cross, end on another line, or sit on top of each other, which burn twice |
| Small details | Closed shapes under 0.5 mm across, which burn as dots |
| Density | The busiest 10 mm square, where heat builds up and the material chars |
| Background shape | A white shape behind the design, whose edge still gets scored |
| Line art | Thin black strokes whose two edges each get scored, so every stroke burns twice |

Each finding is a problem, a warning or information, with where it is (in mm from the top-left) and a suggested fix.

## Example

The [coaster example](https://github.com/kinglet-dev/laserlint/blob/main/examples/coaster.svg) from the repository, checked with laserlint 0.1.1:

```text
$ laserlint coaster.svg
laserlint 0.1.1 · coaster.svg · 60.0 × 60.0 mm · line 0.10 mm · gap 0.25 mm

PROBLEM  Lines too close
         38.7% of scored line is within 0.35 mm of other line, centre to centre (limit 10%); nearest 0.02 mm
         Where: (30.0, 40.0), (43.7, 24.7), (43.7, 26.2), (43.7, 27.7), (16.1, 23.9) mm from the top-left
         Fix: Space lines at least 0.35 mm apart, centre to centre, or remove fine detail; blunt or shorten very sharp points.
WARNING  Crossings
         1 place where score lines cross or one ends on another, burning twice (problem above 50)
         Where: (30.0, 40.0) mm from the top-left
         Fix: Combine overlapping shapes into one outline (Inkscape: Path → Union), or trim lines to stop where they meet.
WARNING  Small details
         1 closed shape under 0.50 mm across burns as a dot (problem above 20); smallest 0.30 mm
         Where: (30.0, 14.0) mm from the top-left
         Fix: Delete specks and slivers, or enlarge details to at least 0.50 mm across; where overlapping shapes leave slivers, combine them (Inkscape: Path → Union).
WARNING  Density
         densest 10 mm area has 1.46 mm of line per mm² (lines about 0.69 mm apart); warning above 0.9, problem above 2
         Where: (30.0, 24.5) mm from the top-left
         Fix: Simplify or spread out the busiest area, or remove fine detail there.
WARNING  Background shape
         a white background shape (60.0 × 60.0 mm) is scored around its edge like any other shape
         Where: (30.0, 30.0) mm from the top-left
         Fix: Delete it before burning; hiding it isn't enough, as laser software such as xTool Creative Space burns hidden layers too.
OK       Line art

Not ready to burn: 1 problem and 4 warnings.
```

laserlint exits with 0 when the design is ready to burn (warnings allowed), 1 when it finds problems, and 2 when it can’t check the file, so a script can stop before burning. Add `--json` for a machine-readable report.

## Install

laserlint is a single program for Windows, macOS and Linux, with nothing else to install.

1. Download the file for your computer from the [latest release](https://github.com/kinglet-dev/laserlint/releases/latest): `windows_amd64` for most PCs, `darwin_arm64` for Macs with Apple silicon, `darwin_amd64` for Intel Macs, and `linux_amd64` or `linux_arm64` for Linux.
2. Unpack it and run `laserlint --version` to check it works.

The programs aren't signed with an Apple or Microsoft certificate yet. On a Mac, if macOS says it can't check the program, run `xattr -d com.apple.quarantine laserlint` once; on Windows, SmartScreen may ask you to confirm the first time. Each release has a checksums file and an SBOM to verify the download.

With [Go](https://go.dev/dl/) 1.27 or later you can also run `go install github.com/kinglet-dev/laserlint/cmd/laserlint@latest`.

## Privacy

laserlint runs entirely on your computer. It never connects to the internet, and your designs never leave your machine.

## Links

- [Documentation](https://github.com/kinglet-dev/laserlint#usage): usage, flags and every check in detail
- [Changelog](https://github.com/kinglet-dev/laserlint/blob/main/CHANGELOG.md)
- [Source](https://github.com/kinglet-dev/laserlint) (MIT licence)
- [Security policy](https://github.com/kinglet-dev/laserlint/blob/main/SECURITY.md): how to report a vulnerability
- [Issues](https://github.com/kinglet-dev/laserlint/issues): report a bug or ask for a check
