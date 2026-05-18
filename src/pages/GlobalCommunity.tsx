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
  Circle,
  Smile,
  Reply,
  Trash2,
  X
} from 'lucide-react';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

  const [replyingTo, setReplyingTo] = useState<any>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !user || isSending) return;

    const text = newMessage;
    const reply = replyingTo;
    setNewMessage('');
    setReplyingTo(null);
    setIsSending(true);

    try {
      await addDoc(collection(db, 'global_messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        senderPhoto: user.photoURL || '',
        text,
        createdAt: serverTimestamp(),
        replyTo: reply ? {
          messageId: reply.id,
          senderName: reply.senderName,
          text: reply.text
        } : null
      });
    } catch (error) {
      toast.error('Failed to broadcast message');
      setNewMessage(text);
    } finally {
      setIsSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;
    const msgRef = doc(db, 'global_messages', messageId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = msg.reactions || {};
    const users = reactions[emoji] || [];
    let newUsers = users.includes(user.uid) ? users.filter((id: string) => id !== user.uid) : [...users, user.uid];

    const updatedReactions = { ...reactions };
    if (newUsers.length > 0) updatedReactions[emoji] = newUsers;
    else delete updatedReactions[emoji];

    await updateDoc(msgRef, { reactions: updatedReactions });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!user || !window.confirm('Erase this broadcast?')) return;
    await deleteDoc(doc(db, 'global_messages', messageId));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-app-bg">
      <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-foreground">
      <div className="px-8 py-6 border-b border-app-border flex items-center justify-between bg-app-card/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary shadow-sm">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-app-foreground tracking-tight">Community Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <Circle size={8} className="fill-emerald-500 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">{allUsers.filter(u => u.status === 'online').length} Operators Active</span>
            </div>
          </div>
        </div>
        
        <div className="hidden md:flex items-center -space-x-2">
           {allUsers.filter(u => u.status === 'online').slice(0, 8).map(u => (
             <div key={u.id} className="w-8 h-8 rounded-full bg-app-muted-bg border-2 border-app-card flex items-center justify-center text-[8px] font-bold text-app-muted uppercase overflow-hidden shadow-sm relative group" title={u.displayName || u.email}>
               {u.displayName?.[0] || u.email?.[0]}
               <div className="absolute inset-0 border border-emerald-500/30 rounded-full" />
             </div>
           ))}
           {allUsers.filter(u => u.status === 'online').length > 8 && (
             <div className="w-8 h-8 rounded-full bg-app-card border-2 border-app-border flex items-center justify-center text-[8px] font-bold text-app-muted shadow-sm">
               +{allUsers.filter(u => u.status === 'online').length - 8}
             </div>
           )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((m, i) => {
            const isMe = m.senderId === user?.uid;
            const prevMessage = messages[i-1];
            const isGrouped = prevMessage && prevMessage.senderId === m.senderId && 
              (m.createdAt?.toMillis?.() - prevMessage.createdAt?.toMillis?.()) < 300000;

            return (
              <div key={m.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? '-mt-4' : ''}`}>
                <div className={`w-10 h-10 rounded-xl bg-app-muted-bg border border-app-border flex-shrink-0 flex items-center justify-center text-xs font-bold text-app-muted uppercase font-mono shadow-sm relative transition-all ${isGrouped ? 'opacity-0 scale-75 -translate-y-2' : ''}`}>
                  {m.senderName?.[0]}
                  {allUsers.find(u => u.id === m.senderId)?.status === 'online' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-app-bg rounded-full shadow-sm" />
                  )}
                </div>
                
                <div className={`max-w-xl group/msg relative ${isMe ? 'text-right' : ''}`}>
                  {!isGrouped && (
                    <div className={`flex items-center gap-2 mb-1.5 px-1 ${isMe ? 'justify-end' : ''}`}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isMe ? 'text-app-primary' : 'text-app-foreground'}`}>
                        {m.senderName}
                      </span>
                      <span className="text-[9px] text-app-muted opacity-40 font-bold uppercase tracking-tighter ml-1">
                        {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                      </span>
                    </div>
                  )}

                  {m.replyTo && (
                    <div className="mb-1 p-2 rounded-lg bg-app-muted-bg border-l-2 border-app-primary/30 text-left text-[10px] opacity-60 inline-block">
                      <div className="font-bold text-app-primary">{m.replyTo.senderName}</div>
                      <div className="truncate">{m.replyTo.text}</div>
                    </div>
                  )}

                  <div className="relative">
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm inline-block text-left ${isMe ? 'bg-app-primary text-white rounded-tr-none' : 'bg-app-card border border-app-border text-app-foreground rounded-tl-none'}`}>
                      {m.text}
                    </div>

                    <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 p-1 bg-app-card border border-app-border rounded-lg shadow-xl z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                      <button onClick={() => setReplyingTo(m)} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Reply size={14} /></button>
                      <button onClick={() => handleReaction(m.id, '👍')} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Smile size={14} /></button>
                      {isMe && <button onClick={() => handleDeleteMessage(m.id)} className="p-1.5 text-app-muted hover:text-red-500 rounded hover:bg-red-500/10"><Trash2 size={14} /></button>}
                    </div>
                  </div>

                  {m.reactions && Object.keys(m.reactions).length > 0 && (
                    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                      {Object.entries(m.reactions).map(([emoji, uids]: [string, any]) => (
                        <button key={emoji} onClick={() => handleReaction(m.id, emoji)} className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${uids.includes(user?.uid) ? 'bg-app-primary/20 border-app-primary text-app-primary' : 'bg-app-card border-app-border text-app-muted'}`}>
                          <span>{emoji}</span><span>{uids.length}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {replyingTo && (
        <div className="max-w-4xl mx-auto w-full px-6 md:px-0">
          <div className="mb-0 p-4 bg-app-accent/30 border-t border-x border-app-border rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Reply size={14} className="text-app-primary" />
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-app-primary uppercase tracking-widest">Replying to {replyingTo.senderName}</div>
                <div className="text-xs text-app-muted truncate opacity-80">{replyingTo.text}</div>
              </div>
            </div>
            <button onClick={() => setReplyingTo(null)} className="p-1 text-app-muted hover:text-app-foreground"><X size={18} /></button>
          </div>
        </div>
      )}

      <div className="p-6 bg-app-card border-t border-app-border shadow-2xl">
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Broadcast a message to the community..."
            className="w-full bg-app-muted-bg border border-app-border rounded-xl pl-6 pr-16 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all font-medium placeholder:text-app-muted"
          />
          <button 
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-app-foreground text-app-bg rounded-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-50"
          >
            {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
}
