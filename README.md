# Torah Scroll Navigator

Standalone GitHub Pages site for locating Torah references in the
standard `245`-column / `42`-line tikkun layout.

Live site:

- [https://doronlevy6.github.io/torah-scroll-navigator/](https://doronlevy6.github.io/torah-scroll-navigator/)

## What It Does

- Search by parashah: `יתרו`
- Search by parashah number: `17`
- Search by book + chapter: `בראשית ג`
- Search by book + chapter + verse: `במדבר כב ב`
- Search by direct column: `עמודה 81`
- Search by Torah words: `והנחש היה ערום`
- Show estimated scroll distance forward/backward
- Show source and target columns with local tikkun images
- Open a large column viewer with zoom, swipe, and next/previous navigation

## Project Layout

```text
torah-scroll-navigator/
├── index.html                  # static app shell
├── app.js                      # search, navigation, viewer logic
├── styles.css                  # responsive UI, iPhone-friendly layout
├── data/
│   └── navigator_data.json     # site-ready search/index data
├── columns/                    # 245 local tikkun column images
├── source-data/torah_scroll/   # raw Torah text + layout sources
├── tools/                      # scripts to build/update the data
└── docs/                       # notes about navigation and structure
```

More detail:

- [docs/project-structure.md](./docs/project-structure.md)
- [docs/torah-scroll-navigation.md](./docs/torah-scroll-navigation.md)

## Data Sources

- Torah text by chapter and verse: Hebrew Wikisource
- Layout anchors for the `245/42` tikkun: Ahavat Ivrit

## Local Preview

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173/`.
