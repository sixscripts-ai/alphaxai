'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { Calendar, Download, TrendingUp, Zap, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];

export default function AnalyticsPage() {
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [statsRes, historyRes] = await Promise.all([
          api.get('/api/inventory/stats'),
          api.get('/api/inventory/analytics/history').catch(() => ({ data: [] })),
        ]);

        // Category data from stats
        if (statsRes.data.categories && statsRes.data.categories.length > 0) {
          setCategoryData(statsRes.data.categories);
        } else {
          setCategoryData([{ name: 'No Data', value: 1 }]);
        }

        // History data for the bar chart
        if (historyRes.data && historyRes.data.length > 0) {
          const formatted = historyRes.data.slice(-7).map((d: any) => ({
            name: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
            value: Math.round(d.value || 0),
            quantity: d.quantity || 0,
          }));
          setHistoryData(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  const handleExport = async () => {
    try {
      const response = await api.get('/api/inventory/items/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'inventory_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-pink-900/10 pointer-events-none" />
        
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Analytics & Reports
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Deep dive into your inventory performance and sales trends
            </motion.p>
          </div>
          
          <div className="flex space-x-3">
            <Link 
                href="/analytics/agent"
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center transition-all transform hover:scale-105"
            >
                <Zap size={18} className="mr-2" />
                Launch AI Agent
            </Link>
            <button 
              onClick={handleExport}
              className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600/30 transition-colors flex items-center"
            >
              <Download size={18} className="mr-2" />
              Export
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 relative z-10">
            <Loader2 className="animate-spin text-blue-400" size={32} />
          </div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 relative z-10">
          {/* Inventory Value / History Trend */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 glass-dark rounded-3xl border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <TrendingUp size={20} className="mr-2 text-blue-400" />
              {historyData.length > 0 ? 'Inventory Value Trend' : 'Inventory Overview'}
            </h3>
            <div className="h-[300px] w-full">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                    <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <Tooltip 
                      cursor={{ fill: '#ffffff05' }}
                      contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Value ($)" />
                    <Bar dataKey="quantity" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Quantity" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <TrendingUp size={48} className="mb-4 opacity-30" />
                  <p>No history data yet</p>
                  <p className="text-sm mt-1">Data will appear after inventory snapshots run</p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Category Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 glass-dark rounded-3xl border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-6">Inventory by Category</h3>
            <div className="h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm text-gray-400">{entry.name} ({entry.value})</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
        )}
      </main>
    </div>
  );
}
