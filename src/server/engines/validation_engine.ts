import { ValidationError } from '../../types';
import { StandardParsedRow } from './types';

export class ValidationEngine {
  /**
   * Validates standard parsed rows against core business and formatting constraints
   */
  public static validate(
    projectName: string,
    parsedRows: StandardParsedRow[]
  ): { isValid: boolean; errors: ValidationError[] } {
    const errors: ValidationError[] = [];

    // 1. Validate project title
    if (!projectName || projectName.trim() === '') {
      errors.push({ message: 'Nama Proyek tidak boleh kosong.' });
    }

    // 2. Validate empty files
    if (!parsedRows || parsedRows.length === 0) {
      errors.push({ message: 'File Excel tidak memiliki baris data pekerjaan yang valid.' });
      return { isValid: false, errors };
    }

    const kodeSet = new Set<string>();

    // 3. Row-by-row structural validation
    for (const row of parsedRows) {
      const rowNum = row.rowNum;

      // Validation: Uraian Pekerjaan cannot be empty if Code/No is present
      if (!row.uraianPekerjaan && (row.kode || row.no)) {
        errors.push({
          row: rowNum,
          column: 'Uraian Pekerjaan',
          message: 'Uraian Pekerjaan tidak boleh kosong.'
        });
      }

      // Validation: Volume cannot be negative
      if (row.volume < 0) {
        errors.push({
          row: rowNum,
          column: 'Volume',
          message: `Volume tidak boleh bernilai negatif: ${row.volume}`
        });
      }

      // Validation: Harga Satuan cannot be negative
      if (row.hargaSatuan < 0) {
        errors.push({
          row: rowNum,
          column: 'Harga Satuan',
          message: `Harga Satuan tidak boleh bernilai negatif: ${row.hargaSatuan}`
        });
      }

      // Validation: Duplicate Code check within the uploaded project scope
      if (row.kode) {
        if (kodeSet.has(row.kode)) {
          errors.push({
            row: rowNum,
            column: 'Kode',
            message: `Duplikasi kode pekerjaan terdeteksi: '${row.kode}'`
          });
        } else {
          kodeSet.add(row.kode);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
