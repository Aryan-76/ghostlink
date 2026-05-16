import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart3, 
  MessageSquare, 
  BrainCircuit, 
  Search, 
  User, 
  Settings, 
  LayoutDashboard, 
  Hash, 
  Layers, 
  Command,
  Smartphone,
  Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ to, icon, label, active }: SidebarItemProps) => (
  <Link to={to}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-ghost-cyan/10 text-ghost-cyan border border-ghost-cyan/20' 
          : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
      }`}
    >
      <span className={`${active ? 'cyan-text-glow' : ''}`}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1 h-4 bg-ghost-cyan rounded-full cyan-glow" 
        />
      )}
    </motion.div>
  </Link>
);

export const Shell = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAuth = location.pathname === '/auth';
  const isLanding = location.pathname === '/';
  const isMobileView = location.pathname === '/mobile';

  if (isAuth || isLanding || isMobileView) return <>{children}</>;

  const menuItems = [
    { to: '/workspace', icon: <LayoutDashboard size={18} />, label: 'Main Workspace' },
    { to: '/chat', icon: <MessageSquare size={18} />, label: 'Realtime Chat' },
    { to: '/ai-collab', icon: <BrainCircuit size={18} />, label: 'AI Collaboration' },
    { to: '/command', icon: <Command size={18} />, label: 'Command Center' },
    { to: '/search', icon: <Search size={18} />, label: 'Intelligence Search' },
    { to: '/threads', icon: <Hash size={18} />, label: 'Spatial Threads' },
    { to: '/profile', icon: <User size={18} />, label: 'Identity' },
  ];

  return (
    <div className="flex h-screen bg-[#020306] overflow-hidden relative selection:bg-ghost-cyan selection:text-ghost-navy">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 violet-glow pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/3 cyan-glow pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="w-[240px] glass-panel border-r border-white/10 flex flex-col flex-shrink-0 z-20">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
              <Network size={18} className="text-white" />
            </div>
            <span className="font-display font-black text-xl tracking-tighter text-white italic">GhostLink</span>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-500 font-bold mb-4 ml-2">Workspace</div>
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={location.pathname === item.to}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="glass-panel rounded-xl p-3 border border-white/5 group hover:border-ghost-cyan/20 transition-all cursor-pointer">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-700 to-zinc-500 flex-shrink-0 border border-white/10"></div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate italic">Alex Revenant</div>
                <div className="text-[10px] text-zinc-500 font-mono">PRO PLAN • ACTIVE</div>
              </div>
            </div>
            <div className="w-full bg-zinc-800/50 h-1.5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '75%' }}
                className="h-full bg-ghost-cyan glow-accent" 
              />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-16 border-b border-white/10 glass-panel flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-widest">
              <span className="hover:text-zinc-300 cursor-pointer">GhostLink</span>
              <span className="opacity-30">/</span>
              <span className="text-white font-bold">{location.pathname.replace('/', '').replace(/-/g, ' ') || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <span className="text-zinc-600 text-[10px] font-mono">⌘K</span>
              </div>
              <input 
                type="text" 
                placeholder="Search commands..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-ghost-cyan/50 w-64 text-zinc-300 transition-all"
              />
            </div>

            <div className="flex -space-x-2">
              {[
                { label: 'AR', color: 'bg-violet-400' },
                { label: 'ES', color: 'bg-ghost-cyan' }
              ].map((user, i) => (
                <div key={i} className={`w-7 h-7 rounded-full border-2 border-[#020306] ${user.color} flex items-center justify-center text-[10px] font-black text-black z-${20-i}`}>
                  {user.label}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-[#020306] bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 z-0">
                +4
              </div>
            </div>

            <button className="bg-white text-ghost-navy px-5 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              Share
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="h-10 border-t border-white/5 bg-black/40 backdrop-blur-3xl flex items-center justify-between px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
              <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Spectral Sync Active</span>
            </div>
            <div className="h-3 w-px bg-zinc-800"></div>
            <span className="text-[9px] text-zinc-600 font-mono tracking-widest font-bold">V0.9.2-ALPHA</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-[9px] text-zinc-600 font-mono font-bold">LATENCY: 14MS</span>
            <span className="text-[9px] text-zinc-600 font-mono font-bold tracking-widest bg-white/5 px-2 py-0.5 rounded">GHOST-OS ENABLED</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
