import { ValidationError } from '../../types';

export interface StandardParsedRow {
  no: string;
  kode: string;
  uraianPekerjaan: string;
  satuan: string;
  volume: number;
  hargaSatuan: number;
  jumlah: number;
  isDivisi: boolean;
  rowNum: number;
}

export interface ParserStrategy {
  name: string;
  id: string;
  canParse(headers: string[]): boolean;
  parse(rawRows: any[], headers: string[]): StandardParsedRow[];
  getRequiredHeaders(): string[];
}

export interface WbsDivision {
  id: string;
  kode: string;
  nama: string;
  items: WbsItem[];
}

export interface WbsItem {
  id: string;
  kode: string;
  nama: string;
  volume: number;
  satuan: string;
  hargaSatuan: number;
  jumlah: number;
}

export interface WbsStructure {
  projectId: string;
  projectName: string;
  divisions: WbsDivision[];
  rawRows: StandardParsedRow[];
}
