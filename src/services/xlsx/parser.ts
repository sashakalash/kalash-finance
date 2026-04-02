import * as XLSX from 'xlsx';

/**
 * Parse an XLSX/XLS file in the browser and return rows as key-value objects.
 * Column headers come from the first non-empty row.
 */
export async function parseXlsxFile(file: File): Promise<Record<string, string>[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true, cellText: false });

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // raw: true keeps numbers as numbers; defval: '' avoids undefined cells
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: true,
  });

  // Stringify all values so adapters receive a consistent Record<string, string>
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, v instanceof Date ? formatXlsxDate(v) : String(v)]),
    ),
  );
}

function formatXlsxDate(date: Date): string {
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}
