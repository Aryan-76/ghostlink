import React from 'react';
import { 
  Shield, 
  Zap, 
  Settings, 
  Cpu, 
  Unlock, 
  LogOut, 
  Activity, 
  Globe, 
  Smartphone,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

const Achievement = ({ title, date, icon: Icon }: any) => (
  <div className="glass p-4 rounded-2xl flex items-center gap-4 group hover:bg-white/5 transition-all cursor-pointer">
    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 group-hover:text-ghost-cyan transition-colors">
      <Icon size={18} />
    </div>
    <div>
      <h4 className="text-sm font-bold text-white italic tracking-tight">{title}</h4>
      <p className="text-[10px] font-mono text-slate-600 uppercase transition-colors">{date}</p>
    </div>
  </div>
);

export default function UserProfile() {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-12">
        <div className="relative group">
          <div className="absolute -inset-2 bg-gradient-to-br from-ghost-cyan to-ghost-violet rounded-full blur opacity-50 group-hover:opacity-80 transition duration-1000" />
          <div className="relative w-40 h-40 rounded-full bg-ghost-charcoal border-4 border-ghost-navy overflow-hidden">
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-ghost-cyan">
              <Smartphone size={64} className="opacity-20 absolute" />
              <span className="text-6xl font-display font-black italic opacity-50">AR</span>
            </div>
            {/* Status indicator */}
            <div className="absolute bottom-4 right-4 w-6 h-6 bg-green-500 border-4 border-ghost-charcoal rounded-full cyan-glow" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-2">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
             <h1 className="text-4xl font-display font-black text-white italic tracking-tighter">Alex Revenant</h1>
             <span className="glass-pill text-ghost-cyan border-ghost-cyan/20 self-center">Vanguard Clearanc</span>
          </div>
          <p className="text-slate-400 max-w-xl">
            Lead Spectral Engineer based in Neo-Tokyo. Specializing in zero-latency AI-bridges and distributed node coordination.
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">
              <Globe size={14} /> Latency: 1.2ms
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1.5 rounded-full">
              <Activity size={14} /> Stability: 99.9%
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button className="glass p-4 rounded-2xl text-slate-400 hover:text-white transition-all"><Settings size={20} /></button>
          <button className="glass p-4 rounded-2xl text-red-500 hover:bg-red-500/10 transition-all"><LogOut size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {/* Identity & Security */}
        <div className="space-y-8">
           <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Shield size={14} className="text-ghost-cyan" /> Spectral Security
          </h3>
          <div className="glass p-8 rounded-3xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white italic tracking-tight">Identity Encryption</p>
                <p className="text-[10px] font-mono text-slate-500 uppercase">Rotational keys active</p>
              </div>
              <Unlock size={18} className="text-ghost-cyan" />
            </div>
            <div className="h-px w-full bg-white/5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-white italic tracking-tight">Access Level</p>
              <div className="flex items-center gap-2 mt-2">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 3 ? 'bg-ghost-cyan cyan-glow' : 'bg-slate-800'}`} />
                ))}
              </div>
              <p className="text-[10px] font-mono text-slate-600 mt-2">Level 3: Global System Authority</p>
            </div>
          </div>
        </div>

        {/* Neural Achievements */}
        <div className="md:col-span-2 space-y-8">
           <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest px-1 flex items-center gap-2">
            <Sparkles size={14} className="text-ghost-violet" /> Network Milestones
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Achievement title="Quantum Leap" date="MAR 12, 2024" icon={Zap} />
            <Achievement title="Deep Synthesis" date="FEB 28, 2024" icon={Sparkles} />
            <Achievement title="Node Anchor" date="JAN 15, 2024" icon={Cpu} />
            <Achievement title="Vanguard Shield" date="DEC 02, 2023" icon={Shield} />
          </div>

          <div className="glass p-8 rounded-3xl bg-ghost-violet/5 border-ghost-violet/10">
            <h4 className="font-display font-bold text-white italic mb-4">Spectral Bio Integrity</h4>
            <div className="flex items-end gap-12">
               <div className="space-y-2">
                  <span className="text-4xl font-display font-black text-ghost-violet">98.4%</span>
                  <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed">
                    Identity coherence remains within target parameters. No drift detected.
                  </p>
               </div>
               <button className="px-6 py-2.5 glass text-white rounded-full text-[10px] font-bold font-mono tracking-widest hover:bg-white/5 transition-all mb-1">
                 SYNC BIO
               </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
