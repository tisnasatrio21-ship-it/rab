import { Proyek } from './db';
import { ParserEngine } from './engines/parser_engine';
import { ValidationEngine } from './engines/validation_engine';
import { PlanningEngine } from './engines/planning_engine';
import { DatabaseEngine } from './engines/database_engine';

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
 * High-level coordinator function that orchestrates the Parser, Validation,
 * Planning, and Database engines in sequence to process flat RAB data.
 */
export function validateAndProcessRab(
  projectName: string,
  rawRows: any[]
): ParseResult {
  try {
    if (!rawRows || rawRows.length === 0) {
      return {
        success: false,
        errors: [{ message: 'File Excel tidak memiliki baris data pekerjaan yang valid.' }]
      };
    }

    // 1. Parser Engine maps the dynamic keys into standard structured objects
    const headers = Object.keys(rawRows[0]);
    const { parsedRows } = ParserEngine.parse(rawRows, headers);

    // 2. Validation Engine performs business and data type validations
    const validation = ValidationEngine.validate(projectName, parsedRows);
    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    // 3. Planning Engine compiles standard rows into hierarchical Work Breakdown Structure (WBS)
    const wbs = PlanningEngine.buildWbs(projectName, parsedRows);

    // 4. Database Engine persists the finalized planning structure to disk
    const savedProyek = DatabaseEngine.saveWbs(wbs);

    return {
      success: true,
      errors: [],
      proyek: {
        id: savedProyek.id,
        nama: savedProyek.nama,
        tanggal_import: savedProyek.tanggal_import,
        status_import: savedProyek.status_import
      },
      divisiCount: wbs.divisions.length,
      itemCount: wbs.divisions.reduce((sum, div) => sum + div.items.length, 0)
    };
  } catch (error: any) {
    return {
      success: false,
      errors: [{ message: error.message || String(error) }]
    };
  }
}
