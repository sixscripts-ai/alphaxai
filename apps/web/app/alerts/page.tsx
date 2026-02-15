'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, X } from 'lucide-react';
import { useState } from 'react';

const initialAlerts = [
  { id: 1, type: 'critical', message: 'Low stock warning: MacBook Pro M3 (SKU: MBP-M3-14)', time: '2 mins ago' },
  { id: 2, type: 'warning', message: 'Unusual sales spike detected in New York Warehouse', time: '1 hour ago' },
  { id: 3, type: 'info', message: 'System maintenance scheduled for Sunday at 2 AM', time: '5 hours ago' },
  { id: 4, type: 'success', message: 'Backup completed successfully', time: '1 day ago' },
];

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(initialAlerts);

  const removeAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
  };

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
            onClick={() => setAlerts([])}
            className="text-sm text-gray-400 hover:text-white transition-colors underline"
          >
            Clear All
          </button>
        </header>

        <div className="space-y-4 max-w-4xl relative z-10">
          {alerts.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              <Bell size={48} className="mx-auto mb-4 opacity-50" />
              <p>No new alerts</p>
            </div>
          ) : (
            alerts.map((alert, index) => (
              <AlertCard key={alert.id} alert={alert} index={index} onDismiss={() => removeAlert(alert.id)} />
            ))
          )}
        </div>
      </main>
    </div>
  );
}

function AlertCard({ alert, index, onDismiss }: { alert: any, index: number, onDismiss: () => void }) {
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
      className={`p-4 rounded-2xl border flex items-start justify-between group relative ${colors[alert.type as keyof typeof colors]}`}
    >
      <div className="flex items-start">
        <div className="mr-4 mt-1">
          {icons[alert.type as keyof typeof icons]}
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
