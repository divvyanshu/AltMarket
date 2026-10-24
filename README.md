# AltMarket

Discovery and comparison for Indian alternative investments — PMS, AIF, SIF, GIFT City
and International schemes in one place, with every return set against the benchmark it
is actually measured by.

Registered entity: AltMarket · APMI AMP0005858 · AMFI ARN13934.

## Build

A single static page. `build.js` inlines the CSS, the content file and the application
modules into `index.html`:

```bash
node build.js        # writes index.html
npx serve -l 8799 .  # serve it
```

There is no bundler, no dependency install and no framework. The only runtime
requirement is a browser.

## Layout

| Path | What it holds |
|---|---|
| `build.js` | Assembles `src/*` into `index.html` |
| `src/shell.html` | Page shell with the `/*BASE_CSS*/`, `/*EXTRA_CSS*/`, `/*PAGES_JS*/`, `/*APP_JS*/` markers |
| `src/app.js` | Core app — data load, screener, filters, routing, drawer |
| `src/app-v3x.js` … | Feature modules, spliced into `app.js` at its `/*MODULES*/` marker |
| `src/pages.js` | Editorial content, the menu and firm registration details |
| `src/investors.js` | Venture investor directory (firms, not schemes) |
| `src/base.css`, `src/extra.css` | Styling |
| `funds.json` | Merged scheme data |

Modules load in the order listed in `build.js`. They share one scope, so a later module
can override an earlier function — that is how features were layered without rewriting
`app.js`. Order matters; append new modules at the end.

## Where the data comes from

Three sources, merged into `funds.json`:

- **ALTPORT** — scheme listings and, for a minority of schemes, fees, holdings and sectors
- **SEBI Portfolio Manager Monthly Report** — time-weighted returns at nine periods plus
  each scheme's own benchmark, for portfolio managers only
- **AltMarket's own sheet** — curated additions and corrections

Coverage is uneven and the app says so rather than papering over it. Returns and
benchmarks exist for most PMS and almost no AIF, because SEBI's monthly report covers
portfolio managers and not AIFs. Sector and holdings data exist for roughly thirty
schemes. The consistency score is only computed where at least four periods carry both a
return and a benchmark.

## Things worth knowing before changing anything

- **Performance shown is not verified by SEBI.** That line is required and appears site-wide.
- **Returns are TWRR**, annualised beyond one year, and are always paired with the
  scheme's own benchmark. Do not display one without the other.
- **Implausible filed figures are flagged, not silently corrected.** Some managers file
  values that cannot be right for the product; those are marked and demoted in rankings.
- **Venture firms are not schemes.** The entries in `investors.js` are investment firms.
  They are deliberately excluded from Explore, Compare and the league tables, because
  IRR/DPI/TVPI cannot sit in a TWRR column. No fund names, sizes, minimums or terms
  appear on any public page — AIFs are privately placed.

## Status

Pre-launch. Outstanding before going public: compliance review of the disclaimer and any
performance claims, confirmation that the commission-disclosure wording matches the
actual arrangement, a licence check on third-party directory data, and manager
biographies, which are placeholders.
