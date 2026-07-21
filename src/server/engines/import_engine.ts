import XLSX from 'xlsx';

export class ImportEngine {
  /**
   * Reads an Excel file buffer and extracts raw rows along with the header names
   */
  public static readExcel(buffer: Buffer): { rawRows: any[]; headers: string[] } {
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer kosong atau tidak valid.');
    }

    const workbook = XLSX.read(buffer, { type: 'buffer' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Berkas Excel tidak memiliki worksheet yang valid.');
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) {
      throw new Error(`Worksheet "${sheetName}" tidak dapat dibaca.`);
    }

    // Convert sheet to raw array of row objects
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: null });

    // Extract headers from the sheet to allow exact matching & validation
    const headers: string[] = [];
    const ref = worksheet['!ref'];
    if (ref) {
      const range = XLSX.utils.decode_range(ref);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: range.s.r, c: col });
        const cell = worksheet[cellRef];
        if (cell && cell.v !== undefined && cell.v !== null) {
          headers.push(String(cell.v).trim());
        }
      }
    } else {
      // Fallback: use keys from the first row object
      if (rawRows.length > 0) {
        headers.push(...Object.keys(rawRows[0]));
      }
    }

    return { rawRows, headers };
  }
}
