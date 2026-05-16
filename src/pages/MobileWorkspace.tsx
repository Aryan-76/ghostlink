import React from 'react';
import { 
  Smartphone, 
  LayoutDashboard, 
  MessageSquare, 
  Zap, 
  Search, 
  MoreHorizontal, 
  TrendingUp,
  Cpu,
  ArrowUpRight,
  Fingerprint
} from 'lucide-react';
import { motion } from 'motion/react';

export default function MobileWorkspace() {
  return (
    <div className="min-h-screen bg-ghost-navy flex justify-center items-center p-4">
      {/* Mobile Mockup Frame */}
      <div className="w-full max-w-[380px] aspect-[9/19] bg-ghost-charcoal rounded-[3rem] border-[8px] border-white/5 shadow-2xl overflow-hidden flex flex-col relative">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-50" />
        
        {/* Header */}
        <header className="pt-12 pb-6 px-6 bg-white/2 backdrop-blur-md">
          <div className="flex justify-between items-center mb-6">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ghost-cyan to-ghost-violet flex items-center justify-center">
              <Fingerprint size={24} className="text-white" />
            </div>
            <button className="p-2 glass rounded-full text-slate-400"><MoreHorizontal size={20} /></button>
          </div>
          <h1 className="text-2xl font-display font-black text-white italic tracking-tighter">Sentinel Mobile</h1>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Global Node: Active</p>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto px-6 py-4 space-y-6 custom-scrollbar">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
             <div className="glass p-4 rounded-2xl flex flex-col justify-between h-28">
                <TrendingUp size={18} className="text-ghost-cyan" />
                <div>
                   <p className="text-[8px] font-mono text-slate-500 uppercase">Load</p>
                   <p className="text-xl font-display font-bold text-white italic">42%</p>
                </div>
             </div>
             <div className="glass p-4 rounded-2xl flex flex-col justify-between h-28">
                <Cpu size={18} className="text-ghost-violet" />
                <div>
                   <p className="text-[8px] font-mono text-slate-500 uppercase">Intel</p>
                   <p className="text-xl font-display font-bold text-white italic">0.2s</p>
                </div>
             </div>
          </div>

          {/* Active synthesis on mobile */}
          <div className="glass bg-ghost-cyan/5 p-4 rounded-2xl border-ghost-cyan/10">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-mono text-ghost-cyan uppercase tracking-widest font-bold">Active Thread</h3>
                <span className="text-[8px] font-mono text-slate-600">LIVE</span>
             </div>
             <p className="text-xs font-bold text-white italic tracking-tight mb-2 truncate">Project Nexus Architecture</p>
             <div className="flex items-center gap-2">
                <div className="flex -space-x-1">
                   {[1, 2].map(i => <div key={i} className="w-4 h-4 rounded-full bg-slate-800 border border-ghost-charcoal" />)}
                </div>
                <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-ghost-cyan w-2/3" />
                </div>
             </div>
          </div>

          <button className="w-full py-4 bg-white text-ghost-navy rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2 group">
              INITIATE COMMAND <Zap size={16} />
          </button>

          <div className="space-y-3">
             <h4 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1">Nearby Nodes</h4>
             {[1, 2, 3].map(i => (
               <div key={i} className="flex items-center gap-4 py-2">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-600">
                    <ArrowUpRight size={14} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-white italic">Node_Spectra_0{i}</p>
                    <p className="text-[8px] font-mono text-slate-600">DIST: 1.4KM</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
               </div>
             ))}
          </div>
        </main>

        {/* Tab Bar */}
        <footer className="h-20 bg-white/2 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6">
           <LayoutDashboard size={20} className="text-ghost-cyan" />
           <MessageSquare size={20} className="text-slate-600" />
           <div className="w-12 h-12 rounded-full bg-ghost-cyan text-ghost-navy flex items-center justify-center -mt-8 shadow-2xl border-4 border-ghost-charcoal">
             <Zap size={24} />
           </div>
           <Search size={20} className="text-slate-600" />
           <Smartphone size={20} className="text-slate-600" />
        </footer>
      </div>
      
      <div className="ml-12 hidden lg:block max-w-sm space-y-6">
         <h2 className="text-2xl font-display font-black text-white italic tracking-tighter">GhostLink Mobile</h2>
         <p className="text-slate-400">
           The GhostLink mobile substrate allows for the same spectral coordination on the go. 
           Optimized for physical-digital spatial overlays.
         </p>
         <button className="glass-pill text-ghost-cyan border-ghost-cyan/20">Vanguard Authorization Required</button>
      </div>
    </div>
  );
}
