'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart, Area, Legend
} from 'recharts';
import {
  Calendar, Download, TrendingUp, Zap, Loader2, Package, DollarSign,
  Truck, Clock, AlertTriangle, CheckCircle, RefreshCw, Save, Trash2,
  Plus, Search, Eye, Building2, Activity, BarChart3, FileText,
  Settings, ChevronDown, X, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '../../lib/api';
import { useToast } from '../../components/ui/Toast';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#ec4899', '#84cc16'];
const TAB_KEYS = ['overview', 'suppliers', 'forecast', 'reports'] as const;

interface SavedReport {
  id: string;
  name: string;
  type: string;
  config: any;
  created_at: string;
}

export default function AnalyticsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<typeof TAB_KEYS[number]>('overview');

  // Data states
  const [loading, setLoading] = useState(true);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [topMovers, setTopMovers] = useState<any[]>([]);
  const [abcData, setAbcData] = useState<any>(null);
  const [turnoverData, setTurnoverData] = useState<any[]>([]);

  // Supplier analytics
  const [supplierSpend, setSupplierSpend] = useState<any>(null);
  const [leadTimeStats, setLeadTimeStats] = useState<any>(null);

  // Forecast accuracy
  const [forecastAccuracy, setForecastAccuracy] = useState<any[]>([]);

  // Reports
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [reportName, setReportName] = useState('');

  // Filters
  const [dateRange, setDateRange] = useState('30');

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        statsRes, historyRes, forecastRes, summaryRes,
        moversRes, abcRes, turnoverRes, accuracyRes,
        reportsRes, supplierSpendRes, leadTimeRes
      ] = await Promise.allSettled([
        api.get('/api/inventory/stats'),
        api.get(`/api/inventory/analytics/history?days=${dateRange}`),
        api.get('/api/inventory/analytics/forecast'),
        api.get('/api/inventory/analytics/summary'),
        api.get('/api/inventory/analytics/top-movers?limit=10'),
        api.get('/api/inventory/analytics/abc-classification'),
        api.get(`/api/inventory/analytics/turnover?months=6`),
        api.get('/api/inventory/analytics/forecast-accuracy'),
        api.get('/api/inventory/reports'),
        api.get('/api/suppliers/analytics/spend'),
        api.get('/api/suppliers/analytics/lead-times'),
      ]);

      if (statsRes.status === 'fulfilled') {
        const d = statsRes.value.data;
        if (d.categories?.length) setCategoryData(d.categories);
      }
      if (historyRes.status === 'fulfilled') setHistoryData(historyRes.value.data?.slice(-30) || []);
      if (forecastRes.status === 'fulfilled') setForecastData(forecastRes.value.data || []);
      if (summaryRes.status === 'fulfilled') setSummaryData(summaryRes.value.data);
      if (moversRes.status === 'fulfilled') setTopMovers(moversRes.value.data || []);
      if (abcRes.status === 'fulfilled') setAbcData(abcRes.value.data);
      if (turnoverRes.status === 'fulfilled') setTurnoverData(turnoverRes.value.data || []);
      if (accuracyRes.status === 'fulfilled') setForecastAccuracy(accuracyRes.value.data || []);
      if (reportsRes.status === 'fulfilled') setSavedReports(reportsRes.value.data || []);
      if (supplierSpendRes.status === 'fulfilled') setSupplierSpend(supplierSpendRes.value.data);
      if (leadTimeRes.status === 'fulfilled') setLeadTimeStats(leadTimeRes.value.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => { fetchAllData(); }, [fetchAllData]);

  const handleExportPDF = async () => {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text('Analytics Report', pageWidth / 2, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

    let y = 40;
    if (summaryData) {
      doc.setFontSize(14);
      doc.text('Key Metrics', 14, y); y += 8;
      doc.setFontSize(10);
      doc.text(`Total Value: $${(summaryData.totalValue || 0).toLocaleString()}`, 14, y); y += 6;
      doc.text(`SKU Count: ${summaryData.skuCount || 0}`, 14, y); y += 6;
      doc.text(`Low Stock Items: ${summaryData.lowStockCount || 0}`, 14, y); y += 6;
      doc.text(`Inventory Turnover: ${summaryData.inventoryTurnover || 0}x`, 14, y); y += 10;
    }

    if (topMovers.length > 0) {
      doc.setFontSize(14);
      doc.text('Top Moving Items', 14, y); y += 8;
      (doc as any).autoTable({
        startY: y,
        head: [['Item', 'SKU', 'Movements', 'Net Flow']],
        body: topMovers.map((m: any) => [m.name, m.sku, m.movementCount, m.netFlow]),
        styles: { fontSize: 9 },
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    if (abcData?.items?.length > 0) {
      if (y > 240) { doc.addPage(); y = 20; }
      doc.setFontSize(14);
      doc.text('ABC Classification', 14, y); y += 8;
      (doc as any).autoTable({
        startY: y,
        head: [['Class', 'Items', 'Value']],
        body: Object.entries(abcData.classes).map(([cls, data]: any) => [cls, data.count, `$${data.value.toLocaleString()}`]),
        styles: { fontSize: 9 },
      });
    }

    doc.save('analytics_report.pdf');
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) return;
    try {
      await api.post('/api/inventory/reports', {
        name: reportName.trim(),
        type: activeTab,
        config: { dateRange, tab: activeTab },
      });
      toast('Report saved', 'success');
      setShowSaveModal(false);
      setReportName('');
      fetchAllData();
    } catch (err) {
      toast('Failed to save report', 'error');
    }
  };

  const handleDeleteReport = async (id: string) => {
    try {
      await api.delete(`/api/inventory/reports/${id}`);
      toast('Report deleted', 'success');
      setSavedReports(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      toast('Failed to delete report', 'error');
    }
  };

  const handleLoadReport = (report: SavedReport) => {
    if (report.config?.tab && TAB_KEYS.includes(report.config.tab)) setActiveTab(report.config.tab as any);
    if (report.config?.dateRange) setDateRange(report.config.dateRange);
    toast(`Loaded: ${report.name}`, 'info');
  };

  const TABS: { key: typeof TAB_KEYS[number]; label: string; icon: any }[] = [
    { key: 'overview', label: 'Overview', icon: BarChart3 },
    { key: 'suppliers', label: 'Suppliers', icon: Building2 },
    { key: 'forecast', label: 'Forecast', icon: Activity },
    { key: 'reports', label: 'Reports', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/10 via-purple-900/10 to-pink-900/10 pointer-events-none" />

        <header className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Analytics & Reports
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1">
              Deep dive into your inventory performance and sales trends
            </motion.p>
          </div>
          <div className="flex space-x-3">
            <Link href="/analytics/agent"
              className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl shadow-lg shadow-indigo-500/20 flex items-center transition-all transform hover:scale-105">
              <Zap size={18} className="mr-2" />
              AI Agent
            </Link>
            {activeTab !== 'reports' && (
              <>
                <button onClick={() => setShowSaveModal(true)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
                  <Save size={18} className="mr-2" />
                  Save Report
                </button>
                <button onClick={handleExportPDF}
                  className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-500/20 rounded-xl hover:bg-blue-600/30 transition-colors flex items-center">
                  <Download size={18} className="mr-2" />
                  Export PDF
                </button>
              </>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 relative z-10 bg-white/5 p-1 rounded-2xl border border-white/10 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}>
                <Icon size={16} className="mr-2" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Date Range Filter */}
        {activeTab === 'overview' && (
          <div className="flex items-center space-x-2 mb-6 relative z-10">
            <Calendar size={16} className="text-gray-400" />
            {['7', '30', '90'].map(d => (
              <button key={d} onClick={() => setDateRange(d)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  dateRange === d
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-black/20 border-white/10 text-gray-400 hover:text-white'
                }`}>
                {d}d
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64 relative z-10">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
              {activeTab === 'overview' && <OverviewTab
                summaryData={summaryData} historyData={historyData}
                categoryData={categoryData} forecastData={forecastData}
                topMovers={topMovers} abcData={abcData}
                turnoverData={turnoverData} dateRange={dateRange}
              />}
              {activeTab === 'suppliers' && <SuppliersTab
                supplierSpend={supplierSpend} leadTimeStats={leadTimeStats}
              />}
              {activeTab === 'forecast' && <ForecastTab forecastAccuracy={forecastAccuracy} />}
              {activeTab === 'reports' && <ReportsTab
                savedReports={savedReports}
                onLoad={handleLoadReport}
                onDelete={handleDeleteReport}
              />}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Save Report Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowSaveModal(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-4">Save Report Configuration</h2>
                <input value={reportName} onChange={e => setReportName(e.target.value)}
                  placeholder="Enter report name..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 mb-4"
                  onKeyDown={e => e.key === 'Enter' && handleSaveReport()}
                />
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setShowSaveModal(false)}
                    className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                  <button onClick={handleSaveReport} disabled={!reportName.trim()}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium disabled:opacity-50">Save</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// ─── Tab Components ────────────────────────────────────────────

function OverviewTab({
  summaryData, historyData, categoryData, forecastData,
  topMovers, abcData, turnoverData, dateRange
}: any) {
  const chartData = historyData.length > 0
    ? historyData.slice(-parseInt(dateRange)).map((d: any) => ({
        name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round(d.value || 0),
        quantity: d.quantity || 0,
      }))
    : [];

  const fmt = (n: number) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
  const toTitle = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A';

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {summaryData && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total Value', value: `$${fmt(summaryData.totalValue)}`, icon: DollarSign, color: 'emerald' },
            { label: 'SKU Count', value: fmt(summaryData.skuCount), icon: Package, color: 'blue' },
            { label: 'Turnover Rate', value: `${summaryData.inventoryTurnover}x`, icon: RefreshCw, color: 'purple' },
            { label: 'Low Stock Items', value: fmt(summaryData.lowStockCount), icon: AlertTriangle, color: 'amber' },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-xs uppercase">{kpi.label}</p>
                  <p className="text-xl font-bold text-white">{kpi.value}</p>
                </div>
                <div className={`p-2 bg-${kpi.color}-500/10 rounded-lg`}>
                  <Icon className={`text-${kpi.color}-500`} size={20} />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Value Trend */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-400" />
            Inventory Value Trend
          </h3>
          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} tickFormatter={v => `$${fmt(v)}`} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: '#ffffff05' }}
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="left" dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Value ($)" />
                  <Line yAxisId="right" type="monotone" dataKey="quantity" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Quantity" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <TrendingUp size={48} className="mb-4 opacity-30" />
                <p>No history data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-6">Inventory by Category</h3>
          <div className="h-[280px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData.length > 0 ? categoryData : [{ name: 'No Data', value: 1 }]}
                  cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                  {categoryData.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="rgba(0,0,0,0)" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {categoryData.map((entry: any, i: number) => (
              <div key={i} className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm text-gray-400">{toTitle(entry.name)} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Turnover Trend */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <RefreshCw size={20} className="mr-2 text-purple-400" />
            Inventory Turnover Trend
          </h3>
          <div className="h-[280px] w-full">
            {turnoverData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={turnoverData.map((d: any) => ({
                  name: new Date(d.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
                  turnover: Number(d.turnoverRate.toFixed(2)),
                  usage: Math.round(d.unitsUsed),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="right" dataKey="usage" fill="#10b981" opacity={0.3} radius={[4, 4, 0, 0]} name="Units Used" />
                  <Line yAxisId="left" type="monotone" dataKey="turnover" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4 }} name="Turnover Rate" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <RefreshCw size={48} className="opacity-30" />
                <p className="ml-4">Insufficient data for turnover trend</p>
              </div>
            )}
          </div>
        </div>

        {/* ABC Classification */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <BarChart3 size={20} className="mr-2 text-amber-400" />
            ABC Classification
          </h3>
          {abcData?.classes ? (
            <div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'A (80%)', value: abcData.classes.A.value, count: abcData.classes.A.count, fill: '#ef4444' },
                    { name: 'B (15%)', value: abcData.classes.B.value, count: abcData.classes.B.count, fill: '#f59e0b' },
                    { name: 'C (5%)', value: abcData.classes.C.value, count: abcData.classes.C.count, fill: '#10b981' },
                  ]}
                    layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                    <XAxis type="number" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                    <YAxis type="category" dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                      formatter={(val: any, name: any) => [`$${Number(val).toLocaleString()}`, name]} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {[{ name: 'A', fill: '#ef4444' }, { name: 'B', fill: '#f59e0b' }, { name: 'C', fill: '#10b981' }].map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {Object.entries(abcData.classes).map(([cls, data]: any) => (
                  <div key={cls} className={`p-3 rounded-xl border text-center ${
                    cls === 'A' ? 'bg-red-500/10 border-red-500/20' : cls === 'B' ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                  }`}>
                    <p className={`text-lg font-bold ${
                      cls === 'A' ? 'text-red-400' : cls === 'B' ? 'text-amber-400' : 'text-emerald-400'
                    }`}>Class {cls}</p>
                    <p className="text-xs text-gray-400">{data.count} items · ${(data.value / 1000).toFixed(0)}k</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              <BarChart3 size={48} className="opacity-30" />
              <p className="ml-4">No data for ABC analysis</p>
            </div>
          )}
        </div>

        {/* Top Movers */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <Activity size={20} className="mr-2 text-cyan-400" />
            Top Moving Items
          </h3>
          {topMovers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3 text-right">Movements</th>
                    <th className="px-4 py-3 text-right">In</th>
                    <th className="px-4 py-3 text-right">Out</th>
                    <th className="px-4 py-3 text-right">Net Flow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {topMovers.map((item: any) => (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-400">{item.sku}</td>
                      <td className="px-4 py-3 text-sm text-gray-400">{item.category || '—'}</td>
                      <td className="px-4 py-3 text-right text-white">{item.movementCount}</td>
                      <td className="px-4 py-3 text-right text-emerald-400">{Math.round(item.totalIn)}</td>
                      <td className="px-4 py-3 text-right text-red-400">{Math.round(item.totalOut)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={item.netFlow >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {item.netFlow >= 0 ? '+' : ''}{Math.round(item.netFlow)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              <Activity size={48} className="opacity-30" />
              <p className="ml-4">No movement data available</p>
            </div>
          )}
        </div>

        {/* Forecast */}
        <div className="p-6 glass-dark rounded-3xl border border-white/10 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-green-400" />
            Demand Forecast (Next 30 Days)
          </h3>
          <div className="h-[280px] w-full">
            {forecastData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData.map((d: any) => ({
                  name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                  value: Math.round(d.value || 0),
                  lower: Math.round(d.lower || 0),
                  upper: Math.round(d.upper || 0),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={10} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="upper" stroke="none" fill="#10b981" fillOpacity={0.15} />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="#10b981" fillOpacity={0.05} />
                  <Line type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} dot={false} name="Predicted Demand" />
                  <Line type="monotone" dataKey="upper" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Upper Bound" />
                  <Line type="monotone" dataKey="lower" stroke="#10b981" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Lower Bound" />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <TrendingUp size={48} className="opacity-30" />
                <p className="ml-4">No forecast data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SuppliersTab({ supplierSpend, leadTimeStats }: any) {
  const spendData = supplierSpend?.suppliers || [];
  const leadData = leadTimeStats?.bySupplier || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* KPI Cards */}
      <div className="lg:col-span-2 grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Total Suppliers</p>
          <p className="text-xl font-bold text-white">{supplierSpend?.supplierCount || 0}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Total Spend</p>
          <p className="text-xl font-bold text-white">${(supplierSpend?.totalSpend || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Avg Spend/Supplier</p>
          <p className="text-xl font-bold text-white">${(supplierSpend?.avgSpendPerSupplier || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Spend by Supplier */}
      <div className="p-6 glass-dark rounded-3xl border border-white/10">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <DollarSign size={20} className="mr-2 text-amber-400" />
          Spend by Supplier
        </h3>
        {spendData.length > 0 ? (
          <div className="space-y-3">
            {spendData.map((s: any) => {
              const pct = supplierSpend.totalSpend > 0 ? (s.totalSpend / supplierSpend.totalSpend * 100) : 0;
              return (
                <div key={s.id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-white">{s.name}</span>
                    <span className="text-gray-400">${s.totalSpend.toLocaleString()}</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-[200px] text-gray-500">
            <DollarSign size={48} className="opacity-30" />
            <p className="ml-4">No spend data available</p>
          </div>
        )}
      </div>

      {/* Lead Time Stats */}
      <div className="p-6 glass-dark rounded-3xl border border-white/10">
        <h3 className="text-lg font-semibold mb-6 flex items-center">
          <Clock size={20} className="mr-2 text-blue-400" />
          Lead Time by Supplier
        </h3>
        <div className="h-[280px] w-full">
          {leadData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadData.map((s: any) => ({
                name: s.supplierName?.length > 12 ? s.supplierName.slice(0, 12) + '…' : s.supplierName,
                leadTime: Number(s.avgLeadTime.toFixed(1)),
              }))} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                <XAxis type="number" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} width={100} />
                <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  formatter={(val: any) => [`${val} days`, 'Avg Lead Time']} />
                <Bar dataKey="leadTime" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Avg Lead Time (days)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Clock size={48} className="opacity-30" />
              <p className="ml-4">No lead time data</p>
            </div>
          )}
        </div>
      </div>

      {/* Lead time detail table */}
      {leadTimeStats?.stats?.length > 0 && (
        <div className="lg:col-span-2 p-6 glass-dark rounded-3xl border border-white/10">
          <h3 className="text-lg font-semibold mb-4">Lead Time Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="text-gray-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3 text-right">Avg Days</th>
                  <th className="px-4 py-3 text-right">Std Dev</th>
                  <th className="px-4 py-3 text-right">Samples</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leadTimeStats.stats.map((s: any, i: number) => (
                  <tr key={i} className="hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white">{s.supplierName}</td>
                    <td className="px-4 py-3 text-gray-300">{s.itemName || '—'}</td>
                    <td className="px-4 py-3 text-gray-400">{s.locationName || '—'}</td>
                    <td className="px-4 py-3 text-right text-white">{s.avgLeadTimeDays?.toFixed(1)}d</td>
                    <td className="px-4 py-3 text-right text-gray-400">±{s.stddevLeadTimeDays?.toFixed(1)}d</td>
                    <td className="px-4 py-3 text-right text-gray-400">{s.sampleCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ForecastTab({ forecastAccuracy }: any) {
  const models = [...new Set(forecastAccuracy.map((f: any) => f.model))];
  const windows = [...new Set(forecastAccuracy.map((f: any) => f.windowDays))];

  const accuracyData = forecastAccuracy.map((f: any) => ({
    ...f,
    model: f.model,
    windowLabel: `${f.windowDays}d`,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Models Tracked</p>
          <p className="text-xl font-bold text-white">{models.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">{models.join(', ') || 'None'}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Best MAPE</p>
          <p className="text-xl font-bold text-emerald-400">
            {accuracyData.length > 0
              ? `${Math.min(...accuracyData.map((f: any) => f.mape)).toFixed(1)}%`
              : '—'}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <p className="text-gray-400 text-xs uppercase">Data Points</p>
          <p className="text-xl font-bold text-white">
            {accuracyData.reduce((s: number, f: any) => s + f.dataPoints, 0) || 0}
          </p>
        </div>
      </div>

      {accuracyData.length > 0 ? (
        <>
          {/* Model Comparison Chart */}
          <div className="p-6 glass-dark rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-6">Model Comparison by Window</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={accuracyData.map((f: any) => ({
                  name: `${f.model} ${f.windowDays}d`,
                  mape: Number(f.mape.toFixed(1)),
                  mae: Number(f.mae.toFixed(0)),
                  rmse: Number(f.rmse.toFixed(0)),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} label={{ value: 'MAPE %', angle: -90, position: 'insideLeft', fill: '#fff', fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#ffffff50" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar yAxisId="right" dataKey="mae" fill="#3b82f6" radius={[4, 4, 0, 0]} name="MAE" />
                  <Bar yAxisId="right" dataKey="rmse" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="RMSE" />
                  <Line yAxisId="left" type="monotone" dataKey="mape" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} name="MAPE %" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Accuracy Table */}
          <div className="p-6 glass-dark rounded-3xl border border-white/10">
            <h3 className="text-lg font-semibold mb-4">Forecast Accuracy Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-gray-400 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Model</th>
                    <th className="px-4 py-3">Window</th>
                    <th className="px-4 py-3 text-right">MAE</th>
                    <th className="px-4 py-3 text-right">RMSE</th>
                    <th className="px-4 py-3 text-right">MAPE</th>
                    <th className="px-4 py-3 text-right">Data Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {accuracyData.sort((a: any, b: any) => a.mape - b.mape).map((f: any, i: number) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 text-white font-medium">{f.model}</td>
                      <td className="px-4 py-3 text-gray-400">{f.windowDays} days</td>
                      <td className="px-4 py-3 text-right text-white">{f.mae.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-white">{f.rmse.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`font-medium ${
                          f.mape < 10 ? 'text-emerald-400' : f.mape < 25 ? 'text-amber-400' : 'text-red-400'
                        }`}>{f.mape.toFixed(1)}%</span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-400">{f.dataPoints}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Activity size={64} className="mb-4 opacity-30" />
          <p className="text-lg">No forecast accuracy data</p>
          <p className="text-sm mt-1">Data will appear after forecasts are generated and evaluated</p>
        </div>
      )}
    </div>
  );
}

function ReportsTab({ savedReports, onLoad, onDelete }: any) {
  return (
    <div className="p-6 glass-dark rounded-3xl border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center">
          <FileText size={20} className="mr-2 text-indigo-400" />
          Saved Reports
        </h3>
      </div>

      {savedReports.length > 0 ? (
        <div className="space-y-3">
          {savedReports.map((report: any) => (
            <div key={report.id}
              className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors group">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <FileText size={20} className="text-indigo-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{report.name}</p>
                  <p className="text-xs text-gray-500">
                    {report.type} · {new Date(report.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onLoad(report)}
                  className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Load">
                  <Eye size={16} />
                </button>
                <button onClick={() => onDelete(report.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-48 text-gray-500">
          <FileText size={48} className="mb-4 opacity-30" />
          <p>No saved reports yet</p>
          <p className="text-sm mt-1">Go to Overview, Suppliers, or Forecast tabs and click "Save Report"</p>
        </div>
      )}
    </div>
  );
}
