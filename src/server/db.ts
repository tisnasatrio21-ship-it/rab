import fs from 'fs';
import path from 'path';

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

interface DatabaseSchema {
  proyek: Proyek[];
  divisi_pekerjaan: DivisiPekerjaan[];
  item_pekerjaan: ItemPekerjaan[];
  rab: RabRow[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'src', 'server', 'db_store.json');

// Ensure database directory and file exist
function initializeDb() {
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

export function getDb(): DatabaseSchema {
  initializeDb();
  try {
    const data = fs.readFileSync(DB_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { proyek: [], divisi_pekerjaan: [], item_pekerjaan: [], rab: [] };
  }
}

export function saveDb(data: DatabaseSchema) {
  initializeDb();
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

export function resetDb() {
  const defaultData: DatabaseSchema = {
    proyek: [],
    divisi_pekerjaan: [],
    item_pekerjaan: [],
    rab: [],
  };
  saveDb(defaultData);
}

// Stats helper
export interface DbStats {
  namaProyek: string;
  jumlahDivisi: number;
  jumlahItem: number;
  tanggalImport: string;
  statusImport: string;
  totalProyekCount: number;
}

export function getStats(proyekId?: string): DbStats {
  const db = getDb();
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

  // Use specified or last imported project
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
