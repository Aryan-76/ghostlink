import React, { useState, useCallback } from 'react';
import { 
  Search, 
  Sparkles, 
  FileText, 
  History,
  Command,
  ChevronRight,
  Database,
  Loader2,
  ArrowUpRight,
  Settings,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { aiService } from '../services/aiService';

interface ResultItem {
  category: string;
  title: string;
  snippet: string;
  time?: string;
  icon?: any;
  url?: string;
}

const SearchResult = React.memo(({ category, title, snippet, time, icon: Icon, url }: ResultItem) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#0A0B0E] border border-white/5 p-6 rounded-xl hover:border-white/10 transition-all cursor-pointer group"
    onClick={() => url && url !== '#' && window.open(url, '_blank')}
  >
    <div className="flex gap-6">
      <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center flex-shrink-0 text-zinc-500 group-hover:text-white transition-colors">
        {Icon ? <Icon size={20} /> : <FileText size={20} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{category || 'Intelligence'}</span>
          <span className="text-zinc-800">•</span>
          <span className="text-[10px] font-medium text-zinc-600 uppercase">{time || 'Just now'}</span>
        </div>
        <h3 className="text-lg font-semibold text-white tracking-tight mb-2 group-hover:text-indigo-400 transition-colors line-clamp-1">{title}</h3>
        <div className="text-sm text-zinc-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">
          {snippet}
        </div>
      </div>
      <ChevronRight size={18} className="text-zinc-800 self-center group-hover:text-zinc-500 transition-all group-hover:translate-x-1 flex-shrink-0" />
    </div>
  </motion.div>
));

export default function UniversalIntelligenceSearch() {
  const [queryInput, setQueryInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    setResults([]);
    
    try {
      const response = await aiService.search(queryInput);
      
      const mainResult: ResultItem = {
        category: 'Universal AI',
        title: `Intelligence Report: ${queryInput}`,
        snippet: response.briefing,
        time: 'Active',
        icon: Sparkles
      };

      const sourceResults: ResultItem[] = response.sources.map((source: any) => ({
        category: 'Web Source',
        title: source.title,
        snippet: `Verified source from the global intelligence network. Link: ${source.url}`,
        time: 'External',
        icon: Globe,
        url: source.url
      }));

      setResults([mainResult, ...sourceResults]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search synchronization failure');
    } finally {
      setIsSearching(false);
    }
  }, [queryInput, isSearching]);

  const recentItems: ResultItem[] = [
    {
      category: "Documentation",
      title: "Project Nexus: Onboarding",
      snippet: "Getting started guide for the core infrastructure team. Scalability requirements and security protocols.",
      time: "2h ago",
      icon: FileText
    } as ResultItem,
    {
      category: "Engineering",
      title: "Infrastructure V2 RFC",
      snippet: "Proposed architectural changes for the global data propagation layer. Focus on CRDT state merging.",
      time: "4h ago",
      icon: Database
    } as ResultItem
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 h-full overflow-y-auto scrollbar-hidden">
      <motion.header 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 pt-8"
      >
        <h2 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Command Center</h2>
        <h1 className="text-4xl font-semibold text-white tracking-tight">Search everything</h1>
      </motion.header>

      {/* Hero Search Box */}
      <motion.form 
        onSubmit={handleSearch}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-w-3xl mx-auto"
      >
        <div className="relative bg-white/[0.03] border border-white/5 rounded-2xl p-2 flex items-center gap-4 focus-within:border-white/10 transition-all shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] flex items-center justify-center text-zinc-500">
            {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
          </div>
          <input 
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder="Search projects, files, and intelligence..."
            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-zinc-700 focus:ring-0 py-4"
            autoFocus
          />
          <div className="pr-4 hidden sm:block">
             <div className="flex items-center gap-1.5 px-2 py-1 bg-white/[0.05] rounded border border-white/5 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                <Command size={10} /> K
             </div>
          </div>
        </div>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-red-400 text-xs font-medium">
            {error}
          </motion.div>
        )}
      </motion.form>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-20">
        <div className="md:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              {results.length > 0 ? 'Search Results' : 'System Indexed Items'}
            </h3>
            <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">{results.length > 0 ? results.length : '1,420'} records active</span>
          </div>

          <div className="space-y-4">
             <AnimatePresence mode="popLayout">
               {results.length > 0 ? (
                 results.map((res, i) => (
                   <SearchResult key={i} {...res} />
                 ))
               ) : (
                 recentItems.map((res, i) => (
                   <SearchResult key={i} {...res} />
                 ))
               )}
             </AnimatePresence>
          </div>
        </div>

        <div className="md:col-span-4 space-y-10">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
             <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
              <History size={14} /> Semantic History
            </h3>
            <div className="space-y-4">
               {['#infrastructure', 'api_specs', 'security_audit', 'latency_reports'].map(item => (
                 <div key={item} className="flex items-center justify-between group cursor-pointer px-2 py-1 hover:bg-white/[0.02] rounded-md transition-all">
                    <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{item}</span>
                    <ArrowUpRight size={14} className="text-zinc-800 group-hover:text-zinc-500 transition-all" />
                 </div>
               ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10"
          >
             <div className="flex items-center gap-2 mb-4">
                <Settings size={16} className="text-indigo-400" />
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Sync Node</span>
             </div>
             <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-relaxed mb-6 italic">
               Cross-regional indexing is synchronized. Intelligence nodes active.
             </p>
             <button className="w-full py-3 bg-white/[0.05] rounded-xl text-[10px] font-bold text-white hover:bg-indigo-600 transition-all uppercase tracking-widest border border-white/5">
                Refresh Index
             </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
