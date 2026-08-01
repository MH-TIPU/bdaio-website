/**
 * A small CSV reader for the score importer.
 *
 * Hand-written rather than adding a dependency: organisers will hand us files
 * saved by Excel, Google Sheets and LibreOffice, and the only awkward part of
 * that is quoted fields containing commas, quotes or newlines — about thirty
 * lines of work. A parser is also exactly the kind of thing that should be
 * readable when a file fails to import at 1am.
 *
 * A plain module (no `server-only`) so the same parsing rules are available to a
 * future client-side preview.
 */

/** Splits CSV text into rows of cells, honouring RFC4180 quoting. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  // Strip a UTF-8 BOM: Excel writes one, and it would otherwise become part of
  // the first header name and break the column lookup.
  const input = text.replace(/^﻿/, "");

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (inQuotes) {
      if (char === '"') {
        // A doubled quote inside a quoted field is a literal quote.
        if (input[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char === "\r") {
      // Swallow CR; the following LF ends the row (CRLF files).
    } else {
      cell += char;
    }
  }

  // A file not ending in a newline still has a final row.
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  // Drop rows that are entirely empty — trailing blank lines are extremely
  // common in spreadsheet exports and are not errors.
  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

/**
 * Maps header names to column indexes, case- and space-insensitively.
 *
 * Organisers rename columns ("E-mail", "email address"), so matching is lenient
 * on presentation while still requiring the *meaning* to be unambiguous.
 */
export function headerIndex(header: string[]): Map<string, number> {
  const index = new Map<string, number>();
  header.forEach((name, i) => {
    const key = name.trim().toLowerCase().replace(/[\s_-]+/g, "");
    if (key && !index.has(key)) index.set(key, i);
  });
  return index;
}

/** First matching alias, or undefined. */
export function findColumn(
  index: Map<string, number>,
  aliases: string[],
): number | undefined {
  for (const alias of aliases) {
    const key = alias.toLowerCase().replace(/[\s_-]+/g, "");
    const found = index.get(key);
    if (found !== undefined) return found;
  }
  return undefined;
}
