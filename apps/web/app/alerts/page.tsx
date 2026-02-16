'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, X, Loader2, Package } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  time: string;
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const statsRes = await api.get('/api/inventory/stats');
        const generatedAlerts: Alert[] = [];

        // Generate alerts from low-stock items
        if (statsRes.data.lowStockItems) {
          for (const item of statsRes.data.lowStockItems) {
            const alertType = item.status === 'OUT_OF_STOCK' ? 'critical' : 'warning';
            generatedAlerts.push({
              id: `stock-${item.id}`,
              type: alertType,
              message: item.status === 'OUT_OF_STOCK' 
                ? `Out of stock: ${item.name} (SKU: ${item.sku})` 
                : `Low stock warning: ${item.name} (SKU: ${item.sku}) — ${Math.round(item.qty)} remaining`,
              time: 'Current',
            });
          }
        }

        // Add system info alert
        if (statsRes.data.totalItems > 0) {
          generatedAlerts.push({
            id: 'system-info',
            type: 'info',
            message: `Inventory tracking ${statsRes.data.totalItems} items (${statsRes.data.activeItems} active)`,
            time: 'System',
          });
        }

        // If no stock issues, show success
        if (statsRes.data.lowStockItems?.length === 0) {
          generatedAlerts.push({
            id: 'all-good',
            type: 'success',
            message: 'All inventory levels are healthy — no stock alerts',
            time: 'System',
          });
        }

        setAlerts(generatedAlerts);
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
        setAlerts([{
          id: 'error',
          type: 'warning',
          message: 'Unable to fetch inventory data for alerts',
          time: 'Now',
        }]);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, []);

  const removeAlert = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const clearAll = () => {
    setDismissed(new Set(alerts.map(a => a.id)));
  };

  const visibleAlerts = alerts.filter(a => !dismissed.has(a.id));

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/10 via-orange-900/10 to-yellow-900/10 pointer-events-none" />
        
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              System Alerts
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Stay informed about critical updates and warnings
            </motion.p>
          </div>
          
          <button 
            onClick={clearAll}
            className="text-sm text-gray-400 hover:text-white transition-colors underline"
          >
            Clear All
          </button>
        </header>

        <div className="space-y-4 max-w-4xl relative z-10">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <Loader2 size={32} className="animate-spin text-blue-400 mb-4" />
              <p>Checking inventory alerts...</p>
            </div>
          ) : visibleAlerts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>No new alerts</p>
            </div>
          ) : (
            visibleAlerts.map((alert, index) => (
              <AlertCard key={alert.id} alert={alert} index={index} onDismiss={() => removeAlert(alert.id)} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function AlertCard({ alert, index, onDismiss }: { alert: Alert, index: number, onDismiss: () => void }) {
  const icons = {
    critical: <AlertTriangle className="text-red-500" size={24} />,
    warning: <AlertTriangle className="text-orange-500" size={24} />,
    info: <Info className="text-blue-500" size={24} />,
    success: <CheckCircle className="text-emerald-500" size={24} />,
  };

  const colors = {
    critical: 'border-red-500/20 bg-red-500/5',
    warning: 'border-orange-500/20 bg-orange-500/5',
    info: 'border-blue-500/20 bg-blue-500/5',
    success: 'border-emerald-500/20 bg-emerald-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`p-4 rounded-2xl border flex items-start justify-between group relative ${colors[alert.type]}`}
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {icons[alert.type]}
        </div>
        <div>
          <p className="font-medium text-white mb-1">{alert.message}</p>
          <span className="text-xs text-gray-500">{alert.time}</span>
        </div>
      </div>
      
      <button 
        onClick={onDismiss}
        className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
      >
        <X size={16} />
      </button>
    </motion.div>
  );
}
