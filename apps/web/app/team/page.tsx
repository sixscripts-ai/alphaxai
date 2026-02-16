'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Plus, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit, 
  Trash2, 
  Shield,
  Mail,
  Phone,
  Calendar,
  Building2,
  UserCheck,
  UserX,
  Loader2,
  Download,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Crown,
  BadgeCheck
} from 'lucide-react';
import api from '../../lib/api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'MEMBER' | 'VIEWER';
  status: 'ACTIVE' | 'INVITED' | 'INACTIVE';
  avatar?: string;
  department: string;
  last_active: string;
  created_at: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      setTimeout(() => {
        setMembers([
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah@company.com',
            phone: '+1 (555) 123-4567',
            role: 'OWNER',
            status: 'ACTIVE',
            department: 'Executive',
            last_active: '2024-01-15T10:30:00Z',
            created_at: '2023-01-10T08:00:00Z'
          },
          {
            id: '2',
            name: 'Michael Chen',
            email: 'michael@company.com',
            phone: '+1 (555) 234-5678',
            role: 'ADMIN',
            status: 'ACTIVE',
            department: 'Operations',
            last_active: '2024-01-15T09:15:00Z',
            created_at: '2023-03-15T10:00:00Z'
          },
          {
            id: '3',
            name: 'Emily Davis',
            email: 'emily@company.com',
            phone: '+1 (555) 345-6789',
            role: 'MANAGER',
            status: 'ACTIVE',
            department: 'Sales',
            last_active: '2024-01-14T16:45:00Z',
            created_at: '2023-05-20T14:30:00Z'
          },
          {
            id: '4',
            name: 'James Wilson',
            email: 'james@company.com',
            phone: '+1 (555) 456-7890',
            role: 'MEMBER',
            status: 'ACTIVE',
            department: 'Warehouse',
            last_active: '2024-01-15T08:00:00Z',
            created_at: '2023-08-10T11:00:00Z'
          },
          {
            id: '5',
            name: 'Lisa Martinez',
            email: 'lisa@company.com',
            phone: '+1 (555) 567-8901',
            role: 'VIEWER',
            status: 'INVITED',
            department: 'Finance',
            last_active: '',
            created_at: '2024-01-14T10:00:00Z'
          },
          {
            id: '6',
            name: 'David Brown',
            email: 'david@company.com',
            phone: '+1 (555) 678-9012',
            role: 'MEMBER',
            status: 'INACTIVE',
            department: 'IT',
            last_active: '2023-12-01T12:00:00Z',
            created_at: '2023-02-28T09:00:00Z'
          }
        ]);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Failed to fetch members', err);
      setError('Failed to load team members. Please try again.');
      setLoading(false);
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'ALL' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'ADMIN': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'MANAGER': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'MEMBER': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'VIEWER': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown size={12} />;
      case 'ADMIN': return <Shield size={12} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'INVITED': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'INACTIVE': return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle size={12} />;
      case 'INVITED': return <Mail size={12} />;
      case 'INACTIVE': return <UserX size={12} />;
      default: return null;
    }
  };

  // Calculate summary metrics
  const totalMembers = members.length;
  const activeMembers = members.filter(m => m.status === 'ACTIVE').length;
  const pendingInvites = members.filter(m => m.status === 'INVITED').length;
  const adminCount = members.filter(m => m.role === 'ADMIN' || m.role === 'OWNER').length;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/10 via-purple-900/10 to-fuchsia-900/10 pointer-events-none" />
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Team Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Manage team members, roles, and access permissions
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
              onClick={() => setShowInviteModal(true)}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl font-medium shadow-lg shadow-violet-500/20 flex items-center transition-colors"
            >
              <Plus size={20} className="mr-2" />
              Invite Member
            </motion.button>
          </div>
        </header>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Total Members</p>
              <p className="text-xl font-bold text-white">{totalMembers}</p>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="text-blue-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Active</p>
              <p className="text-xl font-bold text-white">{activeMembers}</p>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <UserCheck className="text-emerald-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Pending</p>
              <p className="text-xl font-bold text-white">{pendingInvites}</p>
            </div>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Mail className="text-yellow-500" size={20} />
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">Admins</p>
              <p className="text-xl font-bold text-white">{adminCount}</p>
            </div>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Shield className="text-purple-500" size={20} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 relative z-10 bg-white/5 p-4 rounded-2xl border border-white/10 items-center">
          <div className="relative flex-1 min-w-[250px]">
            <Search className="absolute left-3 top-2.5 text-gray-500" size={20} />
            <input 
              type="text" 
              placeholder="Search members, roles, departments..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all text-sm"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400 mr-2 flex items-center"><Filter size={16} className="mr-1"/> Role:</span>
            {['ALL', 'OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  roleFilter === role 
                  ? 'bg-violet-600 border-violet-500 text-white' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2">
            {['ALL', 'ACTIVE', 'INVITED', 'INACTIVE'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  statusFilter === status 
                  ? 'bg-violet-600 border-violet-500 text-white' 
                  : 'bg-black/20 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Team Table */}
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
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Team</h3>
              <p className="text-gray-400 max-w-md mx-auto mb-6">{error}</p>
              <button 
                onClick={fetchMembers}
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
                    <th className="px-6 py-4">Member</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Department</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4">Joined</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        <Loader2 className="animate-spin mx-auto mb-4 text-violet-500" size={32} />
                        <p>Loading team members...</p>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-20 text-center text-gray-500">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                          <Users className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-1">No members found</h3>
                        <p className="text-sm text-gray-500 mb-6">
                          {searchTerm ? `No results for "${searchTerm}"` : "Get started by inviting your first team member."}
                        </p>
                        {!searchTerm && (
                          <button 
                            onClick={() => setShowInviteModal(true)}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors"
                          >
                            Invite First Member
                          </button>
                        )}
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => (
                      <tr key={member.id} className="hover:bg-white/5 transition-colors group cursor-pointer" onClick={() => setSelectedMember(member)}>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold mr-3">
                              {member.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-white font-medium flex items-center">
                                {member.name}
                                {member.role === 'OWNER' && <Crown size={14} className="ml-1 text-yellow-400" />}
                              </div>
                              <div className="text-xs text-gray-500">{member.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(member.role)}`}>
                            {getRoleIcon(member.role)}
                            <span className="ml-1">{member.role}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300">
                          {member.department}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(member.status)}`}>
                            {getStatusIcon(member.status)}
                            <span className="ml-1">{member.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {new Date(member.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors" title="View Details">
                              <Eye size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-colors" title="Edit Member">
                              <Edit size={16} />
                            </button>
                            <button className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Member">
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
            <span>Showing {filteredMembers.length} members</span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 rounded-lg hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
              <span className="px-3 py-1 text-white">Page 1</span>
              <button className="px-3 py-1 rounded-lg hover:bg-white/5" disabled>Next</button>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Member Details Modal */}
      <AnimatePresence>
        {selectedMember && (
          <MemberDetailsModal 
            member={selectedMember} 
            onClose={() => setSelectedMember(null)} 
          />
        )}
      </AnimatePresence>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteMemberModal 
            onClose={() => setShowInviteModal(false)} 
            onRefresh={fetchMembers}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberDetailsModal({ member, onClose }: { member: TeamMember, onClose: () => void }) {
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
        className="relative bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white text-2xl font-bold mr-4">
              {member.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center">
                {member.name}
                {member.role === 'OWNER' && <Crown size={20} className="ml-2 text-yellow-400" />}
              </h2>
              <p className="text-gray-400">{member.department}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center">
            <span className="text-gray-400">Role</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border bg-purple-500/10 text-purple-400 border-purple-500/20`}>
              {member.role}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <Mail className="text-blue-400 mr-2" size={16} />
                <span className="text-xs text-gray-400">Email</span>
              </div>
              <p className="text-white font-medium">{member.email}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <Phone className="text-green-400 mr-2" size={16} />
                <span className="text-xs text-gray-400">Phone</span>
              </div>
              <p className="text-white font-medium">{member.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <Calendar className="text-purple-400 mr-2" size={16} />
                <span className="text-xs text-gray-400">Joined</span>
              </div>
              <p className="text-white font-medium">{new Date(member.created_at).toLocaleDateString()}</p>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center mb-2">
                <UserCheck className="text-emerald-400 mr-2" size={16} />
                <span className="text-xs text-gray-400">Last Active</span>
              </div>
              <p className="text-white font-medium">{member.last_active ? new Date(member.last_active).toLocaleDateString() : 'Never'}</p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white font-medium transition-colors">
              Edit Member
            </button>
            <button className="flex-1 py-2 bg-violet-600 hover:bg-violet-500 rounded-xl text-white font-medium transition-colors">
              Change Role
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function InviteMemberModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'MEMBER',
    department: ''
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
      console.error('Failed to invite member', error);
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
          <h2 className="text-xl font-bold text-white">Invite Team Member</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <XCircle size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Full Name</label>
            <input 
              required
              type="text" 
              placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Email Address</label>
            <input 
              required
              type="email" 
              placeholder="john@company.com"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <option value="ADMIN" className="bg-gray-900">Admin</option>
                <option value="MANAGER" className="bg-gray-900">Manager</option>
                <option value="MEMBER" className="bg-gray-900">Member</option>
                <option value="VIEWER" className="bg-gray-900">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Department</label>
              <input 
                type="text" 
                placeholder="Operations"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-all"
                value={formData.department}
                onChange={e => setFormData({...formData, department: e.target.value})}
              />
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
              disabled={loading}
              className="px-6 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center shadow-lg shadow-violet-500/20"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
