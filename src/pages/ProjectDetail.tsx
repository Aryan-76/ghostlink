import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  getDoc,
  where,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { 
  MessageSquare, 
  FileText, 
  Info, 
  Send, 
  ChevronLeft,
  Users,
  Calendar,
  Settings as SettingsIcon,
  Plus,
  Loader2,
  Trash2,
  Archive,
  UserPlus,
  X,
  Search,
  Check,
  CheckCheck,
  Upload,
  File,
  Download,
  FileCode,
  AlertCircle,
  Smile,
  Reply,
  Edit2,
  MoreHorizontal,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ref, uploadBytesResumable, getDownloadURL, UploadTaskSnapshot, UploadTask, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';
import { Message, Project, Document as DocType } from '../types';
import Markdown from 'react-markdown';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProject, deleteProject, logActivity, addCollaborator, allUsers, activities } = useWorkspace();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'docs' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Docs state
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  // Team Management
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Document Presence
  const [docPresence, setDocPresence] = useState<string[]>([]);
  
  useEffect(() => {
    if (!projectId || !activeDocId || !user) return;
    
    const presenceRef = doc(db, 'projects', projectId, 'doc_presence', `${activeDocId}_${user.uid}`);
    setDocPresence([]); // Reset on switch
    
    setDoc(presenceRef, {
      userId: user.uid,
      userName: user.displayName || user.email,
      docId: activeDocId,
      timestamp: serverTimestamp()
    });
    
    const qPresence = query(
      collection(db, 'projects', projectId, 'doc_presence'),
      where('docId', '==', activeDocId)
    );
    
    const unsubPresence = onSnapshot(qPresence, (snapshot) => {
      const users = snapshot.docs
        .map(doc => doc.data())
        .filter(d => d.userId !== user.uid)
        .map(d => d.userName) as string[];
      setDocPresence(users);
    });
    
    return () => {
      unsubPresence();
      deleteDoc(presenceRef).catch(() => {});
    };
  }, [projectId, activeDocId, user]);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Docs state - secondary
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeUploadTask, setActiveUploadTask] = useState<UploadTask | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editMessageText, setEditMessageText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [localDoc, setLocalDoc] = useState<{ title: string; content: string } | null>(null);
  const activeDoc = documents.find(d => d.id === activeDocId) || null;

  // Sync local doc with active doc when switching
  useEffect(() => {
    if (activeDoc) {
      setLocalDoc({ title: activeDoc.title, content: activeDoc.content });
    } else {
      setLocalDoc(null);
    }
  }, [activeDocId]);

  // Auto-save effect from local state
  useEffect(() => {
    if (!localDoc || !activeDoc || activeDoc.type === 'file' || !projectId) return;
    
    // Only save if different from Firestore
    if (localDoc.title === activeDoc.title && localDoc.content === activeDoc.content) return;

    const timeoutId = setTimeout(async () => {
      try {
        setIsSavingDoc(true);
        const docRef = doc(db, 'projects', projectId, 'documents', activeDoc.id);
        
        await updateDoc(docRef, {
          title: localDoc.title,
          content: localDoc.content,
          updatedAt: serverTimestamp()
        });
      } catch (error: any) {
        if (!error?.message?.includes('offline')) {
          console.error("Auto-save error:", error);
        }
      } finally {
        setIsSavingDoc(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [localDoc, projectId, activeDoc?.id]);

  useEffect(() => {
    if (!projectId || !user) return;

    // Fetch Project metadata
    const unsubProject = onSnapshot(doc(db, 'projects', projectId), (snapshot) => {
      if (snapshot.exists()) {
        setProject({ id: snapshot.id, ...snapshot.data() } as Project);
      } else {
        toast.error('Project not found');
        navigate('/dashboard');
      }
      setIsLoading(false);
    });

    // Real-time Messages
    const qMessages = query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
      setMessages(items);
    });

    // Real-time Documents
    const qDocs = query(
      collection(db, 'projects', projectId, 'documents'),
      orderBy('createdAt', 'desc')
    );
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocType[];
      console.log(`[ProjectDetail] Documents updated: ${items.length} assets`);
      setDocuments(items);
    }, (error) => {
      console.error("[ProjectDetail] Documents Listener Error:", error);
    });

    return () => {
      unsubProject();
      unsubMessages();
      unsubDocs();
    };
  }, [projectId, user, navigate]);

  useEffect(() => {
    if (messages.length > 0) {
      const isAtBottom = messagesEndRef.current?.parentElement && 
        (messagesEndRef.current.parentElement.scrollHeight - messagesEndRef.current.parentElement.scrollTop - messagesEndRef.current.parentElement.clientHeight < 100);
      
      if (isAtBottom || messages.length <= 1) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages.length]);

  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mark project as read when entering or new messages arrive
  useEffect(() => {
    if (!projectId || !user || !activeTab) return;
    if (activeTab === 'chat' && messages.length > 0) {
      const updateRead = async () => {
        try {
          await updateDoc(doc(db, 'projects', projectId), {
            [`lastRead.${user.uid}`]: serverTimestamp()
          });
        } catch (e) {}
      };
      updateRead();
    }
  }, [projectId, user, activeTab, messages.length]);

  // Handle typing state
  useEffect(() => {
    if (!projectId || !user || activeTab !== 'chat') return;
    
    const typingRef = doc(db, 'projects', projectId, 'typing', user.uid);
    
    if (newMessage.trim()) {
      setDoc(typingRef, {
        userId: user.uid,
        userName: user.displayName || user.email,
        timestamp: serverTimestamp()
      });

      // Clear typing status after 3 seconds of inactivity
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
  }, [newMessage, projectId, user, activeTab]);

  // Listen for typing users
  useEffect(() => {
    if (!projectId) return;
    const qTyping = collection(db, 'projects', projectId, 'typing');
    const unsubTyping = onSnapshot(qTyping, (snapshot) => {
      const users = snapshot.docs
        .map(doc => doc.data())
        .filter(d => d.userId !== user?.uid)
        .map(d => d.userName) as string[];
      setTypingUsers(users);
    });
    return () => unsubTyping();
  }, [projectId, user]);

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!projectId || !user) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }
    const msgRef = doc(db, 'projects', projectId, 'messages', messageId);
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = msg.reactions || {};
    const users = reactions[emoji] || [];
    
    let newUsers;
    if (users.includes(user.uid)) {
      newUsers = users.filter(id => id !== user.uid);
    } else {
      newUsers = [...users, user.uid];
    }

    const updatedReactions = { ...reactions };
    if (newUsers.length > 0) {
      updatedReactions[emoji] = newUsers;
    } else {
      delete updatedReactions[emoji];
    }

    await updateDoc(msgRef, { reactions: updatedReactions });
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!projectId || !user) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'messages', messageId));
      setMessageToDelete(null);
      toast.success('Message data purged');
    } catch (e) {
      toast.error('Failed to erase record');
    }
  };

  const handleUpdateMessage = async (messageId: string) => {
    if (!projectId || !user || !editMessageText.trim()) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }
    try {
      const msgRef = doc(db, 'projects', projectId, 'messages', messageId);
      await updateDoc(msgRef, {
        text: editMessageText,
        edited: true,
        editedAt: serverTimestamp()
      });
      setEditingMessageId(null);
      setEditMessageText('');
      toast.success('Signal recalibrated');
    } catch (e) {
      toast.error('Failed to update record');
    }
  };

  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !projectId || !user || isSendingMessage) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }

    const text = newMessage;
    const reply = replyingTo;
    setNewMessage('');
    setReplyingTo(null);
    setIsSendingMessage(true);

    try {
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        text,
        createdAt: serverTimestamp(),
        replyTo: reply ? {
          messageId: reply.id,
          senderName: reply.senderName,
          text: reply.text
        } : null
      });
      
      logActivity({
        type: 'message_sent',
        title: `Broadcast in ${project?.title}`
      });
    } catch (error) {
      toast.error('Signal transmission failed');
      setNewMessage(text);
      setReplyingTo(reply);
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateDoc = async () => {
    if (!projectId || !user || isCreatingDoc) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }
    setIsCreatingDoc(true);
    try {
      const docRef = await addDoc(collection(db, 'projects', projectId, 'documents'), {
        title: 'Untitled Document',
        content: '',
        createdBy: user.uid,
        type: 'markdown',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setActiveDocId(docRef.id);
      toast.success('Document created');
    } catch (error) {
      toast.error('Failed to create document');
    } finally {
      setIsCreatingDoc(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !projectId || !user || isUploading) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }

    // 10MB limit for ghostlink
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File exceeds 10MB neural limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const storagePath = `projects/${projectId}/docs/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, storagePath);
      
      const metadata = {
        customMetadata: {
          'uploader': user.uid,
          'projectId': projectId
        }
      };

      const uploadTask = uploadBytesResumable(storageRef, file, metadata);
      setActiveUploadTask(uploadTask);

      uploadTask.on('state_changed', 
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        }, 
        (error) => {
          console.error("Upload stream error:", error);
          setIsUploading(false);
          setActiveUploadTask(null);
          toast.error("Transmission interrupted.");
        }, 
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            const docData = {
              title: file.name,
              fileName: file.name,
              fileUrl: downloadURL,
              storagePath: storagePath,
              size: file.size,
              mimeType: file.type,
              type: 'file',
              createdBy: user.uid,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };

            const docRef = await addDoc(collection(db, 'projects', projectId, 'documents'), docData);
            
            await logActivity({
              type: 'file_uploaded',
              title: `Asset "${file.name}" synchronized`,
              projectId: projectId,
              targetId: docRef.id
            });

            toast.success('Asset synced successfully');
          } catch (dbError) {
            console.error("Database write error after upload:", dbError);
            // Cleanup storage if Firestore write fails
            const cleanupRef = ref(storage, storagePath);
            await deleteObject(cleanupRef).catch(e => console.error("Storage cleanup failed:", e));
            toast.error('Failed to register signal asset.');
          } finally {
            setIsUploading(false);
            setUploadProgress(0);
            setActiveUploadTask(null);
          }
        }
      );

    } catch (error: any) {
      console.error("[ProjectDetail] Mutation: uploadFile FAILURE", error);
      toast.error('Nexus rejected the signal.');
      setIsUploading(false);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    if (activeUploadTask) {
      activeUploadTask.cancel();
      setActiveUploadTask(null);
      setIsUploading(false);
      setUploadProgress(0);
      toast.info('Upload sequence aborted.');
    }
  };

  const handleSaveDoc = async (id: string, updates: Partial<DocType>) => {
    if (!projectId) return;
    setIsSavingDoc(true);
    try {
      await updateDoc(doc(db, 'projects', projectId, 'documents', id), {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      toast.error('Failed to save document');
    } finally {
      setIsSavingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!projectId || isDeletingDoc || !window.confirm('Are you sure you want to delete this document?')) return;
    if (project?.status === 'archived') {
      toast.error('Project is archived and read-only.');
      return;
    }
    
    setIsDeletingDoc(true);
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'documents', id));
      if (activeDocId === id) setActiveDocId(null);
      toast.success('Document deleted');
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim() || !projectId) return;
    
    setIsInviting(true);
    try {
      await addCollaborator(projectId, inviteEmail);
      toast.success('Member added successfully');
      setInviteEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to add member');
    } finally {
      setIsInviting(false);
    }
  };

  const getCollaboratorData = (uid: string) => {
    return allUsers.find(u => u.id === uid) || { email: uid, displayName: 'Member' };
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-app-bg">
      <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
    </div>
  );

  if (!project) return null;

  return (
    <div className="h-full flex flex-col bg-app-bg text-app-foreground">
      {/* Project Header */}
      <div className="px-8 py-6 border-b border-app-border flex items-center justify-between bg-app-card/50 backdrop-blur-sm sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="text-app-muted hover:text-app-foreground transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-app-foreground tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                project.status === 'active' ? 'bg-app-primary/10 text-app-primary border-app-primary/20' : 'bg-app-muted-bg text-app-muted border-app-border'
              } uppercase tracking-widest`}>
                {project.status}
              </span>
              <span className="text-[10px] text-app-muted font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Users size={10} /> {project.collaborators?.length || 0} Members
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-app-muted-bg/50 border border-app-border rounded-xl">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-app-card text-app-foreground shadow-sm' : 'text-app-muted hover:text-app-foreground'}`}
          >
            <Info size={14} /> OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-app-card text-app-foreground shadow-sm' : 'text-app-muted hover:text-app-foreground'}`}
          >
            <MessageSquare size={14} /> CHAT
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-app-card text-app-foreground shadow-sm' : 'text-app-muted hover:text-app-foreground'}`}
          >
            <FileText size={14} /> DOCS
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-app-card text-app-foreground shadow-sm' : 'text-app-muted hover:text-app-foreground'}`}
          >
            <SettingsIcon size={14} /> SETTINGS
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-8 h-full overflow-y-auto"
            >
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-8">
                  <div className="bg-app-card border border-app-border p-8 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-app-foreground uppercase tracking-widest mb-4">Description</h3>
                    <p className="text-app-muted text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
                  </div>

                  <div className="bg-app-card border border-app-border p-8 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-app-foreground uppercase tracking-widest mb-6 flex items-center gap-2">
                       <Activity size={16} className="text-app-primary" /> Activity Timeline
                    </h3>
                    <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-px before:bg-app-border">
                      {activities.filter(a => a.projectId === projectId).slice(0, 5).map(a => (
                        <div key={a.id} className="flex gap-4 relative">
                          <div className="w-8 h-8 rounded-full bg-app-card border border-app-border flex items-center justify-center relative z-10 text-app-primary">
                             {a.type.includes('message') ? <MessageSquare size={14} /> : 
                              a.type.includes('doc') ? <FileText size={14} /> : 
                              a.type.includes('file') ? <Upload size={14} /> :
                              <Activity size={14} />}
                          </div>
                          <div className="min-w-0 pt-1">
                            <p className="text-sm font-semibold text-app-foreground leading-tight">{a.title}</p>
                            <p className="text-[10px] font-bold text-app-muted uppercase tracking-tighter mt-1">{a.time || 'Synched'}</p>
                          </div>
                        </div>
                      ))}
                      {activities.filter(a => a.projectId === projectId).length === 0 && <p className="text-xs text-app-muted italic pl-4">No neural activity recorded in this sector.</p>}
                    </div>
                  </div>

                  <div className="bg-app-card border border-app-border p-8 rounded-2xl shadow-sm">
                    <h3 className="text-sm font-bold text-app-foreground uppercase tracking-widest mb-6">Recent Messages</h3>
                    <div className="space-y-4">
                      {messages.slice(-3).map(m => (
                        <div key={m.id} className="flex gap-4">
                          <div className="w-8 h-8 rounded bg-app-muted-bg border border-app-border flex items-center justify-center text-[10px] font-bold text-app-muted uppercase font-mono">{m.senderName[0]}</div>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-app-foreground">{m.senderName}</div>
                            <p className="text-xs text-app-muted mt-0.5 truncate">{m.text}</p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && <p className="text-xs text-app-muted italic">No messages yet.</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-app-card border border-app-border p-6 rounded-2xl shadow-sm">
                     <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 italic">Management</h3>
                     <div className="space-y-2">
                        <button 
                          onClick={() => setIsTeamModalOpen(true)}
                          className="w-full py-2.5 bg-app-accent border border-app-border rounded-lg text-xs font-bold text-app-foreground hover:bg-app-muted-bg transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <UserPlus size={14} /> Invite Members
                        </button>
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className="w-full py-2.5 bg-app-primary border border-app-primary/20 rounded-lg text-xs font-bold text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-sm"
                        >
                          <MessageSquare size={14} /> Team Discussion
                        </button>
                     </div>
                  </div>

                  <div className="bg-app-card border border-app-border p-6 rounded-2xl shadow-sm">
                     <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4">Team Members</h3>
                     <div className="space-y-3">
                        {project.collaborators?.map(uid => {
                          const member = getCollaboratorData(uid);
                          const isOnline = member.status === 'online';
                          return (
                            <div key={uid} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-app-muted-bg border border-app-border flex items-center justify-center text-[10px] font-bold text-app-muted uppercase font-mono relative">
                                {member.displayName?.[0] || member.email?.[0]}
                                {isOnline && (
                                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-app-card rounded-full shadow-sm" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-app-foreground truncate flex items-center gap-2">
                                  {member.displayName || member.email}
                                  {isOnline && <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest opacity-80 animate-pulse">Live</span>}
                                </div>
                                <div className="text-[9px] font-bold text-app-muted uppercase tracking-tighter">{uid === project.ownerId ? 'Owner' : 'Collaborator'}</div>
                              </div>
                            </div>
                          );
                        })}
                     </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div 
              key="chat"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col bg-app-bg"
            >
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((m, index) => {
                  const member = getCollaboratorData(m.senderId);
                  const isOnline = member.status === 'online';
                  const isMe = m.senderId === user.uid;
                  const prevMsg = messages[index - 1];
                  const mTime = m.createdAt?.toMillis?.() || Date.now();
                  const prevMTime = prevMsg?.createdAt?.toMillis?.() || 0;
                  const isGrouped = prevMsg && prevMsg.senderId === m.senderId && (mTime - prevMTime) < 300000;
                  
                  return (
                    <div key={m.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} ${isGrouped ? '-mt-4' : ''}`}>
                      <div className={`w-10 h-10 rounded-lg flex-shrink-0 border border-app-border flex items-center justify-center font-bold text-sm shadow-sm relative transition-all ${isMe ? 'bg-app-primary text-white border-app-primary/20' : 'bg-app-card text-app-muted'} ${isGrouped ? 'opacity-0 scale-75 -translate-y-2' : ''}`}>
                        {m.senderName[0]}
                        {isOnline && !isMe && (
                          <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-app-card rounded-full shadow-lg" />
                        )}
                      </div>
                      
                      <div className={`max-w-[70%] group/msg relative ${isMe ? 'text-right' : ''}`}>
                        {!isGrouped && (
                          <div className={`text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1.5 flex items-center gap-2 ${isMe ? 'justify-end' : ''}`}>
                            {m.senderName}
                            <span className="opacity-40 font-mono">
                              {m.createdAt?.toMillis ? new Date(m.createdAt.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isOnline && !isMe && <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />}
                          </div>
                        )}

                        {m.replyTo && (
                          <div className={`mb-1 p-2 rounded-lg bg-app-muted-bg border-l-2 border-app-primary/30 text-left text-[10px] opacity-60 max-w-sm inline-block ${isMe ? 'mr-0' : ''}`}>
                            <div className="font-bold uppercase tracking-tighter text-app-primary">{m.replyTo.senderName}</div>
                            <div className="truncate">{m.replyTo.text}</div>
                          </div>
                        )}

                        <div className="relative">
                          {editingMessageId === m.id ? (
                            <div className={`p-1 rounded-2xl shadow-sm inline-block text-left w-full max-w-md ${isMe ? 'bg-app-primary' : 'bg-app-card border border-app-border'}`}>
                              <textarea
                                value={editMessageText}
                                onChange={(e) => setEditMessageText(e.target.value)}
                                className={`w-full p-3 bg-transparent text-sm resize-none focus:outline-none min-h-[80px] ${isMe ? 'text-white placeholder:text-white/50' : 'text-app-foreground placeholder:text-app-muted'}`}
                                placeholder="Recalibrate signal..."
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleUpdateMessage(m.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingMessageId(null);
                                  }
                                }}
                              />
                              <div className="flex justify-end gap-2 p-2 pt-0">
                                <button 
                                  onClick={() => setEditingMessageId(null)}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isMe ? 'text-white/70 hover:text-white hover:bg-white/10' : 'text-app-muted hover:text-app-foreground hover:bg-app-muted-bg'}`}
                                >
                                  Cancel
                                </button>
                                <button 
                                  onClick={() => handleUpdateMessage(m.id)}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${isMe ? 'bg-white text-app-primary hover:bg-white/90 shadow-lg' : 'bg-app-primary text-white hover:bg-app-primary/90 shadow-lg'}`}
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm inline-block text-left ${isMe ? 'bg-app-primary text-white rounded-tr-none' : 'bg-app-card border border-app-border text-app-foreground rounded-tl-none'}`}>
                                {m.text}
                                {m.edited && (
                                  <span className={`block text-[8px] font-bold uppercase tracking-widest mt-1 opacity-40 ${isMe ? 'text-white' : 'text-app-muted'}`}>
                                    (signal recalibrated)
                                  </span>
                                )}
                              </div>

                              {/* Message Actions */}
                              <div className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-all flex items-center gap-1 p-1 bg-app-card border border-app-border rounded-lg shadow-xl z-10 ${isMe ? 'right-full mr-2' : 'left-full ml-2'}`}>
                                <button 
                                  onClick={() => setReplyingTo(m)}
                                  className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded transition-all"
                                  title="Reply"
                                >
                                  <Reply size={14} />
                                </button>
                                <button 
                                  onClick={() => handleReaction(m.id, '👍')}
                                  className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded transition-all"
                                >
                                  <Smile size={14} />
                                </button>
                                {isMe && (
                                  <>
                                    <button 
                                      onClick={() => { setEditingMessageId(m.id); setEditMessageText(m.text); }}
                                      className="p-1.5 text-app-muted hover:text-app-primary hover:bg-app-primary/10 rounded transition-all"
                                      title="Edit"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button 
                                      onClick={() => setMessageToDelete(m.id)}
                                      className="p-1.5 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                                      title="Delete"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </>
                          )}
                        </div>

                        {/* Reactions and Seen Status */}
                        <div className={`flex items-center gap-3 mt-1.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                          {m.reactions && Object.keys(m.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(m.reactions).map(([emoji, uids]) => (
                                <button 
                                  key={emoji}
                                  onClick={() => handleReaction(m.id, emoji)}
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all flex items-center gap-1 ${uids.includes(user!.uid) ? 'bg-app-primary/20 border-app-primary text-app-primary shadow-inner' : 'bg-app-card border-app-border text-app-muted hover:border-app-muted'}`}
                                >
                                  <span>{emoji}</span>
                                  <span>{uids.length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {isMe && m.createdAt && (
                            <div className="flex items-center gap-1">
                              {(() => {
                                const readBy = project.collaborators?.filter(uid => 
                                  uid !== user!.uid && 
                                  project.lastRead?.[uid] && 
                                  project.lastRead[uid].toMillis() >= m.createdAt.toMillis()
                                ) || [];
                                
                                if (readBy.length > 0) {
                                  return (
                                    <div className="flex items-center gap-1 text-emerald-500" title={`Read by: ${readBy.length} member(s)`}>
                                      <CheckCheck size={12} className="stroke-[3]" />
                                      <span className="text-[8px] font-bold uppercase tracking-widest opacity-60">Seen {readBy.length > 1 ? `by ${readBy.length}` : ''}</span>
                                    </div>
                                  );
                                }
                                return (
                                  <span title="Delivered to Nexus">
                                    <Check size={12} className="text-app-muted opacity-40" />
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                <div ref={messagesEndRef} />
              </div>

              <div className="px-8 flex flex-col gap-2">
                {replyingTo && (
                  <div className="p-4 bg-app-accent/30 border-t border-x border-app-border rounded-t-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
                  <div className="flex items-center gap-4 min-w-0">
                    <Reply size={14} className="text-app-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] font-extrabold text-app-primary uppercase tracking-[0.2em] mb-0.5">Replying to {replyingTo.senderName}</div>
                      <div className="text-xs text-app-muted truncate opacity-80">{replyingTo.text}</div>
                    </div>
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded-lg transition-all">
                    <X size={18} />
                  </button>
                </div>
              )}
              </div>
              
              <div className="p-6 bg-app-card border-t border-app-border shadow-2xl relative z-10">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative group">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Establish signal link..."
                    className="w-full bg-app-muted-bg border border-app-border rounded-xl pl-6 pr-16 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 focus:border-app-primary/40 transition-all placeholder:text-app-muted"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-app-foreground text-app-bg rounded-lg flex items-center justify-center hover:bg-app-muted transition-all active:scale-95 shadow-lg"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>

              {/* Typing indicators moved below input area per request */}
              <div className="h-8 px-8 flex items-center shrink-0">
                <AnimatePresence>
                  {typingUsers.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 text-[10px] text-app-primary font-bold uppercase tracking-[0.2em]"
                    >
                      <div className="flex gap-1.5 item-center">
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                          className="w-1 h-1 bg-app-primary rounded-full shadow-[0_0_5px_rgba(79,70,229,0.8)]" 
                        />
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                          className="w-1 h-1 bg-app-primary rounded-full shadow-[0_0_5px_rgba(79,70,229,0.8)]" 
                        />
                        <motion.span 
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                          className="w-1 h-1 bg-app-primary rounded-full shadow-[0_0_5px_rgba(79,70,229,0.8)]" 
                        />
                      </div>
                      <span className="animate-pulse">
                        {typingUsers.length > 2 ? 'Multiple nexus nodes' : typingUsers.join(' & ')} {typingUsers.length === 1 ? 'is' : 'are'} synchronizing...
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {activeTab === 'docs' && (
            <motion.div 
              key="docs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex"
            >
              <div className="w-72 border-r border-app-border p-6 space-y-6 flex flex-col bg-app-card overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Workspace Assets</h3>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={isUploading}
                        className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded-md transition-all"
                        title="Upload File"
                      >
                        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      </button>
                      <button 
                        onClick={handleCreateDoc} 
                        disabled={isCreatingDoc}
                        className="p-1.5 text-app-muted hover:text-app-foreground hover:bg-app-muted-bg rounded-md transition-all"
                        title="Create Document"
                      >
                        {isCreatingDoc ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                      />
                    </div>
                  </div>

                  {isUploading && (
                    <div className="p-3 bg-app-accent/20 border border-app-primary/20 rounded-xl space-y-2 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold text-app-primary uppercase tracking-widest flex items-center gap-2">
                          <Activity size={10} className="animate-pulse" /> Syncing...
                        </span>
                        <button 
                          onClick={handleCancelUpload}
                          className="p-1 text-app-muted hover:text-red-500 hover:bg-red-500/10 rounded transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="h-1 bg-app-muted-bg rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress}%` }}
                          className="h-full bg-app-primary"
                        />
                      </div>
                      <div className="text-[8px] font-mono text-app-muted text-right uppercase">{Math.round(uploadProgress)}% Complete</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4 flex-1">
                  <div>
                    <h4 className="text-[9px] font-bold text-app-muted opacity-50 uppercase tracking-[0.2em] mb-3 ml-2">Documents</h4>
                    <div className="space-y-1">
                        {documents.filter(d => d.type !== 'file').map(d => (
                          <div key={d.id} className="group/item flex items-center gap-1">
                            <button 
                              onClick={() => setActiveDocId(d.id)}
                              className={`flex-1 text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2.5 ${activeDocId === d.id ? 'bg-app-primary/10 text-app-primary border border-app-primary/20' : 'text-app-muted hover:text-app-foreground hover:bg-app-muted-bg border border-transparent'}`}
                            >
                              <FileText size={14} className={activeDocId === d.id ? 'text-app-primary' : 'text-app-muted'} />
                              <span className="truncate">{d.title}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id); }}
                              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-app-muted hover:text-red-500 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] font-bold text-app-muted opacity-50 uppercase tracking-[0.2em] mb-3 ml-2">Files</h4>
                    <div className="space-y-1">
                        {documents.filter(d => d.type === 'file').map(d => (
                          <div 
                            key={d.id}
                            className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-between group/item hover:bg-app-muted-bg border border-transparent"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <File size={14} className="text-app-muted flex-shrink-0" />
                              <span className="truncate text-app-muted group-hover/item:text-app-foreground">{d.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <a 
                                href={d.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-app-muted hover:text-app-primary transition-colors p-1.5 rounded-md hover:bg-app-accent"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                              <button 
                                onClick={() => handleDeleteDoc(d.id)}
                                className="text-app-muted hover:text-red-500 transition-colors p-1.5 rounded-md hover:bg-red-500/10"
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-12 overflow-y-auto bg-app-bg selection:bg-app-primary/20">
                {activeDoc ? (
                  activeDoc.type === 'file' ? (
                    <div className="h-full flex flex-col items-center justify-center text-center max-w-4xl mx-auto py-12">
                      {activeDoc.mimeType?.startsWith('image/') ? (
                        <div className="w-full mb-8 relative group">
                          <img 
                            src={activeDoc.fileUrl} 
                            alt={activeDoc.title}
                            className="w-full max-h-[60vh] object-contain rounded-2xl shadow-premium border border-app-border bg-app-card"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-2xl">
                             <p className="text-white text-xs font-bold uppercase tracking-widest">{activeDoc.title}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-[2rem] bg-app-card border border-app-border flex items-center justify-center mb-8 text-app-primary shadow-premium">
                          <FileCode size={40} />
                        </div>
                      )}
                      
                      <div className="space-y-4">
                        <h2 className="text-2xl font-bold text-app-foreground tracking-tight">{activeDoc.title}</h2>
                        <div className="flex items-center justify-center gap-4 text-[10px] font-bold text-app-muted uppercase tracking-widest">
                          <span className="px-2 py-0.5 rounded border border-app-border bg-app-muted-bg">{activeDoc.mimeType || 'unknown/type'}</span>
                          <span className="px-2 py-0.5 rounded border border-app-border bg-app-muted-bg">{(activeDoc.size || 0) / 1024 < 1024 ? `${Math.round((activeDoc.size || 0) / 1024)} KB` : `${((activeDoc.size || 0) / (1024 * 1024)).toFixed(1)} MB`}</span>
                        </div>
                        <p className="text-app-muted text-sm max-w-sm leading-relaxed">This asset is synchronized with the GhostLink secure vault. You can download it for local processing.</p>
                      </div>

                      <div className="mt-10 flex items-center gap-4">
                        <a 
                          href={activeDoc.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="px-8 py-3 bg-app-primary text-white font-bold text-[10px] uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-app-primary/20"
                        >
                          <Download size={16} /> Download Asset
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto space-y-10">
                      <div className="flex items-center justify-between group">
                        <input 
                          value={localDoc?.title || ''}
                          onChange={(e) => setLocalDoc(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="text-5xl font-bold bg-transparent border-none text-app-foreground focus:outline-none w-full tracking-tighter placeholder:opacity-20"
                          placeholder="Doc Title"
                        />
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          {isSavingDoc && <Loader2 size={16} className="text-app-muted animate-spin" />}
                          <span className="text-[10px] font-bold text-app-muted uppercase tracking-widest whitespace-nowrap">Session Active</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                           <div className="flex items-center justify-between px-2">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-app-muted uppercase tracking-widest">
                               <FileText size={12} /> Source Editor
                             </div>
                             <div className="flex items-center gap-1">
                               {docPresence.length > 0 && (
                                 <div className="flex -space-x-2 mr-4">
                                   {docPresence.map(name => (
                                     <div key={name} className="w-5 h-5 rounded-full bg-app-primary border border-app-card flex items-center justify-center text-[8px] font-black text-white uppercase shadow-sm" title={name}>
                                       {name[0]}
                                     </div>
                                   ))}
                                   <div className="pl-3 text-[8px] font-bold text-app-primary uppercase tracking-tighter self-center animate-pulse">Editing...</div>
                                 </div>
                               )}
                               <div className="flex items-center gap-1 p-1 bg-app-muted-bg rounded-lg border border-app-border">
                                 <button 
                                   onClick={() => {
                                      const area = document.querySelector('textarea');
                                      if (area) {
                                        const start = area.selectionStart;
                                        const end = area.selectionEnd;
                                        const text = localDoc?.content || '';
                                        const before = text.substring(0, start);
                                        const after = text.substring(end);
                                        const selected = text.substring(start, end);
                                        setLocalDoc(prev => prev ? { ...prev, content: `${before}**${selected}**${after}` } : null);
                                      }
                                   }}
                                   className="p-1 text-app-muted hover:text-app-foreground hover:bg-app-card rounded transition-all font-bold text-xs px-2"
                                 >
                                   B
                                 </button>
                                 <button 
                                   onClick={() => {
                                      const area = document.querySelector('textarea');
                                      if (area) {
                                        const start = area.selectionStart;
                                        const end = area.selectionEnd;
                                        const text = localDoc?.content || '';
                                        const before = text.substring(0, start);
                                        const after = text.substring(end);
                                        const selected = text.substring(start, end);
                                        setLocalDoc(prev => prev ? { ...prev, content: `${before}_${selected}_${after}` } : null);
                                      }
                                   }}
                                   className="p-1 text-app-muted hover:text-app-foreground hover:bg-app-card rounded transition-all italic text-xs px-2"
                                 >
                                   i
                                 </button>
                                 <button 
                                   onClick={() => {
                                      const area = document.querySelector('textarea');
                                      if (area) {
                                        const start = area.selectionStart;
                                        const end = area.selectionEnd;
                                        const text = localDoc?.content || '';
                                        const before = text.substring(0, start);
                                        const after = text.substring(end);
                                        setLocalDoc(prev => prev ? { ...prev, content: `${before}\n# ${after}` } : null);
                                      }
                                   }}
                                   className="p-1 text-app-muted hover:text-app-foreground hover:bg-app-card rounded transition-all font-bold text-xs"
                                 >
                                   H1
                                 </button>
                               </div>
                             </div>
                           </div>
                           <textarea 
                             value={localDoc?.content || ''}
                             onChange={(e) => setLocalDoc(prev => prev ? { ...prev, content: e.target.value } : null)}
                             placeholder="Start typing with markdown..."
                             className="w-full min-h-[60vh] bg-app-card border border-app-border rounded-2xl p-8 text-app-foreground placeholder:text-app-muted/30 focus:outline-none focus:ring-1 focus:ring-app-primary/20 resize-none leading-relaxed text-base font-mono transition-all shadow-sm"
                           />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2 px-2">
                             <Search size={12} /> Live Preview
                           </div>
                           <div className="w-full min-h-[60vh] bg-app-card/30 border border-app-border border-dashed rounded-2xl p-8 overflow-y-auto">
                              <div className="markdown-body prose prose-slate dark:prose-invert max-w-none">
                                <Markdown>{localDoc?.content || '_No content yet. Start typing in the source editor._'}</Markdown>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-app-card border border-app-border flex items-center justify-center mb-8 relative group">
                      <div className="absolute inset-0 bg-app-primary/5 blur-3xl rounded-full scale-150 group-hover:bg-app-primary/10 transition-colors" />
                      <FileText size={32} className="text-app-muted relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-app-foreground mb-2 tracking-tight">Select an Asset</h3>
                    <p className="text-app-muted text-sm max-w-xs mx-auto leading-relaxed">
                      Choose an existing asset from the sidebar or initialize a new document to begin your workspace session.
                    </p>
                    <div className="flex items-center gap-4 mt-10">
                       <button 
                         onClick={handleCreateDoc}
                         className="px-6 py-2.5 bg-app-primary hover:bg-indigo-500 text-white text-[10px] font-bold rounded-xl transition-all uppercase tracking-widest shadow-lg shadow-app-primary/20"
                       >
                         Create Doc
                       </button>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="px-6 py-2.5 bg-app-card hover:bg-app-muted-bg text-app-foreground text-[10px] font-bold rounded-xl border border-app-border transition-all uppercase tracking-widest shadow-sm"
                       >
                         Upload File
                       </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 h-full overflow-y-auto bg-app-bg"
            >
              <div className="max-w-2xl mx-auto space-y-12">
                <section>
                  <h3 className="text-sm font-bold text-app-foreground uppercase tracking-widest mb-6">General Settings</h3>
                  <div className="space-y-4">
                    <div className="bg-app-card border border-app-border p-6 rounded-2xl shadow-sm">
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2">Project Title</label>
                      <input 
                        value={project.title}
                        onChange={(e) => updateProject(project.id, { title: e.target.value })}
                        className="w-full bg-app-muted-bg border border-app-border rounded-lg px-4 py-2.5 text-sm text-app-foreground focus:outline-none focus:ring-1 focus:ring-app-primary/30 transition-all font-medium"
                      />
                    </div>
                    <div className="bg-app-card border border-app-border p-6 rounded-2xl shadow-sm">
                      <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-2">Description</label>
                      <textarea 
                        value={project.description}
                        onChange={(e) => updateProject(project.id, { description: e.target.value })}
                        rows={4}
                        className="w-full bg-app-muted-bg border border-app-border rounded-lg px-4 py-2.5 text-sm text-app-foreground focus:outline-none focus:ring-1 focus:ring-app-primary/30 transition-all resize-none font-medium leading-relaxed"
                        placeholder="Project objectives and notes..."
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-6">Danger Zone</h3>
                  <div className="bg-red-500/[0.02] border border-red-500/10 p-8 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-app-foreground mb-1">Archive Project</h4>
                        <p className="text-xs text-app-muted">Move this project to the archive. It will still be accessible but read-only.</p>
                      </div>
                      <button 
                        onClick={() => updateProject(project.id, { status: 'archived' }).then(() => toast.success('Project archived'))}
                        className="px-6 py-2 bg-app-muted-bg hover:bg-app-muted text-app-foreground text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest border border-app-border"
                      >
                        Archive
                      </button>
                    </div>
                    <div className="h-px bg-app-border" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-red-500 mb-1">Delete Project</h4>
                        <p className="text-xs text-app-muted">Permanently remove this project and all its data. This action cannot be undone.</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this project?')) {
                            deleteProject(project.id).then(() => {
                              toast.success('Project deleted');
                              navigate('/dashboard');
                            });
                          }
                        }}
                        className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-500 text-[10px] font-bold rounded-lg transition-all uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Delete Confirmation Modal */}
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
                This action will permanently erase the message data from the GhostLink nexus. This cannot be undone.
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

      {/* Team Invite Modal */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTeamModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-app-border flex items-center justify-between bg-app-accent/50">
                <div>
                  <h3 className="text-lg font-bold text-app-foreground tracking-tight uppercase">Invite Team</h3>
                  <p className="text-xs text-app-muted mt-1 font-medium">Provision access to collaborators.</p>
                </div>
                <button onClick={() => setIsTeamModalOpen(false)} className="text-app-muted hover:text-app-foreground p-2 rounded-lg hover:bg-app-muted-bg transition-all">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-app-muted uppercase tracking-widest mb-3">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@ghostlink.io"
                      className="w-full bg-app-muted-bg border border-app-border rounded-xl px-4 py-3.5 text-sm text-app-foreground focus:outline-none focus:ring-1 focus:ring-app-primary/30 transition-all font-medium"
                      required
                    />
                    <button 
                      type="submit"
                      disabled={isInviting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-app-primary text-white text-[10px] font-bold px-4 py-2 rounded-lg hover:bg-indigo-500 transition-all disabled:opacity-50 shadow-lg shadow-app-primary/20"
                    >
                      {isInviting ? <Loader2 size={12} className="animate-spin" /> : 'SEND INVITE'}
                    </button>
                  </div>
                </div>

                <div className="pt-4 border-t border-app-border">
                  <h4 className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-4 opacity-50">Current Operators</h4>
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-2 scrollbar-hidden">
                    {project.collaborators?.map(uid => {
                      const member = getCollaboratorData(uid);
                      return (
                        <div key={uid} className="flex items-center justify-between bg-app-muted-bg border border-app-border p-3 rounded-xl shadow-sm">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-app-card border border-app-border flex items-center justify-center text-[10px] font-bold text-app-muted uppercase font-mono shadow-sm">
                              {member.displayName?.[0] || member.email?.[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-app-foreground truncate">{member.displayName || member.email}</div>
                              <div className="text-[9px] font-bold text-app-muted uppercase tracking-tighter opacity-70">{uid === project.ownerId ? 'Nexus Owner' : 'Operator'}</div>
                            </div>
                          </div>
                          {uid === project.ownerId && (
                            <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center">
                              <Check size={12} className="text-app-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
