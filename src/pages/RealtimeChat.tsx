import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Send, 
  Paperclip, 
  Smile,
  Hash,
  AtSign,
  Sparkles,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  Timestamp 
} from 'firebase/firestore';

import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Message as MessageType } from '../types';
import { aiService } from '../services/aiService';
import { useAuthStore } from '../store/authStore';

const Message = React.memo(({ user, text, time, isAI }: MessageType) => (
  <motion.div 
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    className={`flex items-start gap-4 p-4 rounded-xl transition-all ${isAI ? 'bg-indigo-500/5 border border-indigo-500/10' : 'hover:bg-white/[0.02]'}`}
  >
    <div className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-sm ${
      isAI ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-800 text-zinc-400'
    }`}>
      {(user || 'Unknown')[0]}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-sm font-semibold ${isAI ? 'text-indigo-400' : 'text-white'}`}>{user}</span>
        {isAI && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase tracking-widest">Assistant</span>}
        <span className="text-[10px] font-medium text-zinc-600 ml-auto">{time}</span>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-wrap">{text}</p>
    </div>
  </motion.div>
));

export default function RealtimeChat() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chat', 'messages', 'entries'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => {
        const data = doc.data();
        const ts = data.timestamp as Timestamp;
        return {
          id: doc.id,
          user: data.userDisplayName || 'User',
          text: data.text,
          isAI: data.isAI,
          time: ts ? ts.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
        };
      });
      setMessages(msgs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chat/messages/entries');
    });

    return () => unsubscribe();
  }, [user]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || isTyping || !user) return;

    const userEntry = inputValue.trim();
    setInputValue('');

    try {
      // 1. Save user message to Firestore
      await addDoc(collection(db, 'chat', 'messages', 'entries'), {
        text: userEntry,
        userId: user.uid,
        userDisplayName: user.displayName || user.email || 'User',
        isAI: false,
        timestamp: serverTimestamp()
      });

      // 2. Trigger AI logic
      setIsTyping(true);
      const history = messages.slice(-10).map(m => ({
        role: m.isAI ? "model" : "user",
        parts: [{ text: m.text }]
      }));

      const response = await aiService.chat(userEntry, history);
      
      // 3. Save AI response to Firestore
      await addDoc(collection(db, 'chat', 'messages', 'entries'), {
        text: response.text,
        userId: 'ghost-assistant',
        userDisplayName: 'Ghost Assistant',
        isAI: true,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'chat/messages/entries');
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-[#020306]">
      {/* Channels Sidebar */}
      <div className="w-72 border-r border-white/5 flex flex-col bg-[#040507]">
        <div className="p-6 border-b border-white/5">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
            <input 
              placeholder="Jump to..."
              className="w-full bg-white/[0.03] border border-white/5 py-2 pl-9 pr-3 rounded-lg text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/10 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hidden">
          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
              <span>Channels</span>
              <Plus size={14} className="cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-1">
              {['general', 'infrastructure', 'product-design', 'security-audit'].map(ch => (
                <div key={ch} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer group ${
                  ch === 'infrastructure' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
                }`}>
                  <Hash size={16} className={ch === 'infrastructure' ? 'text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-400'} />
                  <span>{ch}</span>
                  {ch === 'general' && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 px-2">
              <span>Direct Messages</span>
              <Plus size={14} className="cursor-pointer hover:text-white" />
            </div>
            <div className="space-y-3 px-2">
              {[
                { name: 'Sarah Miller', status: 'online' },
                { name: 'Marcus Chen', status: 'offline' },
                { name: 'Elena Rodriguez', status: 'online' }
              ].map(user => (
                <div key={user.name} className="flex items-center gap-3 group cursor-pointer">
                  <div className="relative">
                    <div className="w-8 h-8 rounded bg-zinc-800 flex items-center justify-center font-bold text-[10px] text-zinc-400">
                      {user.name[0]}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border-2 border-[#040507] ${
                      user.status === 'online' ? 'bg-emerald-500' : 'bg-zinc-600'
                    }`} />
                  </div>
                  <span className="text-xs text-zinc-400 group-hover:text-white transition-colors">{user.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Suggestion Bar at bottom of sidebar */}
        <div className="p-4 bg-indigo-500/5 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-indigo-400" />
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">AI Context</span>
          </div>
          <p className="text-[10px] text-zinc-500 leading-relaxed italic">
            "The team is discussing regional deployment. I've gathered the latest latency reports for review."
          </p>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-[#020306]">
        {/* Chat Header */}
        <div className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
          <div className="flex items-center gap-4">
            <Hash size={18} className="text-zinc-600" />
            <div>
              <h2 className="text-sm font-semibold text-white">infrastructure</h2>
              <p className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Primary discussion for core systems</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex -space-x-1.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="w-7 h-7 rounded-full border border-[#020306] bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                  {i}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border border-[#020306] bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">+</div>
            </div>
            <MoreVertical size={18} className="text-zinc-600 cursor-pointer hover:text-white" />
          </div>
        </div>

        {/* Messages Listing */}
        <div className="flex-1 overflow-y-auto p-8 space-y-2 scrollbar-hidden">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <Message key={i} {...msg} />
            ))}
          </AnimatePresence>
          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 p-4 text-indigo-400 text-[10px] font-bold uppercase tracking-widest"
            >
              <Loader2 size={12} className="animate-spin" />
              <span>Assistant is typing...</span>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="px-8 pb-8">
          <form 
            onSubmit={handleSendMessage}
            className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 focus-within:border-white/20 transition-all shadow-xl"
          >
            <div className="flex items-center gap-4 mb-3 border-b border-white/5 pb-3">
              <Paperclip size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
              <Smile size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
              <AtSign size={16} className="text-zinc-500 hover:text-zinc-300 cursor-pointer" />
              <div className="ml-auto">
                <span className="text-[10px] font-bold text-zinc-700 uppercase tracking-widest">Markdown Supported</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <input 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Message #infrastructure..."
                className="flex-1 bg-transparent border-none text-sm text-white placeholder:text-zinc-700 focus:ring-0"
              />
              <button 
                type="submit"
                disabled={isTyping || !inputValue.trim()}
                className="p-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl transition-all disabled:opacity-50 disabled:hover:bg-white"
              >
                <Send size={18} />
              </button>
            </div>
          </form>
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest">End-to-end encrypted</span>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
