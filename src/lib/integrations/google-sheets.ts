export async function fetchSheetValues(
  spreadsheetId: string,
  sheetName: string,
  accessToken: string,
): Promise<string[][]> {
  const range = encodeURIComponent(`${sheetName}!A:ZZ`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as {
    values?: string[][];
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Error(data.error?.message ?? "Failed to read Google Sheet");
  }

  return data.values ?? [];
}
