import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  limit,
  setDoc,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
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
  X,
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

export default function GlobalCommunity() {
  const { user } = useAuthStore();
  const { allUsers } = useWorkspace();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  
  // Media states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // For fullscreen preview
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Handle typing state
  useEffect(() => {
    if (!user) return;
    
    const typingRef = doc(db, 'global_typing', user.uid);
    
    if (newMessage.trim()) {
      setDoc(typingRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: serverTimestamp()
      });

      // Clear after 3s
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
  }, [newMessage, user]);

  // Listen for typing users
  useEffect(() => {
    if (!user) return;
    const qTyping = collection(db, 'global_typing');
    const unsubTyping = onSnapshot(qTyping, (snapshot) => {
      const users = snapshot.docs
        .map(doc => doc.data())
        .filter(d => d.userId !== user?.uid)
        .map(d => d.userName) as string[];
      setTypingUsers(users);
    });
    return () => unsubTyping();
  }, [user]);

  const [replyingTo, setReplyingTo] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are supported in this nexus.');
      return;
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size exceeds safety limit (5MB).');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !user || isSending || isUploading) return;

    const text = newMessage;
    const reply = replyingTo;
    const file = selectedFile;

    setNewMessage('');
    setReplyingTo(null);
    setSelectedFile(null);
    setPreviewUrl(null);
    
    setIsSending(true);

    try {
      // Clear typing status on send
      deleteDoc(doc(db, 'global_typing', user.uid)).catch(() => {});

      let imageUrl = null;
      let metadata = null;
      let uploadedRef = null;

      if (file) {
        setIsUploading(true);
        const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const storageRef = ref(storage, `community/${fileName}`);
        uploadedRef = storageRef;
        const uploadTask = uploadBytesResumable(storageRef, file);

        imageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error("Storage upload error:", error);
              reject(error);
            },
            async () => {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });

        metadata = {
          name: file.name,
          size: file.size,
          type: file.type
        };
        setIsUploading(false);
        setUploadProgress(0);
      }

      try {
        await addDoc(collection(db, 'global_messages'), {
          senderId: user.uid,
          senderName: user.displayName || user.email,
          senderPhoto: user.photoURL || '',
          text: text || '',
          imageUrl,
          imageMetadata: metadata,
          createdAt: serverTimestamp(),
          replyTo: reply ? {
            messageId: reply.id,
            senderName: reply.senderName,
            text: reply.text || 'Image transmission'
          } : null
        });
      } catch (dbError) {
        // Cleanup storage if Firestore write fails
        if (uploadedRef) {
          await deleteObject(uploadedRef).catch(e => console.error("Storage cleanup failed:", e));
        }
        throw dbError;
      }
    } catch (error) {
      console.error("Broadcast Error:", error);
      toast.error('Failed to broadcast message');
      // Restore state on failure
      setNewMessage(text);
      setSelectedFile(file);
    } finally {
      setIsSending(false);
      setIsUploading(false);
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
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'global_messages', messageId));
      setMessageToDelete(null);
      toast.success('Broadcast purged');
    } catch (e) {
      toast.error('Failed to erase record');
    }
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
    <div className="h-full flex flex-col bg-app-bg text-app-foreground overflow-hidden">
      <div className="px-8 py-6 border-b border-app-border flex items-center justify-between bg-app-card/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-app-primary/10 border border-app-primary/20 flex items-center justify-center text-app-primary shadow-sm">
            <Globe size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-app-foreground tracking-tight">Community Hub</h1>
            <div className="flex items-center gap-2 mt-1">
              <Circle size={8} className="fill-emerald-500 text-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest">
                {allUsers.filter(u => u.status === 'online').length} Operators Active
              </span>
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
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
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
                    <div className="mb-2 p-2 rounded-lg bg-app-muted-bg border-l-2 border-app-primary/30 text-left text-[10px] opacity-60 inline-block">
                      <div className="font-bold text-app-primary">{m.replyTo.senderName}</div>
                      <div className="truncate">{m.replyTo.text}</div>
                    </div>
                  )}

                  <div className="relative">
                    {m.imageUrl && (
                      <div className={`mb-2 relative rounded-2xl overflow-hidden border border-app-border cursor-pointer group/img ${isMe ? 'ml-auto' : ''}`}>
                        <img 
                          src={m.imageUrl} 
                          alt="Nexus Signal Media" 
                          className="max-w-full max-h-[320px] object-cover transition-transform group-hover/img:scale-105"
                          onClick={() => setSelectedImage(m.imageUrl)}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <Maximize2 size={24} className="text-white" />
                        </div>
                      </div>
                    )}
                    {m.text && (
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm inline-block text-left ${isMe ? 'bg-app-primary text-white rounded-tr-none' : 'bg-app-card border border-app-border text-app-foreground rounded-tl-none'}`}>
                        {m.text}
                      </div>
                    )}

                    <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 p-1 bg-app-card border border-app-border rounded-lg shadow-xl z-20 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                      <button onClick={() => setReplyingTo(m)} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Reply size={14} /></button>
                      <button onClick={() => handleReaction(m.id, '👍')} className="p-1.5 text-app-muted hover:text-app-primary rounded hover:bg-app-muted-bg"><Smile size={14} /></button>
                      {isMe && <button onClick={() => setMessageToDelete(m.id)} className="p-1.5 text-app-muted hover:text-red-500 rounded hover:bg-red-500/10"><Trash2 size={14} /></button>}
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

      <div className="shrink-0 p-6 bg-app-card border-t border-app-border shadow-2xl relative z-10">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="flex flex-col gap-2">
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
                <span>{typingUsers.length > 3 ? 'Multiple nodes' : typingUsers.join(', ')} typing...</span>
              </motion.div>
            )}

            {replyingTo && (
              <div className="p-4 bg-app-accent/30 border-t border-x border-app-border rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <Reply size={14} className="text-app-primary" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold text-app-primary uppercase tracking-widest">Replying to {replyingTo.senderName}</div>
                    <div className="text-xs text-app-muted truncate opacity-80">{replyingTo.text || 'Multimedia'}</div>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 text-app-muted hover:text-app-foreground"><X size={18} /></button>
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="space-y-4">
            <AnimatePresence>
              {previewUrl && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="relative inline-block"
                >
                  <div className="relative rounded-2xl overflow-hidden border-2 border-app-primary shadow-xl">
                    <img src={previewUrl} alt="Preview" className="w-48 h-48 object-cover" />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-4">
                        <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            className="h-full bg-app-primary" 
                            initial={{ width: 0 }}
                            animate={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{Math.round(uploadProgress)}%</span>
                      </div>
                    )}
                    {!isUploading && (
                      <button 
                        type="button"
                        onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                        className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black transition-all"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative group">
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
                  <ImageIcon size={20} />
                </button>
              </div>

              <input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isUploading}
                placeholder={isUploading ? "Uploading signal asset..." : "Broadcast to community..."}
                className="w-full bg-app-muted-bg border border-app-border rounded-xl pl-14 pr-16 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all font-medium placeholder:text-app-muted"
              />
              
              <button 
                type="submit"
                disabled={isSending || isUploading || (!newMessage.trim() && !selectedFile)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-app-foreground text-app-bg rounded-lg flex items-center justify-center hover:opacity-90 transition-all active:scale-95 shadow-lg disabled:opacity-50"
              >
                {isSending || isUploading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Global Modals */}
      <AnimatePresence>
        {messageToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMessageToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-app-card border border-app-border rounded-3xl shadow-2xl p-8 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mx-auto mb-6">
                <AlertCircle size={32} />
              </div>
              <h3 className="text-xl font-bold text-app-foreground tracking-tight uppercase mb-2">Purge Broadcast?</h3>
              <p className="text-sm text-app-muted font-medium mb-8">Permanently erase this record from the community nexus?</p>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setMessageToDelete(null)}
                  className="px-6 py-3 bg-app-muted-bg border border-app-border rounded-xl text-[10px] font-bold text-app-foreground uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteMessage(messageToDelete)}
                  className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20"
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </div>
        )}

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
              <img src={selectedImage} alt="Nexus Signal Full Res" className="max-w-full max-h-[90vh] object-contain rounded shadow-2xl" />
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
