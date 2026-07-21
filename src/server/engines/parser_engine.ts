import { ParserStrategy, StandardParsedRow } from './types';

// Helper to normalize strings for comparison (e.g. "Uraian Pekerjaan" -> "uraianpekerjaan")
export const normalizeHeader = (str: any): string =>
  typeof str === 'string'
    ? str.toLowerCase().replace(/[^a-z0-9]/g, '')
    : '';

/**
 * Strategy implementation for the Standard RAB Template format
 */
export class StandardRabParserStrategy implements ParserStrategy {
  public name = 'Standard RAB Template Parser';
  public id = 'standard_rab';

  private requiredHeaders = [
    'No',
    'Kode',
    'Uraian Pekerjaan',
    'Satuan',
    'Volume',
    'Harga Satuan',
    'Jumlah'
  ];

  public getRequiredHeaders(): string[] {
    return this.requiredHeaders;
  }

  public canParse(headers: string[]): boolean {
    const normalizedHeaders = headers.map(normalizeHeader);
    return this.requiredHeaders.every(req => 
      normalizedHeaders.includes(normalizeHeader(req))
    );
  }

  public parse(rawRows: any[], headers: string[]): StandardParsedRow[] {
    const parsedRows: StandardParsedRow[] = [];

    const getVal = (row: any, fieldName: string) => {
      const normalizedField = normalizeHeader(fieldName);
      const key = Object.keys(row).find(k => normalizeHeader(k) === normalizedField);
      return key ? row[key] : null;
    };

    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const rowNum = i + 2; // Row offset assuming row 1 is headers in Excel

      const no = String(getVal(row, 'No') || '').trim();
      const kode = String(getVal(row, 'Kode') || '').trim();
      const uraian = String(getVal(row, 'Uraian Pekerjaan') || '').trim();
      const satuan = String(getVal(row, 'Satuan') || '').trim();
      
      const rawVolume = getVal(row, 'Volume');
      const rawHargaSatuan = getVal(row, 'Harga Satuan');
      const rawJumlah = getVal(row, 'Jumlah');

      // Skip fully empty rows
      if (!no && !kode && !uraian && !satuan && rawVolume === null && rawHargaSatuan === null) {
        continue;
      }

      // Safe numeric parsing
      const volume = rawVolume !== null && rawVolume !== undefined && rawVolume !== '' ? Number(rawVolume) : 0;
      const hargaSatuan = rawHargaSatuan !== null && rawHargaSatuan !== undefined && rawHargaSatuan !== '' ? Number(rawHargaSatuan) : 0;
      const jumlah = rawJumlah !== null && rawJumlah !== undefined && rawJumlah !== '' ? Number(rawJumlah) : 0;

      // Division VS Item rule:
      // A division has no unit, volume is 0 or empty, and unit price is 0 or empty
      const isDivisi = !satuan && volume === 0 && hargaSatuan === 0;

      parsedRows.push({
        no,
        kode,
        uraianPekerjaan: uraian,
        satuan,
        volume,
        hargaSatuan,
        jumlah: jumlah || (volume * hargaSatuan),
        isDivisi,
        rowNum
      });
    }

    return parsedRows;
  }
}

/**
 * Parser Engine manages the registered parser strategies and applies the matching one
 */
export class ParserEngine {
  private static strategies: ParserStrategy[] = [
    new StandardRabParserStrategy()
  ];

  /**
   * Registers a new parsing strategy dynamically (e.g. for future custom formats)
   */
  public static registerStrategy(strategy: ParserStrategy) {
    this.strategies.unshift(strategy); // Register at start so it takes priority
  }

  /**
   * Identifies a matching strategy based on Excel headers
   */
  public static getMatchingStrategy(headers: string[]): ParserStrategy | null {
    for (const strategy of this.strategies) {
      if (strategy.canParse(headers)) {
        return strategy;
      }
    }
    return null;
  }

  /**
   * Parses raw rows using the appropriate strategy
   */
  public static parse(rawRows: any[], headers: string[]): { parsedRows: StandardParsedRow[]; strategyUsed: string } {
    const strategy = this.getMatchingStrategy(headers);
    if (!strategy) {
      // Find missing columns for standard template to provide a descriptive error
      const standard = new StandardRabParserStrategy();
      const normalizedHeaders = headers.map(normalizeHeader);
      const missing = standard.getRequiredHeaders().filter(req => 
        !normalizedHeaders.includes(normalizeHeader(req))
      );
      
      throw new Error(
        `Format dokumen tidak dikenali oleh Parser Engine. Kolom wajib yang tidak ditemukan: ${missing.join(', ')}.`
      );
    }

    const parsedRows = strategy.parse(rawRows, headers);
    return {
      parsedRows,
      strategyUsed: strategy.name
    };
  }
}
