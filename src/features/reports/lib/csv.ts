type Cell = string | number | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  // Prevent spreadsheet formula injection from text values.
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: Array<Record<string, Cell>>): string {
  const first = rows[0];
  if (!first) return "";
  const headers = Object.keys(first);
  const lines = [headers.map(escapeCell).join(",")];
  for (const row of rows)
    lines.push(headers.map((header) => escapeCell(row[header])).join(","));
  return lines.join("\r\n");
}

export function downloadCsv(
  filename: string,
  rows: Array<Record<string, Cell>>,
): void {
  const blob = new Blob([`\uFEFF${toCsv(rows)}`], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
