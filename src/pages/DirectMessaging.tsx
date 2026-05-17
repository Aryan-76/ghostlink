import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  where,
  limit,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Send, 
  Search,
  User as UserIcon,
  Circle,
  Loader2,
  MoreVertical,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';

export default function DirectMessaging() {
  const { user } = useAuthStore();
  const { allUsers, conversations } = useWorkspace();
  
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activeConversation) return;

    const q = query(
      collection(db, 'conversations', activeConversation.id, 'messages'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [activeConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversation || !user) return;

    const text = newMessage;
    setNewMessage('');

    try {
      const convRef = doc(db, 'conversations', activeConversation.id);
      await addDoc(collection(convRef, 'messages'), {
        senderId: user.uid,
        text,
        createdAt: serverTimestamp()
      });

      await updateDoc(convRef, {
        lastMessage: text,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      toast.error('Failed to send message');
    }
  };

  const startNewConversation = async (recipient: any) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participants.includes(recipient.id) && c.participants.includes(user.uid)
    );

    if (existing) {
      setActiveConversation(existing);
      setIsNewChatModalOpen(false);
      return;
    }

    try {
      const convRef = await addDoc(collection(db, 'conversations'), {
        participants: [user.uid, recipient.id],
        participantNames: {
          [user.uid]: user.displayName || user.email,
          [recipient.id]: recipient.displayName || recipient.email
        },
        participantAvatars: {
          [user.uid]: user.photoURL || '',
          [recipient.id]: recipient.avatarUrl || ''
        },
        lastMessage: 'Conversation started',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
      
      setActiveConversation({ id: convRef.id, participants: [user.uid, recipient.id] });
      setIsNewChatModalOpen(false);
    } catch (error) {
      toast.error('Failed to start conversation');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.uid && 
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRecipientName = (conv: any) => {
    if (!user || !conv.participantNames) return 'User';
    const recipientId = conv.participants.find((id: string) => id !== user.uid);
    return conv.participantNames[recipientId] || 'User';
  };

  if (!user) return null;

  return (
    <div className="h-full flex bg-[#020306]">
      {/* Sidebar */}
      <div className="w-80 border-r border-white/5 flex flex-col bg-[#0A0B0E]">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white tracking-tight">Messages</h2>
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <Plus size={18} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConversation(conv)}
              className={`w-full p-3 rounded-xl flex gap-4 transition-all group ${
                activeConversation?.id === conv.id ? 'bg-indigo-600/10 border border-indigo-500/20' : 'hover:bg-white/[0.03] border border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                {getRecipientName(conv)[0]}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between mb-0.5">
                  <span className={`text-sm font-semibold truncate ${activeConversation?.id === conv.id ? 'text-indigo-400' : 'text-zinc-200'}`}>
                    {getRecipientName(conv)}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 truncate">{conv.lastMessage}</p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-xs text-zinc-600 font-medium leading-relaxed">No conversations yet. Start a new chat to collaborate.</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div 
              key={activeConversation.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col"
            >
              <header className="h-16 px-8 border-b border-white/5 flex items-center justify-between bg-[#0A0B0E]">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                    {getRecipientName(activeConversation)[0]}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white leading-none">{getRecipientName(activeConversation)}</h3>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Circle size={6} className="fill-emerald-500 text-emerald-500" />
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Now</span>
                    </div>
                  </div>
                </div>
                <button className="text-zinc-500 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-4 ${m.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center font-bold text-[10px] ${m.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {m.senderId === user.uid ? (user.displayName?.[0] || user.email?.[0]) : getRecipientName(activeConversation)[0]}
                    </div>
                    <div className={`max-w-md ${m.senderId === user.uid ? 'text-right' : ''}`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300'}`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <footer className="p-6 bg-[#0A0B0E] border-t border-white/5">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-16 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-95"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </footer>
            </motion.div>
          ) : (
            <div className="text-center px-12">
              <div className="w-16 h-16 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mx-auto mb-6 text-zinc-700">
                <MessageSquare size={32} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Direct Messaging</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto leading-relaxed">
                Start a 1-to-1 conversation with any team member to discuss projects privately.
              </p>
              <button 
                onClick={() => setIsNewChatModalOpen(true)}
                className="mt-8 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center gap-2 mx-auto"
              >
                <Plus size={18} /> Start a Conversation
              </button>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0B0E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">New Conversation</h3>
                <div className="mt-4 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              
              <div className="p-2 h-80 overflow-y-auto">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startNewConversation(u)}
                    className="w-full p-3 rounded-xl flex items-center gap-4 hover:bg-white/[0.05] transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-500 uppercase group-hover:bg-indigo-600/20 group-hover:text-indigo-400 transition-colors">
                      {u.displayName?.[0] || u.email?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{u.displayName || 'No Name'}</div>
                      <div className="text-xs text-zinc-500">{u.email}</div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <p className="text-xs text-zinc-500">No users found matching your search.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
