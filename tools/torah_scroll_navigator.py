#!/usr/bin/env python3
"""Locate Torah passages in a 245-column / 42-line tikkun layout.

The script downloads two local datasets:
1. Torah text by book/chapter/verse from Hebrew Wikisource.
2. Parashah + aliyah anchors for the 245/42 layout from Ahavat Ivrit.

It then estimates the column for any Torah reference and computes scroll
distance between two locations.
"""

from __future__ import annotations

import argparse
import html
import json
import math
import re
import sys
import unicodedata
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "torah_scroll"
LAYOUT_PATH = DATA_DIR / "scroll_layout_245.json"
TEXT_PATH = DATA_DIR / "torah_text_he.json"
VERSE_POSITIONS_PATH = DATA_DIR / "verse_positions_245.json"

LINES_PER_COLUMN = 42
TOTAL_COLUMNS = 245
TOTAL_LINES = TOTAL_COLUMNS * LINES_PER_COLUMN

MASTER_PARASHAH_URL = "http://ahavativrit.com/Ahavat_Ivrit-WHERE-IS-MY-PARSHA.html"
AHAVAT_BASE = "http://ahavativrit.com/"
WIKISOURCE_RAW_URL = "https://he.wikisource.org/w/index.php?title={title}&action=raw"
WIKISOURCE_PARSE_URL = "https://he.wikisource.org/w/api.php?action=parse&page={page}&prop=text&format=json"
USER_AGENT = "Mozilla/5.0 (Codex Torah Scroll Navigator)"

BOOKS = [
    {"he": "בראשית", "en": "Genesis", "chapters": 50},
    {"he": "שמות", "en": "Exodus", "chapters": 40},
    {"he": "ויקרא", "en": "Leviticus", "chapters": 27},
    {"he": "במדבר", "en": "Numbers", "chapters": 36},
    {"he": "דברים", "en": "Deuteronomy", "chapters": 34},
]

BOOK_ALIASES = {
    "בראשית": "בראשית",
    "bereishit": "בראשית",
    "bereshit": "בראשית",
    "genesis": "בראשית",
    "שמות": "שמות",
    "shemot": "שמות",
    "exodus": "שמות",
    "ויקרא": "ויקרא",
    "vayikra": "ויקרא",
    "leviticus": "ויקרא",
    "במדבר": "במדבר",
    "bamidbar": "במדבר",
    "numbers": "במדבר",
    "דברים": "דברים",
    "devarim": "דברים",
    "deuteronomy": "דברים",
}

PARASHAH_ALIASES = {
    "תולדות": "תולדת",
    "קדושים": "קדשים",
    "פינחס": "פנחס",
    "שופטים": "שפטים",
    "ניצבים": "נצבים",
    "בהעלותך": "בהעלתך",
    "לךלך": "לך לך",
    "לךלכה": "לך לך",
    "ללך": "לך לך",
    "ויקהלפקודי": "ויקהל",
}


@dataclass(frozen=True)
class ResolvedLocation:
    kind: str
    label: str
    key: str
    column_float: float
    column: int
    line_float: float
    exact: bool
    detail: str


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": USER_AGENT})
    with urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8")


def fetch_ahavat(path: str) -> str:
    return fetch_text(AHAVAT_BASE + path)


def fetch_wikisource_raw(title: str) -> str:
    return fetch_text(WIKISOURCE_RAW_URL.format(title=quote(title)))


def fetch_wikisource_parse(page: str) -> str:
    payload = fetch_text(WIKISOURCE_PARSE_URL.format(page=quote(page)))
    return json.loads(payload)["parse"]["text"]["*"]


def strip_diacritics(text: str) -> str:
    normalized = unicodedata.normalize("NFKD", text)
    return "".join(ch for ch in normalized if not unicodedata.combining(ch))


