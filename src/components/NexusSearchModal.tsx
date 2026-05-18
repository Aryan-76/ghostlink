import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  X, 
  FileText, 
  Users, 
  Hash, 
  ChevronRight,
  Command,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useWorkspace } from '../hooks/useWorkspace';

interface NexusSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NexusSearchModal({ isOpen, onClose }: NexusSearchModalProps) {
  const navigate = useNavigate();
  const { projects, allUsers } = useWorkspace();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: 'project' | 'user'; id: string; title: string; subtitle: string }[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const projectResults = projects
      .filter(p => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      .map(p => ({ type: 'project' as const, id: p.id, title: p.title, subtitle: 'Neural Workflow' }));

    const userResults = allUsers
      .filter(u => u.displayName?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
      .map(u => ({ type: 'user' as const, id: u.id, title: u.displayName || u.email, subtitle: 'Operator Node' }));

    setResults([...projectResults, ...userResults].slice(0, 8));
  }, [query, projects, allUsers]);

  const handleSelect = (result: typeof results[0]) => {
    if (result.type === 'project') {
      navigate(`/project/${result.id}`);
    } else {
      // Maybe navigate to a user profile or start chat
      navigate(`/messages`);
    }
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-xl"
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative w-full max-w-2xl bg-app-card border border-app-border rounded-[2rem] shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-app-border bg-app-accent/30 flex items-center gap-4">
          <Search size={22} className="text-app-primary" />
          <input 
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across the GhostLink Nexus..."
            className="flex-1 bg-transparent border-none text-xl font-bold text-app-foreground focus:outline-none placeholder:text-app-muted/30"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest px-2 py-1 rounded bg-app-card border border-app-border">ESC TO EXIT</span>
            <button onClick={onClose} className="p-2 text-app-muted hover:text-app-foreground transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
          {query.trim() === '' ? (
            <div className="p-12 text-center">
              <Command size={40} className="mx-auto text-app-muted/20 mb-4" />
              <p className="text-sm font-bold text-app-muted uppercase tracking-widest">Type to begin searching...</p>
            </div>
          ) : results.length > 0 ? (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.id}`}
                onClick={() => handleSelect(r)}
                className="w-full p-4 rounded-2xl flex items-center justify-between group hover:bg-app-primary hover:text-white transition-all text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-app-muted-bg border border-app-border flex items-center justify-center group-hover:bg-white/20 group-hover:border-transparent transition-all">
                    {r.type === 'project' ? <Hash size={18} /> : <Users size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold tracking-tight">{r.title}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100">{r.subtitle}</div>
                  </div>
                </div>
                <ChevronRight size={18} className="opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all" />
              </button>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-sm font-bold text-app-muted uppercase tracking-widest">No matching results found.</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-app-muted-bg/50 border-t border-app-border flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[8px] font-black text-app-muted uppercase tracking-[0.2em]">
              <span className="p-1 rounded bg-app-card border border-app-border">↵</span> SELECT
            </div>
            <div className="flex items-center gap-2 text-[8px] font-black text-app-muted uppercase tracking-[0.2em]">
              <span className="p-1 rounded bg-app-card border border-app-border">TAB</span> NAVIGATE
            </div>
          </div>
          <div className="text-[10px] font-bold text-app-primary uppercase tracking-[0.3em] opacity-40">Nexus Search Engine v4.0</div>
        </div>
      </motion.div>
    </div>
  );
}
