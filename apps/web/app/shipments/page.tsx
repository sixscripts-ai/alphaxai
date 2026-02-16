'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { 
  Package, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Truck,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  MapPin,
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  Box,
  Compass,
  Check,
  Circle,
  ChevronRight
} from 'lucide-react';
import api from '../../lib/api';

interface Shipment {
  id: string;
  tracking_number: string;
  carrier: string;
  status: 'PICKED_UP' | 'IN_TRANSIT' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'RETURNED' | 'EXCEPTION';
  origin: string;
  destination: string;
  estimated_delivery: string;
  actual_delivery?: string;
  weight: number;
  dimensions: string;
  cost: number;
  items_count: number;
  created_at: string;
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/shipments');
      setShipments(res.data.map((s: any) => ({ ...s, items_count: s.items_count || 0 })));
    } catch (err) {
      console.error('Failed to fetch shipments', err);
      setError('Failed to load shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Tracking #','Carrier','Status','Origin','Destination','Est. Delivery','Cost'];
    const rows = shipments.map(s => [s.tracking_number, s.carrier, s.status, s.origin, s.destination, s.estimated_delivery, s.cost]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'shipments_export.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = 
      shipment.tracking_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.carrier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && shipment.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PICKED_UP': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'IN_TRANSIT': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'OUT_FOR_DELIVERY': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'DELIVERED': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'RETURNED': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      case 'EXCEPTION': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PICKED_UP': return <Box size={14} />;
      case 'IN_TRANSIT': return <Truck size={14} />;
      case 'OUT_FOR_DELIVERY': return <Compass size={14} />;
      case 'DELIVERED': return <CheckCircle size={14} />;
      case 'RETURNED': return <RefreshCw size={14} />;
      case 'EXCEPTION': return <AlertTriangle size={14} />;
      default: return <Package size={14} />;
    }
  };

  const getTimelineStep = (status: string) => {
    const steps = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
    const currentIndex = steps.indexOf(status);
    if (currentIndex === -1) return 0;
    return currentIndex;
  };

  // Summary metrics
  const inTransitCount = shipments.filter(s => s.status === 'IN_TRANSIT').length;
  const deliveredCount = shipments.filter(s => s.status === 'DELIVERED').length;
  const exceptionCount = shipments.filter(s => s.status === 'EXCEPTION').length;
  const totalShippingCost = shipments.reduce((acc, s) => acc + s.cost, 0);

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/10 via-blue-900/10 to-indigo-900/10 pointer-events-none" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Shipments & Fulfillment
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Track shipments and manage fulfillment across all carriers
            </motion.p>
          </div>
          
          <div className="flex space-x-3">
            <button onClick={exportCSV} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
              <Download size={18} className="mr-2" />
              Export
            </button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl font-medium shadow-lg shadow-cyan-500/20 flex items-center transition-colors"
            >
              <Plus size={20} className="mr-2" />
              New Shipment
            </motion.button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">In Transit</p>
              <p className="text-xl font-bold text-white">{inTransitCount}</p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Truck className="text-purple-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Delivered</p>
              <p className="text-xl font-bold text-white">{deliveredCount}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Exceptions</p>
              <p className="text-xl font-bold text-white">{exceptionCount}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <AlertTriangle className="text-red-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Cost</p>
              <p className="text-xl font-bold text-white">${totalShippingCost.toFixed(2)}</p>
            </div>
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <DollarSign className="text-cyan-500" size={20} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by tracking #, carrier..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400 mr-2 flex items-center"><Filter size={16} className="mr-1"/> Status:</span>
            
            {['ALL', 'PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'EXCEPTION'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === status 
                  ? 'bg-cyan-600 border-cyan-500 text-white' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Shipments Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl border border-white/10 overflow-hidden relative z-10"
        >
          {error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Shipments</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
              <button 
                onClick={fetchShipments}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
              >
                Retry Connection
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-white/5 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Tracking #</th>
                    <th className="px-6 py-4">Carrier</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Origin</th>
                    <th className="px-6 py-4">Destination</th>
                    <th className="px-6 py-4">Est. Delivery</th>
                    <th className="px-6 py-4">Cost</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-4 text-cyan-500" size={32} />
                        <p>Loading shipments...</p>
                      </td>
                    </tr>
                  ) : filteredShipments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                          <Package className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No shipments found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {searchTerm ? `No results for "${searchTerm}"` : "No shipments recorded yet."}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredShipments.map((shipment) => (
                      <tr key={shipment.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedShipment(shipment)}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-cyan-400 font-medium">{shipment.tracking_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <Truck size={16} className="text-gray-400 mr-2" />
                            <span className="text-white">{shipment.carrier}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(shipment.status)}`}>
                            {getStatusIcon(shipment.status)}
                            <span className="ml-1">{shipment.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {shipment.origin}
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {shipment.destination}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(shipment.estimated_delivery).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">${shipment.cost.toFixed(2)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedShipment(shipment); }} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); toast('Edit shipment coming soon', 'info'); }} className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Edit">
                              <Edit size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-500 bg-black/20">
            <span>Showing {filteredShipments.length} shipments</span>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled={currentPage === 1}>Previous</button>
              <span className="px-3 py-1 text-white">Page {currentPage}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled={filteredShipments.length <= currentPage * ITEMS_PER_PAGE}>Next</button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Create Shipment Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateShipmentModal
            onClose={() => setShowCreateModal(false)}
            onCreated={() => { setShowCreateModal(false); fetchShipments(); }}
          />
        )}
      </AnimatePresence>

      {/* Shipment Details Modal */}
      <AnimatePresence>
        {selectedShipment && (
          <ShipmentDetailsModal 
            shipment={selectedShipment} 
            onClose={() => setSelectedShipment(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ShipmentDetailsModal({ shipment, onClose }: { shipment: Shipment, onClose: () => void }) {
  const currentStep = ['PICKED_UP', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].indexOf(shipment.status);
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Shipment Details</h2>
            <p className="text-cyan-400 font-mono mt-1">{shipment.tracking_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>

        {/* Status Timeline */}
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-white/10 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-cyan-500 -translate-y-1/2 z-0 transition-all duration-500"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
            {['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].map((step, idx) => (
              <div key={step} className="relative z-10 flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${idx <= currentStep ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-500'}`}>
                  {idx < currentStep ? <Check size={16} /> : <Circle size={8} className={idx === currentStep ? 'fill-cyan-500' : ''} />}
                </div>
                <span className={`text-xs mt-2 ${idx <= currentStep ? 'text-white' : 'text-gray-500'}`}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><Truck className="text-cyan-400 mr-2" size={16} /><span className="text-xs text-gray-400">Carrier</span></div>
              <p className="text-white font-medium">{shipment.carrier}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><Box className="text-purple-400 mr-2" size={16} /><span className="text-xs text-gray-400">Items</span></div>
              <p className="text-white font-medium">{shipment.items_count} items</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><DollarSign className="text-emerald-400 mr-2" size={16} /><span className="text-xs text-gray-400">Shipping Cost</span></div>
              <p className="text-white font-medium">${shipment.cost.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><MapPin className="text-blue-400 mr-2" size={16} /><span className="text-xs text-gray-400">Origin</span></div>
              <p className="text-white font-medium">{shipment.origin}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><MapPin className="text-amber-400 mr-2" size={16} /><span className="text-xs text-gray-400">Destination</span></div>
              <p className="text-white font-medium">{shipment.destination}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2"><Calendar className="text-purple-400 mr-2" size={16} /><span className="text-xs text-gray-400">Est. Delivery</span></div>
              <p className="text-white font-medium">{new Date(shipment.estimated_delivery).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-8 pt-6 border-t border-white/10">
          <button onClick={() => window.print()} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">Print Label</button>
          <button onClick={() => { const urls: Record<string, string> = { FedEx: 'https://www.fedex.com/fedextrack/?trknbr=', UPS: 'https://www.ups.com/track?tracknum=', DHL: 'https://www.dhl.com/us-en/home/tracking.html?tracking-id=', USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=' }; const base = urls[shipment.carrier] || 'https://www.google.com/search?q=track+'; window.open(base + shipment.tracking_number, '_blank'); }} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 rounded-xl text-white font-medium transition-colors">Track Package</button>
        </div>
      </motion.div>
    </div>
  );
}

function CreateShipmentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [form, setForm] = useState({
    tracking_number: '',
    carrier: '',
    origin: '',
    destination: '',
    estimated_delivery: '',
    weight: '',
    dimensions: '',
    cost: '',
  });

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    if (!form.carrier || !form.origin || !form.destination || !form.estimated_delivery) {
      toast('Carrier, origin, destination, and estimated delivery are required', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.post('/api/shipments', {
        tracking_number: form.tracking_number || undefined,
        carrier: form.carrier,
        origin: form.origin,
        destination: form.destination,
        estimated_delivery: form.estimated_delivery,
        weight: form.weight ? parseFloat(form.weight) : undefined,
        dimensions: form.dimensions || undefined,
        cost: form.cost ? parseFloat(form.cost) : undefined,
      });
      toast('Shipment created successfully', 'success');
      onCreated();
    } catch (err: any) {
      toast(err.response?.data?.error || 'Failed to create shipment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = 'w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-sm';
  const labelCls = 'block text-xs text-gray-400 mb-1';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">New Shipment</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><XCircle size={22} /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Carrier *</label>
              <input className={inputCls} placeholder="e.g. FedEx" value={form.carrier} onChange={e => set('carrier', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Tracking Number</label>
              <input className={inputCls} placeholder="Optional" value={form.tracking_number} onChange={e => set('tracking_number', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Origin *</label>
              <input className={inputCls} placeholder="City, State" value={form.origin} onChange={e => set('origin', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Destination *</label>
              <input className={inputCls} placeholder="City, State" value={form.destination} onChange={e => set('destination', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Est. Delivery *</label>
              <input type="date" className={inputCls} value={form.estimated_delivery} onChange={e => set('estimated_delivery', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Cost ($)</label>
              <input type="number" step="0.01" className={inputCls} placeholder="0.00" value={form.cost} onChange={e => set('cost', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Weight (lbs)</label>
              <input type="number" step="0.1" className={inputCls} placeholder="0.0" value={form.weight} onChange={e => set('weight', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Dimensions</label>
              <input className={inputCls} placeholder='e.g. 12x8x6 in' value={form.dimensions} onChange={e => set('dimensions', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="flex space-x-3 mt-6 pt-4 border-t border-white/10">
          <button onClick={onClose} className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 font-medium transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 rounded-xl text-white font-medium transition-colors flex items-center justify-center">
            {saving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Plus size={16} className="mr-2" />}
            {saving ? 'Creating...' : 'Create Shipment'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
