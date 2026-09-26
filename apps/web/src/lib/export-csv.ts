/** Export the currently filtered rows as a UTF-8 CSV that opens cleanly in Excel. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
  const cell = (value: string | number): string => {
    const text = String(value);
    const safe = /^[\s]*[-=+@]/.test(text) && typeof value === "string" ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const content = [headers, ...rows].map((row) => row.map(cell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
