'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { LucideIcon, ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { useState } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: LucideIcon;
  color: 'blue' | 'purple' | 'emerald' | 'rose' | 'amber';
  delay?: number;
  subtext?: string;
  onDrillDown?: () => void;
}

const colorMap = {
  blue: 'from-blue-500/20 to-blue-600/5 text-blue-400 border-blue-500/20 hover:border-blue-500/40',
  purple: 'from-purple-500/20 to-purple-600/5 text-purple-400 border-purple-500/20 hover:border-purple-500/40',
  emerald: 'from-emerald-500/20 to-emerald-600/5 text-emerald-400 border-emerald-500/20 hover:border-emerald-500/40',
  rose: 'from-rose-500/20 to-rose-600/5 text-rose-400 border-rose-500/20 hover:border-rose-500/40',
  amber: 'from-amber-500/20 to-amber-600/5 text-amber-400 border-amber-500/20 hover:border-amber-500/40',
};

export function StatCard({ title, value, change, icon: Icon, color, delay = 0, subtext, onDrillDown }: StatCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={clsx(
        "relative overflow-hidden rounded-2xl p-6 border backdrop-blur-xl bg-gradient-to-br transition-all duration-300 group",
        colorMap[color]
      )}
    >
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity duration-500 transform group-hover:scale-110">
        <Icon size={120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className={clsx(
            "p-3 rounded-xl bg-white/5 border border-white/10 shadow-lg backdrop-blur-md",
            colorMap[color].split(' ')[1] // text color class
          )}>
            <Icon size={24} />
          </div>
          {onDrillDown && (
             <button 
              onClick={(e) => { e.stopPropagation(); onDrillDown(); }}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
               <MoreHorizontal size={20} />
             </button>
          )}
        </div>

        <div>
          <p className="text-sm font-medium opacity-70 uppercase tracking-wider mb-1 flex items-center">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          
          <div className="flex items-center mt-3 justify-between">
            {change && (
              <div className="flex items-center space-x-2">
                <span className={clsx(
                  "flex items-center text-xs px-2 py-1 rounded-full font-bold",
                  change.startsWith('+') 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                )}>
                  {change.startsWith('+') ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
                  {change}
                </span>
                <span className="text-xs text-gray-400">vs last period</span>
              </div>
            )}
          </div>
           {subtext && (
              <p className="text-xs text-gray-500 mt-2 border-t border-white/5 pt-2">
                {subtext}
              </p>
            )}
        </div>
      </div>
      
      {/* Interactive hover effect */}
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}
