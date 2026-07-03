import React, { useState, useEffect } from 'react';
import { Logo } from './components/Logo';
import { Scanner } from './components/Scanner';
import { History } from './components/History';
import { Dashboard } from './components/Dashboard';
import { ActiveTab, ScanResult } from './types';
import { ScanLine, List, BarChart2 } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('scan');
  const [scans, setScans] = useState<ScanResult[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('quanscan_pro_history');
    if (saved) {
      try {
        setScans(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved scans", e);
      }
    }
  }, []);

  const saveScansToStorage = (updatedScans: ScanResult[]) => {
    setScans(updatedScans);
    localStorage.setItem('quanscan_pro_history', JSON.stringify(updatedScans));
  };

  const handleScanCompleted = (newScan: ScanResult) => {
    const updated = [newScan, ...scans];
    saveScansToStorage(updated);
    setActiveTab('history');
  };

  const handleDeleteScan = (id: string) => {
    const updated = scans.filter(s => s.id !== id);
    saveScansToStorage(updated);
  };

  const handleClearHistory = () => {
    if (window.confirm("Clear all scan history? This cannot be undone.")) {
      saveScansToStorage([]);
    }
  };

  return (
    <div className="min-h-screen bg-brand-50 text-brand-950 flex flex-col max-w-md mx-auto relative shadow-2xl border-x border-brand-100">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-brand-50/80 backdrop-blur-xl border-b border-brand-100 px-6 py-4 flex items-center justify-between">
        <Logo size="sm" />
        <div className="flex items-center gap-2 bg-white border border-brand-100 px-3 py-1.5 rounded-full shadow-sm">
          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">System Ready</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 py-6 overflow-y-auto no-scrollbar">
        {activeTab === 'scan' && (
          <Scanner onScanCompleted={handleScanCompleted} />
        )}
        {activeTab === 'history' && (
          <History 
            scans={scans} 
            onDeleteScan={handleDeleteScan} 
            onClearHistory={handleClearHistory} 
            onBatchScanCompleted={handleScanCompleted}
          />
        )}
        {activeTab === 'dashboard' && (
          <Dashboard scans={scans} />
        )}
      </main>

      {/* Floating Bottom Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[380px] bg-white/90 backdrop-blur-xl border border-brand-100 rounded-full px-2 py-2 flex justify-between items-center z-50 shadow-xl">
        <button
          onClick={() => setActiveTab('scan')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${
            activeTab === 'scan' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-brand-600/60 hover:text-brand-600'
          }`}
        >
          <ScanLine className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-wide">Scan</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${
            activeTab === 'history' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-brand-600/60 hover:text-brand-600'
          }`}
        >
          <List className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-wide">Records</span>
        </button>

        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-300 ${
            activeTab === 'dashboard' ? 'bg-brand-500 text-white shadow-md shadow-brand-500/20' : 'text-brand-600/60 hover:text-brand-600'
          }`}
        >
          <BarChart2 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-bold tracking-wide">Insights</span>
        </button>
      </nav>
    </div>
  );
};

export default App;