def normalize_spaces(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def normalize_hebrew_text(text: str) -> str:
    cleaned = strip_diacritics(text)
    cleaned = cleaned.replace("־", " ")
    cleaned = cleaned.replace("-", " ")
    cleaned = re.sub(r"[\"'׳״:;,.!?()\[\]{}<>|/\\]", " ", cleaned)
    cleaned = re.sub(r"[^A-Za-z\u05d0-\u05ea0-9\s]", " ", cleaned)
    return normalize_spaces(cleaned)


def normalize_key(text: str) -> str:
    cleaned = normalize_hebrew_text(text).lower()
    cleaned = cleaned.replace("פרשת ", "")
    cleaned = cleaned.replace("פרשה ", "")
    cleaned = cleaned.replace("parashat ", "")
    cleaned = cleaned.replace("parasha ", "")
    cleaned = cleaned.replace("parsha ", "")
    cleaned = normalize_spaces(cleaned)
    cleaned = PARASHAH_ALIASES.get(cleaned, cleaned)
    return cleaned


def word_count(text: str) -> int:
    normalized = normalize_hebrew_text(text)
    return len(normalized.split()) if normalized else 0


def to_hebrew_numeral(number: int) -> str:
    if number <= 0:
        raise ValueError("Hebrew numerals only support positive integers")

    values = [
        (400, "ת"),
        (300, "ש"),
        (200, "ר"),
        (100, "ק"),
        (90, "צ"),
        (80, "פ"),
        (70, "ע"),
        (60, "ס"),
        (50, "נ"),
        (40, "מ"),
        (30, "ל"),
        (20, "כ"),
        (10, "י"),
        (9, "ט"),
        (8, "ח"),
        (7, "ז"),
        (6, "ו"),
        (5, "ה"),
        (4, "ד"),
        (3, "ג"),
        (2, "ב"),
        (1, "א"),
    ]

    result: list[str] = []
    remaining = number

    while remaining >= 400:
        result.append("ת")
        remaining -= 400

    if remaining == 15:
        result.extend(["ט", "ו"])
        remaining = 0
    elif remaining == 16:
        result.extend(["ט", "ז"])
        remaining = 0

    for value, letter in values:
        while remaining >= value:
            result.append(letter)
            remaining -= value

    return "".join(result)


def parse_hebrew_number(token: str) -> int | None:
    cleaned = normalize_spaces(token)
    cleaned = cleaned.replace("'", "")
    cleaned = cleaned.replace('"', "")
    cleaned = cleaned.replace("׳", "")
    cleaned = cleaned.replace("״", "")

    if cleaned.isdigit():
        return int(cleaned)

    values = {
        "א": 1,
        "ב": 2,
        "ג": 3,
        "ד": 4,
        "ה": 5,
        "ו": 6,
        "ז": 7,
        "ח": 8,
        "ט": 9,
        "י": 10,
        "כ": 20,
        "ך": 20,
        "ל": 30,
        "מ": 40,
        "ם": 40,
        "נ": 50,
        "ן": 50,
        "ס": 60,
        "ע": 70,
        "פ": 80,
        "ף": 80,
        "צ": 90,
        "ץ": 90,
        "ק": 100,
        "ר": 200,
        "ש": 300,
        "ת": 400,
    }

    if not cleaned or any(ch not in values for ch in cleaned):
        return None

    return sum(values[ch] for ch in cleaned)


def chapter_title(book_he: str, chapter_number: int) -> str:
    return f"{book_he}_{to_hebrew_numeral(chapter_number)}"


def parse_master_parashah_page() -> list[dict]:
    html_text = fetch_ahavat("Ahavat_Ivrit-WHERE-IS-MY-PARSHA.html")
    pattern = re.compile(
        r'<li><a href="(Parsha_(\d+)_.*?_245\.html)">([^<]+?)\s*-\s*([^<]+)</a></li>'
    )

    parashot = []
    for href, order, english_name, hebrew_name in pattern.findall(html_text):
        order_num = int(order)
        book_index = 0
        if order_num >= 44:
            book_index = 4
        elif order_num >= 34:
            book_index = 3
        elif order_num >= 24:
            book_index = 2
        elif order_num >= 13:
            book_index = 1

        book = BOOKS[book_index]
        hebrew_display = normalize_spaces(html.unescape(hebrew_name))
        english_display = normalize_spaces(html.unescape(english_name))
        parashot.append(
            {
                "order": order_num,
                "href": href,
                "name_he_display": hebrew_display,
                "name_he": normalize_hebrew_text(hebrew_display),
                "name_en": english_display,
                "name_en_key": normalize_key(english_display),
                "book_he": book["he"],
                "book_en": book["en"],
            }
        )

    parashot.sort(key=lambda item: item["order"])
    return parashot


def parse_parashah_page(parashah: dict) -> dict:
    html_text = fetch_ahavat(parashah["href"])
    blocks = re.findall(r"<li><h4><a href=.*?</li>", html_text, re.S)

    aliyot = []
    for index, block in enumerate(blocks, start=1):
        column_match = re.search(r"Begins in Column .*?>(\d+)</a> on/within Line #(\d+)", block)
        hebrew_match = re.search(r'<p dir="rtl" lang="he">"(.+?)"\s*</p>', block, re.S)
        verse_match = re.search(r"([A-Za-z]+)\s+(\d+):(\d+)\)</li>", block)
        label_match = re.search(r"<h4><a [^>]+>([^<]+)</a></h4>", block)

        if not (column_match and hebrew_match and verse_match and label_match):
            raise ValueError(f"Failed to parse aliyah block for {parashah['name_he']}")

        column = int(column_match.group(1))
        line = int(column_match.group(2))
        start_words = normalize_spaces(html.unescape(hebrew_match.group(1)).strip('"'))
        label = normalize_spaces(html.unescape(label_match.group(1)))
        english_book = verse_match.group(1)
        chapter = int(verse_match.group(2))
        verse = int(verse_match.group(3))

        aliyot.append(
            {
                "index": index,
                "label": label,
                "column": column,
                "line": line,
                "line_absolute": (column - 1) * LINES_PER_COLUMN + (line - 1),
                "start_words_he": start_words,
                "book_en_ref": english_book,
                "book_he": parashah["book_he"],
                "chapter": chapter,
                "verse": verse,
                "verse_key": verse_key(parashah["book_he"], chapter, verse),
            }
        )

    range_match = re.search(r"found within Columns:\s*(.*?)</p>", html_text, re.S)
    columns_in_parashah: list[int] = []
    if range_match:
        columns_in_parashah = sorted(
            {
                int(number)
                for number in re.findall(
                    r"Sefer_Torah_Col_(\d{3})_of_245\.html", range_match.group(1)
                )
            }
        )

    return {
        **parashah,
        "columns": columns_in_parashah,
        "start_column": aliyot[0]["column"],
        "start_line": aliyot[0]["line"],
        "start_verse_key": aliyot[0]["verse_key"],
        "aliyot": aliyot,
        "source_url": AHAVAT_BASE + parashah["href"],
    }


def parse_chapter_verses(book_he: str, chapter_number: int) -> list[str]:
    html_text = fetch_wikisource_parse(chapter_title(book_he, chapter_number))
    positions = list(re.finditer(r'<span id="([^"]+)"></span>', html_text))

    verses = []
    for index, marker in enumerate(positions):
        verse_id = marker.group(1)
        if "&#95;" not in verse_id:
            continue

        start = marker.end()
        end = positions[index + 1].start() if index + 1 < len(positions) else len(html_text)
        chunk = html_text[start:end]
        chunk = chunk.split('<span style="white-space: nowrap; float: left; margin-left: -2em;">', 1)[0]
        chunk = chunk.split("</p>", 1)[0]
        chunk = re.sub(r"<[^>]+>", "", chunk)
        chunk = normalize_spaces(html.unescape(chunk))
        if chunk:
            verses.append(chunk)

    return verses


def build_torah_text() -> dict:
    books_payload = []
    for book in BOOKS:
        chapters_payload = []
        for chapter_number in range(1, book["chapters"] + 1):
            verses = parse_chapter_verses(book["he"], chapter_number)
            chapters_payload.append(
                {
                    "chapter": chapter_number,
                    "verses": verses,
                }
            )

        books_payload.append(
            {
                "book_he": book["he"],
                "book_en": book["en"],
                "chapters": chapters_payload,
            }
        )

    return {
        "source": "Hebrew Wikisource",
        "books": books_payload,
    }


def verse_key(book_he: str, chapter: int, verse: int) -> str:
    return f"{book_he}:{chapter}:{verse}"


def build_scroll_layout() -> dict:
    parashot_meta = parse_master_parashah_page()
    parashot = [parse_parashah_page(parashah) for parashah in parashot_meta]

    return {
        "source": "Ahavat Ivrit / Love of Hebrew",
        "layout": {
            "columns": TOTAL_COLUMNS,
            "lines_per_column": LINES_PER_COLUMN,
        },
        "parashot": parashot,
    }


def iter_verses(text_payload: dict) -> Iterable[dict]:
    for book in text_payload["books"]:
        for chapter in book["chapters"]:
            for verse_number, verse_text in enumerate(chapter["verses"], start=1):
                yield {
                    "book_he": book["book_he"],
                    "book_en": book["book_en"],
                    "chapter": chapter["chapter"],
                    "verse": verse_number,
                    "key": verse_key(book["book_he"], chapter["chapter"], verse_number),
                    "text": verse_text,
                    "normalized": normalize_hebrew_text(verse_text),
                    "words": word_count(verse_text),
                }


def build_verse_positions(text_payload: dict, layout_payload: dict) -> dict:
    verses = list(iter_verses(text_payload))
    verse_lookup = {verse["key"]: verse for verse in verses}

    word_offset = 0
    for verse in verses:
        verse["word_offset"] = word_offset
        word_offset += verse["words"]

    anchors = []
    parashah_starts = []
    for parashah in layout_payload["parashot"]:
        first_aliyah = parashah["aliyot"][0]
        parashah_starts.append(
            {
                "order": parashah["order"],
                "name_he": parashah["name_he"],
                "name_he_display": parashah["name_he_display"],
                "verse_key": first_aliyah["verse_key"],
            }
        )

        for aliyah in parashah["aliyot"]:
            verse = verse_lookup.get(aliyah["verse_key"])
            if verse is None:
                raise ValueError(f"Missing verse text for anchor {aliyah['verse_key']}")

            anchors.append(
                {
                    "verse_key": aliyah["verse_key"],
                    "verse_index": verses.index(verse),
                    "word_offset": verse["word_offset"],
                    "line_absolute": aliyah["line_absolute"],
                    "column": aliyah["column"],
                    "line": aliyah["line"],
                    "parashah_order": parashah["order"],
                    "parashah_name_he": parashah["name_he"],
                    "aliyah_label": aliyah["label"],
                }
            )

    anchors.sort(key=lambda item: item["verse_index"])
    parashah_starts.sort(key=lambda item: verse_lookup[item["verse_key"]]["word_offset"])

    end_anchor = {
        "verse_key": "__END__",
        "verse_index": len(verses),
        "word_offset": word_offset,
        "line_absolute": TOTAL_LINES - 1,
        "column": TOTAL_COLUMNS,
        "line": LINES_PER_COLUMN,
        "parashah_order": layout_payload["parashot"][-1]["order"],
        "parashah_name_he": layout_payload["parashot"][-1]["name_he"],
        "aliyah_label": "END",
    }

    anchors_with_end = anchors + [end_anchor]
    anchor_index = 0
    parashah_index = 0
    verse_positions = []

    parashah_start_indices = [
        {
            **item,
            "verse_index": next(
                idx for idx, verse in enumerate(verses) if verse["key"] == item["verse_key"]
            ),
        }
        for item in parashah_starts
    ]

    for verse_index, verse in enumerate(verses):
        while anchor_index + 1 < len(anchors_with_end) and anchors_with_end[anchor_index + 1]["verse_index"] <= verse_index:
            anchor_index += 1

        while (
            parashah_index + 1 < len(parashah_start_indices)
            and parashah_start_indices[parashah_index + 1]["verse_index"] <= verse_index
        ):
            parashah_index += 1

        lower = anchors_with_end[anchor_index]
        upper = anchors_with_end[anchor_index + 1] if anchor_index + 1 < len(anchors_with_end) else end_anchor
        parashah_info = parashah_start_indices[parashah_index]

        if verse_index == lower["verse_index"]:
            line_absolute = float(lower["line_absolute"])
            exact = True
            method = "anchor"
        else:
            lower_words = lower["word_offset"]
            upper_words = upper["word_offset"]
            current_words = verse["word_offset"]

            if upper_words <= lower_words:
                line_absolute = float(lower["line_absolute"])
                exact = False
                method = "fallback"
            else:
                ratio = (current_words - lower_words) / (upper_words - lower_words)
                line_absolute = lower["line_absolute"] + ratio * (upper["line_absolute"] - lower["line_absolute"])
                exact = False
                method = "interpolated"

        column_float = (line_absolute / LINES_PER_COLUMN) + 1
        line_float = (line_absolute % LINES_PER_COLUMN) + 1
        column = min(max(int(math.floor(column_float)), 1), TOTAL_COLUMNS)

        verse_positions.append(
            {
                "key": verse["key"],
                "book_he": verse["book_he"],
                "book_en": verse["book_en"],
                "chapter": verse["chapter"],
                "verse": verse["verse"],
                "text": verse["text"],
                "column_float": round(column_float, 4),
                "column": column,
                "line_float": round(line_float, 4),
                "exact": exact,
                "method": method,
                "parashah_order": parashah_info["order"],
                "parashah_name_he": parashah_info["name_he"],
                "parashah_name_he_display": parashah_info["name_he_display"],
            }
        )

    return {
        "layout": {
            "columns": TOTAL_COLUMNS,
            "lines_per_column": LINES_PER_COLUMN,
        },
        "anchors": anchors,
        "verses": verse_positions,
    }


def save_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def build_all(force: bool = False) -> None:
    if not force and LAYOUT_PATH.exists() and TEXT_PATH.exists() and VERSE_POSITIONS_PATH.exists():
        return

    layout_payload = build_scroll_layout()
    text_payload = build_torah_text()
    verse_positions_payload = build_verse_positions(text_payload, layout_payload)

    save_json(LAYOUT_PATH, layout_payload)
    save_json(TEXT_PATH, text_payload)
    save_json(VERSE_POSITIONS_PATH, verse_positions_payload)


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def load_data(force_rebuild: bool = False) -> tuple[dict, dict, dict]:
    build_all(force=force_rebuild)
    return load_json(LAYOUT_PATH), load_json(TEXT_PATH), load_json(VERSE_POSITIONS_PATH)


def parse_reference(query: str) -> tuple[str, int, int]:
    cleaned = normalize_spaces(query)
    cleaned = cleaned.replace(":", " ")
    cleaned = cleaned.replace(".", " ")
    parts = cleaned.split()

    if len(parts) < 2:
        raise ValueError("Reference must include a book and at least a chapter")

    book_token = normalize_key(parts[0])
    book_he = BOOK_ALIASES.get(book_token)
    if not book_he:
        raise ValueError(f"Unknown book: {parts[0]}")

    chapter = parse_hebrew_number(parts[1])
    verse = parse_hebrew_number(parts[2]) if len(parts) >= 3 else 1

    if chapter is None or verse is None:
        raise ValueError(f"Could not parse chapter/verse from: {query}")

    return book_he, chapter, verse


def find_parashah(query: str, layout_payload: dict) -> dict | None:
    key = normalize_key(query)
    if not key:
        return None

    if key.isdigit():
        order = int(key)
        return next((item for item in layout_payload["parashot"] if item["order"] == order), None)

    key = PARASHAH_ALIASES.get(key, key)
    for parashah in layout_payload["parashot"]:
        candidates = {
            normalize_key(parashah["name_he"]),
            normalize_key(parashah["name_he_display"]),
            normalize_key(parashah["name_en"]),
        }
        if key in candidates:
            return parashah
    return None


def find_column_query(query: str) -> int | None:
    match = re.fullmatch(r"(?:עמודה|עמוד|col|column|#)\s*(\d{1,3})", normalize_key(query))
    if not match:
        return None

    value = int(match.group(1))
    if 1 <= value <= TOTAL_COLUMNS:
        return value
    return None


def resolve_query(query: str, layout_payload: dict, verse_positions_payload: dict) -> ResolvedLocation:
    column_number = find_column_query(query)
    if column_number is not None:
        return ResolvedLocation(
            kind="column",
            label=f"עמודה {column_number}",
            key=f"column:{column_number}",
            column_float=float(column_number),
            column=column_number,
            line_float=1.0,
            exact=True,
            detail="עמודה ידנית",
        )

    parashah = find_parashah(query, layout_payload)
    if parashah:
        return ResolvedLocation(
            kind="parashah",
            label=f"פרשת {parashah['name_he_display']}",
            key=f"parashah:{parashah['order']}",
            column_float=float(parashah["start_column"]),
            column=parashah["start_column"],
            line_float=float(parashah["start_line"]),
            exact=True,
            detail=f"פרשה #{parashah['order']}",
        )

    book_he, chapter, verse = parse_reference(query)
    key = verse_key(book_he, chapter, verse)
    verse_position = next((item for item in verse_positions_payload["verses"] if item["key"] == key), None)
    if verse_position is None:
        raise ValueError(f"Reference not found in Torah text: {query}")

    return ResolvedLocation(
        kind="verse",
        label=f"{book_he} {chapter}:{verse}",
        key=key,
        column_float=verse_position["column_float"],
        column=verse_position["column"],
        line_float=verse_position["line_float"],
        exact=bool(verse_position["exact"]),
        detail=(
            f"{verse_position['parashah_name_he_display']} | "
            f"{'מדויק' if verse_position['exact'] else 'משוער'}"
        ),
    )


def format_location(location: ResolvedLocation) -> str:
    precision = "מדויק" if location.exact else "משוער"
    line_display = (
        f"{int(round(location.line_float))}"
        if location.exact
        else f"{location.line_float:.1f}"
    )
    column_display = (
        f"{location.column}"
        if location.exact and abs(location.column_float - location.column) < 1e-9
        else f"{location.column_float:.2f}"
    )
    return (
        f"{location.label}: עמודה {column_display}, שורה {line_display} "
        f"({precision}; {location.detail})"
    )


def format_distance(current: ResolvedLocation, target: ResolvedLocation) -> str:
    delta = target.column_float - current.column_float
    if abs(delta) < 0.25:
        return "היעד כמעט באותה עמודה, צריך גלילה קטנה מאוד."

    direction = "קדימה" if delta > 0 else "אחורה"
    return f"צריך לגלול בערך {abs(delta):.1f} עמודות {direction}."


def print_single(location: ResolvedLocation) -> None:
    print(format_location(location))


def print_compare(current: ResolvedLocation, target: ResolvedLocation) -> None:
    print("מיקום נוכחי")
    print(format_location(current))
    print()
    print("יעד")
    print(format_location(target))
    print()
    print(format_distance(current, target))


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Locate Torah references in the 245-column / 42-line tikkun layout. "
            "Pass one query to locate it, or two queries to compare scroll distance."
        )
    )
    parser.add_argument(
        "queries",
        nargs="*",
        help=(
            'Examples: "יתרו", "17", "בראשית ג", "במדבר כב ב", '
            '"עמודה 81"'
        ),
    )
    parser.add_argument(
        "--rebuild",
        action="store_true",
        help="Re-download and rebuild the local datasets before answering.",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    args = parse_args(argv or sys.argv[1:])

    if not args.queries:
        print(
            'Usage examples:\n'
            '  python scripts/torah_scroll_navigator.py "בראשית ג"\n'
            '  python scripts/torah_scroll_navigator.py "בראשית ג" "במדבר כב"\n'
            '  python scripts/torah_scroll_navigator.py "עמודה 44" "יתרו"'
        )
        return 0

    try:
        layout_payload, _, verse_positions_payload = load_data(force_rebuild=args.rebuild)
        resolved = [resolve_query(query, layout_payload, verse_positions_payload) for query in args.queries]
    except (HTTPError, URLError, TimeoutError) as exc:
        print(f"Network error while building Torah datasets: {exc}", file=sys.stderr)
        return 1
    except ValueError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    if len(resolved) == 1:
        print_single(resolved[0])
        return 0

    if len(resolved) == 2:
        print_compare(resolved[0], resolved[1])
        return 0

    print("Please pass one query to locate, or two queries to compare.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
