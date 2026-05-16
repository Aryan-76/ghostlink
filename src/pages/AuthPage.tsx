import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Mail, Lock, Fingerprint, Github, Twitter } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/workspace');
  };

  return (
    <div className="min-h-screen bg-ghost-navy flex items-center justify-center p-8 relative overflow-hidden">
      {/* Background Atmosphere */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-ghost-cyan/5 blur-[150px] rounded-full pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ghost-cyan to-ghost-violet flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(0,242,255,0.2)]">
            <Fingerprint size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-black text-white italic tracking-tighter mb-2">
            GhostLink Sentinel
          </h1>
          <p className="text-slate-400">Secure access to the vanguard network.</p>
        </div>

        <div className="glass p-8 rounded-3xl shadow-2xl relative">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 pb-3 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
                isLogin ? 'text-ghost-cyan border-ghost-cyan' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Sign In
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 pb-3 text-sm font-bold tracking-widest uppercase transition-all border-b-2 ${
                !isLogin ? 'text-ghost-cyan border-ghost-cyan' : 'text-slate-500 border-transparent hover:text-slate-300'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2 pl-1">Unique Identifier</label>
                <div className="relative">
                  <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    type="text" 
                    placeholder="E.g. Ghost_01"
                    className="w-full glass bg-ghost-charcoal/50 py-4 pl-12 pr-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-ghost-cyan/50 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em] mb-2 pl-1">Node Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="email" 
                  placeholder="name@ghostlink.ai"
                  className="w-full glass bg-ghost-charcoal/50 py-4 pl-12 pr-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-ghost-cyan/50 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-2 pl-1">
                <label className="text-[10px] font-mono text-slate-500 uppercase tracking-[0.2em]">Security Key</label>
                {isLogin && <a href="#" className="text-[10px] font-mono text-ghost-cyan hover:underline">Revoke Access?</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  className="w-full glass bg-ghost-charcoal/50 py-4 pl-12 pr-4 rounded-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-ghost-cyan/50 transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full py-4 bg-white text-ghost-navy rounded-xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 group"
            >
              {isLogin ? 'Establish Connection' : 'Initialize Node'}
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-white/5">
            <p className="text-center text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-6">Or authenticate via spectral bridge</p>
            <div className="flex gap-4">
              <button className="flex-1 glass py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-slate-300">
                <Github size={18} /> <span className="text-xs font-bold font-mono">GITHUB</span>
              </button>
              <button className="flex-1 glass py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-white/5 transition-all text-slate-300">
                <Twitter size={18} /> <span className="text-xs font-bold font-mono">TWITTER</span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-center mt-12 text-[10px] font-mono text-slate-500 uppercase tracking-[0.4em] opacity-50">
          GhostLink Protocol v4.2.0 • Zero Trust Active
        </p>
      </motion.div>
    </div>
  );
}
