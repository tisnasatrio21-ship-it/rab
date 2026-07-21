import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Folder, CheckSquare, Search, ChevronDown, ChevronRight, LayoutList, FolderOpen, ArrowRight, Database, RefreshCw } from 'lucide-react';
import { Proyek, ProyekWBS, DivisiWBS, ItemWBS } from '../types';

interface PlanningViewProps {
  projects: Proyek[];
  onNavigateToImport: () => void;
}

export default function PlanningView({ projects, onNavigateToImport }: PlanningViewProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [wbsData, setWbsData] = useState<ProyekWBS | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDivs, setExpandedDivs] = useState<Record<string, boolean>>({});

  // Fetch projects list on mount and set initial selected project
  useEffect(() => {
    if (projects && projects.length > 0) {
      // Default to last imported project
      const latestProject = projects[projects.length - 1];
      setSelectedProjectId(latestProject.id);
    }
  }, [projects]);

  // Fetch WBS structure when selected project changes
  useEffect(() => {
    if (!selectedProjectId) {
      setWbsData(null);
      return;
    }

    const fetchWbs = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/project/${selectedProjectId}/wbs`);
        if (response.ok) {
          const data = await response.json();
          setWbsData(data);
          
          // Expand all divisions by default
          const initialExpanded: Record<string, boolean> = {};
          data.divisions.forEach((div: DivisiWBS) => {
            initialExpanded[div.id] = true;
          });
          setExpandedDivs(initialExpanded);
        }
      } catch (error) {
        console.error('Error fetching WBS data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWbs();
  }, [selectedProjectId]);

  // Toggle single division expand/collapse
  const toggleExpand = (divId: string) => {
    setExpandedDivs(prev => ({
      ...prev,
      [divId]: !prev[divId]
    }));
  };

  // Expand all divisions
  const handleExpandAll = () => {
    if (!wbsData) return;
    const expanded: Record<string, boolean> = {};
    wbsData.divisions.forEach(div => {
      expanded[div.id] = true;
    });
    setExpandedDivs(expanded);
  };

  // Collapse all divisions
  const handleCollapseAll = () => {
    if (!wbsData) return;
    const expanded: Record<string, boolean> = {};
    wbsData.divisions.forEach(div => {
      expanded[div.id] = false;
    });
    setExpandedDivs(expanded);
  };

  // Filter divisions and items dynamically based on search query
  const getFilteredWbs = () => {
    if (!wbsData) return null;
    if (!searchQuery.trim()) return wbsData;

    const query = searchQuery.toLowerCase();
    
    const filteredDivisions = wbsData.divisions.map(div => {
      // Check if division name matches
      const divMatch = div.nama.toLowerCase().includes(query) || div.kode.toLowerCase().includes(query);
      
      // Filter items of this division
      const matchedItems = div.items.filter(item => 
        item.nama.toLowerCase().includes(query) || item.kode.toLowerCase().includes(query)
      );

      // If division matches, keep all its items; otherwise, only keep matched items
      if (divMatch) {
        return div;
      } else if (matchedItems.length > 0) {
        return {
          ...div,
          items: matchedItems
        };
      }
      return null;
    }).filter(Boolean) as DivisiWBS[];

    return {
      ...wbsData,
      divisions: filteredDivisions
    };
  };

  const filteredWbs = getFilteredWbs();

  return (
    <div className="space-y-6">
      {/* Header title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">Planning Proyek (WBS)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Visualisasi pohon kerja (Work Breakdown Structure) hasil analisis RAB otomatis.
          </p>
        </div>

        {/* Project Selector dropdown */}
        {projects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Pilih Proyek:</span>
            <div className="relative">
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none rounded border border-slate-200 bg-white pl-3.5 pr-9 py-2 text-xs font-bold text-slate-700 outline-none transition-colors focus:border-blue-500 cursor-pointer shadow-xs"
              >
                {projects.map((proj) => (
                  <option key={proj.id} value={proj.id}>
                    {proj.nama}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        /* Empty State */
        <div className="rounded-lg border border-slate-200 bg-white py-16 px-6 text-center max-w-xl mx-auto shadow-xs space-y-6">
          <div className="flex h-14 w-14 items-center justify-center rounded bg-blue-50 text-blue-600 mx-auto">
            <LayoutList className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-800">Belum Ada Planning Proyek</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
              Anda belum mengimpor berkas RAB. Silakan lakukan proses import terlebih dahulu untuk menghasilkan bagan struktur kerja WBS.
            </p>
          </div>
          <button
            onClick={onNavigateToImport}
            className="inline-flex items-center gap-2 rounded bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/10 hover:bg-blue-700 transition-all"
          >
            Import RAB Sekarang
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* WBS View Container */
        <div className="rounded-lg border border-slate-200 bg-white shadow-xs overflow-hidden">
          {/* Controls Bar */}
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-3.5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search field */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari divisi atau nama pekerjaan..."
                className="w-full rounded border border-slate-200 bg-white pl-9 pr-4 py-1.5 text-xs font-medium text-slate-700 outline-none transition-colors focus:border-blue-500"
              />
            </div>

            {/* Tree Collapse/Expand Actions */}
            <div className="flex items-center gap-2 text-xs font-semibold">
              <button
                onClick={handleExpandAll}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5 text-slate-400" />
                Expand Semua
              </button>
              <button
                onClick={handleCollapseAll}
                className="inline-flex items-center gap-1.5 rounded border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Folder className="h-3.5 w-3.5 text-slate-400" />
                Collapse Semua
              </button>
            </div>
          </div>

          {/* Loading status */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="h-7 w-7 text-blue-500 animate-spin mx-auto" />
              <p className="text-xs font-semibold text-slate-400">Menyusun Struktur WBS...</p>
            </div>
          ) : filteredWbs ? (
            /* WBS Visual Tree */
            <div className="p-6">
              {/* Project Title Badge */}
              <div className="mb-5 flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded px-4 py-2.5 text-xs font-bold text-blue-700">
                <Database className="h-4 w-4 text-blue-600" />
                <span>Pohon Kerja WBS untuk: {filteredWbs.nama}</span>
              </div>

              {filteredWbs.divisions.length === 0 ? (
                <div className="py-10 text-center text-xs font-medium text-slate-400">
                  Tidak ada item pekerjaan yang cocok dengan pencarian Anda.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredWbs.divisions.map((div) => {
                    const isExpanded = !!expandedDivs[div.id];
                    return (
                      <div key={div.id} className="border border-slate-100 rounded-xl overflow-hidden shadow-xs">
                        {/* Division Heading Line */}
                        <div
                          onClick={() => toggleExpand(div.id)}
                          className="flex items-center justify-between px-4 py-3.5 bg-slate-50/30 hover:bg-slate-50/80 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                              {div.kode}
                            </span>
                            <div className="flex items-center gap-2">
                              <Folder className="h-4.5 w-4.5 text-blue-600 fill-blue-50" />
                              <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                                {div.nama}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {div.items.length} Item
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-4.5 w-4.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-4.5 w-4.5 text-slate-400" />
                            )}
                          </div>
                        </div>

                      {/* Nesting Items list */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            className="overflow-hidden bg-slate-50/20 border-t border-slate-100"
                          >
                            <div className="pl-12 pr-6 py-4 space-y-2 relative border-l-2 border-slate-200 ml-8 my-2">
                              {div.items.map((item) => (
                                <div
                                  key={item.id}
                                  className="wbs-tree-line flex items-center justify-between p-3 bg-white border border-slate-150 rounded shadow-xs hover:border-slate-300 transition-colors group"
                                >
                                  <div className="flex items-center gap-3">
                                    <span className="font-mono text-[10px] font-semibold text-slate-400">
                                      {item.kode}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <CheckSquare className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                      <span className="text-xs font-semibold text-slate-700">
                                        {item.nama}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Vol and Satuan */}
                                  <div className="flex items-center gap-2.5 text-[11px]">
                                    <span className="font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded">
                                      {item.volume.toLocaleString('id-ID')}
                                    </span>
                                    <span className="font-bold text-slate-400 uppercase text-[9px] tracking-wide">
                                      {item.satuan}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-xs font-medium text-slate-400">
              Gagal memuat data WBS.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
