# Hebcal Readings

## מקור רשמי

- Hebcal Developer APIs: https://www.hebcal.com/home/developer-apis
- Leyning API package/docs: https://hebcal.github.io/api/leyning/

## Endpoint רלוונטי

```text
https://www.hebcal.com/leyning?cfg=json&start=YYYY-MM-DD&end=YYYY-MM-DD&i=on&triennial=off
```

## חשוב

- לפריסת ישראל משתמשים ב־`i=on`
- לא להשתמש כאן ב־`il=on`
- `summary` יכול לכלול גם קטעים שאינם תורה, למשל `Song of Songs`
- למיפוי שלנו לוקחים רק חלקים מחמשת חומשי תורה

## שליפה למודל אחר

1. חשב את התאריך של היום לפי `Asia/Jerusalem`
2. משוך חלון תאריכים סביב היום, למשל `today - 21 days` עד `today + 21 days`
3. קרא את `items`
4. מכל item:
   - אם יש `summaryParts`, קח רק חלקים שהשדה `k` שלהם הוא אחד מ:
     - `Genesis`
     - `Exodus`
     - `Leviticus`
     - `Numbers`
     - `Deuteronomy`
   - אם אין `summaryParts`, השתמש ב־`weekday` או `fullkriyah`
5. הפק:
   - `start` = תחילת החלק הראשון
   - `end` = סוף החלק האחרון
6. קבע:
   - `previous_reading` = הפריט האחרון ש־`item.date <= today`
   - `next_reading` = הפריט הראשון ש־`item.date > today`

## שדות להחזיר

```json
{
  "previous_reading": {
    "date": "2026-04-06",
    "name": "פֶּסַח ה׳ (חוה״מ)",
    "start": { "book": "שמות", "chapter": 34, "verse": 1 },
    "end": { "book": "במדבר", "chapter": 28, "verse": 25 }
  },
  "next_reading": {
    "date": "2026-04-07",
    "name": "פֶּסַח ו׳ (חוה״מ)",
    "start": { "book": "במדבר", "chapter": 9, "verse": 1 },
    "end": { "book": "במדבר", "chapter": 28, "verse": 25 }
  }
}
```

## מיפוי לאתר הזה

1. המר כל `book/chapter/verse` למפתח מקומי בפורמט:
   - `book:chapter:verse`
2. חפש אותו בתוך `navigatorData.verseByKey`
3. קח:
   - `columnFloat`
   - `column`
   - `lineFloat`
4. חישוב גלילה:
   - `scrollColumns = next_reading.start.columnFloat - previous_reading.end.columnFloat`

## דוגמה חיה

לתאריך `2026-04-06` בישראל:

- `previous_reading`: `פֶּסַח ה׳ (חוה״מ)` בתאריך `2026-04-06`
- `next_reading`: `פֶּסַח ו׳ (חוה״מ)` בתאריך `2026-04-07`
