import express from 'express';
import path from 'path';
import multer from 'multer';
import XLSX from 'xlsx';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb, getStats, resetDb, Proyek } from './src/server/db';
import { generateTemplateExcelBuffer } from './src/server/template_generator';
import { ImportEngine } from './src/server/engines/import_engine';
import { ParserEngine } from './src/server/engines/parser_engine';
import { ValidationEngine } from './src/server/engines/validation_engine';
import { PlanningEngine } from './src/server/engines/planning_engine';
import { DatabaseEngine } from './src/server/engines/database_engine';

const app = express();
const PORT = 3000;

// Increase payload limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Setup multer for memory storage file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.xlsx') {
      return cb(new Error('Hanya menerima file Excel (.xlsx)'));
    }
    cb(null, true);
  }
});

// Settings API (simple key-value persistence in db.json if needed)
let settings = {
  companyName: 'RAB Engine Corp',
  defaultProjectName: 'Proyek Baru',
  autoSave: true
};

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Stats for Dashboard
app.get('/api/stats', (req, res) => {
  try {
    const { proyekId } = req.query;
    const stats = getStats(proyekId as string);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengambil data statistik: ' + error.message });
  }
});

// All Projects List
app.get('/api/projects', (req, res) => {
  try {
    const db = getDb();
    res.json(db.proyek);
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal mengambil daftar proyek: ' + error.message });
  }
});

// WBS structure for a specific project
app.get('/api/project/:id/wbs', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    const proyek = db.proyek.find(p => p.id === id);

    if (!proyek) {
      return res.status(404).json({ error: 'Proyek tidak ditemukan' });
    }

    const divisions = db.divisi_pekerjaan.filter(d => d.proyek_id === id);
    const structuredWbs = divisions.map(div => {
      const items = db.item_pekerjaan.filter(i => i.divisi_pekerjaan_id === div.id);
      return {
        id: div.id,
        kode: div.kode,
        nama: div.nama,
        items: items.map(item => ({
          id: item.id,
          kode: item.kode,
          nama: item.nama,
          volume: item.volume,
          satuan: item.satuan
        }))
      };
    });

    res.json({
      id: proyek.id,
      nama: proyek.nama,
      tanggal_import: proyek.tanggal_import,
      status_import: proyek.status_import,
      divisions: structuredWbs
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Gagal menyusun data WBS: ' + error.message });
  }
});

// Import Excel RAB
app.post('/api/import', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        errors: [{ message: err.message || 'Gagal mengunggah file. Pastikan format .xlsx.' }]
      });
    }
    next();
  });
}, (req, res) => {
  try {
    const projectName = req.body.projectName || 'Proyek Tanpa Nama';
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        errors: [{ message: 'File Excel tidak ditemukan. Silakan pilih file.' }]
      });
    }

    // 1. Import Engine reads Excel file buffer
    const { rawRows, headers } = ImportEngine.readExcel(file.buffer);

    // 2. Parser Engine maps tabular data to a standardized model
    const { parsedRows } = ParserEngine.parse(rawRows, headers);

    // 3. Validation Engine validates business and formatting constraints
    const validationResult = ValidationEngine.validate(projectName, parsedRows);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        errors: validationResult.errors
      });
    }

    // 4. Planning Engine compiles standard rows into the hierarchical WBS tree
    const wbs = PlanningEngine.buildWbs(projectName, parsedRows);

    // 5. Database Engine persists the finalized structure to the storage file
    const savedProyek = DatabaseEngine.saveWbs(wbs);

    res.json({
      success: true,
      errors: [],
      proyek: savedProyek,
      divisiCount: wbs.divisions.length,
      itemCount: wbs.divisions.reduce((sum, div) => sum + div.items.length, 0)
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      errors: [{ message: 'Gagal memproses file Excel: ' + (error.message || error) }]
    });
  }
});

// Download RAB Template
app.get('/api/template', (req, res) => {
  try {
    const buffer = generateTemplateExcelBuffer();
    
    res.setHeader('Content-Disposition', 'attachment; filename="Template_RAB_Engine.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error: any) {
    res.status(500).send('Gagal mengunduh template: ' + error.message);
  }
});

// Get Settings
app.get('/api/settings', (req, res) => {
  res.json(settings);
});

// Save Settings
app.post('/api/settings', (req, res) => {
  const { companyName, defaultProjectName, autoSave } = req.body;
  if (companyName) settings.companyName = companyName;
  if (defaultProjectName) settings.defaultProjectName = defaultProjectName;
  if (typeof autoSave === 'boolean') settings.autoSave = autoSave;
  res.json({ success: true, settings });
});

// Reset Database
app.post('/api/reset', (req, res) => {
  try {
    resetDb();
    res.json({ success: true, message: 'Database berhasil dikosongkan.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Gagal mengosongkan database: ' + error.message });
  }
});

// --- VITE INTERFACE AND STATIC FILES SERVING ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RAB TO PLANNING Server running on http://localhost:${PORT}`);
  });
}

startServer();
