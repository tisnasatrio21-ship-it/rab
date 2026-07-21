import { StandardParsedRow, WbsDivision, WbsItem, WbsStructure } from './types';

export class PlanningEngine {
  /**
   * Transforms a flat list of parsed rows into a structured Work Breakdown Structure (WBS)
   */
  public static buildWbs(projectName: string, parsedRows: StandardParsedRow[]): WbsStructure {
    const divisions: WbsDivision[] = [];
    const proyekId = 'proj_' + Math.random().toString(36).substring(2, 11);

    let currentDivisi: WbsDivision | null = null;
    let divisionCounter = 1;
    let itemCounter = 1;

    for (const row of parsedRows) {
      if (row.isDivisi) {
        // Create new division node
        const divId = `div_${proyekId}_${divisionCounter++}`;
        currentDivisi = {
          id: divId,
          kode: row.kode || String(divisionCounter - 1),
          nama: row.uraianPekerjaan || 'Tanpa Nama Divisi',
          items: []
        };
        divisions.push(currentDivisi);
      } else {
        // It's a work item
        // Ensure we have a division node. If none exists, create a default header.
        if (!currentDivisi) {
          const divId = `div_${proyekId}_default`;
          currentDivisi = {
            id: divId,
            kode: '0',
            nama: 'Pekerjaan Persiapan / Umum',
            items: []
          };
          divisions.push(currentDivisi);
        }

        const itemId = `item_${proyekId}_${itemCounter++}`;
        const itemKode = row.kode || `${currentDivisi.kode}.${itemCounter - 1}`;

        const item: WbsItem = {
          id: itemId,
          kode: itemKode,
          nama: row.uraianPekerjaan,
          volume: row.volume,
          satuan: row.satuan,
          hargaSatuan: row.hargaSatuan,
          jumlah: row.jumlah || (row.volume * row.hargaSatuan)
        };

        // Standardize the row's code back to standard if it was empty so the frontend sees it
        if (!row.kode) {
          row.kode = itemKode;
        }

        currentDivisi.items.push(item);
      }
    }

    return {
      projectId: proyekId,
      projectName: projectName || 'Proyek Tanpa Nama',
      divisions,
      rawRows: parsedRows
    };
  }
}
