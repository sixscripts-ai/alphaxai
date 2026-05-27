'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '../../components/ui/Toast';
import { 
  ShoppingCart, 
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
  Calendar,
  DollarSign,
  RefreshCw,
  Download,
  Truck,
  Mail
} from 'lucide-react';
import api from '../../lib/api';

interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total_amount: number;
  items_count: number;
  created_at: string;
  shipping_address: string;
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/orders');
      setOrders(Array.isArray(response.data) ? response.data : (response.data.orders || []));
    } catch (err: any) {
      console.error('Failed to fetch orders', err);
      if (err.response?.status === 501) {
        setError('orders-service-not-implemented');
      } else {
        setError('Failed to load orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && order.status === statusFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'PROCESSING':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'SHIPPED':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DELIVERED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'CANCELLED':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return <Clock size={14} />;
      case 'PROCESSING': return <RefreshCw size={14} />;
      case 'SHIPPED': return <Truck size={14} />;
      case 'DELIVERED': return <CheckCircle size={14} />;
      case 'CANCELLED': return <XCircle size={14} />;
      default: return <Package size={14} />;
    }
  };

  // Calculate summary metrics
  const totalRevenue = orders.reduce((acc, o) => acc + o.total_amount, 0);
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const processingOrders = orders.filter(o => o.status === 'PROCESSING').length;
  const cancelledOrders = orders.filter(o => o.status === 'CANCELLED').length;

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
              Orders Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Track and manage customer orders across all channels
            </motion.p>
          </div>
          
          <div className="flex space-x-3">
            <button onClick={() => { const headers = ['Order #','Customer','Email','Status','Items','Total','Date']; const rows = orders.map(o => [o.order_number, o.customer_name, o.customer_email, o.status, o.items_count, o.total_amount, o.created_at]); const csv = [headers, ...rows].map(r => r.join(',')).join('\n'); const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'orders_export.csv'; a.click(); URL.revokeObjectURL(url); }} className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium flex items-center transition-colors text-gray-300">
              <Download size={18} className="mr-2" />
              Export
            </button>
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toast('Orders service coming soon', 'info')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center transition-colors"
            >
              <Plus size={20} className="mr-2" />
              New Order
            </motion.button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Revenue</p>
              <p className="text-xl font-bold text-white">${totalRevenue.toLocaleString()}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <DollarSign className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Pending</p>
              <p className="text-xl font-bold text-white">{pendingOrders}</p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Clock className="text-yellow-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Processing</p>
              <p className="text-xl font-bold text-white">{processingOrders}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <RefreshCw className="text-blue-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Cancelled</p>
              <p className="text-xl font-bold text-white">{cancelledOrders}</p>
            </div>
            <div className="p-2 bg-red-500/10 rounded-lg">
              <XCircle className="text-red-500" size={20} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search orders, customers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400 mr-2 flex items-center"><Filter size={16} className="mr-1"/> Status:</span>
            
            {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === status 
                  ? 'bg-blue-600 border-blue-500 text-white' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark rounded-3xl border border-white/10 overflow-hidden relative z-10"
        >
          {error === 'orders-service-not-implemented' ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                <Package className="text-blue-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Orders Service Coming Soon</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">
                The orders management feature is not yet available. We are working on building a 
                dedicated service to track and manage customer orders across all channels.
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={fetchOrders}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Check Again
                </button>
                <button
                  onClick={() => window.history.back()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 mb-4">
                <AlertTriangle className="text-red-500" size={32} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Orders</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
              <button 
                onClick={fetchOrders}
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
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={32} />
                        <p>Loading orders...</p>
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                          <ShoppingCart className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No orders found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {searchTerm ? `No results for "${searchTerm}"` : "Get started by creating your first order."}
                        </p>
                        {!searchTerm && (
                          <button 
                            onClick={() => setShowCreateModal(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
                          >
                            Create First Order
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <td className="px-6 py-4">
                          <span className="font-mono text-blue-400 font-medium">{order.order_number}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold mr-3">
                              {order.customer_name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium">{order.customer_name}</div>
                              <div className="text-xs text-gray-500">{order.customer_email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1">{order.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {order.items_count} items
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">${order.total_amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }} className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); toast('Orders service coming soon', 'info'); }} className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Edit Order">
                              <Edit size={16} />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); toast('Orders service coming soon', 'info'); }} className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Cancel Order">
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
            <span>Showing {filteredOrders.length} orders</span>
            <div className="flex space-x-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled={currentPage === 1}>Previous</button>
              <span className="px-3 py-1 text-white">Page {currentPage}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled={filteredOrders.length <= currentPage * ITEMS_PER_PAGE}>Next</button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Order Details Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <OrderDetailsModal 
            order={selectedOrder} 
            onClose={() => setSelectedOrder(null)} 
          />
        )}
      </AnimatePresence>

      {/* Create Order Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateOrderModal 
            onClose={() => setShowCreateModal(false)} 
            onRefresh={fetchOrders}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailsModal({ order, onClose }: { order: Order, onClose: () => void }) {
  const { toast } = useToast();
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
            <h2 className="text-2xl font-bold text-white">Order Details</h2>
            <p className="text-gray-400 font-mono">{order.order_number}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <span className="text-gray-400">Status</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border bg-blue-500/10 text-blue-400 border-blue-500/20`}>
              {order.status}
            </span>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <User className="text-purple-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Name</span>
                </div>
                <p className="text-white font-medium">{order.customer_name}</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-center mb-2">
                  <Mail className="text-blue-400 mr-2" size={16} />
                  <span className="text-xs text-gray-400">Email</span>
                </div>
                <p className="text-white font-medium">{order.customer_email}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Shipping Address</h3>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex items-start">
              <MapPin className="text-emerald-400 mr-3 mt-0.5" size={16} />
              <p className="text-white">{order.shipping_address}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase">Order Summary</h3>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Items</span>
                <span className="text-white">{order.items_count}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">${(order.total_amount * 0.9).toLocaleString()}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">${(order.total_amount * 0.1).toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 mt-2 pt-2 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-emerald-400 font-bold">${order.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button onClick={() => { toast('Orders service coming soon', 'info'); }} className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">
              Edit Order
            </button>
            <button onClick={() => { toast('Orders service coming soon', 'info'); }} className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-medium transition-colors">
              Update Status
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function CreateOrderModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    shippingAddress: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onRefresh();
      onClose();
    } catch (error) {
      console.error('Failed to create order', error);
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
          <h2 className="text-xl font-bold text-white">Create New Order</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Customer Name</label>
            <input 
              required
              type="text" 
              placeholder="Enter customer name"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={formData.customerName}
              onChange={e => setFormData({...formData, customerName: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Customer Email</label>
            <input 
              required
              type="email" 
              placeholder="customer@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all"
              value={formData.customerEmail}
              onChange={e => setFormData({...formData, customerEmail: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Shipping Address</label>
            <textarea 
              required
              placeholder="Enter full shipping address"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all h-24 resize-none"
              value={formData.shippingAddress}
              onChange={e => setFormData({...formData, shippingAddress: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Order Notes (Optional)</label>
            <textarea 
              placeholder="Any special instructions..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all h-20 resize-none"
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
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
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-blue-500/20"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
