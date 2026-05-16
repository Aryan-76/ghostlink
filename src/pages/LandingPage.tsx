import React from 'react';
import { 
  ArrowRight, 
  ChevronRight, 
  Zap, 
  Shield, 
  MessageCircle, 
  Cpu, 
  Globe, 
  Sparkles,
  Github,
  Twitter,
  ChevronDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Nav = () => (
  <motion.nav 
    initial={{ y: -100 }}
    animate={{ y: 0 }}
    transition={{ type: 'spring', damping: 20 }}
    className="fixed top-0 w-full z-50 border-b border-white/5 bg-ghost-navy/80 backdrop-blur-md px-8 py-4 flex items-center justify-between"
  >
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded bg-gradient-to-br from-ghost-cyan to-ghost-violet flex items-center justify-center">
        <Cpu size={18} className="text-white" />
      </div>
      <span className="font-display font-bold text-xl text-white italic">GhostLink</span>
    </div>
    
    <div className="hidden md:flex items-center gap-8">
      {['Product', 'Integrations', 'Security', 'Enterprise'].map((item) => (
        <a key={item} href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">{item}</a>
      ))}
    </div>

    <div className="flex items-center gap-4">
      <Link to="/auth" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Log In</Link>
      <Link to="/auth" className="px-5 py-2 bg-white text-ghost-navy rounded-full text-sm font-bold hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]">
        Get Started
      </Link>
    </div>
  </motion.nav>
);

const Hero = () => (
  <section className="pt-48 pb-20 px-8 relative overflow-hidden">
    {/* Ambient Background Glows */}
    <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-ghost-cyan/5 blur-[160px] -z-10 rounded-full animate-pulse" />
    <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-ghost-violet/10 blur-[140px] -z-10 rounded-full" />
    
    <div className="max-w-6xl mx-auto text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="inline-flex items-center gap-2 glass-pill border-ghost-cyan/20 text-ghost-cyan mb-8 px-4 py-1.5 cursor-pointer hover:bg-white/5 transition-all">
          <span className="w-1.5 h-1.5 rounded-full bg-ghost-cyan animate-ping" />
          <span className="text-[10px] font-mono tracking-widest font-black">Vanguard Beta v0.4.2</span>
        </div>
        <h1 className="text-6xl md:text-[9.5rem] font-black text-white italic tracking-tighter mb-12 leading-[0.8] mix-blend-lighten">
          The <span className="text-ghost-cyan cyan-text-glow">Collective</span> <br />
          <span className="text-ghost-violet">Kernel</span>.
        </h1>
        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-16 font-medium leading-relaxed italic">
          GhostLink is a high-frequency coordination engine where humans and 
          intelligence models converge in a unified spatial substrate.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.2 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-32"
      >
        <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-ghost-cyan text-ghost-navy rounded-full font-bold flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-[0_0_50px_rgba(0,242,255,0.4)] group">
          Join the Fleet <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </Link>
        <a href="#" className="w-full sm:w-auto px-10 py-5 glass text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all border-white/10">
          View Blueprint <Zap size={20} className="text-yellow-400" />
        </a>
      </motion.div>

      {/* Hero Image / Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
        whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative group perspective-1000"
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-ghost-cyan via-ghost-violet to-ghost-cyan rounded-[3rem] blur-2xl opacity-10 group-hover:opacity-20 transition duration-1000" />
        <div className="relative glass bg-ghost-navy/90 rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5 ring-1 ring-white/10">
          <div className="flex items-center gap-2 p-5 border-b border-white/5 bg-white/2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-white/5" />
              <div className="w-3 h-3 rounded-full bg-white/5" />
              <div className="w-3 h-3 rounded-full bg-white/5" />
            </div>
            <div className="mx-auto h-6 px-6 rounded-full bg-white/5 flex items-center text-[9px] font-mono text-slate-500 tracking-wider">
              GHOSTLINK_VANGUARD_SUBSYSTEM
            </div>
          </div>
          <div className="aspect-[16/10] bg-gradient-to-br from-ghost-charcoal to-ghost-navy relative overflow-hidden">
             <div className="absolute inset-0 grid grid-cols-12 grid-rows-12 opacity-10">
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} className="border-[0.5px] border-white/10" />
                ))}
             </div>
             <motion.div 
               animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
               transition={{ duration: 4, repeat: Infinity }}
               className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] bg-ghost-cyan/5 blur-[100px] rounded-full" 
             />
             <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                <Sparkles size={64} className="text-white/5 animate-pulse" />
                <div className="text-white/10 font-mono text-xs tracking-[1em] uppercase">Spectral Neural Sync Active</div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Features = () => (
  <section className="py-48 px-8 border-y border-white/5">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {[
          { icon: <Shield />, title: "Quantum Security", desc: "End-to-end encryption with ephemeral keys. Your data never touches a third-party server." },
          { icon: <Globe />, title: "Spectral Presence", desc: "Zero-latency synchronization across every node in your network. Truly real-time." },
          { icon: <Sparkles />, title: "AI-Augmented", desc: "Omnipresent intelligence that learns your workflow and anticipates your next move." }
        ].map((feature, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.1 }}
            key={i} 
            className="p-10 glass rounded-[2.5rem] hover:border-ghost-cyan/30 transition-all group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/2 rounded-full blur-[60px] group-hover:bg-ghost-cyan/5 transition-all" />
            <div className="w-14 h-14 rounded-2xl bg-white/5 text-ghost-cyan flex items-center justify-center mb-10 group-hover:scale-110 transition-transform group-hover:cyan-text-glow">
              {React.cloneElement(feature.icon as React.ReactElement, { size: 28 })}
            </div>
            <h3 className="text-2xl font-bold text-white mb-6 italic tracking-tight">{feature.title}</h3>
            <p className="text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-ghost-navy selection:bg-ghost-cyan selection:text-ghost-navy">
      <Nav />
      <Hero />
      <Features />
      
      {/* Social Proof */}
      <section className="py-32 flex flex-wrap justify-center items-center gap-20 grayscale opacity-10">
        <span className="font-display font-black text-4xl italic tracking-tighter">NEXUS</span>
        <span className="font-display font-black text-4xl italic tracking-tighter">ORBIT</span>
        <span className="font-display font-black text-4xl italic tracking-tighter">CORE</span>
        <span className="font-display font-black text-4xl italic tracking-tighter">SPECTRA</span>
      </section>

      <footer className="py-24 px-8 border-t border-white/5 bg-ghost-charcoal/20 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ghost-cyan/10 flex items-center justify-center text-ghost-cyan">
                <Cpu size={24} />
              </div>
              <span className="font-display font-black text-3xl text-white italic tracking-tighter">GhostLink</span>
            </div>
            <p className="text-slate-500 max-w-xs text-sm leading-relaxed italic">
              Empowering high-performance teams with decentralized collective intelligence.
            </p>
            <div className="flex gap-4 text-slate-400">
              <Twitter size={20} className="hover:text-ghost-cyan cursor-pointer transition-colors" />
              <Github size={20} className="hover:text-white cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-20">
            <div>
              <h4 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Workspace</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Command Center</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">About</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-mono text-white uppercase tracking-widest mb-6">Support</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Docs</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">API</a></li>
                <li><a href="#" className="hover:text-ghost-cyan transition-colors">Status</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">© 2026 GHOSTLINK KERNEL. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8 text-[10px] font-mono text-slate-700 uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Spectral Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
