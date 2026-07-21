import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trash2, AlertTriangle, Settings, RefreshCw, CheckCircle, Info, Layers, Layout, ArrowRight } from 'lucide-react';

interface SettingsViewProps {
  companyName: string;
  defaultProjectName: string;
  onUpdateSettings: (companyName: string, defaultProjectName: string) => Promise<void>;
  onResetDatabase: () => Promise<void>;
}

export default function SettingsView({
  companyName,
  defaultProjectName,
  onUpdateSettings,
  onResetDatabase,
}: SettingsViewProps) {
  const [compName, setCompName] = useState(companyName);
  const [projName, setProjName] = useState(defaultProjectName);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdateSettings(compName, projName);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    setResetSuccess(false);
    try {
      await onResetDatabase();
      setResetSuccess(true);
      setShowConfirmReset(false);
      setTimeout(() => setResetSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Pengaturan Aplikasi</h2>
        <p className="text-xs text-slate-400 mt-1">
          Konfigurasi parameter default aplikasi dan pengelolaan database penyimpanan lokal.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Settings Form Column */}
        <div className="lg:col-span-2 space-y-4">
          <form onSubmit={handleSaveSettings} className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Settings className="h-4.5 w-4.5 text-blue-600" />
              General Configuration
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nama Perusahaan / Organisasi
                </label>
                <input
                  type="text"
                  value={compName}
                  onChange={(e) => setCompName(e.target.value)}
                  placeholder="RAB Engine Corp"
                  className="w-full rounded border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-500 bg-slate-50/50"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Nama Proyek Default
                </label>
                <input
                  type="text"
                  value={projName}
                  onChange={(e) => setProjName(e.target.value)}
                  placeholder="Proyek Baru"
                  className="w-full rounded border border-slate-200 px-3.5 py-2.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-500 bg-slate-50/50"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              {saveSuccess && (
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 animate-fade-in">
                  <CheckCircle className="h-4 w-4" />
                  Pengaturan berhasil disimpan
                </div>
              )}
              <span />

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded bg-blue-600 hover:bg-blue-700 px-5 py-2.5 text-xs font-bold text-white transition-colors cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Pengaturan'
                )}
              </button>
            </div>
          </form>

          {/* Database Reset Management */}
          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
              <Trash2 className="h-4.5 w-4.5 text-rose-600" />
              Manajemen Database lokal
            </h3>
            
            <p className="text-xs text-slate-400 leading-relaxed">
              Tindakan di bawah ini bersifat permanen. Seluruh data proyek yang telah diimpor beserta divisi dan detail item pekerjaannya akan dihapus secara menyeluruh dari server.
            </p>

            {resetSuccess && (
              <div className="rounded border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
                Database berhasil dikosongkan secara menyeluruh.
              </div>
            )}

            {!showConfirmReset ? (
              <button
                onClick={() => setShowConfirmReset(true)}
                className="inline-flex items-center justify-center gap-2 rounded border border-rose-200 bg-rose-50/50 hover:bg-rose-100/60 px-4 py-2 text-xs font-bold text-rose-700 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                Kosongkan Database
              </button>
            ) : (
              <div className="rounded border border-rose-200 bg-rose-50/30 p-4.5 space-y-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600 shrink-0 mt-0.5 animate-bounce" />
                  <div>
                    <h4 className="text-xs font-bold text-rose-800">Apakah Anda Yakin?</h4>
                    <p className="text-[11px] font-medium text-rose-700/80 leading-relaxed mt-0.5">
                      Seluruh data akan hilang secara permanen dari berkas data utama. Tindakan ini tidak dapat dibatalkan.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5 text-xs font-bold">
                  <button
                    onClick={handleReset}
                    disabled={resetting}
                    className="rounded bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 cursor-pointer"
                  >
                    {resetting ? 'Menghapus...' : 'Ya, Hapus Semua'}
                  </button>
                  <button
                    onClick={() => setShowConfirmReset(false)}
                    className="rounded bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-4 py-2 cursor-pointer"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Concept Architecture Block - Indonesian 'RAB Engine' explanation */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-xs space-y-4">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-blue-50 text-blue-600">
            <Info className="h-4.5 w-4.5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Konsep Arsitektur</h3>
            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">RAB ENGINE FOUNDATION</p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Metode ini dirancang sebagai mesin inti. Database dirancang modular dengan memisahkan tabel <span className="font-semibold text-slate-600">proyek</span>, <span className="font-semibold text-slate-600">divisi_pekerjaan</span>, dan <span className="font-semibold text-slate-600">item_pekerjaan</span>.
          </p>
          
          <div className="border-t border-slate-100 pt-3 space-y-3">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Potensi Modul Berikutnya:</h4>
            
            <div className="space-y-2">
              <div className="flex gap-2.5 items-start">
                <div className="h-5 w-5 rounded bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0 mt-0.5">
                  <Layers className="h-3 w-3 text-slate-400" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-700">Kurva S & Progress</h5>
                  <p className="text-[10px] text-slate-400 leading-normal">Menggunakan struktur WBS yang sudah terbentuk untuk melacak realisasi fisik.</p>
                </div>
              </div>

              <div className="flex gap-2.5 items-start">
                <div className="h-5 w-5 rounded bg-slate-50 border border-slate-150 flex items-center justify-center shrink-0 mt-0.5">
                  <Layout className="h-3 w-3 text-slate-400" />
                </div>
                <div>
                  <h5 className="text-[11px] font-bold text-slate-700">Laporan Harian</h5>
                  <p className="text-[10px] text-slate-400 leading-normal">Mencatat aktivitas harian lapangan yang dihubungkan langsung ke kode WBS proyek.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
