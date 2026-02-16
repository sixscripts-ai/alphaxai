'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { Sidebar } from '../../components/ui/Sidebar';
import { StatCard } from '../../components/ui/StatCard';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Search,
  Bell,
  User,
  DollarSign,
  Activity,
  Clock,
  PieChart as PieIcon,
  RefreshCw
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceLine,
  BarChart,
  Bar,
  ComposedChart
} from 'recharts';
import api from '../../lib/api';

interface DashboardData {
  locationsCount: number;
  itemsCount: number;
  lowStockCount: number;
  inventoryValue: number;
  workingCapital: number;
  turnoverRate: number;
  fillRate: number;
  daysInventoryRemaining: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    locationsCount: 0,
    itemsCount: 0,
    lowStockCount: 0,
    inventoryValue: 0,
    workingCapital: 0,
    turnoverRate: 0,
    fillRate: 0,
    daysInventoryRemaining: 0
  });
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [riskItems, setRiskItems] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, forecastRes, locationsRes, statsRes] = await Promise.all([
          api.get('/api/inventory/analytics/summary'),
          api.get('/api/inventory/analytics/forecast').catch(() => ({ data: [] })),
          api.get('/api/locations'),
          api.get('/api/inventory/stats'),
        ]);
        
        const summary = summaryRes.data;
        const stats = statsRes.data;
        const totalItems = stats.totalItems || 0;
        const lowStockCount = (stats.lowStock || 0) + (stats.outOfStock || 0);
        
        // Compute fill rate: % of items NOT low-stock
        const fillRate = totalItems > 0 ? Math.round(((totalItems - lowStockCount) / totalItems) * 1000) / 10 : 100;
        
        setData({
          locationsCount: locationsRes.data.length,
          itemsCount: totalItems,
          lowStockCount: lowStockCount,
          inventoryValue: summary.totalValue,
          workingCapital: summary.totalValue * 0.8,
          turnoverRate: summary.inventoryTurnover,
          fillRate,
          daysInventoryRemaining: totalItems > 0 ? Math.round(30 * fillRate / 100) : 0,
        });

        // Risk items from real low-stock data
        if (stats.lowStockItems && stats.lowStockItems.length > 0) {
          setRiskItems(stats.lowStockItems.slice(0, 5).map((item: any) => ({
            name: item.name,
            factor: item.status === 'OUT_OF_STOCK' ? 'Stockout' : 'Low Stock',
            score: item.status === 'OUT_OF_STOCK' ? 95 : Math.max(50, Math.round(100 - (item.qty / item.reorder_point) * 100)),
          })));
        }

        // Category data for aging chart (repurpose as category breakdown)
        if (stats.categories && stats.categories.length > 0) {
          setCategoryData(stats.categories.slice(0, 6).map((c: any) => ({
            range: c.name,
            value: c.value,
            items: c.value,
          })));
        }

        // Format forecast data for chart
        if (forecastRes.data && forecastRes.data.length > 0) {
          const formattedForecast = forecastRes.data.map((f: any) => ({
              name: new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              demand: f.value,
              forecast: f.value,
              confidenceLower: f.lower,
              confidenceUpper: f.upper,
          }));
          setForecastData(formattedForecast);
        }

      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-blue-500/30">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-emerald-900/10 pointer-events-none" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-10 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Executive Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Enterprise Overview & Financial Health
            </motion.p>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-white/5 border border-white/10 rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 w-64 transition-all"
              />
            </div>
            <button onClick={() => router.push('/inventory?status=LOW_STOCK')} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors relative">
              <Bell size={20} className="text-gray-300" />
              <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0a0a0a]" />
            </button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <User size={20} className="text-white" />
            </div>
          </div>
        </header>

        {/* Financial & Operational KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
          <StatCard 
            title="Working Capital" 
            value={`$${data.workingCapital.toLocaleString()}`} 
            change="+12%"
            icon={DollarSign} 
            color="emerald" 
            delay={0.1}
            subtext="Tied up in inventory"
            onDrillDown={() => router.push('/inventory')}
          />
          <StatCard 
            title="Inventory Turnover" 
            value={data.turnoverRate} 
            change="+0.4"
            icon={RefreshCw} 
            color="blue" 
            delay={0.2}
            subtext="Turns per year"
            onDrillDown={() => router.push('/analytics/agent')}
          />
           <StatCard 
            title="Fill Rate" 
            value={`${data.fillRate}%`} 
            change="-0.2%"
            icon={Activity} 
            color="purple" 
            delay={0.3}
            subtext="Order fulfillment accuracy"
            onDrillDown={() => router.push('/inventory?status=LOW_STOCK')}
          />
          <StatCard 
            title="Days Remaining" 
            value={data.daysInventoryRemaining} 
            change="-2"
            icon={Clock} 
            color="amber" 
            delay={0.4}
            subtext="Average stock cover"
            onDrillDown={() => router.push('/inventory')}
          />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
             <div className="md:col-span-1 p-4 rounded-2xl glass-dark border border-white/10 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase font-medium">Total SKU Count</p>
                    <p className="text-2xl font-bold text-white">{data.itemsCount}</p>
                </div>
                <Package className="text-gray-500" size={24} />
             </div>
             <div className="md:col-span-1 p-4 rounded-2xl glass-dark border border-white/10 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase font-medium">Locations</p>
                    <p className="text-2xl font-bold text-white">{data.locationsCount}</p>
                </div>
                <Building2 className="text-gray-500" size={24} />
             </div>
             <div className="md:col-span-1 p-4 rounded-2xl glass-dark border border-white/10 flex items-center justify-between border-l-4 border-l-red-500">
                <div>
                    <p className="text-gray-400 text-xs uppercase font-medium">Critical Alerts</p>
                    <p className="text-2xl font-bold text-white">{data.lowStockCount}</p>
                </div>
                <AlertTriangle className="text-red-500" size={24} />
             </div>
             <div className="md:col-span-1 p-4 rounded-2xl glass-dark border border-white/10 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase font-medium">Inventory Value</p>
                    <p className="text-2xl font-bold text-white">${data.inventoryValue.toLocaleString()}</p>
                </div>
                <DollarSign className="text-gray-500" size={24} />
             </div>
        </div>

        {/* Advanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10 relative z-10">
          {/* Forecast Chart with Confidence Intervals */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-2 p-6 glass-dark rounded-3xl border border-white/10"
          >
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold flex items-center">
                <TrendingUp size={20} className="mr-2 text-blue-400" />
                Demand Forecast & Confidence
                </h3>
                <div className="flex items-center space-x-2">
                    <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div> Demand</span>
                    <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-purple-500 mr-1"></div> Forecast</span>
                    <span className="flex items-center text-xs text-gray-400"><div className="w-2 h-2 rounded-full bg-red-500/50 mr-1"></div> Reorder Point</span>
                </div>
            </div>
            
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                  <XAxis dataKey="name" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  {/* Confidence Interval Band */}
                  <Area type="monotone" dataKey="confidenceUpper" stroke="none" fill="url(#colorConfidence)" />
                  <Area type="monotone" dataKey="confidenceLower" stroke="none" fill="#0a0a0a" /> {/* Masking trick for band */}
                  
                  <Line type="monotone" dataKey="demand" stroke="#3b82f6" strokeWidth={2} dot={{r: 4}} name="Actual Demand" />
                  <Line type="monotone" dataKey="forecast" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" name="AI Forecast" />
                  <ReferenceLine y={2000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Reorder Point', fill: '#ef4444', fontSize: 10 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Inventory Breakdown by Category */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 glass-dark rounded-3xl border border-white/10"
          >
            <h3 className="text-lg font-semibold mb-6 flex items-center">
              <Clock size={20} className="mr-2 text-amber-400" />
              Inventory Breakdown
            </h3>
            {categoryData.length > 0 ? (
              <>
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                      <XAxis type="number" stroke="#ffffff50" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis dataKey="range" type="category" stroke="#ffffff80" fontSize={12} tickLine={false} axisLine={false} width={100} />
                      <Tooltip 
                        cursor={{ fill: '#ffffff05' }}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} name="Items" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                    {categoryData.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                            <span className="text-gray-400">{item.range}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">{item.items} items</span>
                        </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                <Package size={40} className="mb-3 opacity-30" />
                <p>No category data yet</p>
              </div>
            )}
          </motion.div>
        </div>

        {/* Risk & Audit Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
            {/* High Risk Items Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-dark rounded-3xl border border-white/10 overflow-hidden"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-red-400 flex items-center">
                        <AlertTriangle size={20} className="mr-2" />
                        High Risk Items
                    </h3>
                    <button onClick={() => router.push('/inventory?status=LOW_STOCK')} className="text-sm text-gray-400 hover:text-white">View All Risk Report</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white/5 text-gray-400 uppercase font-medium">
                            <tr>
                                <th className="px-6 py-3">Item</th>
                                <th className="px-6 py-3">Risk Factor</th>
                                <th className="px-6 py-3">Score</th>
                                <th className="px-6 py-3">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {riskItems.length > 0 ? riskItems.map((item, i) => (
                                <tr key={i} className="hover:bg-white/5">
                                    <td className="px-6 py-4 font-medium text-white">{item.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{item.factor}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <div className="w-16 h-1.5 bg-gray-700 rounded-full mr-2 overflow-hidden">
                                                <div className={`h-full ${item.score > 80 ? 'bg-red-500' : 'bg-orange-500'}`} style={{ width: `${item.score}%` }} />
                                            </div>
                                            <span className={item.score > 80 ? 'text-red-400' : 'text-orange-400'}>{item.score}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={(e) => { e.stopPropagation(); router.push('/inventory'); }} className="text-blue-400 hover:text-blue-300 text-xs font-medium uppercase tracking-wide">Review</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        No high-risk items detected
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Audit Log Preview */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-dark rounded-3xl border border-white/10 overflow-hidden"
            >
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-200 flex items-center">
                        <Activity size={20} className="mr-2" />
                        Audit Log
                    </h3>
                    <button onClick={() => router.push('/inventory')} className="text-sm text-gray-400 hover:text-white">Full History</button>
                </div>
                 <div className="p-6 space-y-6">
                    {data.itemsCount > 0 ? (
                      <>
                        <div className="flex items-start">
                            <div className="w-2 h-2 rounded-full mt-2 mr-4 bg-emerald-500" />
                            <div>
                                <p className="text-sm text-white">Dashboard loaded with live data</p>
                                <p className="text-xs text-gray-500 mt-1">by <span className="text-gray-300">System</span> • Just now</p>
                            </div>
                        </div>
                        <div className="flex items-start">
                            <div className="w-2 h-2 rounded-full mt-2 mr-4 bg-blue-500" />
                            <div>
                                <p className="text-sm text-white">Tracking {data.itemsCount} SKUs across {data.locationsCount} locations</p>
                                <p className="text-xs text-gray-500 mt-1">by <span className="text-gray-300">System</span> • Current</p>
                            </div>
                        </div>
                        {data.lowStockCount > 0 && (
                          <div className="flex items-start">
                              <div className="w-2 h-2 rounded-full mt-2 mr-4 bg-orange-500" />
                              <div>
                                  <p className="text-sm text-white">{data.lowStockCount} items flagged as low/out of stock</p>
                                  <p className="text-xs text-gray-500 mt-1">by <span className="text-gray-300">Alert System</span> • Current</p>
                              </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-6 text-gray-500">
                        <p>No activity yet</p>
                      </div>
                    )}
                </div>
            </motion.div>
        </div>
      </main>
    </div>
  );
}
