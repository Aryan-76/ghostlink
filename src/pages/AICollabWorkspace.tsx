import React from 'react';
import { 
  Plus, 
  Search, 
  Sparkles, 
  Activity, 
  Code2, 
  Cpu, 
  Share2, 
  MoreHorizontal,
  ChevronRight,
  Database,
  RefreshCcw,
  Zap,
  Users
} from 'lucide-react';
import { motion } from 'motion/react';

const Node = ({ title, status, load }: any) => (
  <div className="glass p-4 rounded-xl flex items-center justify-between group hover:border-ghost-cyan/40 transition-all cursor-pointer">
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${status === 'active' ? 'bg-ghost-cyan animate-pulse' : 'bg-slate-700'}`} />
      <div>
        <p className="text-xs font-bold text-white italic transition-colors group-hover:text-ghost-cyan">{title}</p>
        <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">{load}% Node Intensity</p>
      </div>
    </div>
    <MoreHorizontal size={14} className="text-slate-700 group-hover:text-slate-400" />
  </div>
);

const Suggestion = ({ title, desc }: any) => (
  <div className="glass bg-white/2 p-4 rounded-2xl border-l-2 border-ghost-violet relative overflow-hidden group hover:bg-white/5 transition-all cursor-pointer">
    <div className="absolute -right-4 -top-4 w-16 h-16 bg-ghost-violet/5 rounded-full blur-xl transition-all group-hover:bg-ghost-violet/10" />
    <div className="flex items-center gap-2 mb-2">
      <Sparkles size={14} className="text-ghost-violet" />
      <span className="text-[10px] font-mono text-ghost-violet uppercase tracking-widest font-bold">Augmented Insight</span>
    </div>
    <h4 className="text-sm font-bold text-white mb-1 italic">{title}</h4>
    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

export default function AICollabWorkspace() {
  return (
    <div className="flex h-full bg-ghost-navy">
      {/* Left Context: Nodes & Infrastructure */}
      <div className="w-80 border-r border-ghost-border p-6 flex flex-col space-y-8 bg-ghost-charcoal/20">
        <div>
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 px-1">Living Nodes</h3>
          <div className="space-y-2">
            <Node title="Primary Synthesis Core" status="active" load="84" />
            <Node title="Spectral Memory Node" status="active" load="12" />
            <Node title="Vanguard Gate" status="idle" load="0" />
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-4 px-1">Active Augmentations</h3>
          <div className="space-y-4">
            <Suggestion 
              title="Memory Refactor" 
              desc="I've noticed repetitive spectral queries. I can cache the resonance map to save 14% compute." 
            />
            <Suggestion 
              title="Auto-Doc Sync" 
              desc="Project Nexus lacks latest deployment logs. Shall I synthesize from the build output?" 
            />
          </div>
        </div>

        <div className="mt-auto glass bg-ghost-violet/10 p-4 rounded-2xl border-ghost-violet/20">
          <div className="flex items-center gap-2 mb-3">
            <Cpu size={16} className="text-ghost-violet" />
            <span className="text-xs font-bold font-display italic text-ghost-violet">Neural Engine Status</span>
          </div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden mb-2">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '92%' }}
              className="h-full bg-ghost-violet violet-glow" 
            />
          </div>
          <div className="flex justify-between text-[8px] font-mono text-slate-500">
            <span>COHERENCE</span>
            <span>92.4%</span>
          </div>
        </div>
      </div>

      {/* Main Execution Area */}
      <div className="flex-1 flex flex-col p-8 space-y-8 overflow-y-auto h-full custom-scrollbar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-ghost-cyan shadow-[0_0_20px_rgba(34,211,238,0.1)]">
              <Activity size={24} />
            </div>
            <div>
              <h1 className="text-4xl font-display font-black text-white italic tracking-tighter">Collective Intelligence</h1>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mt-1">Project Nexus Evolution Substrate</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="glass p-2.5 rounded-lg text-slate-400 hover:text-white transition-all"><Share2 size={18} /></button>
            <button className="glass p-2.5 rounded-lg text-slate-400 hover:text-white transition-all"><RefreshCcw size={18} /></button>
            <button className="px-6 py-2.5 bg-white text-ghost-navy rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] ml-2">
              <Zap size={16} /> Deploy Synthesis
            </button>
          </div>
        </div>

        <div className="max-w-4xl">
          <p className="text-zinc-400 leading-relaxed text-lg mb-8 italic">
            The GhostLink infrastructure leverages a hybrid edge-compute model to ensure zero-latency synchronization across global regions. 
            By employing <span className="text-ghost-cyan border-b border-ghost-cyan/30">semantic state merging</span>, we resolve conflicts before they even appear to the user.
          </p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="p-6 border border-white/10 rounded-2xl bg-white/2 glass-panel group hover:border-ghost-cyan/20 transition-all cursor-pointer">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">Component 01</div>
              <div className="text-xl font-bold text-white italic">Edge Gateway</div>
              <div className="h-16 w-full mt-6 flex items-end gap-1.5 px-2">
                <motion.div initial={{ height: 0 }} animate={{ height: '20%' }} className="w-full bg-ghost-cyan/20 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} className="w-full bg-ghost-cyan/40 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '80%' }} className="w-full bg-ghost-cyan cyan-glow rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '50%' }} className="w-full bg-ghost-cyan/60 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '30%' }} className="w-full bg-ghost-cyan/30 rounded-t-sm" />
              </div>
            </div>
            <div className="p-6 border border-white/10 rounded-2xl bg-white/2 glass-panel group hover:border-ghost-violet/20 transition-all cursor-pointer">
              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-mono">Component 02</div>
              <div className="text-xl font-bold text-white italic">Spectral Cache</div>
              <div className="h-16 w-full mt-6 flex items-end gap-1.5 px-2">
                <motion.div initial={{ height: 0 }} animate={{ height: '60%' }} className="w-full bg-ghost-violet/20 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '20%' }} className="w-full bg-ghost-violet/40 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '40%' }} className="w-full bg-ghost-violet violet-glow rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '90%' }} className="w-full bg-ghost-violet/60 rounded-t-sm" />
                <motion.div initial={{ height: 0 }} animate={{ height: '70%' }} className="w-full bg-ghost-violet/30 rounded-t-sm" />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/30 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ghost-cyan animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
              <span className="text-[10px] font-mono text-ghost-cyan font-bold tracking-widest">SUGGESTION ENGINE ACTIVE</span>
            </div>
            <p className="text-sm text-zinc-300 italic">
              Based on your current architecture, should we add a dedicated <span className="text-ghost-cyan underline underline-offset-4 decoration-ghost-cyan/30 cursor-pointer hover:text-ghost-cyan/80 transition-colors">Websocket Handshaker</span> for the mobile workspace clients?
            </p>
          </div>
        </div>

        {/* The 'Glass' Editor/Canvas */}
        <div className="flex-1 glass rounded-3xl p-8 flex flex-col relative overflow-hidden min-h-[400px]">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ghost-cyan via-ghost-violet to-ghost-cyan opacity-50" />
          
          <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-4">
             <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                <Code2 size={14} className="text-slate-400" />
                <span className="text-[10px] font-mono text-slate-400">src/kernel/spectre.rs</span>
             </div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-ghost-cyan cyan-glow" />
                <span className="text-[10px] font-mono text-ghost-cyan uppercase tracking-widest font-bold">AI ACTIVE: Synthesizing Logic</span>
             </div>
          </div>

          <div className="flex-1 font-mono text-sm space-y-4 text-slate-500 overflow-y-auto custom-scrollbar">
            <p><span className="text-ghost-violet">pub fn</span> <span className="text-ghost-cyan">init_spectral_bridge</span>() &#123;</p>
            <p className="pl-8 text-slate-600">// GhostLink AI: Optimized the buffer allocation strategy for zero-latency spikes.</p>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="pl-8 text-slate-300 bg-ghost-cyan/5 border-l-2 border-ghost-cyan py-1"
            >
              let buffer = SpectralBuffer::with_capacity(1024 * 1024);
            </motion.p>
            <p className="pl-8 text-slate-300">let bridge = Bridge::connect(buffer);</p>
            <motion.p 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
              className="pl-8 text-ghost-cyan bg-ghost-cyan/5 border-l-2 border-ghost-cyan py-1"
            >
              bridge.optimize_resonance();
            </motion.p>
            <p className="pl-8 text-slate-300">return bridge;</p>
            <p>&#125;</p>
          </div>

          {/* Inline Suggestion Floating */}
          <div className="absolute bottom-8 right-8 w-80 glass bg-ghost-charcoal/90 p-4 rounded-2xl shadow-2xl border-ghost-cyan/20 translate-y-0 hover:-translate-y-1 transition-all cursor-pointer group">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono text-ghost-cyan uppercase font-black">AI Suggestion</span>
                <ChevronRight size={14} className="text-slate-600 group-hover:translate-x-1 transition-all" />
             </div>
             <p className="text-xs text-slate-300 leading-relaxed">
               "I've added a resonance optimization call. This should eliminate the spectral jitter in Sector 7. Review the diff?"
             </p>
          </div>
        </div>

        {/* Control Strip */}
        <div className="glass p-4 rounded-2xl flex items-center gap-6">
           <div className="flex items-center gap-2">
              <Database size={16} className="text-slate-400" />
              <span className="text-[10px] font-mono text-slate-500">KNOWLEDGE SOURCE: LATEST_SPECS_V4</span>
           </div>
           <div className="h-4 w-px bg-white/5" />
           <div className="flex items-center gap-2">
              <Users size={16} className="text-slate-400" />
              <span className="text-[10px] font-mono text-slate-500">COLLABORATORS: SARAH, AI_UNIT_7</span>
           </div>
           <div className="ml-auto text-[10px] font-mono text-slate-700 italic">LAST SAVED: 12 SECONDS AGO</div>
        </div>
      </div>
    </div>
  );
}
