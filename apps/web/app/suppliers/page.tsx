'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Truck, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Package,
  Loader2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronDown,
  X,
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  DollarSign,
  RefreshCw,
  Download,
  TrendingUp,
  Building2
} from 'lucide-react';
import api from '../../lib/api';

interface Supplier {
  id: string;
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  total_orders: number;
  total_spend: number;
  rating: number;
  categories: string[];
  created_at: string;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulated data
      setTimeout(() => {
        setSuppliers([
          {
            id: '1',
            name: 'TechParts International',
            contact_person: 'John Smith',
            email: 'john@techparts.com',
            phone: '+1 (555) 123-4567',
            website: 'https://techparts.com',
            address: '123 Tech Blvd, San Jose, CA 95110',
            status: 'ACTIVE',
            total_orders: 145,
            total_spend: 1250000.00,
            rating: 4.8,
            categories: ['Electronics', 'Components'],
            created_at: '2023-06-15T10:30:00Z'
          },
          {
            id: '2',
            name: 'Global Materials Co',
            contact_person: 'Sarah Johnson',
            email: 'sarah@globalmaterials.com',
            phone: '+1 (555) 987-6543',
            website: 'https://globalmaterials.com',
            address: '456 Industrial Way, Chicago, IL 60601',
            status: 'ACTIVE',
            total_orders: 89,
            total_spend: 850000.00,
            rating: 4.5,
            categories: ['Raw Materials', 'Packaging'],
            created_at: '2023-08-20T14:22:00Z'
          },
          {
            id: '3',
            name: 'FastShip Logistics',
            contact_person: 'Mike Wilson',
            email: 'mike@fastship.com',
            phone: '+1 (555) 456-7890',
            website: 'https://fastship.com',
            address: '789 Logistics Ave, Memphis, TN 38103',
            status: 'ACTIVE',
            total_orders: 234,
            total_spend: 450000.00,
            rating: 4.2,
            categories: ['Shipping', 'Logistics'],
            created_at: '2023-01-10T09:15:00Z'
          },
          {
            id: '4',
            name: 'EcoPack Solutions',
            contact_person: 'Emily Davis',
            email: 'emily@ecopack.com',
            phone: '+1 (555) 321-0987',
            website: 'https://ecopack.com',
            address: '321 Green St, Portland, OR 97201',
            status: 'PENDING',
            total_orders: 12,
            total_spend: 25000.00,
            rating: 4.0,
            categories: ['Packaging', 'Sustainability'],
            created_at: '2024-01-05T16:45:00Z'
          },
          {
            id: '5',
            name: 'MetalWorks Inc',
            contact_person: 'Robert Brown',
            email: 'robert@metalworks.com',
            phone: '+1 (555) 654-3210',
            website: 'https://metalworks.com',
            address: '555 Steel Ave, Detroit, MI 48201',
            status: 'INACTIVE',
            total_orders: 0,
            total_spend: 0,
            rating: 3.5,
            categories: ['Metal', 'Manufacturing'],
            created_at: '2022-11-20T11:00:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to fetch suppliers', err);
      setError('Failed to load suppliers. Please try again.');
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.categories.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && supplier.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'INACTIVE':
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-emerald-400';
    if (rating >= 4.0) return 'text-blue-400';
    if (rating >= 3.0) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Calculate summary metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === 'ACTIVE').length;
  const totalSpend = suppliers.reduce((acc, s) => acc + s.total_spend, 0);
  const avgRating = suppliers.length > 0 ? suppliers.reduce((acc, s) => acc + s.rating, 0) / suppliers.length : 0;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-orange-900/10 to-yellow-900/10 pointer-events-none" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Suppliers & Vendors
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Manage your supplier relationships and purchase orders
            </motion.p>
          </div>
          
          <div className="flex space-x-3">
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
              <Download size={18} className="mr-2" />
              Export
            </button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl font-medium shadow-lg shadow-amber-500/20 flex items-center transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Add Supplier
            </motion.button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Suppliers</p>
              <p className="text-xl font-bold text-white">{totalSuppliers}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Truck className="text-blue-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Active</p>
              <p className="text-xl font-bold text-white">{activeSuppliers}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Spend</p>
              <p className="text-xl font-bold text-white">${(totalSpend / 1000000).toFixed(1)}M</p>
            </div>
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <DollarSign className="text-amber-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Avg Rating</p>
              <p className="text-xl font-bold text-white">{avgRating.toFixed(1)}</p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <TrendingUp className="text-purple-500" size={20} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search suppliers, contacts, categories..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400 mr-2 flex items-center"><Filter size={16} className="mr-1"/> Status:</span>
            
            {['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === status 
                  ? 'bg-amber-600 border-amber-500 text-white' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Suppliers Table */}
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
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Suppliers</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
              <button 
                onClick={fetchSuppliers}
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
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Contact</th>
                    <th className="px-6 py-4">Categories</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Orders</th>
                    <th className="px-6 py-4">Total Spend</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-4 text-amber-500" size={32} />
                        <p>Loading suppliers...</p>
                      </td>
                    </tr>
                  ) : filteredSuppliers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-20 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                          <Truck className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No suppliers found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {searchTerm ? `No results for "${searchTerm}"` : "Get started by adding your first supplier."}
                        </p>
                        {!searchTerm && (
                          <button 
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors"
                          >
                            Add First Supplier
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredSuppliers.map((supplier) => (
                      <tr key={supplier.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedSupplier(supplier)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold mr-3">
                              {supplier.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium">{supplier.name}</div>
                              <div className="text-xs text-gray-500">{supplier.website}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-white">{supplier.contact_person}</div>
                          <div className="text-xs text-gray-500">{supplier.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {supplier.categories.slice(0, 2).map((cat, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-300">
                                {cat}
                              </span>
                            ))}
                            {supplier.categories.length > 2 && (
                              <span className="px-2 py-0.5 bg-white/5 rounded text-xs text-gray-500">
                                +{supplier.categories.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(supplier.status)}`}>
                            {supplier.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {supplier.total_orders}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">${supplier.total_spend.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-bold ${getRatingColor(supplier.rating)}`}>
                            {supplier.rating.toFixed(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Edit Supplier">
                              <Edit size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete Supplier">
                              <Trash2 size={16} />
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
            <span>Showing {filteredSuppliers.length} suppliers</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
              <span className="px-3 py-1 text-white">Page 1</span>
              <button className="px-3 py-1 rounded-lg hover:bg-white/5" disabled>Next</button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Supplier Details Modal */}
      <AnimatePresence>
        {selectedSupplier && (
          <SupplierDetailsModal 
            supplier={selectedSupplier} 
            onClose={() => setSelectedSupplier(null)} 
          />
        )}
      </AnimatePresence>

      {/* Create Supplier Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateSupplierModal 
            onClose={() => setShowCreateModal(false)} 
            onRefresh={fetchSuppliers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SupplierDetailsModal({ supplier, onClose }: { supplier: Supplier, onClose: () => void }) {
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
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-2xl font-bold mr-4">
              {supplier.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{supplier.name}</h2>
              <p className="text-gray-400">Supplier since {new Date(supplier.created_at).getFullYear()}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${
              supplier.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              supplier.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
              'bg-gray-500/10 text-gray-400 border-gray-500/20'
            }`}>
              {supplier.status}
            </span>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <User className="text-purple-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Contact Person</span>
                </div>
                <p className="text-white font-medium">{supplier.contact_person}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <Mail className="text-blue-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Email</span>
                </div>
                <p className="text-white font-medium">{supplier.email}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <Phone className="text-green-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Phone</span>
                </div>
                <p className="text-white font-medium">{supplier.phone}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <Globe className="text-cyan-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Website</span>
                </div>
                <p className="text-white font-medium">{supplier.website}</p>
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Address</h3>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start">
              <MapPin className="text-amber-400 mr-3 mt-0.5" size={16} />
              <p className="text-white">{supplier.address}</p>
            </div>
          </div>

          {/* Stats */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Performance Stats</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">{supplier.total_orders}</p>
                <p className="text-xs text-gray-400">Total Orders</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-white">${(supplier.total_spend / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-400">Total Spend</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                <p className="text-2xl font-bold text-emerald-400">{supplier.rating}</p>
                <p className="text-xs text-gray-400">Rating</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">
              Edit Supplier
            </button>
            <button className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-white font-medium transition-colors">
              Create PO
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateSupplierModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    categories: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to create supplier', error);
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
          <h2 className="text-xl font-bold text-white">Add New Supplier</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
            <input 
              required
              type="text" 
              placeholder="Enter company name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Contact Person</label>
            <input 
              required
              type="text" 
              placeholder="Full name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              value={formData.contactPerson}
              onChange={e => setFormData({...formData, contactPerson: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input 
                required
                type="email" 
                placeholder="email@company.com"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
              <input 
                required
                type="tel" 
                placeholder="+1 (555) 000-0000"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Website</label>
            <input 
              type="url" 
              placeholder="https://company.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              value={formData.website}
              onChange={e => setFormData({...formData, website: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Address</label>
            <textarea 
              required
              placeholder="Full address"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all h-20 resize-none"
              value={formData.address}
              onChange={e => setFormData({...formData, address: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Categories (comma separated)</label>
            <input 
              type="text" 
              placeholder="Electronics, Components, Shipping"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/50 transition-all"
              value={formData.categories}
              onChange={e => setFormData({...formData, categories: e.target.value})}
            />
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
              disabled={loading}
              className="px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-amber-500/20"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Creating...' : 'Add Supplier'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
