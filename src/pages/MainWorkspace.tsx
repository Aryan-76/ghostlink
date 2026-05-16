import React from 'react';
import { 
  Zap, 
  Clock, 
  Activity, 
  Server, 
  Users, 
  MessageSquare, 
  Plus, 
  MoreHorizontal,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

const StatCard = ({ label, value, trend, icon: Icon, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="glass p-6 rounded-2xl group hover:border-ghost-cyan/30 transition-all cursor-pointer"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-ghost-cyan transition-colors">
        <Icon size={20} />
      </div>
      {trend && (
        <span className="text-[10px] font-mono px-2 py-1 rounded bg-green-500/10 text-green-400">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-display font-bold text-white italic">{value}</p>
  </motion.div>
);

const ActivityItem = ({ title, time, type }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 group cursor-pointer hover:bg-white/2 p-2 rounded-xl transition-all"
  >
    <div className={`w-2 h-2 rounded-full ${
      type === 'ai' ? 'bg-ghost-cyan cyan-glow' : 
      type === 'user' ? 'bg-ghost-violet violet-glow' : 'bg-slate-700'
    }`} />
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-300 group-hover:text-white transition-colors truncate">{title}</p>
      <p className="text-[10px] font-mono text-slate-500 uppercase">{time}</p>
    </div>
    <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-500 transition-colors" />
  </motion.div>
);

export default function MainWorkspace() {
  return (
    <div className="p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-6"
      >
        <div>
          <h2 className="text-[10px] font-mono text-ghost-cyan uppercase tracking-[0.3em] mb-2">Welcome Back, Ghost_01</h2>
          <h1 className="text-4xl font-display font-black text-white italic tracking-tighter">
            Fleet Operations Overview
          </h1>
        </div>
        <div className="flex gap-4">
          <button className="glass px-6 py-2.5 rounded-full text-sm font-bold flex items-center gap-2 hover:bg-white/5 transition-all">
            <Clock size={16} /> History
          </button>
          <button className="px-6 py-2.5 bg-white text-ghost-navy rounded-full text-sm font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all flex items-center gap-2">
            <Plus size={16} /> Initiate Project
          </button>
        </div>
      </motion.div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left Column: Stats */}
        <div className="md:col-span-8 flex flex-col gap-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <StatCard label="Network Load" value="42.8 TH/s" trend="+12.5%" icon={Server} delay={0.1} />
            <StatCard label="Active Nodes" value="1,204" trend="Stable" icon={Users} delay={0.2} />
            <StatCard label="AI Coherence" value="98.2%" trend="Optimal" icon={Zap} delay={0.3} />
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-3xl overflow-hidden min-h-[400px] flex flex-col"
          >
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="font-display font-bold text-white italic text-lg flex items-center gap-2">
                <Activity size={18} className="text-ghost-cyan" /> Visual Intelligence Map
              </h3>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-800" />)}
              </div>
            </div>
            <div className="flex-1 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-ghost-cyan/5 via-transparent to-ghost-violet/5" />
              
              {/* Central Neural Pulse */}
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-ghost-cyan/10 blur-[80px] rounded-full" 
              />

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center space-y-4 z-10">
                <Sparkles size={48} className="text-ghost-cyan/40 mx-auto animate-pulse" />
                <p className="font-mono text-[10px] text-slate-400 uppercase tracking-widest bg-ghost-navy/40 px-4 py-1 rounded-full backdrop-blur-md">Neural Map Active</p>
              </div>
              
              {/* Interactive Data Nodes */}
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    x: [Math.random() * 20, Math.random() * -20, Math.random() * 20],
                    y: [Math.random() * 20, Math.random() * -20, Math.random() * 20]
                  }}
                  transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
                  style={{ top: `${20 + i * 15}%`, left: `${15 + i * 12}%` }}
                  className={`absolute w-${i % 2 === 0 ? '2' : '3'} h-${i % 2 === 0 ? '2' : '3'} rounded-full ${i % 2 === 0 ? 'bg-ghost-cyan shadow-[0_0_10px_rgba(0,242,255,0.5)]' : 'bg-ghost-violet shadow-[0_0_10px_rgba(189,0,255,0.5)]'}`}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Column: Activity & Sidebar */}
        <div className="md:col-span-4 flex flex-col gap-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-6 flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-display font-bold text-white italic text-lg">Vanguard Stream</h3>
              <MoreHorizontal size={18} className="text-slate-600" />
            </div>

            <div className="space-y-6 overflow-y-auto max-h-[600px] pr-2 custom-scrollbar flex-1">
              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Active Syntheses</h4>
              <div className="space-y-2">
                <ActivityItem title="Ghost_01 drafted architectural RFC" time="2m ago" type="ai" />
                <ActivityItem title="Sarah merged feature/quantum-gate" time="15m ago" type="user" />
                <ActivityItem title="Automated security sweep complete" time="45m ago" type="system" />
              </div>

              <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-8">Upcoming Alignments</h4>
              <div className="space-y-2">
                <ActivityItem title="Tactical Review: Project Spectra" time="In 2h" type="user" />
                <ActivityItem title="Weekly Intelligence Sync" time="Tomorrow" type="system" />
              </div>
            </div>

            <button className="mt-8 w-full py-4 glass rounded-2xl text-xs font-bold font-mono tracking-widest text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 group">
              VIEW FULL LOGS <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
