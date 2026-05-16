import React, { useState, useRef, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Hash,
  AtSign,
  ChevronRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Message = ({ user, text, time, isAI }: any) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${isAI ? 'glass bg-ghost-cyan/5 border-ghost-cyan/10' : 'hover:bg-white/2'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center font-bold font-display italic text-sm ${
      isAI ? 'bg-ghost-cyan text-ghost-navy shadow-[0_0_15px_rgba(0,242,255,0.3)]' : 'bg-slate-800 text-slate-200'
    }`}>
      {user[0]}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-bold italic tracking-tight ${isAI ? 'text-ghost-cyan' : 'text-white'}`}>{user}</span>
        {isAI && <span className="glass-pill text-[8px] px-1.5 py-0">GHOST_INTEL</span>}
        <span className="text-[10px] font-mono text-slate-600 ml-auto lowercase">{time}</span>
      </div>
      <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  </motion.div>
);

export default function RealtimeChat() {
  const [messages, setMessages] = useState([
    { user: "Sarah Revenant", text: "Initial quantum handshake sequences established in sector 4. Latency is sub-2ms.", time: "10:42 AM" },
    { user: "GhostLink AI", isAI: true, text: "Handshake sequence confirmed. However, I detect a potential resonance overlap in the spectral buffer. Recommend implementing sector isolation.", time: "10:44 AM" },
    { user: "Elena Spectral", text: "I agree with GhostLink. I've already drafted the isolation protocol. Can you review the diff @Sarah?", time: "10:45 AM" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = {
      user: "Architect",
      text: inputValue,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: inputValue,
          history: messages.map(m => ({
            role: m.isAI ? 'model' : 'user',
            parts: [{ text: m.text }]
          }))
        }),
      });
      const data = await response.json();
      
      const aiMessage = {
        user: "GhostLink AI",
        isAI: true,
        text: data.text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-ghost-navy">
      {/* Channels Sidebar */}
      <div className="w-72 border-r border-ghost-border flex flex-col bg-ghost-charcoal/30">
        <div className="p-6 border-b border-white/5">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
            <input 
              placeholder="Search conversations..."
              className="w-full bg-white/5 border border-white/5 py-2 pl-9 pr-3 rounded-lg text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-ghost-cyan/50 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4 px-2">
              <span>Main Channels</span>
              <Plus size={14} className="cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
              {['general-hq', 'nexus-protocol', 'spectral-design', 'vanguard-security'].map(ch => (
                <div key={ch} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer group ${
                  ch === 'nexus-protocol' ? 'bg-ghost-cyan/10 text-ghost-cyan shadow-[inset_0_0_10px_rgba(0,242,255,0.05)]' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}>
                  <Hash size={16} className={ch === 'nexus-protocol' ? 'text-ghost-cyan' : 'text-slate-600 group-hover:text-slate-400'} />
                  <span className="italic">{ch}</span>
                  {ch === 'general-hq' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-ghost-violet violet-glow" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-4 px-2">
              <span>Direct Bridges</span>
              <Plus size={14} className="cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-2 px-2">
              {[
                { name: 'Sarah Revenant', status: 'online' },
                { name: 'Marcus Vanguard', status: 'offline' },
                { name: 'Elena Spectral', status: 'online' }
              ].map(user => (
                <div key={user.name} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold font-display italic text-[10px] text-slate-400">
                      {user.name[0]}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-ghost-charcoal ${
                      user.status === 'online' ? 'bg-green-500' : 'bg-slate-600'
                    }`} />
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-white transition-colors">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggestion Bar at bottom of sidebar */}
        <div className="p-4 bg-ghost-cyan/5 border-t border-ghost-cyan/10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-ghost-cyan" />
            <span className="text-[10px] font-mono text-ghost-cyan uppercase tracking-widest font-bold">Smart Context</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed italic">
            "Discussion in #nexus-protocol highlights potential socket drift. Drafted a fix?"
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#050508]">
        {/* Chat Header */}
        <div className="h-16 px-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Hash size={20} className="text-slate-600" />
            <div>
              <h2 className="text-sm font-bold text-white italic tracking-tight">nexus-protocol</h2>
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest transition-opacity">Primary Layer Sync</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-[#050508] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">
                  {i}
                </div>
              ))}
              <div className="w-8 h-8 rounded-full border-2 border-[#050508] bg-ghost-cyan text-ghost-navy flex items-center justify-center text-[10px] font-black">+</div>
            </div>
            <MoreVertical size={18} className="text-slate-600 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Messages Listing */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {messages.map((msg, i) => (
              <Message key={i} {...msg} />
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-4 text-ghost-cyan text-xs font-mono tracking-widest"
            >
              <Loader2 size={14} className="animate-spin" />
              <span>GHOST LINK SYNTHESIZING...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} className="p-8 pt-0">
          <div className="glass bg-white/2 rounded-2xl p-4 shadow-2xl relative group focus-within:border-ghost-cyan/50 transition-all">
            <div className="flex items-center gap-4 mb-2">
              <Paperclip size={18} className="text-slate-600 hover:text-slate-400 cursor-pointer" />
              <Smile size={18} className="text-slate-600 hover:text-slate-400 cursor-pointer" />
              <AtSign size={18} className="text-slate-600 hover:text-slate-400 cursor-pointer" />
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest hidden sm:block">Atmosphere: Stable</span>
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 cyan-glow" />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Compose a signal..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-slate-700 focus:ring-0"
              />
              <button 
                type="submit"
                disabled={isTyping}
                className="w-10 h-10 rounded-xl bg-ghost-cyan text-ghost-navy flex items-center justify-center shadow-[0_0_20px_rgba(0,242,255,0.2)] hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-center gap-8 opacity-20">
            <span className="text-[8px] font-mono text-white tracking-[1em] uppercase">Spectral Encryption Active</span>
          </div>
        </form>
      </div>
    </div>
  );
}
