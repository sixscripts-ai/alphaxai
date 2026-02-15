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
  Loader2
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
  location_id: string;
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await api.get('/api/inventory/items');
      setItems(response.data);
    } catch (error) {
      console.error('Failed to fetch items', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-emerald-900/10 pointer-events-none" />
        
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
        </header>

        {/* Filters & Search */}
        <div className="flex space-x-4 mb-6 relative z-10">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
          <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex items-center text-gray-300">
            <Filter size={20} className="mr-2" />
            Filters
          </button>
        </div>

        {/* Inventory Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-dark rounded-3xl border border-white/10 overflow-hidden relative z-10"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 uppercase text-xs font-semibold tracking-wider">
                <tr>
                  <th className="px-6 py-4">Item Details</th>
                  <th className="px-6 py-4">SKU</th>
                  <th className="px-6 py-4">Stock Level</th>
                  <th className="px-6 py-4">Unit Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Loader2 className="animate-spin mx-auto mb-2" size={24} />
                      Loading inventory...
                    </td>
                  </tr>
                ) : filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <Package className="mx-auto mb-2 opacity-50" size={48} />
                      No items found
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
                            <div className="text-xs text-gray-500">{item.description || 'No description'}</div>
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
                        {/* Simple progress bar for stock level relative to reorder point (mock visual) */}
                        <div className="w-24 h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${item.quantity_on_hand <= item.reorder_point ? 'bg-red-500' : 'bg-emerald-500'}`} 
                            style={{ width: '60%' }} // Mock width
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-300">
                        ${item.unit_cost.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        {item.quantity_on_hand <= item.reorder_point ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle size={12} className="mr-1" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle size={12} className="mr-1" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination (Mock) */}
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between text-sm text-gray-500">
            <span>Showing {filteredItems.length} items</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
              <button className="px-3 py-1 rounded-lg hover:bg-white/5">Next</button>
            </div>
          </div>
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl"
      >
        <h2 className="text-xl font-bold text-white mb-6">Add New Item</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Item Name</label>
            <input 
              required
              type="text" 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
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
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={formData.unitCost}
                onChange={e => setFormData({...formData, unitCost: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
            <textarea 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-24 resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Reorder Point</label>
              <input 
                required
                type="number" 
                min="0"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={formData.reorderPoint}
                onChange={e => setFormData({...formData, reorderPoint: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                value={formData.locationId}
                onChange={e => setFormData({...formData, locationId: e.target.value})}
              >
                  {locations.map(loc => (
                      <option key={loc.id} value={loc.id} className="bg-gray-900">{loc.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Item'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
