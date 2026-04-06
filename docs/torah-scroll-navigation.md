# Torah Scroll Navigation

Local CLI for estimating where a Torah reference lands in the standard
`245`-column / `42`-line tikkun layout and how far to scroll from one
location to another.

## Data Sources

- Hebrew Torah text by `book/chapter/verse`: Hebrew Wikisource
- Parashah + aliyah anchor positions for the `245/42` layout: Ahavat Ivrit

The tool stores downloaded data in:

- `data/torah_scroll/torah_text_he.json`
- `data/torah_scroll/scroll_layout_245.json`
- `data/torah_scroll/verse_positions_245.json`

## Usage

Locate one reference:

```bash
python3 scripts/torah_scroll_navigator.py "בראשית ג"
```

Compare two locations:

```bash
python3 scripts/torah_scroll_navigator.py "בראשית ג" "במדבר כב"
python3 scripts/torah_scroll_navigator.py "עמודה 44" "יתרו"
python3 scripts/torah_scroll_navigator.py "17" "שמות כ"
```

Force a fresh rebuild of the local datasets:

```bash
python3 scripts/torah_scroll_navigator.py --rebuild "בראשית ג" "במדבר כב"
```

## Supported Queries

- Parashah name in Hebrew: `יתרו`
- Parashah order number: `17`
- Book + chapter: `בראשית ג`
- Book + chapter + verse: `במדבר כב ב`
- Direct column: `עמודה 81`

## Notes

- Parashah starts and aliyah anchors are exact.
- Most chapter/verse lookups are estimated by interpolating between exact
  aliyah anchors, so the result is best read as an approximate scroll
  distance in columns.
- The first build downloads source data and may take a few minutes. Later
  runs are local and much faster.
