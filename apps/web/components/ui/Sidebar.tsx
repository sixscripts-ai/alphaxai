'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Package, 
  Settings, 
  Users, 
  BarChart, 
  Bell, 
  Menu, 
  ChevronLeft,
  LogOut,
  ShoppingCart,
  Truck,
  FileText
} from 'lucide-react';
import clsx from 'clsx';

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { name: 'Inventory', icon: Package, href: '/inventory' },
  { name: 'Orders', icon: ShoppingCart, href: '/orders' },
  { name: 'Suppliers', icon: Truck, href: '/suppliers' },
  { name: 'Shipments', icon: Truck, href: '/shipments' },
  { name: 'Team', icon: Users, href: '/team' },
  { name: 'Analytics', icon: BarChart, href: '/analytics' },
  { name: 'Organization', icon: Users, href: '/organization' },
  { name: 'Alerts', icon: Bell, href: '/alerts' },
  { name: 'Settings', icon: Settings, href: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <motion.div 
      initial={{ width: 240 }}
      animate={{ width: collapsed ? 80 : 240 }}
      className="h-screen glass-dark border-r border-white/10 flex flex-col sticky top-0 z-50 transition-all duration-300"
    >
      <div className="p-4 flex items-center justify-between border-b border-white/10 h-16">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent truncate"
            >
              Inventory AI
            </motion.div>
          )}
        </AnimatePresence>
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-2 hover:bg-white/5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <motion.div
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  "flex items-center px-3 py-3 rounded-xl cursor-pointer transition-colors relative group focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                  isActive ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute left-0 w-1 h-8 bg-blue-500 rounded-r-full"
                  />
                )}
                <item.icon size={20} className={clsx("min-w-[20px]", collapsed ? "mx-auto" : "mr-3")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="whitespace-nowrap font-medium"
                    >
                      {item.name}
                    </motion.span>
                  )}
                </AnimatePresence>
                
                {collapsed && (
                  <div className="absolute left-14 bg-gray-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10">
                    {item.name}
                  </div>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button 
          onClick={() => { useAuthStore.getState().logout(); window.location.href = '/login'; }}
          className={clsx(
          "flex items-center w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500",
          collapsed ? "justify-center" : "justify-start"
        )}>
          <LogOut size={20} className={clsx(collapsed ? "" : "mr-3")} />
          {!collapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </motion.div>
  );
}
