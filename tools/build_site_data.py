#!/usr/bin/env python3
"""Build the compact site data bundle used by the static app."""

from __future__ import annotations

import json
import math
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "source-data" / "torah_scroll"
OUTPUT_PATH = ROOT / "data" / "navigator_data.json"
TOTAL_COLUMNS = 245


def load_json(name: str) -> dict:
    return json.loads((SOURCE_DIR / name).read_text(encoding="utf-8"))


def ref_label(verse: dict) -> str:
    return f"{verse['book_he']} {verse['chapter']}:{verse['verse']}"


def unique_ordered(items: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            out.append(item)
    return out


def build_column_summaries(verses: list[dict]) -> list[dict]:
    buckets: dict[int, list[dict]] = {column: [] for column in range(1, TOTAL_COLUMNS + 1)}

    for index, verse in enumerate(verses):
        start = float(verse["column_float"])
        end = (
            float(verses[index + 1]["column_float"])
            if index + 1 < len(verses)
            else float(TOTAL_COLUMNS + 1)
        )

        first_column = max(1, int(math.floor(start)))
        last_column = min(TOTAL_COLUMNS, int(math.ceil(end) - 1))
        for column in range(first_column, last_column + 1):
            buckets[column].append(verse)

    summaries = []
    for column in range(1, TOTAL_COLUMNS + 1):
        verses_in_column = buckets[column]
        if not verses_in_column:
            continue

        first = verses_in_column[0]
        last = verses_in_column[-1]
        parashot = unique_ordered([verse["parashah_name_he_display"] for verse in verses_in_column])
        books = unique_ordered([verse["book_he"] for verse in verses_in_column])
        chapters = unique_ordered([str(verse["chapter"]) for verse in verses_in_column])

        summaries.append(
            {
                "column": column,
                "books": books,
                "parashot": parashot,
                "first_ref": ref_label(first),
                "last_ref": ref_label(last),
                "first_book": first["book_he"],
                "first_chapter": first["chapter"],
                "first_verse": first["verse"],
                "last_book": last["book_he"],
                "last_chapter": last["chapter"],
                "last_verse": last["verse"],
                "chapters": chapters,
            }
        )

    return summaries


def main() -> None:
    layout = load_json("scroll_layout_245.json")
    verse_positions = load_json("verse_positions_245.json")

    payload = {
        "layout": layout["layout"],
        "parashot": [
            {
                "order": item["order"],
                "name_he": item["name_he"],
                "name_display": item["name_he_display"],
                "name_en": item["name_en"],
                "column": item["start_column"],
                "line": item["start_line"],
            }
            for item in layout["parashot"]
        ],
        "verses": [
            [
                item["book_he"],
                item["chapter"],
                item["verse"],
                item["text"],
                item["column_float"],
                item["column"],
                item["line_float"],
                item["exact"],
                item["parashah_name_he_display"],
            ]
            for item in verse_positions["verses"]
        ],
        "columns": build_column_summaries(verse_positions["verses"]),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    print(OUTPUT_PATH)


if __name__ == "__main__":
    main()
