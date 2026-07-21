import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UploadCloud, FileSpreadsheet, Download, AlertTriangle, CheckCircle2, RefreshCw, X } from 'lucide-react';
import { ValidationError } from '../types';

interface ImportViewProps {
  onImportSuccess: () => void;
  defaultProjectName: string;
}

export default function ImportView({ onImportSuccess, defaultProjectName }: ImportViewProps) {
  const [file, setFile] = useState<File | null>(null);
  const [projectName, setProjectName] = useState(defaultProjectName || 'Proyek Baru');
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ projectName: string; divisi: number; item: number } | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Download template directly from Express route
  const handleDownloadTemplate = () => {
    window.location.href = '/api/template';
  };

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setErrors([]);
        setSuccessData(null);
      } else {
        setErrors([{ message: 'Hanya berkas Excel dengan format .xlsx yang diperbolehkan.' }]);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.name.endsWith('.xlsx')) {
        setFile(selectedFile);
        setErrors([]);
        setSuccessData(null);
      } else {
        setErrors([{ message: 'Hanya berkas Excel dengan format .xlsx yang diperbolehkan.' }]);
      }
    }
  };

  const handleTriggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setErrors([]);
  };

  // Perform import API post
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrors([{ message: 'Silakan pilih berkas Excel (.xlsx) terlebih dahulu.' }]);
      return;
    }
    if (!projectName.trim()) {
      setErrors([{ message: 'Nama Proyek wajib diisi.' }]);
      return;
    }

    setLoading(true);
    setErrors([]);
    setSuccessData(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectName', projectName);

    try {
      const response = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrors(data.errors || [{ message: 'Gagal mengunggah atau memproses berkas.' }]);
      } else {
        setSuccessData({
          projectName: data.proyek.nama,
          divisi: data.divisiCount,
          item: data.itemCount,
        });
        setFile(null);
        onImportSuccess(); // Trigger layout update for parent / sidebar stats
      }
    } catch (error: any) {
      setErrors([{ message: 'Koneksi ke server gagal: ' + error.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Import Rencana Anggaran Biaya (RAB)</h2>
        <p className="text-xs text-slate-400 mt-1">
          Pilih file Excel RAB yang sesuai dengan template resmi untuk diolah menjadi struktur WBS yang rapi.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Main form card */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleImport} className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            {/* Project Name Input */}
            <div>
              <label htmlFor="projectName" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nama Proyek
              </label>
              <input
                type="text"
                id="projectName"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Masukkan nama proyek, misal: Proyek Renovasi Kantor Cabang"
                className="w-full rounded border border-slate-200 px-3.5 py-2.5 text-sm font-medium text-slate-700 outline-none transition-colors focus:border-blue-500 bg-slate-50/50"
                required
              />
            </div>

            {/* Drag and Drop Zone */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                Berkas Excel RAB (.xlsx)
              </label>
              
              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={handleTriggerUpload}
                  className={`flex flex-col items-center justify-center rounded border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-200 ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50/30 scale-[0.99]'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-50 text-blue-600 mb-3">
                    <UploadCloud className="h-5 w-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-700">Tarik & Lepas file Excel di sini</p>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">atau klik untuk mencari berkas (.xlsx)</p>
                  <p className="text-[9px] text-slate-400 font-bold mt-3 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded uppercase tracking-wider">Maksimum 5 MB</p>
                </div>
              ) : (
                <div className="rounded border border-blue-100 bg-blue-50/20 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-emerald-100 text-emerald-600">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 truncate max-w-md">{file.name}</h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={loading || !file}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded px-5 py-2.5 text-xs font-bold text-white transition-all ${
                  loading || !file
                    ? 'bg-slate-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Memproses & Validasi...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-4 w-4" />
                    Proses Import & Bentuk WBS
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Success Notification */}
          {successData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded border border-emerald-200 bg-emerald-50/50 p-5 flex gap-4"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-emerald-500 text-white">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Import Berhasil & WBS Terbentuk!</h4>
                <p className="text-xs text-emerald-700/85 leading-relaxed font-medium">
                  RAB untuk proyek <span className="font-bold">"{successData.projectName}"</span> berhasil dianalisis. Sistem otomatis mengekstrak <span className="font-bold">{successData.divisi} Divisi Pekerjaan</span> utama dan <span className="font-bold">{successData.item} Item Pekerjaan</span>.
                </p>
                <p className="text-[11px] text-emerald-600 font-semibold pt-1">
                  💡 Silakan buka menu "Planning Proyek" untuk melihat visualisasi pohon kerja (WBS).
                </p>
              </div>
            </motion.div>
          )}

          {/* Validation Errors Panel */}
          {errors.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded border border-rose-200 bg-rose-50/50 p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded bg-rose-500 text-white">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wide">Kesalahan Validasi Terdeteksi</h4>
                  <p className="text-[10px] font-semibold text-rose-500">Proses import dihentikan sementara</p>
                </div>
              </div>

              <div className="border-t border-rose-100 pt-2 space-y-1.5">
                {errors.map((err, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs font-medium text-rose-700 leading-relaxed pl-1">
                    <span className="text-rose-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>
                      {err.row && <span className="font-mono bg-rose-100 border border-rose-200/50 px-1 py-0.5 rounded text-[10px] text-rose-800 mr-1.5">Baris {err.row}</span>}
                      {err.column && <span className="font-semibold text-rose-900 mr-1">{err.column}:</span>}
                      {err.message}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Sidebar help panel */}
        <div className="space-y-4">
          {/* Template Info Card */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-600">
              <Download className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Template RAB Resmi</h3>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Aplikasi hanya menerima file Excel yang menggunakan format kolom dan struktur yang telah ditetapkan oleh RAB Engine.
              </p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="w-full inline-flex items-center justify-center gap-2 rounded border border-slate-200 bg-slate-50 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Download className="h-3.5 w-3.5 text-slate-500" />
              Download Template RAB (.xlsx)
            </button>
          </div>

          {/* Validation Rules Card */}
          <div className="rounded border border-slate-200 bg-white p-5 shadow-xs space-y-3.5">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aturan Validasi Berkas</h3>
            <div className="space-y-3 text-xs text-slate-500 font-medium">
              <div className="flex gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">1</span>
                <p className="leading-relaxed">Kolom wajib ada: <span className="font-semibold text-slate-700">No, Kode, Uraian Pekerjaan, Satuan, Volume, Harga Satuan, Jumlah</span>.</p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">2</span>
                <p className="leading-relaxed"><span className="font-semibold text-slate-700">Volume</span> pekerjaan tidak boleh bernilai negatif (&lt; 0).</p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">3</span>
                <p className="leading-relaxed">Tidak boleh ada <span className="font-semibold text-slate-700">duplikasi Kode</span> pekerjaan pada satu proyek.</p>
              </div>
              <div className="flex gap-2.5">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 text-[10px]">4</span>
                <p className="leading-relaxed">Pembagian divisi otomatis berdasarkan baris kosong pada kolom volume & satuan (dianggap tajuk kategori).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
