import { getDb, saveDb, Proyek, DivisiPekerjaan, ItemPekerjaan, RabRow } from './db';

export interface ValidationError {
  row?: number;
  column?: string;
  message: string;
}

export interface ParseResult {
  success: boolean;
  errors: ValidationError[];
  proyek?: Proyek;
  divisiCount?: number;
  itemCount?: number;
}

/**
 * Validates and processes the raw parsed rows from the Excel file
 */
export function validateAndProcessRab(
  projectName: string,
  rawRows: any[]
): ParseResult {
  const errors: ValidationError[] = [];

  if (!projectName || projectName.trim() === '') {
    errors.push({ message: 'Nama Proyek tidak boleh kosong.' });
  }

  if (!rawRows || rawRows.length === 0) {
    errors.push({ message: 'File Excel tidak memiliki baris data yang valid.' });
    return { success: false, errors };
  }

  // 1. Validate Columns
  // Expected headers: No, Kode, Uraian Pekerjaan, Satuan, Volume, Harga Satuan, Jumlah
  // Let's inspect the first row's keys or try to match them.
  // Standardizing keys to make it flexible
  const firstRow = rawRows[0];
  const requiredHeaders = [
    'No',
    'Kode',
    'Uraian Pekerjaan',
    'Satuan',
    'Volume',
    'Harga Satuan',
    'Jumlah'
  ];

  // Helper to normalize strings for comparison
  const normalize = (str: any) =>
    typeof str === 'string'
      ? str.toLowerCase().replace(/[^a-z0-9]/g, '')
      : '';

  const keys = Object.keys(firstRow);
  const normalizedKeys = keys.map(normalize);

  const missingHeaders: string[] = [];
  for (const header of requiredHeaders) {
    const normalizedHeader = normalize(header);
    if (!normalizedKeys.includes(normalizedHeader)) {
      missingHeaders.push(header);
    }
  }

  if (missingHeaders.length > 0) {
    errors.push({
      message: `Kolom Excel tidak sesuai template. Kolom yang kurang: ${missingHeaders.join(', ')}. Pastikan template RAB sesuai.`
    });
    return { success: false, errors };
  }

  // Helper to map dynamic object keys to standard keys based on normalization
  const getVal = (row: any, header: string) => {
    const normalizedHeader = normalize(header);
    const key = keys.find(k => normalize(k) === normalizedHeader);
    return key ? row[key] : null;
  };

  const db = getDb();
  const proyekId = 'proj_' + Math.random().toString(36).substr(2, 9);
  
  const parsedDivisions: DivisiPekerjaan[] = [];
  const parsedItems: ItemPekerjaan[] = [];
  const parsedRabRows: RabRow[] = [];

  const kodeSet = new Set<string>();

  let currentDivisi: DivisiPekerjaan | null = null;
  let divisionCounter = 1;
  let itemCounter = 1;

  // 2. Validate row values and construct structural data
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 2; // Row number in Excel file (usually starting at 2 assuming row 1 is headers)

    const no = String(getVal(row, 'No') || '').trim();
    const kode = String(getVal(row, 'Kode') || '').trim();
    const uraian = String(getVal(row, 'Uraian Pekerjaan') || '').trim();
    const satuan = String(getVal(row, 'Satuan') || '').trim();
    const rawVolume = getVal(row, 'Volume');
    const rawHargaSatuan = getVal(row, 'Harga Satuan');
    const rawJumlah = getVal(row, 'Jumlah');

    // Skip totally empty rows
    if (!no && !kode && !uraian && !satuan && rawVolume === null && rawHargaSatuan === null) {
      continue;
    }

    // Validation: Uraian Pekerjaan cannot be empty if Kode/No is present
    if (!uraian && (kode || no)) {
      errors.push({
        row: rowNum,
        column: 'Uraian Pekerjaan',
        message: 'Uraian Pekerjaan tidak boleh kosong.'
      });
    }

    // Parse numeric fields safely
    const volume = rawVolume !== null && rawVolume !== undefined && rawVolume !== '' ? Number(rawVolume) : 0;
    const hargaSatuan = rawHargaSatuan !== null && rawHargaSatuan !== undefined && rawHargaSatuan !== '' ? Number(rawHargaSatuan) : 0;
    const jumlah = rawJumlah !== null && rawJumlah !== undefined && rawJumlah !== '' ? Number(rawJumlah) : 0;

    // Validation: Volume cannot be negative
    if (volume < 0) {
      errors.push({
        row: rowNum,
        column: 'Volume',
        message: `Volume tidak boleh bernilai negatif: ${volume}`
      });
    }

    // Validation: Harga Satuan cannot be negative
    if (hargaSatuan < 0) {
      errors.push({
        row: rowNum,
        column: 'Harga Satuan',
        message: `Harga Satuan tidak boleh bernilai negatif: ${hargaSatuan}`
      });
    }

    // Validation: Duplicate Code check (only if code is provided)
    if (kode) {
      if (kodeSet.has(kode)) {
        errors.push({
          row: rowNum,
          column: 'Kode',
          message: `Duplikasi kode pekerjaan terdeteksi: '${kode}'`
        });
      } else {
        kodeSet.add(kode);
      }
    }

    // Logic to distinguish Division vs Item:
    // A Divisi has: No volume, no unit, no harga_satuan (or all of them are empty/0)
    const isDivisi = !satuan && volume === 0 && hargaSatuan === 0;

    if (isDivisi) {
      const divId = `div_${proyekId}_${divisionCounter++}`;
      currentDivisi = {
        id: divId,
        proyek_id: proyekId,
        kode: kode || String(divisionCounter - 1),
        nama: uraian || 'Tanpa Nama Divisi'
      };
      parsedDivisions.push(currentDivisi);

      // Save raw RAB row linked to this division
      parsedRabRows.push({
        id: `rab_row_${Math.random().toString(36).substr(2, 9)}`,
        proyek_id: proyekId,
        divisi_pekerjaan_id: divId,
        item_pekerjaan_id: null,
        no,
        kode,
        uraian_pekerjaan: uraian,
        satuan: '',
        volume: 0,
        harga_satuan: 0,
        jumlah
      });
    } else {
      // It's an item
      // If we don't have an active division yet, create a default one
      if (!currentDivisi) {
        const divId = `div_${proyekId}_default`;
        currentDivisi = {
          id: divId,
          proyek_id: proyekId,
          kode: '0',
          nama: 'Pekerjaan Persiapan / Umum'
        };
        parsedDivisions.push(currentDivisi);
      }

      const itemId = `item_${proyekId}_${itemCounter++}`;
      parsedItems.push({
        id: itemId,
        divisi_pekerjaan_id: currentDivisi.id,
        kode: kode || `${currentDivisi.kode}.${itemCounter - 1}`,
        nama: uraian,
        volume,
        satuan
      });

      // Save raw RAB row linked to both division and item
      parsedRabRows.push({
        id: `rab_row_${Math.random().toString(36).substr(2, 9)}`,
        proyek_id: proyekId,
        divisi_pekerjaan_id: currentDivisi.id,
        item_pekerjaan_id: itemId,
        no,
        kode: kode || `${currentDivisi.kode}.${itemCounter - 1}`,
        uraian_pekerjaan: uraian,
        satuan,
        volume,
        harga_satuan: hargaSatuan,
        jumlah: jumlah || (volume * hargaSatuan)
      });
    }
  }

  // If validation errors are found, stop and return them
  if (errors.length > 0) {
    return { success: false, errors };
  }

  // 3. Save to DB
  const dateStr = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5);
  const newProyek: Proyek = {
    id: proyekId,
    nama: projectName,
    tanggal_import: dateStr,
    status_import: 'Sukses'
  };

  db.proyek.push(newProyek);
  db.divisi_pekerjaan.push(...parsedDivisions);
  db.item_pekerjaan.push(...parsedItems);
  db.rab.push(...parsedRabRows);

  saveDb(db);

  return {
    success: true,
    errors: [],
    proyek: newProyek,
    divisiCount: parsedDivisions.length,
    itemCount: parsedItems.length
  };
}
