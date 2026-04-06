# Project Structure

This project is fully isolated from `benson` and lives in its own folder:

`/Users/dwrwnlwy/projects/torah-scroll-navigator`

## Diagram

```text
torah-scroll-navigator/
├── index.html
├── app.js
├── styles.css
├── .nojekyll
├── README.md
├── data/
│   └── navigator_data.json
├── columns/
│   ├── Torah_Scroll_Col_001_of_245.jpg
│   ├── ...
│   └── Torah_Scroll_Col_245_of_245.jpg
├── docs/
│   ├── project-structure.md
│   └── torah-scroll-navigation.md
├── source-data/
│   └── torah_scroll/
│       ├── scroll_layout_245.json
│       ├── torah_text_he.json
│       └── verse_positions_245.json
└── tools/
    ├── build_site_data.py
    └── torah_scroll_navigator.py
```

## What Each Part Contains

- `index.html`
  The static page layout: search boxes, result area, word search, and the large column viewer.

- `app.js`
  The client-side logic. It loads the data, resolves parashah or verse queries, calculates how many columns to scroll, runs word search, and drives the large viewer.

- `styles.css`
  All visual styling and responsiveness, including the iPhone layout, enlarged viewer, swipe-friendly stage, and compact cards.

- `data/navigator_data.json`
  The ready-to-use dataset for the website. It includes parashot, verses, and per-column summaries so the site can search quickly without server code.

- `columns/`
  The local images of all `245` tikkun columns. These are what the site shows in preview and in the zoomable viewer.

- `source-data/torah_scroll/`
  The raw source files used to build the site dataset:
  - `torah_text_he.json`: Torah text by book/chapter/verse
  - `scroll_layout_245.json`: parashah and layout anchors
  - `verse_positions_245.json`: estimated verse placement in the `245/42` format

- `tools/build_site_data.py`
  Rebuilds `data/navigator_data.json` from the raw source data.

- `tools/torah_scroll_navigator.py`
  The original local command-line helper for resolving references and scroll distance.

- `docs/torah-scroll-navigation.md`
  Notes about the navigation model and how references map into the tikkun layout.

## Friendly Flow

The app is designed around four simple actions:

1. Write where you are.
2. Write where you want to go.
3. See how many columns to scroll.
4. Open the source or target column large, zoom in, and move to nearby columns easily.

There is also a separate word search path:

1. Write a few Torah words.
2. Pick the matching verse.
3. Open its column or use it as the target.
