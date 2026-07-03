import React, { useState, useMemo } from 'react';
import { Search, Calendar, Trash2, CheckCircle2, Circle, Layers, X, Package, AlertCircle, Sparkles } from 'lucide-react';
import { ScanResult } from '../types';
import { analyzeInventoryImageBatch } from '../services/geminiService';

interface HistoryProps {
  scans: ScanResult[];
  onDeleteScan: (id: string) => void;
  onClearHistory: () => void;
  onBatchScanCompleted: (scan: ScanResult) => void;
}

export const History: React.FC<HistoryProps> = ({ scans, onDeleteScan, onClearHistory, onBatchScanCompleted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedScanIds, setSelectedScanIds] = useState<Set<string>>(new Set());
  const [activeDetailScan, setActiveDetailScan] = useState<ScanResult | null>(null);
  const [isBatchAnalyzing, setIsBatchAnalyzing] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set<string>();
    scans.forEach(s => cats.add(s.detectedCategory));
    return ['All', ...Array.from(cats)];
  }, [scans]);

  const filteredScans = useMemo(() => {
    return scans.filter(scan => {
      const matchesSearch = scan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            scan.detectedCategory.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || scan.detectedCategory === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [scans, searchQuery, selectedCategory]);

  const toggleSelectScan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedScanIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedScanIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedScanIds.size === filteredScans.length) setSelectedScanIds(new Set());
    else setSelectedScanIds(new Set(filteredScans.map(s => s.id)));
  };

  const aggregatedTotals = useMemo(() => {
    const totals: { [key: string]: number } = {};
    let totalItems = 0;
    scans.forEach(scan => {
      if (selectedScanIds.has(scan.id)) {
        scan.items.forEach(item => {
          totals[item.label] = (totals[item.label] || 0) + item.count;
          totalItems += item.count;
        });
      }
    });
    return {
      breakdown: Object.entries(totals).map(([label, count]) => ({ label, count })),
      totalItems
    };
  }, [scans, selectedScanIds]);

  const handleDeleteSelected = () => {
    if (window.confirm(`Delete ${selectedScanIds.size} selected scans?`)) {
      selectedScanIds.forEach(id => onDeleteScan(id));
      setSelectedScanIds(new Set());
    }
  };

  const handleBatchAnalyze = async () => {
    if (selectedScanIds.size < 2) {
      alert("Please select at least 2 scans to combine.");
      return;
    }

    setIsBatchAnalyzing(true);
    try {
      const selectedScans = scans.filter(s => selectedScanIds.has(s.id));
      const imageUrls = selectedScans.map(s => s.imageUrl);
      
      const result = await analyzeInventoryImageBatch(imageUrls);
      
      const combinedScan: ScanResult = {
        id: `scan-${Date.now()}`,
        title: `Combined Batch (${selectedScanIds.size} Trays)`,
        timestamp: Date.now(),
        imageUrl: imageUrls[0], // Use the first image as representative
        detectedCategory: result.detectedCategory,
        totalCount: result.totalCount,
        items: result.items,
        sceneDescription: result.sceneDescription
      };

      onBatchScanCompleted(combinedScan);
      setSelectedScanIds(new Set());
      alert("Batch analysis completed and saved to history!");
    } catch (err) {
      console.error(err);
      alert("Failed to complete batch analysis. Please try again.");
    } finally {
      setIsBatchAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high': return 'text-emerald-600 bg-emerald-50 border-emerald-100';
      case 'medium': return 'text-amber-600 bg-amber-50 border-amber-100';
      case 'low': return 'text-rose-600 bg-red-50 border-red-100';
      default: return 'text-zinc-600 bg-zinc-50 border-zinc-100';
    }
  };

  return (
    <div className="space-y-6 pb-32 animate-fade-in relative min-h-full">
      
      {/* Search & Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-600/50 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search records..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-brand-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-brand-950 placeholder-brand-600/40 focus:outline-none focus:border-brand-500 transition-colors shadow-sm"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/10' 
                  : 'bg-white text-brand-600 border border-brand-100 hover:bg-brand-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List Header */}
      <div className="flex justify-between items-center px-1">
        <h3 className="text-sm font-bold text-brand-950">
          Records <span className="text-brand-600/60 font-normal">({filteredScans.length})</span>
        </h3>
        {filteredScans.length > 0 && (
          <button 
            onClick={toggleSelectAll}
            className="text-xs text-brand-500 hover:text-brand-600 font-semibold"
          >
            {selectedScanIds.size === filteredScans.length ? 'Deselect All' : 'Select All'}
          </button>
        )}
      </div>

      {/* Scan List */}
      <div className="space-y-3">
        {filteredScans.length === 0 ? (
          <div className="bg-white border border-brand-100 border-dashed rounded-3xl p-12 text-center">
            <Package className="w-10 h-10 mx-auto text-brand-200 mb-3" />
            <p className="text-sm font-bold text-brand-950">No records found</p>
            <p className="text-xs text-brand-600 mt-1">Adjust filters or create a new scan.</p>
          </div>
        ) : (
          filteredScans.map(scan => {
            const isSelected = selectedScanIds.has(scan.id);
            return (
              <div 
                key={scan.id}
                onClick={() => setActiveDetailScan(scan)}
                className={`group relative bg-white border rounded-2xl p-3 transition-all cursor-pointer flex items-center gap-4 shadow-sm ${
                  isSelected ? 'border-brand-500 bg-brand-50/30' : 'border-brand-100 hover:border-brand-200'
                }`}
              >
                <button 
                  onClick={(e) => toggleSelectScan(scan.id, e)}
                  className="pl-2 text-brand-200 hover:text-brand-500 transition-colors"
                >
                  {isSelected ? <CheckCircle2 className="w-5 h-5 text-brand-500" /> : <Circle className="w-5 h-5" />}
                </button>

                <div className="w-14 h-14 rounded-xl overflow-hidden bg-brand-50 shrink-0">
                  <img src={scan.imageUrl} alt={scan.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-brand-950 truncate">{scan.title}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded">
                      {scan.detectedCategory}
                    </span>
                    <span className="text-[10px] text-brand-600/60 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(scan.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="pr-2 text-right">
                  <span className="text-lg font-black text-brand-950">{scan.totalCount}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Bar for Multi-Select */}
      {selectedScanIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-sm bg-white border border-brand-100 rounded-2xl p-4 shadow-2xl z-40 animate-slide-up flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="text-brand-500 w-5 h-5" />
              <span className="text-sm font-bold text-brand-950">{selectedScanIds.size} Selected</span>
            </div>
            <span className="text-sm font-black text-accent-500">{aggregatedTotals.totalItems} Items</span>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={handleBatchAnalyze}
              disabled={isBatchAnalyzing || selectedScanIds.size < 2}
              className="flex-[2] py-2.5 bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 disabled:opacity-50"
            >
              {isBatchAnalyzing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Combine & Analyze
            </button>
            <button 
              onClick={handleDeleteSelected}
              className="flex-1 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg transition-colors"
            >
              Delete
            </button>
            <button 
              onClick={() => setSelectedScanIds(new Set())}
              className="flex-1 py-2.5 bg-brand-50 text-brand-600 text-xs font-bold rounded-lg hover:bg-brand-100 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal (Bottom Sheet Style) */}
      {activeDetailScan && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl animate-slide-up max-h-[90vh] flex flex-col border border-brand-100">
            
            <div className="p-5 border-b border-brand-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-brand-950">{activeDetailScan.title}</h3>
                <p className="text-xs text-brand-600 mt-0.5">
                  {new Date(activeDetailScan.timestamp).toLocaleString()}
                </p>
              </div>
              <button 
                onClick={() => setActiveDetailScan(null)}
                className="p-2 rounded-full bg-brand-50 text-brand-600 hover:bg-brand-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-5 space-y-6 no-scrollbar">
              <div className="relative rounded-xl overflow-hidden bg-brand-50 border border-brand-100 flex items-center justify-center">
                <img 
                  src={activeDetailScan.imageUrl} 
                  alt={activeDetailScan.title} 
                  className="w-full object-contain max-h-64"
                />
                {activeDetailScan.items.map((item) => {
                  if (!item.box_2d) return null;
                  const [ymin, xmin, ymax, xmax] = item.box_2d;
                  return (
                    <div
                      key={item.id}
                      className="absolute border border-brand-500 bg-brand-500/20 rounded"
                      style={{
                        top: `${ymin}%`, left: `${xmin}%`, width: `${xmax - xmin}%`, height: `${ymax - ymin}%`,
                      }}
                    />
                  );
                })}
              </div>

              <div className="flex gap-4">
                <div className="flex-1 bg-brand-50 rounded-xl p-4 border border-brand-100">
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mb-1">Total Count</p>
                  <span className="text-3xl font-black text-accent-500">{activeDetailScan.totalCount}</span>
                </div>
                <div className="flex-1 bg-brand-50 rounded-xl p-4 border border-brand-100">
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider mb-1">Category</p>
                  <span className="text-sm font-bold text-brand-950 block mt-2 truncate">{activeDetailScan.detectedCategory}</span>
                </div>
              </div>

              {activeDetailScan.sceneDescription && (
                <div className="bg-brand-50/50 border border-brand-100 rounded-xl p-4">
                  <p className="text-xs text-brand-600 italic">"{activeDetailScan.sceneDescription}"</p>
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold text-brand-950 uppercase tracking-wider mb-3">Item Breakdown</h4>
                <div className="space-y-2">
                  {activeDetailScan.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col bg-brand-50/30 p-3.5 rounded-xl border border-brand-100 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-brand-950">{item.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-accent-500">x{item.count}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getConfidenceColor(item.confidence)}`}>
                            {item.confidence || 'high'}
                          </span>
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-xs text-brand-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-brand-100 bg-white">
              <button
                onClick={() => {
                  onDeleteScan(activeDetailScan.id);
                  setActiveDetailScan(null);
                }}
                className="w-full py-3.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
