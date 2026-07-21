import React from 'react';
import { motion } from 'motion/react';
import { FileSpreadsheet, FolderKanban, Calendar, RefreshCw, Layers, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { DbStats } from '../types';

interface DashboardViewProps {
  stats: DbStats;
  onNavigateToImport: () => void;
  onNavigateToWbs: () => void;
}

export default function DashboardView({ stats, onNavigateToImport, onNavigateToWbs }: DashboardViewProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100 } }
  };

  const cards = [
    {
      title: 'Nama Proyek',
      value: stats.namaProyek || 'Belum Ada Proyek',
      icon: FolderKanban,
      color: 'bg-blue-600 text-white',
      textColor: 'text-blue-600',
      bgColor: 'bg-white border-slate-200 hover:border-slate-300',
      desc: 'Proyek aktif saat ini'
    },
    {
      title: 'Jumlah Divisi Pekerjaan',
      value: `${stats.jumlahDivisi} Divisi`,
      icon: Layers,
      color: 'bg-indigo-600 text-white',
      textColor: 'text-indigo-600',
      bgColor: 'bg-white border-slate-200 hover:border-slate-300',
      desc: 'Pekerjaan utama/kategori'
    },
    {
      title: 'Jumlah Item Pekerjaan',
      value: `${stats.jumlahItem} Item`,
      icon: FileSpreadsheet,
      color: 'bg-sky-600 text-white',
      textColor: 'text-sky-600',
      bgColor: 'bg-white border-slate-200 hover:border-slate-300',
      desc: 'Sub-pekerjaan/WBS'
    },
    {
      title: 'Tanggal Import',
      value: stats.tanggalImport || '-',
      icon: Calendar,
      color: 'bg-teal-600 text-white',
      textColor: 'text-teal-600',
      bgColor: 'bg-white border-slate-200 hover:border-slate-300',
      desc: 'Waktu unggahan terakhir'
    },
    {
      title: 'Status Import',
      value: stats.statusImport || 'Belum Ada',
      icon: RefreshCw,
      color: stats.statusImport === 'Sukses' ? 'bg-emerald-600 text-white' : stats.statusImport === 'Gagal' ? 'bg-rose-600 text-white' : 'bg-slate-500 text-white',
      textColor: stats.statusImport === 'Sukses' ? 'text-emerald-600' : stats.statusImport === 'Gagal' ? 'text-rose-600' : 'text-slate-500',
      bgColor: 'bg-white border-slate-200 hover:border-slate-300',
      desc: 'Kondisi data database'
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants} className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white shadow-md">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/5 blur-2xl"></div>
        <div className="absolute bottom-0 right-1/4 -mb-16 h-48 w-48 rounded-full bg-white/5 blur-xl"></div>
        
        <div className="relative max-w-2xl space-y-3">
          <span className="inline-flex items-center gap-1.5 rounded bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            🚀 Mesin Analisis RAB
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            Selamat datang di RAB Engine
          </h2>
          <p className="text-blue-100 font-medium leading-relaxed text-sm">
            Sistem pengolah instan untuk menyusun Rencana Anggaran Biaya (RAB) Anda menjadi format Work Breakdown Structure (WBS) terstruktur secara presisi untuk efisiensi planning proyek.
          </p>
          <div className="pt-4 flex flex-wrap gap-3">
            {stats.totalProyekCount === 0 ? (
              <button
                onClick={onNavigateToImport}
                className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow-md hover:bg-blue-50 transition-colors"
              >
                Mulai Import RAB
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={onNavigateToWbs}
                className="inline-flex items-center gap-2 rounded bg-white px-5 py-2.5 text-xs font-bold text-blue-700 shadow-md hover:bg-blue-50 transition-colors"
              >
                Lihat Planning Proyek
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <a
              href="/api/template"
              className="inline-flex items-center gap-2 rounded border border-white/30 bg-white/10 px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/15 transition-colors backdrop-blur-sm"
            >
              Unduh Template RAB
            </a>
          </div>
        </div>
      </motion.div>

      {/* Grid Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={idx}
              variants={itemVariants}
              className={`rounded-lg border bg-white p-5 shadow-xs transition-all hover:shadow-sm ${card.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {card.title}
                </span>
                <div className={`flex h-8 w-8 items-center justify-center rounded ${card.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-bold text-slate-800 tracking-tight truncate">
                  {card.value}
                </h3>
                <p className="mt-1 text-[10px] font-semibold text-slate-400">
                  {card.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* RAB Engine Concept Flow */}
      <motion.div variants={itemVariants} className="rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Alur Kerja Sistem (RAB Engine Pipeline)</h3>
        <p className="mt-1 text-xs text-slate-400">
          Metodologi transformasi otomatis dari format tabular Rencana Anggaran Biaya menjadi struktur kerja WBS yang rapi.
        </p>

        <div className="mt-6 grid gap-4 lg:grid-cols-5">
          {[
            { step: '01', title: 'Template RAB', desc: 'Isi data pekerjaan pada berkas Excel resmi sesuai dengan struktur kolom.' },
            { step: '02', title: 'Unggah / Import', desc: 'Sistem membaca berkas .xlsx, mengolah bit data dalam format aman.' },
            { step: '03', title: 'Validasi Presisi', desc: 'Pengecekan kesalahan, validasi duplikasi kode, dan nilai negatif.' },
            { step: '04', title: 'Analisis Struktur', desc: 'Pemetaan otomatis klasifikasi divisi utama dan sub-pekerjaan.' },
            { step: '05', title: 'Planning Proyek', desc: 'WBS interaktif terbentuk rapi, siap diekspor & dikembangkan.' }
          ].map((item, idx) => (
            <div key={idx} className="relative rounded border border-slate-200 bg-slate-50/50 p-4">
              <span className="text-xl font-bold text-slate-300 block">{item.step}</span>
              <h4 className="mt-1 text-xs font-bold text-slate-700">{item.title}</h4>
              <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 font-medium">{item.desc}</p>
              {idx < 4 && (
                <div className="hidden lg:block absolute top-1/2 -right-3.5 z-10 -translate-y-1/2 transform rounded-full bg-slate-200 p-1">
                  <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
