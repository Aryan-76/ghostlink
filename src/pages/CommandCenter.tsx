import React, { useState } from 'react';
import { 
  Command, 
  Search, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  Zap, 
  Terminal, 
  Radio,
  ChevronRight,
  Filter,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const CommandItem = ({ icon: Icon, title, shortcut, desc, color, onClick }: any) => (
  <motion.div 
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="glass p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer flex items-center gap-4 group"
    onClick={onClick}
  >
    <div className={`w-10 h-10 rounded-xl bg-${color}/10 text-${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
      <Icon size={20} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white italic tracking-tight">{title}</h4>
        <span className="text-[10px] font-mono text-slate-600 bg-white/5 px-1.5 py-0.5 rounded border border-white/5">{shortcut}</span>
      </div>
      <p className="text-xs text-slate-500 mt-1">{desc}</p>
    </div>
  </motion.div>
);

export default function SemanticCommandCenter() {
  const [command, setCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<any>(null);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const data = await response.json();
      setFeedback(data);
      setCommand('');
    } catch (error) {
      console.error(error);
      setFeedback({ error: 'Command Center Link Interrupted' });
    } finally {
      setIsProcessing(false);
    }
  };

  const executeDirective = (directive: string) => {
    setCommand(directive);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-2xl">
          <Terminal size={32} className="text-ghost-cyan" />
        </div>
        <h1 className="text-4xl font-display font-black text-white italic tracking-tighter">Command Center</h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm">Semantic control over every node and synthesis in the GhostLink network.</p>
      </motion.div>

      {/* Semantic Search Bar */}
      <motion.form 
        onSubmit={handleCommand}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative group"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-ghost-cyan/20 to-ghost-violet/20 rounded-3xl blur opacity-30 group-focus-within:opacity-100 transition duration-500" />
        <div className="relative glass bg-ghost-charcoal/80 rounded-3xl p-2 shadow-2xl flex items-center gap-4 border-ghost-cyan/20">
          <div className="w-12 h-12 rounded-2xl bg-ghost-cyan/10 flex items-center justify-center text-ghost-cyan shadow-[0_0_15px_rgba(0,242,255,0.1)]">
            {isProcessing ? <Loader2 size={24} className="animate-spin text-ghost-cyan" /> : <Command size={24} />}
          </div>
          <input 
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            disabled={isProcessing}
            autoFocus
            placeholder="Search nodes, users, or execute spectral commands..."
            className="flex-1 bg-transparent border-none text-lg text-white placeholder:text-slate-700 focus:ring-0 py-4"
          />
          <div className="flex gap-2 pr-4">
            <button type="submit" className="glass-pill flex items-center gap-2 hover:bg-white/10 transition-colors px-6 py-2">
              EXECUTE
            </button>
          </div>
        </div>
      </motion.form>

      <AnimatePresence>
        {feedback && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`glass p-6 rounded-3xl border-${feedback.error ? 'red-500/20' : 'ghost-cyan/20'} bg-${feedback.error ? 'red-500/5' : 'ghost-cyan/5'}`}
          >
            <div className="flex items-center gap-4">
              {feedback.error ? <AlertCircle className="text-red-500" /> : <Zap className="text-ghost-cyan" />}
              <div>
                <h4 className="text-sm font-bold text-white italic">{feedback.error ? 'Execution Error' : 'Directive Acknowledged'}</h4>
                <p className="text-xs text-slate-400 mt-1">{feedback.error || feedback.reason || `Successfully processed: ${feedback.action || 'SYNTHESIS_UPDATE'}`}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
            <Radio size={14} className="text-ghost-cyan" /> System Directives
          </h3>
          <div className="space-y-3">
            <CommandItem 
              icon={Cpu} 
              title="Rescale Synthesis" 
              shortcut="⌘ S" 
              desc="Adjust compute allocation for active AI threads."
              color="text-ghost-cyan"
              onClick={() => executeDirective("Adjust compute allocation for sector 7")}
            />
            <CommandItem 
              icon={ShieldCheck} 
              title="Rotate Spectral Keys" 
              shortcut="⌘ K" 
              desc="Invalidate current ephemeral keys and rebroadcast."
              color="text-ghost-violet"
              onClick={() => executeDirective("Rotate all spectral encryption keys")}
            />
            <CommandItem 
              icon={Globe} 
              title="Network Topology" 
              shortcut="⌘ N" 
              desc="Visualize active bridges and node status."
              color="text-ghost-cyan"
              onClick={() => executeDirective("Analyze network topology for bottlenecks")}
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
           <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-6 px-1 flex items-center gap-2">
            <Zap size={14} className="text-yellow-400" /> Quick Actions
          </h3>
          <div className="space-y-3">
            <div className="glass p-6 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white italic">Node Connectivity</span>
                <span className="text-[10px] font-mono text-ghost-cyan">98.4%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-ghost-cyan cyan-glow w-[98%]" />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold font-mono tracking-widest text-slate-300 hover:text-white transition-all">STABILIZE</button>
                <button className="flex-1 py-3 bg-white/5 rounded-xl text-xs font-bold font-mono tracking-widest text-slate-300 hover:text-white transition-all">BOOST</button>
              </div>
            </div>
            <div className="glass p-4 rounded-2xl flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-500 flex items-center justify-center">
                    <Radio size={16} />
                 </div>
                 <span className="text-sm font-medium text-slate-300">Vanguard Broadcast active</span>
              </div>
              <ChevronRight size={14} className="text-slate-700 group-hover:text-slate-400" />
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
