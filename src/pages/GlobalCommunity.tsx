import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  limit 
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  Users, 
  Loader2, 
  Globe,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';

export default function GlobalCommunity() {
  const { user } = useAuthStore();
  const { allUsers } = useWorkspace();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);

    const q = query(
      collection(db, 'global_messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).reverse();
      setMessages(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Community Listener Error:", error);
      setIsLoading(false);
    });

    return () => unsub();
  }, [user]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    const text = newMessage;
    setNewMessage('');
    setIsSending(true);

    try {
      await addDoc(collection(db, 'global_messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderPhoto: user.photoURL || '',
        text,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      toast.error('Failed to broadcast message');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-[#020306]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-[#020306]">
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-[#0A0B0E]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Community Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <Circle size={8} className="fill-emerald-500 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{allUsers.length} Users Online</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center -space-x-2">
           {allUsers.slice(0, 5).map(u => (
             <div key={u.id} className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-[#0A0B0E] flex items-center justify-center text-[8px] font-bold text-zinc-500 uppercase overflow-hidden" title={u.displayName || u.email}>
               {u.displayName?.[0] || u.email?.[0]}
             </div>
           ))}
           {allUsers.length > 5 && (
             <div className="w-8 h-8 rounded-full bg-zinc-900 border-2 border-[#0A0B0E] flex items-center justify-center text-[8px] font-bold text-zinc-600">
               +{allUsers.length - 5}
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m, i) => {
            const isMe = m.senderId === user?.uid;
            const prevMessage = messages[i-1];
            const showHeader = !prevMessage || prevMessage.senderId !== m.senderId;

            return (
              <div key={m.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''}`}>
                {!isMe && showHeader && (
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                    {m.senderName?.[0]}
                  </div>
                )}
                {!isMe && !showHeader && <div className="w-10 flex-shrink-0" />}
                
                <div className={`max-w-xl ${isMe ? 'text-right' : ''}`}>
                  {showHeader && (
                    <div className="flex items-center gap-2 mb-1.5 px-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-indigo-400' : 'text-zinc-400'}`}>
                        {m.senderName}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-bold">● Just now</span>
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed ${isMe ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white/5 text-zinc-300 rounded-tl-none'}`}>
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-6 bg-[#0A0B0E] border-t border-white/5">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Broadcast a message to the community..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-16 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-zinc-700"
          />
          <button 
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
