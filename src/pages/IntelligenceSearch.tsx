import React, { useState } from 'react';
import { 
  Search, 
  Sparkles, 
  FileText, 
  BrainCircuit, 
  User, 
  History,
  Command,
  ChevronRight,
  Hash,
  Database,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const SearchResult = ({ category, title, snippet, time, icon: Icon, url }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass p-6 rounded-3xl hover:bg-white/5 transition-all cursor-pointer group border-transparent hover:border-ghost-cyan/20"
    onClick={() => url && window.open(url, '_blank')}
  >
    <div className="flex gap-6">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center flex-shrink-0 text-slate-500 group-hover:text-ghost-cyan transition-colors">
        <Icon size={24} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-mono text-ghost-cyan uppercase tracking-widest font-black">{category}</span>
          <span className="text-slate-700">•</span>
          <span className="text-[10px] font-mono text-slate-600 uppercase transition-colors">{time}</span>
        </div>
        <h3 className="text-lg font-bold text-white italic tracking-tight mb-2 group-hover:cyan-text-glow transition-all">{title}</h3>
        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
          {snippet}
        </p>
      </div>
      <ChevronRight size={18} className="text-slate-800 self-center group-hover:text-slate-600 transition-all group-hover:translate-x-1" />
    </div>
  </motion.div>
);

export default function UniversalIntelligenceSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await response.json();
      
      const newResults = [
        {
          category: 'AI Synthesis',
          title: 'Intelligence Briefing',
          snippet: data.text,
          time: 'Just now',
          icon: Sparkles
        },
        ...data.sources.map((s: any) => ({
          category: 'External Source',
          title: s.title,
          snippet: `Discovered intelligence from ${new URL(s.url).hostname}.`,
          time: 'Historical',
          icon: Database,
          url: s.url
        }))
      ];
      setResults(newResults);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 h-full overflow-y-auto custom-scrollbar">
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6 pt-12"
      >
        <h2 className="text-[10px] font-mono text-ghost-cyan uppercase tracking-[0.4em]">Universal Intelligence Engine</h2>
        <h1 className="text-6xl font-display font-black text-white italic tracking-tighter">Semantic Search</h1>
      </motion.header>

      {/* Hero Search Box */}
      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-ghost-cyan/40 via-ghost-violet/40 to-ghost-cyan/40 rounded-[2.5rem] blur opacity-40 group-focus-within:opacity-100 transition duration-1000" />
        <div className="relative glass bg-ghost-charcoal/90 rounded-[2.5rem] p-3 flex items-center gap-4 shadow-2xl border-ghost-cyan/10">
          <div className="w-14 h-14 rounded-3xl bg-white/5 flex items-center justify-center text-ghost-cyan border border-white/5">
            {isSearching ? <Loader2 size={28} className="animate-spin" /> : <Search size={28} />}
          </div>
          <input 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Interrogate the Ghost domain..."
            className="flex-1 bg-transparent border-none text-xl text-white placeholder:text-slate-800 focus:ring-0 py-6"
            autoFocus
          />
          <div className="flex gap-2 pr-6">
             <button type="submit" className="flex items-center gap-1 text-[10px] font-mono text-slate-700 bg-white/5 px-3 py-2 rounded border border-white/5 hover:bg-white/10 transition-colors">
                SEARCH
             </button>
          </div>
        </div>
      </motion.form>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        <div className="md:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-ghost-cyan" /> {results.length > 0 ? 'Synthesis Report' : 'Intelligent Signals'}
            </h3>
            <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest">{results.length > 0 ? results.length : '1,248'} Nodes Indexed</span>
          </div>

          <div className="space-y-3">
             <AnimatePresence mode="popLayout">
               {results.length > 0 ? (
                 results.map((res, i) => (
                   <SearchResult key={i} {...res} />
                 ))
               ) : (
                 [
                   <SearchResult 
                     key="static-1"
                     category="Documentation"
                     title="Project Nexus: Handshake Protocol V4"
                     snippet="The revised handshake protocol eliminates spectral jitter by introducing a quantum-resistant ephemeral key rotation strategy..."
                     time="2h ago"
                     icon={FileText}
                   />,
                   <SearchResult 
                     key="static-2"
                     category="Synthesis"
                     title="Neural Map: Sector 7 Anomaly"
                     snippet="Observed a 14% drift in user engagement metrics. AI synthesis suggests a regression in the kernel's resonance sub-module..."
                     time="4h ago"
                     icon={BrainCircuit}
                   />
                 ]
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="md:col-span-4 space-y-8">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
             <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <History size={14} className="text-ghost-violet" /> Recency Map
            </h3>
            <div className="glass p-6 rounded-3xl space-y-4">
               {['#nexus-protocol', '#spectral-design', 'kernel_init.rs', 'Vanguard_Report_Q1'].map(trend => (
                 <div key={trend} className="flex items-center justify-between group cursor-pointer">
                    <span className="text-sm italic font-medium text-slate-400 group-hover:text-white transition-colors">{trend}</span>
                    <ArrowUpRight size={14} className="text-slate-800 group-hover:text-ghost-cyan transition-all" />
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass p-8 rounded-3xl border-ghost-violet/10 bg-ghost-violet/2"
          >
             <div className="flex items-center gap-2 mb-4">
                <Database size={16} className="text-ghost-violet" />
                <span className="text-xs font-bold font-display italic text-ghost-violet">Knowledge Integrity</span>
             </div>
             <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-relaxed mb-6">
               Your semantic graph is 98% coherent. AI is indexing recent syntheses.
             </p>
             <button className="w-full py-3 glass rounded-2xl text-[10px] font-bold font-mono tracking-widest text-white hover:bg-white/5 shadow-2xl transition-all">
                REFRESH GRAPH
             </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const ArrowUpRight = ({ size, className }: any) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="7" y1="17" x2="17" y2="7"></line>
    <polyline points="7 7 17 7 17 17"></polyline>
  </svg>
);
