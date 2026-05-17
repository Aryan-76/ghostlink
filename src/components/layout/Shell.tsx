import React, { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  BrainCircuit, 
  Search, 
  User, 
  LayoutDashboard, 
  Hash, 
  Command,
  Network,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  key?: React.Key;
}

const SidebarItem = ({ to, icon, label, active }: SidebarItemProps) => (
  <Link to={to} aria-label={`Navigate to ${label}`} aria-current={active ? 'page' : undefined}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${
        active 
          ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
          : 'text-zinc-500 hover:text-zinc-100 hover:bg-white/5'
      }`}
    >
      <span className={`${active ? 'text-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.2)]' : ''}`}>{icon}</span>
      <span className="font-medium text-sm">{label}</span>
      {active && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" 
        />
      )}
    </motion.div>
  </Link>
);

import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Shell = React.memo(({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    let isSubscribed = true;

    const syncUserProfile = async () => {
      if (!user || !user.uid) return;
      
      try {
        const userRef = doc(db, 'users', user.uid);
        // Only attempt to sync if we're not already in the middle of a sync
        const userSnap = await getDoc(userRef);
        
        if (isSubscribed && !userSnap.exists()) {
          console.log("[Shell] Syncing new user profile...");
          await setDoc(userRef, {
            userId: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp()
          });
        }
      } catch (error: any) {
        // Silently handle "client is offline" errors
        if (!error?.message?.includes('offline')) {
          console.error("Profile sync error:", error);
        }
      }
    };
    
    syncUserProfile();
    return () => { isSubscribed = false; };
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        navigate('/command');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
  
  const isAuth = location.pathname === '/auth';
  const isLanding = location.pathname === '/';
  const isMobileView = location.pathname === '/mobile';

  if (isAuth || isLanding || isMobileView) return <>{children}</>;

  const menuItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/community', icon: <Globe size={18} />, label: 'Community' },
    { to: '/messages', icon: <MessageSquare size={18} />, label: 'Messages' },
    { to: '/settings', icon: <User size={18} />, label: 'Settings' },
  ];

  const userInitial = user?.displayName ? user.displayName[0] : (user?.email ? user.email[0] : 'U');
  const currentPageLabel = menuItems.find(item => item.to === location.pathname)?.label || 'Project';

  return (
    <div className="flex h-screen bg-[#020306] overflow-hidden relative selection:bg-indigo-500/30 selection:text-white">
      <Toaster theme="dark" position="top-center" />
      
      {/* Sidebar */}
      <aside className="w-[240px] bg-[#0A0B0E] border-r border-white/5 flex flex-col flex-shrink-0 z-20" aria-label="Main Sidebar">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Network size={18} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight text-white">GhostLink</span>
          </div>

          <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-bold mb-4 ml-2">Platform</div>
          <nav className="space-y-1" aria-label="Main Navigation">
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

        <div className="mt-auto p-4 border-t border-white/5 bg-white/[0.01]">
          <Link to="/settings" className="flex items-center gap-3 px-2 py-1 group cursor-pointer" role="button" aria-label="User Profile">
            <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
              {userInitial}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">{user?.displayName || user?.email || 'User'}</div>
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">MVP Early Access</div>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-16 border-b border-white/5 bg-[#020306]/80 backdrop-blur-md flex items-center justify-between px-8" role="banner">
          <div className="flex items-center gap-4">
            <nav className="flex items-center gap-2 text-zinc-500 text-xs font-medium" aria-label="Breadcrumb">
              <Link to="/dashboard" className="hover:text-zinc-300 transition-colors">GhostLink</Link>
              <span className="opacity-20" aria-hidden="true">/</span>
              <span className="text-zinc-100 font-medium">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-md">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search size={12} className="text-zinc-500" />
              </div>
              <input 
                type="text" 
                placeholder="Search projects..." 
                aria-label="Universal Search"
                className="bg-white/5 border border-white/10 rounded-md pl-9 pr-12 py-1.5 text-xs focus:outline-none focus:border-white/20 w-64 text-zinc-300 transition-all font-medium"
              />
            </div>

            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast.success('Link copied to clipboard');
              }}
              className="bg-white hover:bg-zinc-200 text-black px-4 py-1.5 rounded-md text-xs font-semibold transition-all active:scale-95"
              aria-label="Share page"
            >
              Share
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative" id="main-content">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
});
