export interface Proyek {
  id: string;
  nama: string;
  tanggal_import: string;
  status_import: 'Sukses' | 'Gagal' | 'Belum Ada';
}

export interface DivisiWBS {
  id: string;
  kode: string;
  nama: string;
  items: ItemWBS[];
}

export interface ItemWBS {
  id: string;
  kode: string;
  nama: string;
  volume: number;
  satuan: string;
}

export interface ProyekWBS {
  id: string;
  nama: string;
  tanggal_import: string;
  status_import: string;
  divisions: DivisiWBS[];
}

export interface ValidationError {
  row?: number;
  column?: string;
  message: string;
}

export interface DbStats {
  namaProyek: string;
  jumlahDivisi: number;
  jumlahItem: number;
  tanggalImport: string;
  statusImport: string;
  totalProyekCount: number;
}

export type MenuType = 'dashboard' | 'import' | 'planning' | 'pengaturan';
