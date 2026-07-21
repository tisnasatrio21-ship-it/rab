import fs from 'fs';
import path from 'path';
import { WbsStructure } from './types';
import { DbStats } from '../../types';

export interface Proyek {
  id: string;
  nama: string;
  tanggal_import: string;
  status_import: 'Sukses' | 'Gagal' | 'Belum Ada';
}

export interface DivisiPekerjaan {
  id: string;
  proyek_id: string;
  kode: string;
  nama: string;
}

export interface ItemPekerjaan {
  id: string;
  divisi_pekerjaan_id: string;
  kode: string;
  nama: string;
  volume: number;
  satuan: string;
}

export interface RabRow {
  id: string;
  proyek_id: string;
  divisi_pekerjaan_id: string | null;
  item_pekerjaan_id: string | null;
  no: string;
  kode: string;
  uraian_pekerjaan: string;
  satuan: string;
  volume: number;
  harga_satuan: number;
  jumlah: number;
}

export interface DatabaseSchema {
  proyek: Proyek[];
  divisi_pekerjaan: DivisiPekerjaan[];
  item_pekerjaan: ItemPekerjaan[];
  rab: RabRow[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'server', 'db_store.json');

export class DatabaseEngine {
  /**
   * Ensures the database store exists, initializing if missing
   */
  private static initializeDb() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      const defaultData: DatabaseSchema = {
        proyek: [],
        divisi_pekerjaan: [],
        item_pekerjaan: [],
        rab: [],
      };
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
  }

  /**
   * Retrieves the raw database contents
   */
  public static getDb(): DatabaseSchema {
    this.initializeDb();
    try {
      const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('[DatabaseEngine] Gagal membaca database:', error);
      return { proyek: [], divisi_pekerjaan: [], item_pekerjaan: [], rab: [] };
    }
  }

  /**
   * Persists database contents back to file
   */
  public static saveDb(data: DatabaseSchema) {
    this.initializeDb();
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      console.error('[DatabaseEngine] Gagal menulis database:', error);
    }
  }

  /**
   * Purges all tables in the database
   */
  public static resetDb() {
    const defaultData: DatabaseSchema = {
      proyek: [],
      divisi_pekerjaan: [],
      item_pekerjaan: [],
      rab: [],
    };
    this.saveDb(defaultData);
  }

  /**
   * Saves a finalized Work Breakdown Structure (WBS) to the database
   */
  public static saveWbs(wbs: WbsStructure): Proyek {
    const db = this.getDb();
    
    // Create new project record
    const dateStr = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().split(' ')[0].substring(0, 5);
    const newProyek: Proyek = {
      id: wbs.projectId,
      nama: wbs.projectName,
      tanggal_import: dateStr,
      status_import: 'Sukses'
    };

    // Construct divisi_pekerjaan records
    const divisiPekerjaanList: DivisiPekerjaan[] = wbs.divisions.map(div => ({
      id: div.id,
      proyek_id: wbs.projectId,
      kode: div.kode,
      nama: div.nama
    }));

    // Construct item_pekerjaan records
    const itemPekerjaanList: ItemPekerjaan[] = wbs.divisions.flatMap(div =>
      div.items.map(item => ({
        id: item.id,
        divisi_pekerjaan_id: div.id,
        kode: item.kode,
        nama: item.nama,
        volume: item.volume,
        satuan: item.satuan
      }))
    );

    // Reconstruct original tabular raw rows mapping division & items sequentially
    const rabRowsList: RabRow[] = [];
    let currentDivIdx = -1;
    let currentItemIdx = 0;

    for (const raw of wbs.rawRows) {
      if (raw.isDivisi) {
        currentDivIdx++;
        currentItemIdx = 0;
        const div = wbs.divisions[currentDivIdx];
        if (div) {
          rabRowsList.push({
            id: `rab_row_${Math.random().toString(36).substring(2, 11)}`,
            proyek_id: wbs.projectId,
            divisi_pekerjaan_id: div.id,
            item_pekerjaan_id: null,
            no: raw.no,
            kode: div.kode,
            uraian_pekerjaan: div.nama,
            satuan: '',
            volume: 0,
            harga_satuan: 0,
            jumlah: raw.jumlah
          });
        }
      } else {
        const div = wbs.divisions[currentDivIdx === -1 ? 0 : currentDivIdx];
        if (div) {
          const item = div.items[currentItemIdx++];
          if (item) {
            rabRowsList.push({
              id: `rab_row_${Math.random().toString(36).substring(2, 11)}`,
              proyek_id: wbs.projectId,
              divisi_pekerjaan_id: div.id,
              item_pekerjaan_id: item.id,
              no: raw.no,
              kode: item.kode,
              uraian_pekerjaan: item.nama,
              satuan: item.satuan,
              volume: item.volume,
              harga_satuan: raw.hargaSatuan,
              jumlah: item.jumlah
            });
          }
        }
      }
    }

    // Append records to DB tables
    db.proyek.push(newProyek);
    db.divisi_pekerjaan.push(...divisiPekerjaanList);
    db.item_pekerjaan.push(...itemPekerjaanList);
    db.rab.push(...rabRowsList);

    this.saveDb(db);
    return newProyek;
  }

  /**
   * Calculates metrics for dashboard
   */
  public static getStats(proyekId?: string): DbStats {
    const db = this.getDb();
    const totalProyekCount = db.proyek.length;
    
    if (totalProyekCount === 0) {
      return {
        namaProyek: 'Belum Ada Proyek',
        jumlahDivisi: 0,
        jumlahItem: 0,
        tanggalImport: '-',
        statusImport: 'Belum Ada',
        totalProyekCount: 0,
      };
    }

    // Default to last project if no ID specified
    const targetProyek = proyekId 
      ? db.proyek.find(p => p.id === proyekId) 
      : db.proyek[db.proyek.length - 1];

    if (!targetProyek) {
      return {
        namaProyek: 'Proyek Tidak Ditemukan',
        jumlahDivisi: 0,
        jumlahItem: 0,
        tanggalImport: '-',
        statusImport: 'Gagal',
        totalProyekCount,
      };
    }

    const divisions = db.divisi_pekerjaan.filter(d => d.proyek_id === targetProyek.id);
    const divIds = divisions.map(d => d.id);
    const items = db.item_pekerjaan.filter(i => divIds.includes(i.divisi_pekerjaan_id));

    return {
      namaProyek: targetProyek.nama,
      jumlahDivisi: divisions.length,
      jumlahItem: items.length,
      tanggalImport: targetProyek.tanggal_import,
      statusImport: targetProyek.status_import,
      totalProyekCount,
    };
  }
}
