import React from 'react';
import { LayoutDashboard, UploadCloud, GitMerge, Settings, Cpu } from 'lucide-react';
import { MenuType } from '../types';

interface SidebarProps {
  activeMenu: MenuType;
  setActiveMenu: (menu: MenuType) => void;
  companyName: string;
}

export default function Sidebar({ activeMenu, setActiveMenu, companyName }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as MenuType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'import' as MenuType, label: 'Import RAB', icon: UploadCloud },
    { id: 'planning' as MenuType, label: 'Planning Proyek', icon: GitMerge },
    { id: 'pengaturan' as MenuType, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r border-slate-800 bg-slate-900 text-white">
      {/* Brand logo & header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded bg-blue-600 text-white shadow-md shadow-blue-500/20 font-bold text-lg">
          R
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white uppercase">RAB Engine</h1>
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{companyName}</p>
        </div>
      </div>

      {/* Nav menus */}
      <nav className="flex-1 space-y-1.5 px-3 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMenu === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`flex w-full items-center gap-3.5 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 border-l-4 border-blue-400 text-white shadow-md'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <Icon className={`h-4.5 w-4.5 transition-transform duration-200 ${isActive ? 'scale-110 text-white' : 'text-slate-400 group-hover:text-white'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="border-t border-slate-800 p-4.5 bg-slate-950/40">
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3.5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500"></span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 tracking-wide uppercase">Core Active</span>
          </div>
          <p className="mt-1 text-xs font-semibold text-slate-300">John Doe (Admin Proyek)</p>
          <p className="text-[10px] font-medium text-slate-500">v12.0.0 (Laravel-aligned)</p>
        </div>
      </div>
    </aside>
  );
}

