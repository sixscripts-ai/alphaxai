'use client';

import { useEffect, useState } from 'react';
import { Sidebar } from '../../components/ui/Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, MapPin, Users, Plus, Mail, MoreHorizontal, Globe, Loader2, Edit, Trash2, XCircle } from 'lucide-react';
import api from '../../lib/api';

interface Location {
  id: string;
  name: string;
  code?: string;
  timezone?: string;
}

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
}

export default function OrganizationPage() {
  const [activeTab, setActiveTab] = useState<'locations' | 'users'>('locations');
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);

  useEffect(() => {
    if (activeTab === 'locations') {
      fetchLocations();
    } else {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchLocations = async () => {
    try {
      const response = await api.get('/api/locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Failed to fetch locations', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/organization/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-900/10 via-red-900/10 to-yellow-900/10 pointer-events-none" />
        
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Organization Settings
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Manage your warehouses, stores, and team members
            </motion.p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => activeTab === 'locations' ? setShowAddLocation(true) : setShowInviteMember(true)}
            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-medium shadow-lg shadow-orange-500/20 flex items-center"
          >
            <Plus size={20} className="mr-2" />
            {activeTab === 'locations' ? 'Add Location' : 'Invite Member'}
          </motion.button>
        </header>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white/5 p-1 rounded-xl w-fit mb-8 relative z-10 border border-white/10">
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'locations' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Locations
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'users' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
          >
            Team Members
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'locations' ? (
              locations.map((location, index) => (
                <LocationCard key={location.id} location={location} index={index} />
              ))
            ) : (
              users.map((user, index) => (
                <UserCard key={user.id} user={user} index={index} />
              ))
            )}
          </AnimatePresence>
          
          {/* Empty State / Add New Placeholder */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="border-2 border-dashed border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer min-h-[200px]"
            onClick={() => activeTab === 'locations' ? setShowAddLocation(true) : setShowInviteMember(true)}
          >
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Plus size={24} />
            </div>
            <span className="font-medium">Add New {activeTab === 'locations' ? 'Location' : 'Member'}</span>
          </motion.div>
        </div>
      </main>

        {/* Add Location Modal */}
        <AnimatePresence>
          {showAddLocation && (
            <AddLocationModal onClose={() => setShowAddLocation(false)} onRefresh={fetchLocations} />
          )}
        </AnimatePresence>

        {/* Invite Member Modal */}
        <AnimatePresence>
          {showInviteMember && (
            <InviteMemberModal onClose={() => setShowInviteMember(false)} onRefresh={fetchUsers} />
          )}
        </AnimatePresence>
      </div>
  );
}

function LocationCard({ location, index }: { location: Location, index: number }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-6 glass-dark rounded-3xl border border-white/10 group hover:border-orange-500/30 transition-colors relative"
    >
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-white"><MoreHorizontal size={20} /></button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
            <button onClick={() => setShowMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10"><Edit size={14} className="mr-2" />Edit</button>
            <button onClick={() => setShowMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/10"><Trash2 size={14} className="mr-2" />Delete</button>
          </div>
        )}
      </div>
      
      <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4 text-orange-400">
        <Building size={24} />
      </div>
      
      <h3 className="text-xl font-bold text-white mb-2">{location.name}</h3>
      
      <div className="space-y-3 text-gray-400 text-sm">
        {location.code && (
          <div className="flex items-center">
            <MapPin size={16} className="mr-2 shrink-0" />
            Code: {location.code}
          </div>
        )}
        <div className="flex items-center">
          <Globe size={16} className="mr-2" />
          {location.timezone || 'America/Los_Angeles'}
        </div>
      </div>
    </motion.div>
  );
}

function UserCard({ user, index }: { user: User, index: number }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="p-6 glass-dark rounded-3xl border border-white/10 group hover:border-blue-500/30 transition-colors relative"
    >
       <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setShowMenu(!showMenu)} className="text-gray-400 hover:text-white"><MoreHorizontal size={20} /></button>
        {showMenu && (
          <div className="absolute right-0 mt-2 w-36 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-lg z-20 overflow-hidden">
            <button onClick={() => setShowMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-white/10"><Edit size={14} className="mr-2" />Edit Role</button>
            <button onClick={() => setShowMenu(false)} className="w-full flex items-center px-4 py-2 text-sm text-red-400 hover:bg-white/10"><XCircle size={14} className="mr-2" />Remove</button>
          </div>
        )}
      </div>

      <div className="flex items-center mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg mr-4">
          {user.first_name?.[0]}{user.last_name?.[0]}
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">{user.first_name} {user.last_name}</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
            {user.roles[0]}
          </span>
        </div>
      </div>
      
      <div className="flex items-center text-gray-400 text-sm">
        <Mail size={16} className="mr-2" />
        {user.email}
      </div>
    </motion.div>
  );
}

function InviteMemberModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('MEMBER');
  const [department, setDepartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/team/invite', { email, name, role, department });
      onRefresh();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold text-white mb-4">Invite Team Member</h2>
        {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email *</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="colleague@company.com"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="Jane Smith"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="MEMBER">Member</option>
              <option value="VIEWER">Viewer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Department</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
              placeholder="Engineering"
              value={department}
              onChange={e => setDepartment(e.target.value)}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white font-medium disabled:opacity-50 flex items-center">
              {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
              Send Invite
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function AddLocationModal({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) {
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [timezone, setTimezone] = useState('America/Los_Angeles');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/api/locations', { name, code: code || undefined, timezone });
            onRefresh();
            onClose();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to create location');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative bg-[#111] border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
                <h2 className="text-xl font-bold text-white mb-4">Add Location</h2>
                {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Location Name *</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                            placeholder="e.g. Main Warehouse"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Location Code</label>
                        <input 
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                            placeholder="e.g. WH-001"
                            value={code}
                            onChange={e => setCode(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-gray-400 mb-1">Timezone</label>
                        <select
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-orange-500"
                            value={timezone}
                            onChange={e => setTimezone(e.target.value)}
                        >
                            <option value="America/Los_Angeles">Pacific Time (US)</option>
                            <option value="America/Denver">Mountain Time (US)</option>
                            <option value="America/Chicago">Central Time (US)</option>
                            <option value="America/New_York">Eastern Time (US)</option>
                            <option value="Europe/London">London (GMT)</option>
                            <option value="Europe/Berlin">Central European</option>
                            <option value="Asia/Tokyo">Japan</option>
                            <option value="Asia/Shanghai">China</option>
                            <option value="UTC">UTC</option>
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg text-white font-medium disabled:opacity-50 flex items-center">
                            {loading && <Loader2 size={16} className="mr-2 animate-spin" />}
                            Create
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    )
}
