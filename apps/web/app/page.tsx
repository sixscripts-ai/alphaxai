'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AnimatedBackground } from '../components/ui/AnimatedBackground';
import { ArrowRight, LayoutDashboard, ShieldCheck, Zap } from 'lucide-react';

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-white">
      <AnimatedBackground />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-[2px]" />

      <main className="relative z-10 w-full max-w-5xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <span className="inline-block py-1 px-3 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6 backdrop-blur-md">
            Enterprise Inventory Intelligence
          </span>
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-gray-400 mb-8 tracking-tight">
            Predict Demand. <br />
            Optimize Stock.
          </h1>
          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            The AI-powered platform for multi-location businesses. Automate reordering, visualize trends, and integrate seamlessly with your accounting software.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/login">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg shadow-lg shadow-blue-500/25 flex items-center group"
              >
                Get Started
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-xl glass-dark border border-white/10 text-white font-medium text-lg hover:bg-white/5 transition-colors"
              >
                Create Account
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <FeatureCard 
            icon={Zap}
            title="Real-time Analytics"
            description="Monitor stock levels, movements, and valuation across all locations instantly."
            delay={0.2}
          />
          <FeatureCard 
            icon={LayoutDashboard}
            title="Predictive Forecasting"
            description="AI-driven demand planning to prevent stockouts and reduce overstock."
            delay={0.4}
          />
          <FeatureCard 
            icon={ShieldCheck}
            title="Enterprise Security"
            description="Role-based access control, audit logs, and secure API integrations."
            delay={0.6}
          />
        </div>
      </main>

      <footer className="relative z-10 mt-20 text-gray-500 text-sm">
        © 2024 Inventory AI. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="p-6 rounded-2xl glass-dark border border-white/10 hover:border-blue-500/30 transition-colors group"
    >
      <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 group-hover:bg-blue-500/10 transition-colors">
        <Icon className="text-gray-300 group-hover:text-blue-400 transition-colors" size={24} />
      </div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
}
