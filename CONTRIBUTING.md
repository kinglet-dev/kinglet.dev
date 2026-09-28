# Contributing

Thanks for your interest in kinglet.dev.

## Before you start

- **Open an issue first** for anything beyond a typo fix, so we can agree on
  the change before you spend time on it.
- **Security problems:** don't open an issue; follow [SECURITY.md](SECURITY.md).

## Contributor License Agreement

Outside contributions can only be merged after the contributor signs a
Contributor License Agreement (CLA). The CLA process is not set up yet, so pull
requests from outside contributors can't be merged for now. Issues, bug reports
and suggestions are very welcome in the meantime.

## How changes are made

- Work on a branch named after the change (e.g. `feature/<short-name>`), never
  directly on `main`.
- Write the check first. Behaviour of the built site is covered by
  `scripts/check-site.sh`: add a check that fails, then make the change that
  makes it pass.
- Keep each commit to one change, with the checks that cover it, and make sure
  `bash scripts/check-site.sh public` passes at every commit.
- Commit messages: a short imperative subject (72 characters at most), a blank
  line, then why the change was made.
- Don't commit secrets, personal data, local file paths, or build output
  (`public/`, `resources/`, `.cache/`).
- New dependencies, fonts or images must use a licence that allows unrestricted
  commercial use (MIT, Apache 2.0, BSD, ISC; SIL OFL 1.1 for fonts). Mention the
  licence in the pull request.

## Design rules

The site follows WCAG 2.2 AA (text contrast at least 4.5:1, visible focus,
24 px minimum targets), works from 320 px wide in light and dark mode, loads no
third-party scripts, fonts or trackers, and uses the colour tokens in
`assets/css/main.css` rather than one-off values.
