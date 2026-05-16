import React from 'react';
import { 
  Hash, 
  Plus, 
  Maximize2, 
  Minimize2, 
  ChevronRight, 
  MessageSquare, 
  Sparkles,
  Command,
  Layers,
  Zap,
  Globe,
  Cpu
} from 'lucide-react';
import { motion } from 'motion/react';

const ThreadCard = ({ title, status, participants, desc, active, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ scale: 1.02 }}
    className={`glass p-6 rounded-3xl relative overflow-hidden transition-all duration-500 group cursor-pointer ${
      active ? 'border-ghost-cyan/40 shadow-[0_0_40px_rgba(0,242,255,0.1)]' : 'hover:border-white/10'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="active-bar"
        className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ghost-cyan to-ghost-violet" 
      />
    )}
    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/2 rounded-full blur-2xl group-hover:bg-white/5 transition-all" />
    
    <div className="relative z-10 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Hash size={16} className={active ? 'text-ghost-cyan cyan-text-glow' : 'text-slate-600'} />
          <span className={`text-sm font-bold italic tracking-tight ${active ? 'text-white' : 'text-slate-400'}`}>{title}</span>
        </div>
        <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-green-500 bg-glow-green animate-pulse' : 'bg-slate-800'}`} />
      </div>

      <p className="text-xs text-slate-500 mb-6 leading-relaxed flex-1 italic">{desc}</p>

      <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-auto">
        <div className="flex -space-x-2">
          {participants.map((p: any, i: number) => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-ghost-charcoal bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 ring-1 ring-white/5">
              {p[0]}
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-ghost-charcoal bg-ghost-cyan text-ghost-navy flex items-center justify-center text-[10px] font-black">+</div>
        </div>
        <button className={`p-2 rounded-lg transition-all ${active ? 'text-ghost-cyan bg-ghost-cyan/10' : 'text-slate-600 hover:text-slate-400'}`}>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  </motion.div>
);

export default function SpatialThreadView() {
  return (
    <div className="p-8 space-y-12 h-full overflow-y-auto custom-scrollbar">
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div>
           <div className="flex items-center gap-2 mb-2">
              <Layers size={16} className="text-ghost-violet" />
              <span className="text-[10px] font-mono text-ghost-violet uppercase tracking-[0.3em] font-bold">Multidimensional View</span>
           </div>
           <h1 className="text-4xl font-display font-black text-white italic tracking-tighter">Spatial Threads</h1>
           <p className="text-slate-400 mt-2">Visualizing synchronous intelligence bridges across the global network.</p>
        </div>
        <div className="flex gap-4">
           <div className="glass p-1 rounded-xl flex items-center gap-1">
              <button className="px-4 py-2 bg-white/5 rounded-lg text-[10px] font-mono text-white flex items-center gap-2 transition-all hover:bg-white/10"><Globe size={14} /> GLOBAL</button>
              <button className="px-4 py-2 hover:bg-white/2 rounded-lg text-[10px] font-mono text-slate-600 transition-all uppercase tracking-widest">PRIVATE</button>
           </div>
           <button className="px-6 py-2.5 bg-white text-ghost-navy rounded-full text-sm font-bold shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:scale-105 transition-all flex items-center gap-2 group">
             <Plus size={16} className="group-hover:rotate-90 transition-transform" /> Forge Thread
           </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <ThreadCard 
          title="nexus-core-sync"
          status="active"
          participants={['Sarah', 'AI_7']}
          desc="Synchronizing the primary kernel with the Vanguard nodes. High latency detected in Sector 4."
          active
          delay={0.1}
        />
        <ThreadCard 
          title="spectral-design-v2"
          status="idle"
          participants={['Elena', 'Marcus']}
          desc="Iterating on the glassmorphic architecture for the mobile substrate. Pending review."
          delay={0.2}
        />
        <ThreadCard 
          title="vanguard-ops"
          status="active"
          participants={['Alex', 'AI_3']}
          desc="Monitoring security protocols across the global distributed network. Zero trust active."
          delay={0.3}
        />
        <ThreadCard 
          title="intelligence-bridge"
          status="active"
          participants={['Sarah', 'Elena']}
          desc="Synthesizing cross-domain knowledge maps to improve AI coherence levels."
          delay={0.4}
        />
      </div>

      {/* Spatial Visualization Map (Abstract) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="relative glass rounded-[3rem] p-12 min-h-[550px] overflow-hidden flex flex-col items-center justify-center space-y-8 bg-ghost-charcoal/20 border-white/5 shadow-2xl"
      >
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
         
         <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
            <svg width="100%" height="100%" className="blur-sm">
                <motion.line 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  x1="50%" y1="50%" x2="20%" y2="80%" stroke="#00f2ff" strokeWidth="1" />
                <motion.line 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 1, repeat: Infinity, repeatDelay: 3 }}
                  x1="50%" y1="50%" x2="80%" y2="80%" stroke="#00f2ff" strokeWidth="1" />
                <motion.line 
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 2, delay: 2, repeat: Infinity, repeatDelay: 3 }}
                  x1="50%" y1="50%" x2="50%" y2="20%" stroke="#bd00ff" strokeWidth="1" />
            </svg>
         </div>

         {/* Central Node */}
         <motion.div 
            animate={{ 
              boxShadow: ["0 0 20px rgba(0,242,255,0.2)", "0 0 50px rgba(0,242,255,0.4)", "0 0 20px rgba(0,242,255,0.2)"]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="relative group cursor-pointer"
         >
            <div className="absolute inset-0 bg-ghost-cyan/20 rounded-full blur-3xl animate-pulse" />
            <div className="relative w-32 h-32 glass rounded-full flex items-center justify-center border-ghost-cyan/40 shadow-[0_0_50px_rgba(0,242,255,0.2)] hover:scale-110 transition-transform">
               <div className="text-center">
                  <Cpu size={32} className="text-ghost-cyan mx-auto mb-2 cyan-glow" />
                  <span className="text-[10px] font-mono text-white italic tracking-tighter uppercase font-bold">HQ CORE</span>
               </div>
            </div>
         </motion.div>

         <div className="grid grid-cols-3 gap-32 relative z-10">
            <motion.div 
              whileHover={{ y: -10 }}
              className="glass p-4 rounded-2xl w-40 h-28 flex flex-col justify-between hover:bg-white/5 transition-all shadow-xl"
            >
               <span className="text-[8px] font-mono text-ghost-cyan uppercase tracking-[0.4em]">Node_A1</span>
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white italic">SYDNEY</h4>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 cyan-glow animate-pulse" />
               </div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -30 }}
              className="glass p-4 rounded-2xl w-40 h-28 flex flex-col justify-between hover:bg-white/5 transition-all -translate-y-20 border-ghost-violet/30 bg-ghost-violet/5 shadow-xl shadow-ghost-violet/10"
            >
                <span className="text-[8px] font-mono text-ghost-violet uppercase tracking-[0.4em]">Node_V9</span>
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white italic">TOKYO</h4>
                  <div className="w-1.5 h-1.5 rounded-full bg-ghost-violet violet-glow animate-pulse" />
               </div>
            </motion.div>
            <motion.div 
              whileHover={{ y: -10 }}
              className="glass p-4 rounded-2xl w-40 h-28 flex flex-col justify-between hover:bg-white/5 transition-all shadow-xl"
            >
                <span className="text-[8px] font-mono text-ghost-cyan uppercase tracking-[0.4em]">Node_X4</span>
               <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white italic">LONDON</h4>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-lg animate-pulse" />
               </div>
            </motion.div>
         </div>

         {/* Floating Interface Controls */}
         <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4">
            <button className="glass p-3 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-3xl hover:bg-white/5"><Maximize2 size={20} /></button>
            <button className="glass p-3 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-3xl hover:bg-white/5"><Minimize2 size={20} /></button>
            <div className="h-full w-px bg-white/5 mx-2" />
            <button className="glass p-3 rounded-2xl text-slate-400 hover:text-white transition-all backdrop-blur-3xl hover:bg-white/5"><Command size={20} /></button>
         </div>
      </motion.div>
    </div>
  );
}
