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
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { 
  MessageSquare, 
  Send, 
  Search,
  User as UserIcon,
  Circle,
  Loader2,
  MoreVertical,
  Plus,
  Smile,
  Reply,
  Trash2,
  X,
  Zap,
  Check,
  CheckCheck,
  AlertCircle,
  Image as ImageIcon,
  Paperclip,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';

export default function DirectMessaging() {
  const { user } = useAuthStore();
  const { allUsers, conversations } = useWorkspace();
  
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Media states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); 
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Mark as read when selecting conversation or new messages arrive
  useEffect(() => {
    if (!activeConversationId || !user) return;
    
    const markAsRead = async () => {
      try {
        const convRef = doc(db, 'conversations', activeConversationId);
        await updateDoc(convRef, {
          [`lastRead.${user.uid}`]: serverTimestamp()
        });
      } catch (e) {
        // Silently fail for "offline" or other issues
      }
    };

    markAsRead();
  }, [activeConversationId, user, messages.length]);

  useEffect(() => {
    if (!activeConversationId) return;

    const q = query(
      collection(db, 'conversations', activeConversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(items.reverse());
    });

    return () => unsub();
  }, [activeConversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      const isAtBottom = messagesEndRef.current?.parentElement && 
        (messagesEndRef.current.parentElement.scrollHeight - messagesEndRef.current.parentElement.scrollTop - messagesEndRef.current.parentElement.clientHeight < 100);
      
      if (isAtBottom || messages.length <= 1) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only images are supported for now.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds 5MB limit.');
      return;
    }
    setSelectedFile(file);
    setUploadStatus('idle');
    setUploadProgress(0);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !activeConversation || !user || isUploading) return;

    // Clear typing status on send
    if (activeConversationId) {
      deleteDoc(doc(db, 'conversations', activeConversationId, 'typing', user.uid)).catch(() => {});
    }

    const text = newMessage;
    const reply = replyingTo;
    const file = selectedFile;

    setNewMessage('');
    setReplyingTo(null);
    
    if (file) {
      setUploadStatus('uploading');
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }

    try {
      let imageUrl = null;
      let metadata = null;
      let uploadedRef = null;

      if (file) {
        setIsUploading(true);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `conversations/${activeConversationId}/${fileName}`);
        uploadedRef = storageRef;
        const uploadTask = uploadBytesResumable(storageRef, file);

        imageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            (err) => {
              setUploadStatus('error');
              reject(err);
            },
            () => getDownloadURL(uploadTask.snapshot.ref).then(resolve)
          );
        });

        metadata = { name: file.name, size: file.size, type: file.type };
      }

      const convRef = doc(db, 'conversations', activeConversationId!);
      try {
        await addDoc(collection(convRef, 'messages'), {
          senderId: user.uid,
          text: text || '',
          imageUrl,
          imageMetadata: metadata,
          createdAt: serverTimestamp(),
          replyTo: reply ? {
            messageId: reply.id,
            senderName: user.uid === reply.senderId ? 'You' : (activeRecipient?.name || 'User'),
            text: reply.text || 'Image transmission'
          } : null
        });

        await updateDoc(convRef, {
          lastMessage: text || 'Media received',
          lastMessageAt: serverTimestamp(),
          lastSenderId: user.uid,
          updatedAt: serverTimestamp(),
          [`lastRead.${user.uid}`]: serverTimestamp()
        });

        if (file) {
          setUploadStatus('success');
          setTimeout(() => {
            setSelectedFile(null);
            setPreviewUrl(null);
            setUploadStatus('idle');
            setUploadProgress(0);
            setIsUploading(false);
          }, 1500);
        }
      } catch (dbError) {
        if (uploadedRef) {
          await deleteObject(uploadedRef).catch(e => console.error("Storage cleanup failed:", e));
        }
        throw dbError;
      }
    } catch (error) {
      console.error("DM Send Error:", error);
      setUploadStatus('error');
      toast.error('Failed to send signal');
      setNewMessage(text);
      setSelectedFile(file);
      setTimeout(() => {
        setUploadStatus('idle');
      }, 3000);
    } finally {
      if (!file) {
        setIsUploading(false);
      }
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeConversationId || !user) return;
    const msgRef = doc(db, 'conversations', activeConversationId, 'messages', messageId);
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
    if (!activeConversationId || !user) return;
    try {
      await deleteDoc(doc(db, 'conversations', activeConversationId, 'messages', messageId));
      setMessageToDelete(null);
      toast.success('Signal purged');
    } catch (e) {
      toast.error('Failed to erase record');
    }
  };

  const startNewConversation = async (recipient: any) => {
    if (!user) return;
    
    // Check if conversation already exists
    const existing = conversations.find(c => 
      c.participants.includes(recipient.id) && c.participants.includes(user.uid)
    );

    if (existing) {
      setActiveConversationId(existing.id);
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
          [recipient.id]: recipient.photoURL || ''
        },
        lastMessage: 'Conversation started',
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        lastRead: {
          [user.uid]: serverTimestamp(),
          [recipient.id]: serverTimestamp()
        }
      });
      
      setActiveConversationId(convRef.id);
      setIsNewChatModalOpen(false);
    } catch (error) {
      console.error("New Conv Error:", error);
      toast.error('Failed to start conversation');
    }
  };

  const filteredUsers = allUsers.filter(u => 
    u.id !== user?.uid && 
    (u.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getRecipientInfo = (conv: any) => {
    if (!user || !conv.participants) return { name: 'User', avatar: '', status: 'offline' };
    const recipientId = conv.participants.find((id: string) => id !== user.uid);
    const recipientProfile = allUsers.find(u => u.id === recipientId);
    
    // Check if there are unread messages - add 1s grace period for clock skew
    const lastMessageAt = (conv.lastMessageAt as any)?.toMillis?.() || 0;
    const lastReadAt = (conv.lastRead?.[user.uid] as any)?.toMillis?.() || 0;
    
    // Improved logic: only mark as unread if the last message is truly NEWER than the last read 
    // and the last message isn't just the "Conversation started" placeholder
    // also ensure it wasn't sent BY the current user
    const lastSenderId = conv.lastSenderId || null;
    const isUnread = lastMessageAt > (lastReadAt + 1000) && 
                    conv.id !== activeConversationId && 
                    conv.lastMessage !== 'Conversation started' &&
                    lastSenderId !== user.uid;

    return {
      id: recipientId,
      name: recipientProfile?.displayName || conv.participantNames?.[recipientId] || 'Ghost User',
      avatar: recipientProfile?.photoURL || conv.participantAvatars?.[recipientId] || '',
      status: recipientProfile?.status || 'offline',
      isUnread
    };
  };

  const activeRecipient = activeConversation ? getRecipientInfo(activeConversation) : null;

  // Handle typing state
  useEffect(() => {
    if (!activeConversationId || !user) return;
    
    const typingRef = doc(db, 'conversations', activeConversationId, 'typing', user.uid);
    
    if (newMessage.trim()) {
      setDoc(typingRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: serverTimestamp()
      });

      // Clear after 3s of inactivity
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        deleteDoc(typingRef).catch(() => {});
      }, 3000);
    } else {
      deleteDoc(typingRef).catch(() => {});
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    }
    
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      deleteDoc(typingRef).catch(() => {});
    };
  }, [newMessage, activeConversationId, user]);

  // Listen for typing users
  useEffect(() => {
    if (!activeConversationId) return;
    const qTyping = collection(db, 'conversations', activeConversationId, 'typing');
    const unsubTyping = onSnapshot(qTyping, (snapshot) => {
      const users = snapshot.docs
        .map(doc => doc.data())
        .filter(d => d.userId !== user?.uid)
        .map(d => d.userName) as string[];
      setTypingUsers(users);
    });
    return () => unsubTyping();
  }, [activeConversationId, user]);

  if (!user) return null;

  return (
    <div className="h-full flex bg-app-bg text-app-foreground">
      {/* Sidebar */}
      <div className="w-80 border-r border-app-border flex flex-col bg-app-card/50 backdrop-blur-sm">
        <div className="p-6 border-b border-app-border flex items-center justify-between">
          <h2 className="text-lg font-bold text-app-foreground tracking-tight uppercase">Signals</h2>
          <button 
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-10 h-10 rounded-xl bg-app-primary text-white flex items-center justify-center hover:bg-indigo-500 transition-all shadow-lg shadow-app-primary/20 active:scale-95"
          >
            <Plus size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 scrollbar-hidden">
          {conversations.map(conv => (
            <button
              key={conv.id}
              onClick={() => setActiveConversationId(conv.id)}
              className={`w-full p-4 rounded-2xl flex gap-4 transition-all group border ${
                activeConversationId === conv.id 
                  ? 'bg-app-primary/10 border-app-primary/40 shadow-sm' 
                  : 'hover:bg-app-muted-bg border-transparent'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-app-muted-bg border border-app-border flex-shrink-0 flex items-center justify-center text-sm font-bold text-app-muted uppercase overflow-hidden shadow-sm font-mono transition-colors group-hover:bg-app-card relative">
                {getRecipientInfo(conv).avatar ? (
                  <img src={getRecipientInfo(conv).avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  getRecipientInfo(conv).name[0]
                )}
                {getRecipientInfo(conv).status === 'online' && (
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-app-card rounded-full" />
                )}
              </div>
              <div className="flex-1 min-w-0 text-left py-0.5">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold truncate tracking-tight ${activeConversationId === conv.id ? 'text-app-primary' : 'text-app-foreground'}`}>
                    {getRecipientInfo(conv).name}
                  </span>
                  {getRecipientInfo(conv).isUnread && (
                    <span className="w-2 h-2 bg-app-primary rounded-full shadow-[0_0_8px_rgba(79,70,229,0.5)] animate-pulse" />
                  )}
                </div>
                <p className={`text-xs truncate font-medium ${getRecipientInfo(conv).isUnread ? 'text-app-foreground font-bold' : 'text-app-muted opacity-80'}`}>
                  {conv.lastMessage}
                </p>
              </div>
            </button>
          ))}
          {conversations.length === 0 && (
            <div className="p-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-app-accent flex items-center justify-center mx-auto text-app-primary shadow-inner">
                <MessageSquare size={24} />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-app-foreground font-bold uppercase tracking-widest leading-relaxed">No signals detected</p>
                <p className="text-[9px] text-app-muted font-bold uppercase tracking-tight opacity-50">Establish a secure link.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative bg-app-bg overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] nexus-gradient" />
        <AnimatePresence mode="wait">
          {activeConversation ? (
            <motion.div 
              key={activeConversation.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="absolute inset-0 flex flex-col"
            >
              <header className="h-20 px-8 border-b border-app-border flex items-center justify-between bg-app-card/30 backdrop-blur-md sticky top-0 z-20">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-app-muted-bg border border-app-border flex items-center justify-center text-xs font-bold text-app-muted uppercase overflow-hidden shadow-sm font-mono relative">
                    {activeRecipient?.avatar ? (
                      <img src={activeRecipient.avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      activeRecipient?.name[0]
                    )}
                    {activeRecipient?.status === 'online' && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-3 border-app-bg rounded-full shadow-lg" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-app-foreground tracking-tight">{activeRecipient?.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      {activeRecipient?.status === 'online' ? (
                        <>
                          <Circle size={6} className="fill-emerald-500 text-emerald-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest opacity-90">Active Now</span>
                        </>
                      ) : (
                        <>
                          <Circle size={6} className="fill-app-muted text-app-muted" />
                          <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest opacity-70">Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button className="w-10 h-10 rounded-xl hover:bg-app-muted-bg flex items-center justify-center text-app-muted transition-all">
                  <MoreVertical size={20} />
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hidden">
                {messages.map((m, index) => {
                  const isMe = m.senderId === user.uid;
                  const prevMsg = messages[index - 1];
                  const mTime = m.createdAt?.toMillis?.() || Date.now();
                  const prevMTime = prevMsg?.createdAt?.toMillis?.() || 0;
                  const isGrouped = prevMsg && prevMsg.senderId === m.senderId && (mTime - prevMTime) < 300000;

                  return (
                    <div key={m.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? '-mt-4' : ''}`}>
                      <div className={`w-10 h-10 rounded-2xl border border-app-border flex-shrink-0 flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm font-mono transition-all ${isMe ? 'bg-app-primary text-white border-app-primary/20' : 'bg-app-card text-app-muted'} ${isGrouped ? 'opacity-0 scale-75 -translate-y-2' : ''}`}>
                        {isMe ? (
                          user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : (user.displayName?.[0] || user.email?.[0])
                        ) : (
                          activeRecipient?.avatar ? <img src={activeRecipient.avatar} alt="" className="w-full h-full object-cover" /> : activeRecipient?.name?.[0]
                        )}
                      </div>
                      <div className={`max-w-[70%] group/msg relative ${isMe ? 'text-right' : ''}`}>
                        {!isGrouped && !isMe && (
                           <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5 flex items-center gap-2">
                             {activeRecipient?.name}
                             <span className="opacity-40 font-mono">
                               {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                             </span>
                           </div>
                        )}
                        {!isGrouped && isMe && (
                           <div className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5 flex items-center gap-2 justify-end">
                             <span className="opacity-40 font-mono">
                               {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                             </span>
                             You
                           </div>
                        )}
                        {m.replyTo && (
                          <div className={`mb-1 p-2 rounded-lg bg-app-muted-bg border-l-2 border-app-primary/30 text-left text-[10px] opacity-60 inline-block`}>
                            <div className="font-bold uppercase tracking-tighter text-app-primary">{m.replyTo.senderName}</div>
                            <div className="truncate">{m.replyTo.text}</div>
                          </div>
                        )}
                        <div className="relative">
                          {m.imageUrl && (
                            <div className={`mb-2 relative rounded-2xl overflow-hidden border border-app-border cursor-pointer group/img ${isMe ? 'ml-auto' : ''}`}>
                              <img 
                                src={m.imageUrl} 
                                alt="Signal Media" 
                                className="max-w-full max-h-[320px] object-cover transition-transform group-hover/img:scale-105"
                                onClick={() => setSelectedImage(m.imageUrl)}
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                <Maximize2 size={20} className="text-white" />
                              </div>
                            </div>
                          )}
                          {m.text && (
                            <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm inline-block text-left ${isMe ? 'bg-app-primary text-white rounded-tr-none' : 'bg-app-card border border-app-border text-app-foreground rounded-tl-none'}`}>
                              {m.text}
                            </div>
                          )}

                          {/* Hover Actions */}
                          <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 p-1 bg-app-card border border-app-border rounded-lg shadow-xl z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                            <button onClick={() => setReplyingTo(m)} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Reply size={14} /></button>
                            <button onClick={() => handleReaction(m.id, '👍')} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Smile size={14} /></button>
                            {isMe && <button onClick={() => setMessageToDelete(m.id)} className="p-1.5 text-app-muted hover:text-red-500 rounded hover:bg-red-500/10"><Trash2 size={14} /></button>}
                          </div>
                        </div>

                        {/* Reactions */}
                        {m.reactions && Object.keys(m.reactions).length > 0 && (
                          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : ''}`}>
                            {Object.entries(m.reactions).map(([emoji, uids]: [string, any]) => (
                              <button 
                                key={emoji}
                                onClick={() => handleReaction(m.id, emoji)}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${uids.includes(user.uid) ? 'bg-app-primary/20 border-app-primary text-app-primary' : 'bg-app-card border-app-border text-app-muted'}`}
                              >
                                <span>{emoji}</span><span>{uids.length}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        <div className={`mt-1 flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                          {!isGrouped && (
                            <span className="text-[9px] text-app-muted font-bold opacity-40 uppercase tracking-tighter">
                              {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                            </span>
                          )}
                          {isMe && activeConversation?.lastRead?.[activeRecipient?.id] && m.createdAt && (
                            activeConversation.lastRead[activeRecipient.id].toMillis() >= m.createdAt.toMillis() ? (
                              <span className="flex items-center gap-0.5 text-emerald-500" title="Seen by recipient">
                                <CheckCheck size={12} className="stroke-[3]" />
                                <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Seen</span>
                              </span>
                            ) : (
                              <span title="Delivered">
                                <Check size={12} className="text-app-muted opacity-40" />
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-8 flex flex-col gap-2">
                {typingUsers.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="flex items-center gap-2 text-[9px] text-app-primary font-bold uppercase tracking-widest bg-app-primary/10 border border-app-primary/20 w-fit px-3 py-1 rounded-full mb-2"
                  >
                    <div className="flex gap-1 mt-0.5">
                      <span className="w-1 h-1 bg-app-primary rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                      <span className="w-1 h-1 bg-app-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      <span className="w-1 h-1 bg-app-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                    <span>{typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} indexing...</span>
                  </motion.div>
                )}

                {replyingTo && (
                  <div className="p-4 bg-app-accent/30 border-t border-x border-app-border rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Reply size={14} className="text-app-primary" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-bold text-app-primary uppercase tracking-widest">Replying to {replyingTo.senderId === user.uid ? 'You' : activeRecipient?.name}</div>
                      <div className="text-xs text-app-muted truncate opacity-80">{replyingTo.text}</div>
                    </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1 text-app-muted hover:text-app-foreground"><X size={18} /></button>
                </div>
              )}
              </div>

              <footer className="p-6 bg-app-card/50 backdrop-blur-md border-t border-app-border shadow-2xl shrink-0">
                <div className="max-w-4xl mx-auto space-y-4">
                  <AnimatePresence>
                    {previewUrl && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative inline-block"
                      >
                        <div className="relative rounded-2xl overflow-hidden border-2 border-app-primary shadow-xl group/preview">
                          <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover" />
                          {(isUploading || uploadStatus !== 'idle') && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 backdrop-blur-sm">
                              {uploadStatus === 'uploading' && (
                                <>
                                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mb-3 border border-white/5">
                                    <motion.div 
                                      className="h-full bg-app-primary shadow-[0_0_10px_rgba(79,70,229,0.8)]" 
                                      initial={{ width: 0 }}
                                      animate={{ width: `${uploadProgress}%` }}
                                      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-[8px] font-bold text-app-primary uppercase tracking-[0.2em] animate-pulse">Uploading Signal...</span>
                                    <span className="text-[10px] font-mono font-bold text-white">{Math.round(uploadProgress)}%</span>
                                  </div>
                                </>
                              )}
                              {uploadStatus === 'success' && (
                                <motion.div 
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex flex-col items-center gap-2"
                                >
                                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-500">
                                    <CheckCheck size={24} />
                                  </div>
                                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Signal Transmitted</span>
                                </motion.div>
                              )}
                              {uploadStatus === 'error' && (
                                <motion.div 
                                  initial={{ scale: 0.5, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="flex flex-col items-center gap-2"
                                >
                                  <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center text-red-500">
                                    <AlertCircle size={24} />
                                  </div>
                                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Transmission Failed</span>
                                </motion.div>
                              )}
                            </div>
                          )}
                          {(uploadStatus === 'idle') && (
                            <button 
                              type="button"
                              onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                              className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-all opacity-0 group-hover/preview:opacity-100"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSendMessage} className="relative group">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-app-muted hover:text-app-primary hover:bg-app-primary/10 transition-all disabled:opacity-50"
                      >
                        <ImageIcon size={18} />
                      </button>
                    </div>

                    <input 
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={isUploading}
                      placeholder={isUploading ? "Uploading signal..." : "Establish signal link..."}
                      className="w-full bg-app-muted-bg border border-app-border rounded-2xl pl-12 pr-16 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all font-medium placeholder:text-app-muted/50"
                    />
                    <button 
                      type="submit"
                      disabled={isUploading || (!newMessage.trim() && !selectedFile)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-app-foreground text-app-bg rounded-xl flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-50"
                    >
                      {isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                  </form>
                </div>
              </footer>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center p-12 text-center space-y-8 relative z-10"
            >
              <div className="w-24 h-24 rounded-[2.5rem] bg-app-card border border-app-border flex items-center justify-center text-app-primary shadow-premium animate-pulse-slow">
                <Zap size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-app-foreground tracking-tight uppercase">GhostLink Encrypted Signal</h3>
                <p className="text-sm text-app-muted max-w-sm font-medium leading-relaxed">Select a signal channel from the sidebar to initialize end-to-end encrypted communication.</p>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold text-app-muted uppercase tracking-[0.2em] opacity-40">
                <div className="flex items-center gap-2 bg-app-card border border-app-border px-3 py-1.5 rounded-lg">
                  <span className="p-1 rounded bg-app-muted-bg border border-app-border">⌘</span>
                  <span className="p-1 rounded bg-app-muted-bg border border-app-border">K</span> SEARCH
                </div>
                <div className="flex items-center gap-2 bg-app-card border border-app-border px-3 py-1.5 rounded-lg">
                  <span className="p-1 rounded bg-app-muted-bg border border-app-border">ESC</span> CLOSE
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {messageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessageToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-sm bg-app-card border border-app-border rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-app-foreground tracking-tight uppercase mb-2">Purge Signal?</h3>
              <p className="text-sm text-app-muted font-medium leading-relaxed mb-8">
                This action will permanently erase the signal record from the GhostLink nexus. This cannot be undone.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMessageToDelete(null)}
                  className="px-6 py-3 bg-app-muted-bg border border-app-border rounded-xl text-[10px] font-bold text-app-foreground uppercase tracking-widest hover:bg-app-card transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-red-500/20"
                >
                  Confirm Purge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* New Chat Modal */}
      <AnimatePresence>
        {isNewChatModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewChatModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-app-border bg-app-accent/50">
                <h3 className="text-xl font-bold text-app-foreground tracking-tight uppercase">New Signal</h3>
                <div className="mt-6 relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-app-muted opacity-50 transition-opacity group-focus-within:opacity-100" size={18} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by operator ID..."
                    className="w-full bg-app-muted-bg border border-app-border rounded-2xl pl-12 pr-6 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all font-medium placeholder:text-app-muted/50"
                  />
                </div>
              </div>
              
              <div className="p-4 h-[400px] overflow-y-auto scrollbar-hidden">
                {filteredUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => startNewConversation(u)}
                    className="w-full p-4 rounded-2xl flex items-center gap-4 hover:bg-app-muted-bg transition-all text-left group border border-transparent hover:border-app-border/30"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-app-accent border border-app-border flex items-center justify-center text-sm font-bold text-app-muted uppercase group-hover:bg-app-primary/10 group-hover:text-app-primary transition-all font-mono">
                      {u.displayName?.[0] || u.email?.[0]}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-foreground group-hover:text-app-primary transition-colors">{u.displayName || 'Unnamed Operator'}</div>
                      <div className="text-xs text-app-muted font-medium opacity-60">{u.email}</div>
                    </div>
                  </button>
                ))}
                {filteredUsers.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-50">
                    <div className="w-12 h-12 rounded-2xl border-2 border-dashed border-app-border flex items-center justify-center mb-4">
                      <UserIcon size={20} className="text-app-muted" />
                    </div>
                    <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest">No matching signals found.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Fullscreen Image Preview */}
      <AnimatePresence>
        {selectedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedImage(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-[90vw] max-h-[90vh]"
            >
              <img src={selectedImage} alt="Signal Media Full" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" />
              <button 
                onClick={() => setSelectedImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-all"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
