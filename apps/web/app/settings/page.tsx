'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Save, Database, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [serviceStatuses, setServiceStatuses] = useState<Record<string, 'checking' | 'healthy' | 'error'>>({
    gateway: 'checking',
    auth: 'checking',
    inventory: 'checking',
    worker: 'checking',
  });
  const user = useAuthStore((state) => state.user);
  const [profileData, setProfileData] = useState({ firstName: '', lastName: '', email: '' });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.first_name || user.email?.split('@')[0] || '',
        lastName: user.last_name || '',
        email: user.email || '',
      });
    }
  }, [user]);

  useEffect(() => {
    if (activeSection === 'database') {
      checkServices();
    }
  }, [activeSection]);

  const checkServices = async () => {
    setDbStatus('checking');
    setServiceStatuses({ gateway: 'checking', auth: 'checking', inventory: 'checking', worker: 'checking' });

    // Check gateway health (via /api/ rewrite path)
    try {
      const gatewayRes = await api.get('/api/health/gateway');
      setServiceStatuses(prev => ({ ...prev, gateway: gatewayRes.data?.status === 'healthy' ? 'healthy' : 'error' }));
    } catch {
      setServiceStatuses(prev => ({ ...prev, gateway: 'error' }));
    }

    // Check auth (auth service has /health at root, gateway proxies /api/auth/X -> auth:/api/auth/X,
    // so we need a route that hits auth's /health)
    try {
      const res = await api.get('/api/health/auth');
      setServiceStatuses(prev => ({ ...prev, auth: res.data?.status === 'healthy' ? 'healthy' : 'error' }));
    } catch {
      setServiceStatuses(prev => ({ ...prev, auth: 'error' }));
    }

    // Check inventory
    try {
      const res = await api.get('/api/inventory/items');
      setServiceStatuses(prev => ({ ...prev, inventory: 'healthy' }));
      setDbStatus('connected');
    } catch (err: any) {
      if (err.response?.status === 401) {
        setServiceStatuses(prev => ({ ...prev, inventory: 'healthy' }));
        setDbStatus('connected');
      } else {
        setServiceStatuses(prev => ({ ...prev, inventory: 'error' }));
        setDbStatus('error');
      }
    }

    // Check worker
    try {
      const res = await api.get('/api/health/worker');
      setServiceStatuses(prev => ({ ...prev, worker: res.data?.status === 'healthy' ? 'healthy' : 'error' }));
    } catch {
      setServiceStatuses(prev => ({ ...prev, worker: 'error' }));
    }
  };

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    try {
      const res = await api.put('/api/auth/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
      });
      // Update auth store with new data
      if (res.data.user) {
        useAuthStore.setState({ user: res.data.user });
      }
      setSaveStatus('saved');
    } catch (error) {
      console.error('Failed to save profile:', error);
      setSaveStatus('idle');
    }
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto h-screen relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-blue-900/10 to-indigo-900/10 pointer-events-none" />
        
        <header className="flex justify-between items-center mb-8 relative z-10">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
            >
              Settings
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-gray-400 mt-1"
            >
              Configure your preferences and account details
            </motion.p>
          </div>
          
          <button 
            onClick={handleSaveProfile}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center transition-colors"
          >
            {saveStatus === 'saving' ? <Loader2 size={18} className="mr-2 animate-spin" /> : <Save size={18} className="mr-2" />}
            {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
          </button>
        </header>

        <div className="flex flex-col lg:flex-row gap-8 relative z-10">
          {/* Settings Navigation */}
          <div className="w-full lg:w-64 space-y-2">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'appearance', label: 'Appearance', icon: Palette },
              { id: 'integrations', label: 'Integrations', icon: Globe },
              { id: 'database', label: 'Database Connection', icon: Database },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${activeSection === item.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon size={20} className="mr-3" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Settings Content */}
          <motion.div 
            key={activeSection}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-1 glass-dark rounded-3xl border border-white/10 p-8"
          >
            <h2 className="text-xl font-bold text-white mb-6 capitalize">{activeSection} Settings</h2>
            
            {activeSection === 'profile' && (
              <div className="space-y-6 max-w-2xl">
                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-purple-500/20">
                    {profileData.firstName?.[0]?.toUpperCase() || 'U'}{profileData.lastName?.[0]?.toUpperCase() || ''}
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors mb-2">Change Avatar</button>
                    <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                    <input type="text" value={profileData.firstName} onChange={e => setProfileData({...profileData, firstName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                    <input type="text" value={profileData.lastName} onChange={e => setProfileData({...profileData, lastName: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input type="email" value={profileData.email} readOnly className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-gray-500 focus:outline-none cursor-not-allowed" />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h3 className="font-medium text-white">Email Notifications</h3>
                    <p className="text-sm text-gray-500">Receive emails about your account activity</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h3 className="font-medium text-white">Push Notifications</h3>
                    <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                  </div>
                  <ToggleSwitch defaultChecked={false} />
                </div>
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h3 className="font-medium text-white">Weekly Reports</h3>
                    <p className="text-sm text-gray-500">Receive weekly summary of your inventory status</p>
                  </div>
                  <ToggleSwitch defaultChecked />
                </div>
              </div>
            )}
            
            {activeSection === 'database' && (
              <div className="space-y-6">
                <div className={`border rounded-xl p-4 flex items-start ${
                  dbStatus === 'connected' ? 'bg-emerald-500/10 border-emerald-500/20' :
                  dbStatus === 'error' ? 'bg-red-500/10 border-red-500/20' :
                  'bg-blue-500/10 border-blue-500/20'
                }`}>
                    {dbStatus === 'checking' ? (
                      <Loader2 className="text-blue-400 mt-1 mr-3 animate-spin" size={24} />
                    ) : dbStatus === 'connected' ? (
                      <CheckCircle className="text-emerald-400 mt-1 mr-3" size={24} />
                    ) : (
                      <XCircle className="text-red-400 mt-1 mr-3" size={24} />
                    )}
                    <div>
                        <h3 className="font-bold text-white">
                          {dbStatus === 'checking' ? 'Checking Connection...' :
                           dbStatus === 'connected' ? 'Database Connected' : 'Connection Issues Detected'}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          PostgreSQL database hosted on Render (Oregon, US West)
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Service Health</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {Object.entries(serviceStatuses).map(([service, status]) => (
                          <div key={service} className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-xs text-gray-400 uppercase mb-2">{service}</p>
                            <div className="flex items-center">
                              {status === 'checking' ? (
                                <Loader2 size={14} className="text-blue-400 mr-2 animate-spin" />
                              ) : status === 'healthy' ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                              ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                              )}
                              <span className={`font-medium text-sm ${
                                status === 'healthy' ? 'text-emerald-400' :
                                status === 'error' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {status === 'checking' ? 'Checking...' :
                                 status === 'healthy' ? 'Healthy' : 'Unreachable'}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                        <p className="text-xs text-gray-400 uppercase mb-2">Database Details</p>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Provider</span>
                            <span className="text-white">Render PostgreSQL</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Region</span>
                            <span className="text-white">Oregon (US West)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Database</span>
                            <span className="text-white font-mono text-xs">inventory_saas</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Plan</span>
                            <span className="text-white">Free</span>
                          </div>
                        </div>
                    </div>

                    <button 
                      onClick={checkServices}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 hover:text-white transition-colors"
                    >
                      Re-check Connection
                    </button>
                </div>
              </div>
            )}
            
            {/* Placeholder for sections not yet built */}
             {!['profile', 'notifications', 'database'].includes(activeSection) && (
                <div className="text-center py-20 text-gray-500">
                    <p>Settings for {activeSection} are coming soon.</p>
                </div>
             )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}

function ToggleSwitch({ defaultChecked }: { defaultChecked: boolean }) {
  const [enabled, setEnabled] = useState(defaultChecked);

  return (
    <button
      onClick={() => setEnabled(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-blue-600' : 'bg-gray-700'}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`}
      />
    </button>
  );
}
