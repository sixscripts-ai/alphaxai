'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  AlertTriangle, 
  CheckCircle, 
  Package,
  Loader2,
  Download,
  Upload,
  RefreshCw,
  ArrowRightLeft,
  History,
  ShoppingCart,
  XCircle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import api from '../../lib/api';

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  quantity_on_hand: number;
  reorder_point: number;
  unit_cost: number;
  status: 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DEAD_STOCK' | 'OVERSTOCK';
  last_movement_at: string | null;
  location_id: string;
  // Derived fields
  inventory_value?: number;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, LOW_STOCK, OUT_OF_STOCK, ACTIVE
  
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/inventory/items');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items', error);
      setError('Failed to load inventory. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && item.status === statusFilter;
  });

  // Calculate Summary Metrics
  const totalValue = items.reduce((acc, item) => acc + (item.quantity_on_hand * item.unit_cost), 0);
  const lowStockCount = items.filter(i => i.status === 'LOW_STOCK').length;
  const outOfStockCount = items.filter(i => i.status === 'OUT_OF_STOCK').length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-emerald-900/10 pointer-events-none" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Inventory Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Track, organize, and manage your stock across all locations
            </motion.p>
          </div>
          
          <div className="flex space-x-3">
             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
                <Upload size={18} className="mr-2" />
                Import
             </button>
             <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
                <Download size={18} className="mr-2" />
                Export
             </button>
            <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center transition-colors"
            >
                <Plus size={20} className="mr-2" />
                Add Item
            </motion.button>
          </div>
        </header>

        {/* Quick Stats Toolbar */}
        <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                <div>
                    <p className="text-gray-400 text-xs uppercase">Total Value</p>
                    <p className="text-xl font-bold text-white">${totalValue.toLocaleString()}</p>
                </div>
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <CheckCircle className="text-emerald-500" size={20} />
                </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                 <div>
                    <p className="text-gray-400 text-xs uppercase">Low Stock</p>
                    <p className="text-xl font-bold text-white">{lowStockCount}</p>
                </div>
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                    <AlertTriangle className="text-yellow-500" size={20} />
                </div>
            </div>
             <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                 <div>
                    <p className="text-gray-400 text-xs uppercase">Out of Stock</p>
                    <p className="text-xl font-bold text-white">{outOfStockCount}</p>
                </div>
                <div className="p-2 bg-red-500/10 rounded-lg">
                    <XCircle className="text-red-500" size={20} />
                </div>
            </div>
             <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
                 <div>
                    <p className="text-gray-400 text-xs uppercase">Total Items</p>
                    <p className="text-xl font-bold text-white">{items.length}</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Package className="text-blue-500" size={20} />
                </div>
            </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-wrap gap-4 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, SKU or category..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2 overflow-x-auto">
            <span className="text-sm text-gray-400 mr-2 flex items-center"><Filter size={16} className="mr-1"/> Filter:</span>
            
            {['ALL', 'ACTIVE', 'LOW_STOCK', 'OUT_OF_STOCK'].map((status) => (
                 <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        statusFilter === status 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                    {status.replace('_', ' ')}
                </button>
            ))}
          </div>
        </div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-3xl border border-white/10 overflow-hidden relative z-10"
        >
          {error ? (
               <div className="text-center py-20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                      <AlertTriangle className="text-red-500" size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Unable to Load Inventory</h3>
                  <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
                  <button 
                    onClick={fetchItems}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                  >
                      Retry Connection
                  </button>
              </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Item Details</th>
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">Stock Level</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Mov.</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                          <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
                          <p>Syncing with inventory database...</p>
                        </td>
                      </tr>
                    ) : filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                             <Package className="text-gray-400" size={32} />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-1">No items found</h3>
                          <p className="text-sm text-gray-500 mb-6">
                            {searchTerm ? `No results for "${searchTerm}"` : "Get started by adding your first item."}
                          </p>
                          {!searchTerm && (
                              <button 
                                onClick={() => setShowAddModal(true)}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                              >
                                Create First Item
                              </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center text-gray-400 font-bold mr-3 border border-white/10">
                                {item.name.charAt(0)}
                              </div>
                              <div>
                                <div className="font-medium text-white">{item.name}</div>
                                <div className="text-xs text-gray-500 truncate max-w-[150px]">{item.description || 'No description'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-gray-300">
                            {item.sku}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <span className="font-medium text-white mr-2">{item.quantity_on_hand}</span>
                              <span className="text-xs text-gray-500">units</span>
                            </div>
                            {/* Visual Stock Level Indicator */}
                            <div className="w-24 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                    item.quantity_on_hand === 0 ? 'bg-gray-700' :
                                    item.quantity_on_hand <= item.reorder_point ? 'bg-red-500' : 
                                    'bg-emerald-500'
                                }`} 
                                style={{ width: `${Math.min((item.quantity_on_hand / (item.reorder_point * 3)) * 100, 100)}%` }} 
                              />
                            </div>
                            <div className="text-[10px] text-gray-500 mt-0.5">ROP: {item.reorder_point}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-gray-300">${item.unit_cost.toFixed(2)}</div>
                            <div className="text-[10px] text-gray-500">Total: ${(item.unit_cost * item.quantity_on_hand).toLocaleString()}</div>
                          </td>
                          <td className="px-6 py-4">
                             {item.status === 'LOW_STOCK' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                                <AlertTriangle size={12} className="mr-1" />
                                Low Stock
                              </span>
                            )}
                            {item.status === 'OUT_OF_STOCK' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                <XCircle size={12} className="mr-1" />
                                Stockout
                              </span>
                            )}
                            {item.status === 'ACTIVE' && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle size={12} className="mr-1" />
                                Healthy
                              </span>
                            )}
                          </td>
                           <td className="px-6 py-4 text-xs text-gray-400">
                             {item.last_movement_at ? new Date(item.last_movement_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="Adjust Stock">
                                    <RefreshCw size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Transfer">
                                    <ArrowRightLeft size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Reorder">
                                    <ShoppingCart size={16} />
                                </button>
                                <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" title="History">
                                    <History size={16} />
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-500 bg-black/20">
                <span>Showing {filteredItems.length} items</span>
                <div className="flex space-x-2">
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
                  <span className="px-3 py-1 text-white">Page 1</span>
                  <button className="px-3 py-1 rounded-lg hover:bg-white/5" disabled>Next</button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </main>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddItemModal onClose={() => setShowAddModal(false)} onRefresh={fetchItems} />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddItemModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    unitCost: 0,
    reorderPoint: 10,
    locationId: '' // Ideally fetch locations to populate this
  });
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);

  useEffect(() => {
    // Fetch locations for the dropdown
    api.get('/api/locations').then(res => {
        if (res.data.length > 0) {
            setLocations(res.data);
            setFormData(prev => ({ ...prev, locationId: res.data[0].id }));
        }
    }).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/api/inventory/items', formData);
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to create item', error);
      alert('Failed to create item');
    } finally {
      setLoading(false);
    }
  };

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
            <h2 className="text-xl font-bold text-white">Add New Item</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
                <XCircle size={24} />
            </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
            <input 
              required
              type="text" 
              placeholder="e.g. MacBook Pro 16-inch"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">SKU</label>
              <input 
                required
                type="text" 
                placeholder="e.g. MBP-16-M3"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                value={formData.sku}
                onChange={e => setFormData({...formData, sku: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Unit Cost ($)</label>
              <input 
                required
                type="number" 
                min="0"
                step="0.01"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                value={formData.unitCost}
                onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all h-24 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1 flex items-center">
                  Reorder Point
                  <ShieldAlert size={14} className="ml-2 text-gray-500" />
              </label>
              <input 
                required
                type="number" 
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                value={formData.reorderPoint}
                onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Initial Location</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
                value={formData.locationId}
                onChange={e => setFormData({...formData, locationId: e.target.value})}
              >
                  {locations.length === 0 && <option value="">No locations found</option>}
                  {locations.map(loc => (
                      <option key={loc.id} value={loc.id} className="bg-gray-900">{loc.name}</option>
                  ))}
              </select>
              {locations.length === 0 && (
                  <p className="text-xs text-red-400 mt-1">Please create a location first.</p>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t border-white/10">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading || locations.length === 0}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
