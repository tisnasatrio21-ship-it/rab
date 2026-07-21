import { DatabaseEngine, DatabaseSchema } from './engines/database_engine';

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

export function getDb(): DatabaseSchema {
  return DatabaseEngine.getDb();
}

export function saveDb(data: DatabaseSchema) {
  DatabaseEngine.saveDb(data);
}

export function resetDb() {
  DatabaseEngine.resetDb();
}

export interface DbStats {
  namaProyek: string;
  jumlahDivisi: number;
  jumlahItem: number;
  tanggalImport: string;
  statusImport: string;
  totalProyekCount: number;
}

export function getStats(proyekId?: string): DbStats {
  return DatabaseEngine.getStats(proyekId);
}
