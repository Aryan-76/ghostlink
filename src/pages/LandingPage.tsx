import React, { useEffect } from 'react';
import { 
  ArrowRight, 
  Zap, 
  Lock, 
  Globe, 
  Cpu,
  Layout,
  Twitter,
  Github,
  Sparkles,
  Shield
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';

const Nav = React.memo(() => {
  const { user } = useAuthStore();
  
  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 w-full z-50 border-b border-app-border bg-app-bg/80 backdrop-blur-md px-8 py-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-app-foreground flex items-center justify-center shadow-lg">
          <Layout size={20} className="text-app-bg" />
        </div>
        <span className="font-bold text-2xl text-app-foreground tracking-tighter">GhostLink</span>
      </div>
      
      <div className="hidden md:flex items-center gap-10">
        {['Product', 'Enterprise', 'Security', 'Pricing'].map((item) => (
          <button 
            key={item} 
            onClick={() => toast.info(`${item} details summarized in workspace console.`)}
            className="text-[10px] font-bold text-app-muted hover:text-app-foreground uppercase tracking-widest transition-colors"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <Link to="/dashboard" className="px-6 py-2.5 bg-app-foreground text-app-bg rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all flex items-center gap-3 shadow-lg active:scale-95">
            Dashboard <ArrowRight size={16} />
          </Link>
        ) : (
          <>
            <Link to="/auth" className="text-[10px] font-bold text-app-muted hover:text-app-foreground uppercase tracking-widest transition-colors">Access Console</Link>
            <Link to="/auth" className="px-6 py-2.5 bg-app-foreground text-app-bg rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg active:scale-95">
              Get Started
            </Link>
          </>
        )}
      </div>
    </motion.nav>
  );
});

const Hero = () => (
  <section className="pt-56 pb-24 px-8 relative overflow-hidden bg-app-bg">
    <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-app-primary/5 blur-[180px] -z-10 rounded-full animate-pulse" />
    <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-app-primary/5 blur-[160px] -z-10 rounded-full" />
    
    <div className="max-w-7xl mx-auto text-center relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-app-primary/10 border border-app-primary/20 rounded-full text-app-primary mb-12 shadow-sm">
          <Sparkles size={14} className="animate-spin-slow" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Nexus Intelligence v1.0 Live</span>
        </div>
        <h1 className="text-6xl md:text-[7.5rem] font-bold text-app-foreground tracking-tighter mb-10 leading-[0.9] selection:bg-app-primary selection:text-white">
          Architectural <br />
          <span className="text-app-muted opacity-30">Collaboration.</span>
        </h1>
        <p className="text-xl md:text-2xl text-app-muted max-w-3xl mx-auto mb-16 font-medium leading-relaxed opacity-80">
          GhostLink is a secure hyper-workspace for elite teams. Real-time signals, encrypted project nodes, and advanced document architecture in a single minimalist console.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-40"
      >
        <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-app-primary text-white rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-indigo-500 transition-all shadow-2xl shadow-app-primary/40 group active:scale-95">
          Deploy Workspace <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
        </Link>
        <Link to="/auth" className="w-full sm:w-auto px-10 py-5 bg-app-card border border-app-border text-app-foreground rounded-2xl font-bold text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-app-accent transition-all shadow-xl active:scale-95">
          Documentation <Zap size={20} className="text-yellow-500" />
        </Link>
      </motion.div>

      {/* Hero Image / Mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative max-w-6xl mx-auto"
      >
        <div className="absolute -inset-2 bg-gradient-to-r from-app-primary/20 via-blue-500/10 to-app-primary/20 rounded-[3rem] blur-3xl opacity-30 animate-pulse" />
        <div className="relative bg-app-card rounded-[2.5rem] overflow-hidden border border-app-border shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)]">
          <div className="flex items-center gap-2 p-6 border-b border-app-border bg-app-accent/30">
            <div className="w-3 h-3 rounded-full bg-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/20" />
            <div className="ml-6 h-6 px-4 rounded-full bg-app-muted-bg flex items-center text-[10px] text-app-muted font-bold uppercase tracking-widest border border-app-border/30">
              Nexus Environment Console v1.0.42
            </div>
          </div>
          <div className="aspect-[16/10] bg-app-bg flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(79,70,229,0.08),transparent)]" />
             <div className="flex flex-col items-center gap-10 relative z-10 text-center px-16">
                <div className="w-24 h-24 rounded-3xl bg-app-card flex items-center justify-center border border-app-border shadow-2xl relative group">
                   <div className="absolute inset-0 bg-app-primary/5 blur-2xl rounded-full scale-150 group-hover:bg-app-primary/10 transition-colors" />
                   <Cpu size={48} className="text-app-primary relative z-10" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-bold text-app-foreground tracking-tight">Signal Persistence Activated</h3>
                  <p className="text-base text-app-muted max-w-lg font-medium opacity-70">Real-time collaboration nodes finalized with enterprise-grade synchronization protocols.</p>
                </div>
                <div className="grid grid-cols-3 gap-6 w-full max-w-md">
                   {[1, 2, 3].map(i => (
                     <div key={i} className="h-1 bg-app-border rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ x: '-100%' }}
                         animate={{ x: '0%' }}
                         transition={{ duration: 2, delay: i * 0.5, repeat: Infinity, repeatDelay: 1 }}
                         className="w-full h-full bg-app-primary shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                     </div>
                   ))}
                </div>
             </div>
          </div>
        </div>
      </motion.div>
    </div>
  </section>
);

const Features = () => (
  <section className="py-56 px-8 border-y border-app-border bg-app-bg">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
        {[
          { icon: Shield, title: "Identity Vault", desc: "Military-grade data protection. Your project nodes are secured with multi-layer encryption and isolated in high-availability clusters." },
          { icon: Zap, title: "Signal Stream", desc: "Instantaneous state synchronization. Our proprietary real-time engine ensures fluid collaboration across globally distributed teams." },
          { icon: Layout, title: "Nexus Interface", desc: "The definitive minimal HUD for developers. Manage encrypted assets, project signals, and team telemetry in one distilled view." }
        ].map((feature, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: i * 0.2 }}
            key={feature.title} 
            className="p-12 bg-app-card border border-app-border rounded-[2.5rem] hover:bg-app-accent hover:scale-[1.02] transition-all group shadow-xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-app-muted-bg text-app-primary flex items-center justify-center mb-12 group-hover:bg-app-primary group-hover:text-white transition-all shadow-lg font-mono">
              <feature.icon size={28} />
            </div>
            <h3 className="text-2xl font-bold text-app-foreground mb-6 tracking-tight">{feature.title}</h3>
            <p className="text-app-muted leading-relaxed font-medium text-base opacity-80">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default function LandingPage() {
  const { user, isLoading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);
  return (
    <div className="min-h-screen bg-app-bg text-app-muted selection:bg-app-primary selection:text-white">
      <Nav />
      <Hero />
      <Features />
      
      {/* Trust Section */}
      <section className="py-24 border-b border-white/5 text-center">
        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-12">Trusted by innovative teams worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-16 px-8 opacity-40">
           <div className="text-xl font-bold text-white tracking-tighter">STRIPE</div>
           <div className="text-xl font-bold text-white tracking-tighter">VERCEL</div>
           <div className="text-xl font-bold text-white tracking-tighter">LINEAR</div>
           <div className="text-xl font-bold text-white tracking-tighter">RAILWAY</div>
        </div>
      </section>

      <footer className="py-24 px-8 bg-app-card/30">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-16">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-app-primary flex items-center justify-center text-white shadow-xl shadow-app-primary/20">
                <Layout size={24} />
              </div>
              <span className="font-bold text-2xl text-app-foreground tracking-tight">GhostLink</span>
            </div>
            <p className="text-app-muted max-w-xs text-sm leading-relaxed font-medium">
              Empowering high-performance teams with intelligent collaboration tools.
            </p>
            <div className="flex gap-4">
              <Twitter size={20} className="text-app-muted hover:text-app-primary cursor-pointer transition-colors" />
              <Github size={20} className="text-app-muted hover:text-app-foreground cursor-pointer transition-colors" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 md:gap-20">
            <div>
              <h4 className="text-[10px] font-bold text-app-foreground uppercase tracking-widest mb-6">Product</h4>
              <ul className="space-y-4 text-xs font-bold text-app-muted uppercase tracking-wider">
                <li><Link to="/auth" className="hover:text-app-primary transition-colors">Workspace</Link></li>
                <li><span className="opacity-20 cursor-not-allowed">Integrations (Soon)</span></li>
                <li><span className="opacity-20 cursor-not-allowed">API</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-app-foreground uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-4 text-xs font-bold text-app-muted uppercase tracking-wider">
                <li><span className="opacity-20 cursor-not-allowed">About</span></li>
                <li><span className="opacity-20 cursor-not-allowed">Careers</span></li>
                <li><span className="opacity-20 cursor-not-allowed">Blog</span></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-app-foreground uppercase tracking-widest mb-6">Legal</h4>
              <ul className="space-y-4 text-xs font-bold text-app-muted uppercase tracking-wider">
                <li><span className="opacity-20 cursor-not-allowed">Privacy</span></li>
                <li><span className="opacity-20 cursor-not-allowed">Terms</span></li>
                <li><span className="opacity-20 cursor-not-allowed">Security</span></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-app-border flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-bold text-app-muted uppercase tracking-widest">
          <p>© 2026 GHOSTLINK. ALL RIGHTS RESERVED.</p>
          <div className="flex gap-8">
            <button onClick={() => toast.info('Privacy policy coming soon')} className="hover:text-app-foreground transition-colors">Privacy</button>
            <button onClick={() => toast.info('Terms of service coming soon')} className="hover:text-app-foreground transition-colors">Security</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
