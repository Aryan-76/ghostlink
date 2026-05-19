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
  Globe,
  Menu,
  X as CloseIcon,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badgeCount?: number;
  onClick?: () => void;
}

const SidebarItem = ({ to, icon, label, active, badgeCount, onClick }: SidebarItemProps) => (
  <Link to={to} onClick={onClick} aria-label={`Navigate to ${label}`} aria-current={active ? 'page' : undefined}>
    <motion.div
      whileHover={{ x: 4 }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-app-primary text-white shadow-lg shadow-app-primary/20' 
          : 'text-app-muted hover:text-app-foreground hover:bg-app-muted-bg'
      }`}
    >
      <span className={`${active ? 'text-white' : ''}`}>{icon}</span>
      <span className="font-semibold text-sm tracking-tight">{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="ml-auto bg-emerald-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] flex items-center justify-center border-2 border-app-card">
          {badgeCount}
        </span>
      )}
      {active && !badgeCount && (
        <motion.div 
          layoutId="active-indicator"
          className="ml-auto w-1 h-4 bg-white/40 rounded-full" 
        />
      )}
    </motion.div>
  </Link>
);

import { Toaster, toast } from 'sonner';
import { useAuthStore } from '../../store/authStore';
import { useWorkspace } from '../../hooks/useWorkspace';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import NexusSearchModal from '../NexusSearchModal';
import NotificationCenter from '../NotificationCenter';

export const Shell = React.memo(({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, conversations, allUsers } = useWorkspace();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  // Calculate real unread signals
  const unreadCount = React.useMemo(() => {
    return conversations.reduce((acc, conv) => {
      if (!user) return acc;
      const lastMessageAt = (conv.lastMessageAt as any)?.toMillis?.() || 0;
      const lastReadAt = (conv.lastRead?.[user.uid] as any)?.toMillis?.() || 0;
      const lastSenderId = conv.lastSenderId || null;

      // Check if there are unread messages - add 1s grace period for clock skew
      // and ensure it wasn't sent BY the current user
      const isUnread = lastMessageAt > (lastReadAt + 1000) && 
                      conv.lastMessage !== 'Conversation started' &&
                      lastSenderId !== user.uid;
      
      return isUnread ? acc + 1 : acc;
    }, 0);
  }, [conversations, user?.uid]);

  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);

  useEffect(() => {
    // Close sidebar on route change
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const isAuth = location.pathname === '/auth';
  const isLanding = location.pathname === '/';
  const isMobileView = location.pathname === '/mobile';

  if (isAuth || isLanding || isMobileView) return <>{children}</>;

  const menuItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/community', icon: <Globe size={18} />, label: 'Community' },
    { to: '/messages', icon: <MessageSquare size={18} />, label: 'Messages', badgeCount: unreadCount },
    { to: '/settings', icon: <User size={18} />, label: 'Settings' },
  ];

  const userInitial = user?.displayName ? user.displayName[0] : (user?.email ? user.email[0] : 'U');
  const currentPageLabel = menuItems.find(item => item.to === location.pathname)?.label || 'Workspace';

  return (
    <div className="flex h-screen bg-app-bg overflow-hidden relative selection:bg-app-primary/30 selection:text-white">
      <Toaster theme={theme === 'dark' ? 'dark' : 'light'} position="top-center" richColors />
      <NexusSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 w-[280px] bg-app-card border-r border-app-border flex flex-col z-50 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-label="Main Sidebar"
      >
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-app-primary flex items-center justify-center shadow-xl shadow-app-primary/20">
                <Network size={22} className="text-white" />
              </div>
              <span className="font-display font-black text-xl tracking-tighter text-app-foreground">GhostLink</span>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-app-muted hover:text-app-foreground">
              <CloseIcon size={20} />
            </button>
          </div>

          <div className="text-[10px] uppercase tracking-[0.3em] text-app-muted font-bold mb-6 ml-2 opacity-40">System Nodes</div>
          <nav className="space-y-2 flex-1" aria-label="Main Navigation">
            {menuItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                to={item.to} 
                icon={item.icon} 
                label={item.label} 
                active={location.pathname === item.to}
                badgeCount={item.badgeCount}
                onClick={() => setIsSidebarOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-app-border">
            <Link to="/settings" className="flex items-center gap-4 p-4 bg-app-muted-bg/50 rounded-2xl border border-app-border group hover:border-app-primary/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex-shrink-0 flex items-center justify-center text-[12px] font-bold text-app-muted uppercase overflow-hidden shadow-sm">
                {user?.photoURL ? (
                  <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  userInitial
                )}
              </div>
              <div className="overflow-hidden min-w-0">
                <div className="text-sm font-bold text-app-foreground truncate">{user?.displayName || user?.email || 'User'}</div>
                <div className="text-[9px] text-app-muted font-bold uppercase tracking-widest opacity-60">Verified Operator</div>
              </div>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 text-app-foreground">
        <header className="h-20 border-b border-app-border bg-app-bg/80 backdrop-blur-md flex items-center justify-between px-6 md:px-10" role="banner">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 text-app-muted hover:text-app-foreground transition-all"
            >
              <Menu size={24} />
            </button>
            <nav className="flex items-center gap-3 text-app-muted text-[10px] font-bold uppercase tracking-widest" aria-label="Breadcrumb">
              <Link to="/dashboard" className="hover:text-app-primary transition-colors">GhostLink</Link>
              <span className="opacity-20" aria-hidden="true">/</span>
              <span className="text-app-foreground">{currentPageLabel}</span>
            </nav>
          </div>

          <div className="flex items-center gap-4 md:gap-8">
            <div className="hidden lg:flex items-center relative group">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={14} className="text-app-muted" />
              </div>
              <input 
                type="text" 
                readOnly
                onClick={() => setIsSearchOpen(true)}
                placeholder="Universal Search..." 
                className="bg-app-muted-bg border border-app-border rounded-xl pl-12 pr-12 py-2.5 text-xs focus:outline-none focus:border-app-primary/40 w-72 text-app-foreground transition-all font-medium placeholder:text-app-muted/50 cursor-pointer"
              />
              <div className="absolute right-3 px-1.5 py-0.5 rounded border border-app-border bg-app-card text-[9px] font-bold text-app-muted opacity-40">
                ⌘K
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className={`p-2.5 rounded-xl transition-all relative ${isNotificationsOpen ? 'bg-app-primary text-white shadow-lg' : 'text-app-muted hover:text-app-foreground hover:bg-app-muted-bg'}`}
                >
                  <Bell size={20} />
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-emerald-500 rounded-full border-2 border-app-bg" />
                </button>
                <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success('Nexus signal link copied');
                }}
                className="bg-app-foreground text-app-bg px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-black/10"
              >
                Share
              </button>
            </div>
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
