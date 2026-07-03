import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Layers, Package, Calendar } from 'lucide-react';
import { ScanResult } from '../types';

interface DashboardProps {
  scans: ScanResult[];
}

export const Dashboard: React.FC<DashboardProps> = ({ scans }) => {
  
  const stats = useMemo(() => {
    let totalItemsCounted = 0;
    const categories = new Set<string>();
    const itemBreakdown: { [key: string]: number } = {};

    scans.forEach(scan => {
      totalItemsCounted += scan.totalCount;
      categories.add(scan.detectedCategory);
      scan.items.forEach(item => {
        itemBreakdown[item.label] = (itemBreakdown[item.label] || 0) + item.count;
      });
    });

    return {
      totalScans: scans.length,
      totalItemsCounted,
      uniqueCategories: categories.size,
      topItem: Object.entries(itemBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
    };
  }, [scans]);

  const trendData = useMemo(() => {
    return scans
      .slice(-7)
      .reverse()
      .map(scan => ({
        name: scan.title.length > 10 ? `${scan.title.substring(0, 10)}...` : scan.title,
        count: scan.totalCount,
        date: new Date(scan.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      }));
  }, [scans]);

  const categoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    scans.forEach(scan => {
      counts[scan.detectedCategory] = (counts[scan.detectedCategory] || 0) + scan.totalCount;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [scans]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-brand-100 p-3 rounded-xl shadow-xl">
          <p className="text-xs text-brand-600 mb-1">{label}</p>
          <p className="text-sm font-bold text-brand-950">
            Count: <span className="text-accent-500">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      
      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-brand-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Package className="text-brand-500 w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Total Items</span>
          </div>
          <h3 className="text-2xl font-black text-brand-950">{stats.totalItemsCounted}</h3>
        </div>

        <div className="bg-white border border-brand-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-violetAccent-500 w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Total Scans</span>
          </div>
          <h3 className="text-2xl font-black text-brand-950">{stats.totalScans}</h3>
        </div>

        <div className="bg-white border border-brand-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Layers className="text-brand-500 w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Categories</span>
          </div>
          <h3 className="text-2xl font-black text-brand-950">{stats.uniqueCategories}</h3>
        </div>

        <div className="bg-white border border-brand-100 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-accent-500 w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600">Top Item</span>
          </div>
          <h3 className="text-xs font-bold text-brand-950 truncate mt-1">{stats.topItem}</h3>
        </div>
      </div>

      {scans.length === 0 ? (
        <div className="bg-white border border-brand-100 border-dashed rounded-3xl p-10 text-center">
          <p className="text-sm text-brand-600">Complete a scan to view analytics.</p>
        </div>
      ) : (
        <>
          {/* Area Chart */}
          <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-brand-950">Recent Volume</h3>
              <p className="text-xs text-brand-600">Items counted in last 7 scans</p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00c2a8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#00c2a8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" vertical={false} />
                  <XAxis dataKey="date" stroke="#0f766e" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#0f766e" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#00c2a8" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-white border border-brand-100 rounded-2xl p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-brand-950">Category Distribution</h3>
              <p className="text-xs text-brand-600">Total items per category</p>
            </div>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccfbf1" vertical={false} />
                  <XAxis dataKey="name" stroke="#0f766e" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#0f766e" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f0fdfa', opacity: 0.4 }} />
                  <Bar dataKey="value" fill="#8c7cff" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
