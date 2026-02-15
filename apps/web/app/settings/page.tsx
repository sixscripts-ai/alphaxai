'use client';

import { Sidebar } from '../../components/ui/Sidebar';
import { motion } from 'framer-motion';
import { User, Bell, Shield, Palette, Globe, Save } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');

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
          
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-medium shadow-lg shadow-blue-500/20 flex items-center transition-colors">
            <Save size={18} className="mr-2" />
            Save Changes
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
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors mb-2">Change Avatar</button>
                    <p className="text-xs text-gray-500">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">First Name</label>
                    <input type="text" defaultValue="John" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Last Name</label>
                    <input type="text" defaultValue="Doe" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
                  <input type="email" defaultValue="john.doe@example.com" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
                  <textarea className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-32 resize-none" defaultValue="Product Manager at TechCorp..." />
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
            
            {/* Add other sections as needed */}
             {(activeSection !== 'profile' && activeSection !== 'notifications') && (
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
