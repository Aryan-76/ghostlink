import React from 'react';
import { Bell, X, Check, Activity, MessageSquare, UserPlus, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../hooks/useWorkspace';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const { activities } = useWorkspace();
  
  // Last 5 activities as mock notifications
  const notifications = activities.slice(0, 5).map(a => ({
      id: a.id,
      title: a.title,
      time: a.time || '1m ago',
      read: false,
      type: a.type
  }));

  if (!isOpen) return null;

  return (
    <div className="absolute top-full right-0 mt-4 w-96 bg-app-card border border-app-border rounded-3xl shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
      <div className="p-6 border-b border-app-border flex items-center justify-between bg-app-accent/30">
        <div className="flex items-center gap-3">
          <Bell size={18} className="text-app-primary" />
          <h3 className="text-sm font-bold text-app-foreground tracking-tight uppercase">Control Center</h3>
        </div>
        <div className="flex items-center gap-2">
           <button className="text-[9px] font-bold text-app-primary uppercase tracking-widest hover:underline px-2">Clear All</button>
           <button onClick={onClose} className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded-lg transition-all">
             <X size={18} />
           </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-4 space-y-2">
        {notifications.length > 0 ? (
          notifications.map((n) => (
            <div key={n.id} className="p-4 rounded-2xl bg-app-muted-bg/50 border border-transparent hover:border-app-border transition-all group flex gap-4 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-app-card border border-app-border flex items-center justify-center text-app-primary group-hover:bg-app-primary group-hover:text-white transition-all shadow-sm">
                {n.type.includes('message') ? <MessageSquare size={16} /> : 
                 n.type.includes('member') ? <UserPlus size={16} /> : 
                 <Activity size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-app-foreground line-clamp-2 leading-tight">{n.title}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-app-muted uppercase tracking-tighter">{n.time}</span>
                  {!n.read && <div className="w-1.5 h-1.5 bg-app-primary rounded-full" />}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Info size={32} className="mx-auto text-app-muted/20 mb-3" />
            <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Nexus is stable. No alerts.</p>
          </div>
        )}
      </div>

      <div className="p-4 bg-app-accent/20 border-t border-app-border text-center">
        <button className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em] hover:text-app-primary transition-all">View All Signals</button>
      </div>
    </div>
  );
}
