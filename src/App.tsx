import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LayoutDashboard, Menu, X, Calendar, User, Cpu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import ImportView from './components/ImportView';
import PlanningView from './components/PlanningView';
import SettingsView from './components/SettingsView';
import { Proyek, DbStats, MenuType } from './types';

export default function App() {
  const [activeMenu, setActiveMenu] = useState<MenuType>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [projects, setProjects] = useState<Proyek[]>([]);
  const [stats, setStats] = useState<DbStats>({
    namaProyek: 'Belum Ada Proyek',
    jumlahDivisi: 0,
    jumlahItem: 0,
    tanggalImport: '-',
    statusImport: 'Belum Ada',
    totalProyekCount: 0,
  });
  const [settings, setSettings] = useState({
    companyName: 'RAB Engine Corp',
    defaultProjectName: 'Proyek Baru',
  });

  // Fetch initial configuration & projects list & stats
  const fetchData = async () => {
    try {
      // 1. Fetch Stats
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // 2. Fetch Projects list
      const projRes = await fetch('/api/projects');
      if (projRes.ok) {
        const projData = await projRes.json();
        setProjects(projData);
      }

      // 3. Fetch Settings
      const setRes = await fetch('/api/settings');
      if (setRes.ok) {
        const setData = await setRes.json();
        setSettings({
          companyName: setData.companyName || 'RAB Engine Corp',
          defaultProjectName: setData.defaultProjectName || 'Proyek Baru',
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleImportSuccess = () => {
    // Refresh stats and projects list when import succeeds
    fetchData();
  };

  const handleUpdateSettings = async (companyName: string, defaultProjectName: string) => {
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, defaultProjectName }),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings({
          companyName: data.settings.companyName,
          defaultProjectName: data.settings.defaultProjectName,
        });
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      throw error;
    }
  };

  const handleResetDatabase = async () => {
    try {
      const response = await fetch('/api/reset', { method: 'POST' });
      if (response.ok) {
        await fetchData();
        setActiveMenu('dashboard');
      }
    } catch (error) {
      console.error('Failed to reset database:', error);
      throw error;
    }
  };

  // Human-readable titles for headers
  const getHeaderTitle = () => {
    switch (activeMenu) {
      case 'dashboard':
        return 'Dashboard Analytics';
      case 'import':
        return 'Import RAB Proyek';
      case 'planning':
        return 'Work Breakdown Structure (WBS)';
      case 'pengaturan':
        return 'Pengaturan Sistem';
      default:
        return 'RAB Engine';
    }
  };

  // Navigational wrappers for inner buttons
  const navigateToImport = () => setActiveMenu('import');
  const navigateToWbs = () => setActiveMenu('planning');

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Desktop Left Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          activeMenu={activeMenu}
          setActiveMenu={setActiveMenu}
          companyName={settings.companyName}
        />
      </div>

      {/* Mobile Navigation Drawer / Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative flex w-64 max-w-xs flex-col bg-white h-full shadow-2xl">
            <Sidebar
              activeMenu={activeMenu}
              setActiveMenu={(menu) => {
                setActiveMenu(menu);
                setSidebarOpen(false);
              }}
              companyName={settings.companyName}
            />
          </div>
        </div>
      )}

      {/* Main Content Layout Shell */}
      <div className="lg:pl-64">
        {/* Top Header Navbar */}
        <header className="sticky top-0 z-10 flex h-16 bg-white border-b border-slate-200 items-center justify-between px-6 shadow-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold text-slate-800 tracking-tight">
              {getHeaderTitle()}
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-[9px] rounded border border-blue-100 uppercase font-bold tracking-wider">
              Live View
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right mr-4 hidden md:block">
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Terakhir diimpor</p>
              <p className="text-xs font-semibold text-slate-600">{stats.tanggalImport !== '-' ? stats.tanggalImport : 'Belum Ada'}</p>
            </div>

            {/* Profile Avatar Widget aligned with theme */}
            <div className="flex items-center gap-2.5 rounded border border-slate-200 p-1.5 pr-3 bg-slate-50/50">
              <div className="flex h-7.5 w-7.5 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs border border-slate-600">
                JD
              </div>
              <div className="text-[10px] leading-tight">
                <p className="font-semibold text-slate-800">John Doe</p>
                <p className="text-[9px] text-slate-400 font-semibold">Admin Proyek</p>
              </div>
            </div>
          </div>
        </header>

        {/* Inner page with graceful fade and translate micro-animations */}
        <main className="p-6 md:p-8 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              {activeMenu === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  onNavigateToImport={navigateToImport}
                  onNavigateToWbs={navigateToWbs}
                />
              )}
              {activeMenu === 'import' && (
                <ImportView
                  onImportSuccess={handleImportSuccess}
                  defaultProjectName={settings.defaultProjectName}
                />
              )}
              {activeMenu === 'planning' && (
                <PlanningView
                  projects={projects}
                  onNavigateToImport={navigateToImport}
                />
              )}
              {activeMenu === 'pengaturan' && (
                <SettingsView
                  companyName={settings.companyName}
                  defaultProjectName={settings.defaultProjectName}
                  onUpdateSettings={handleUpdateSettings}
                  onResetDatabase={handleResetDatabase}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
