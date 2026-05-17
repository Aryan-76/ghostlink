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
  Upload,
  File,
  Download,
  FileCode,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';
import { Message, Project, Document as DocType } from '../types';
import Markdown from 'react-markdown';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { updateProject, deleteProject, logActivity, addCollaborator, allUsers } = useWorkspace();
  
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'chat' | 'docs' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  // Team Management
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  // Chat state
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Docs state
  const [documents, setDocuments] = useState<DocType[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);
  const [isSavingDoc, setIsSavingDoc] = useState(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save effect
  useEffect(() => {
    if (!activeDoc || activeDoc.type === 'file' || !projectId) return;

    // Use a reference check to avoid infinite loops if Firestore updates other fields
    const timeoutId = setTimeout(async () => {
      try {
        setIsSavingDoc(true);
        const docRef = doc(db, 'projects', projectId, 'documents', activeDoc.id);
        
        // Use setDoc with merge to be safer or updateDoc
        await updateDoc(docRef, {
          title: activeDoc.title,
          content: activeDoc.content,
          updatedAt: serverTimestamp()
        });
      } catch (error: any) {
        // Silently ignore offline errors during auto-save
        if (!error?.message?.includes('offline')) {
          console.error("Auto-save error:", error);
        }
      } finally {
        setIsSavingDoc(false);
      }
    }, 2000); // 2 second debounce

    return () => clearTimeout(timeoutId);
  }, [activeDoc?.content, activeDoc?.title, projectId]);

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
      orderBy('updatedAt', 'desc')
    );
    const unsubDocs = onSnapshot(qDocs, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DocType[];
      setDocuments(items);
    });

    return () => {
      unsubProject();
      unsubMessages();
      unsubDocs();
    };
  }, [projectId, user, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !projectId || !user || isSendingMessage) return;

    const text = newMessage;
    setNewMessage('');
    setIsSendingMessage(true);

    try {
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        senderId: user.uid,
        senderName: user.displayName || user.email,
        text,
        createdAt: serverTimestamp()
      });
      
      logActivity({
        type: 'message_sent',
        title: `Sent a message in ${project?.title}`
      });
    } catch (error) {
      toast.error('Failed to send message');
      setNewMessage(text); // Restore message on failure
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleCreateDoc = async () => {
    if (!projectId || !user || isCreatingDoc) return;
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
      
      const newDoc = { 
        id: docRef.id, 
        title: 'Untitled Document', 
        content: '', 
        createdBy: user.uid, 
        createdAt: new Date(), 
        updatedAt: new Date(), 
        type: 'markdown' as const 
      };
      
      setActiveDoc(newDoc);
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

    setIsUploading(true);
    try {
      console.log("[ProjectDetail] Starting file upload:", file.name);
      const storageRef = ref(storage, `projects/${projectId}/docs/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      const url = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, 'projects', projectId, 'documents'), {
        title: file.name,
        fileName: file.name,
        fileUrl: url,
        type: 'file',
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      await logActivity({
        type: 'file_uploaded',
        title: `Uploaded asset: ${file.name}`
      });

      toast.success('File uploaded and indexed');
    } catch (error: any) {
      console.error("[ProjectDetail] Upload error:", error);
      toast.error('Failed to upload asset');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
    
    setIsDeletingDoc(true);
    try {
      await deleteDoc(doc(db, 'projects', projectId, 'documents', id));
      if (activeDoc?.id === id) setActiveDoc(null);
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
    <div className="h-full flex items-center justify-center bg-[#020306]">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
    </div>
  );

  if (!project) return null;

  return (
    <div className="h-full flex flex-col bg-[#020306]">
      {/* Project Header */}
      <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate('/dashboard')} className="text-zinc-500 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">{project.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                project.status === 'active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
              } uppercase tracking-widest`}>
                {project.status}
              </span>
              <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-1.5">
                <Users size={10} /> {project.collaborators?.length || 0} Members
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-1 bg-white/[0.03] border border-white/5 rounded-xl">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <Info size={14} /> OVERVIEW
          </button>
          <button 
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'chat' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <MessageSquare size={14} /> CHAT
          </button>
          <button 
            onClick={() => setActiveTab('docs')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'docs' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            <FileText size={14} /> DOCS
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${activeTab === 'settings' ? 'bg-white/5 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
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
                  <div className="bg-[#0A0B0E] border border-white/5 p-8 rounded-2xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4">Description</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">{project.description || 'No description provided.'}</p>
                  </div>

                  <div className="bg-[#0A0B0E] border border-white/5 p-8 rounded-2xl">
                    <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Recent Messages</h3>
                    <div className="space-y-4">
                      {messages.slice(-3).map(m => (
                        <div key={m.id} className="flex gap-4">
                          <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">{m.senderName[0]}</div>
                          <div>
                            <div className="text-xs font-semibold text-white">{m.senderName}</div>
                            <p className="text-xs text-zinc-500 mt-0.5">{m.text}</p>
                          </div>
                        </div>
                      ))}
                      {messages.length === 0 && <p className="text-xs text-zinc-600 italic">No messages yet.</p>}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-[#0A0B0E] border border-white/5 p-6 rounded-2xl">
                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 italic">Management</h3>
                     <div className="space-y-2">
                        <button 
                          onClick={() => setIsTeamModalOpen(true)}
                          className="w-full py-2.5 bg-white/[0.03] border border-white/5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <UserPlus size={14} /> Invite Members
                        </button>
                        <button 
                          onClick={() => setActiveTab('chat')}
                          className="w-full py-2.5 bg-indigo-600 border border-white/5 rounded-lg text-xs font-bold text-white hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
                        >
                          <MessageSquare size={14} /> Team Discussion
                        </button>
                     </div>
                  </div>

                  <div className="bg-[#0A0B0E] border border-white/5 p-6 rounded-2xl">
                     <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Team Members</h3>
                     <div className="space-y-3">
                        {project.collaborators?.map(uid => {
                          const member = getCollaboratorData(uid);
                          return (
                            <div key={uid} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                {member.displayName?.[0] || member.email?.[0]}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-white truncate">{member.displayName || member.email}</div>
                                <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{uid === project.ownerId ? 'Owner' : 'Collaborator'}</div>
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
              className="absolute inset-0 flex flex-col"
            >
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.map((m) => (
                  <div key={m.id} className={`flex gap-4 ${m.senderId === user.uid ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs ${m.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-500'}`}>
                      {m.senderName[0]}
                    </div>
                    <div className={`max-w-md ${m.senderId === user.uid ? 'text-right' : ''}`}>
                      <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{m.senderName}</div>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.senderId === user.uid ? 'bg-indigo-600 text-white' : 'bg-white/5 text-zinc-300'}`}>
                        {m.text}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-6 bg-[#0A0B0E] border-t border-white/5">
                <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto relative">
                  <input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-6 pr-16 py-4 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                  />
                  <button 
                    type="submit"
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white text-black rounded-lg flex items-center justify-center hover:bg-zinc-200 transition-all"
                  >
                    <Send size={18} />
                  </button>
                </form>
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
              <div className="w-72 border-r border-white/5 p-6 space-y-6 flex flex-col bg-[#0A0B0E]">
                <div className="flex items-center justify-between">
                  <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Workspace Assets</h3>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploading}
                      className="text-zinc-500 hover:text-white transition-colors"
                      title="Upload File"
                    >
                      {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    </button>
                    <button 
                      onClick={handleCreateDoc} 
                      disabled={isCreatingDoc}
                      className="text-zinc-500 hover:text-white transition-colors"
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

                <div className="space-y-4 flex-1 overflow-y-auto">
                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-2">Documents</h4>
                    <div className="space-y-1">
                        {documents.filter(d => d.type !== 'file').map(d => (
                          <div key={d.id} className="group/item flex items-center gap-1">
                            <button 
                              onClick={() => setActiveDoc(d)}
                              className={`flex-1 text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center gap-2.5 ${activeDoc?.id === d.id ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02] border border-transparent'}`}
                            >
                              <FileText size={14} className={activeDoc?.id === d.id ? 'text-indigo-400' : 'text-zinc-600'} />
                              <span className="truncate">{d.title}</span>
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteDoc(d.id); }}
                              className="opacity-0 group-hover/item:opacity-100 p-2 text-zinc-600 hover:text-red-500 transition-all"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-2">Files</h4>
                    <div className="space-y-1">
                        {documents.filter(d => d.type === 'file').map(d => (
                          <div 
                            key={d.id}
                            className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between group/item hover:bg-white/[0.02] border border-transparent"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <File size={14} className="text-zinc-600 flex-shrink-0" />
                              <span className="truncate text-zinc-500 group-hover/item:text-zinc-300">{d.title}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <a 
                                href={d.fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-zinc-600 hover:text-indigo-400 transition-colors p-1.5"
                                title="Download"
                              >
                                <Download size={14} />
                              </a>
                              <button 
                                onClick={() => handleDeleteDoc(d.id)}
                                className="text-zinc-600 hover:text-red-500 transition-colors p-1.5"
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

              <div className="flex-1 p-12 overflow-y-auto bg-[#020306]">
                {activeDoc ? (
                  activeDoc.type === 'file' ? (
                    <div className="h-full flex flex-col items-center justify-center text-center">
                      <div className="w-20 h-20 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-center mb-8 text-zinc-600">
                        <FileCode size={40} />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-2">{activeDoc.title}</h2>
                      <p className="text-zinc-500 text-sm mb-8">This is a binary file. You can download it to view the content.</p>
                      <a 
                        href={activeDoc.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="px-8 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2"
                      >
                        <Download size={16} /> Download Asset
                      </a>
                    </div>
                  ) : (
                    <div className="max-w-4xl mx-auto space-y-10">
                      <div className="flex items-center justify-between group">
                        <input 
                          value={activeDoc.title}
                          onChange={(e) => setActiveDoc({ ...activeDoc, title: e.target.value })}
                          className="text-5xl font-bold bg-transparent border-none text-white focus:outline-none w-full tracking-tight"
                        />
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isSavingDoc && <Loader2 size={16} className="text-zinc-500 animate-spin" />}
                          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest whitespace-nowrap">Auto-saving</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
                             <FileText size={12} /> Editor
                           </div>
                           <textarea 
                             value={activeDoc.content}
                             onChange={(e) => setActiveDoc({ ...activeDoc, content: e.target.value })}
                             placeholder="Start writing markdown..."
                             className="w-full min-h-[60vh] bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-zinc-400 focus:outline-none focus:border-indigo-500/30 resize-none leading-relaxed text-base font-mono transition-all"
                           />
                        </div>
                        <div className="space-y-4">
                           <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">
                             <Search size={12} /> Preview
                           </div>
                           <div className="w-full min-h-[60vh] bg-transparent rounded-2xl prose prose-secondary prose-invert max-w-none">
                              <div className="markdown-body">
                                <Markdown>{activeDoc.content || '_No content yet. Start typing in the editor._'}</Markdown>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-3xl bg-zinc-900/50 border border-white/5 flex items-center justify-center mb-8 relative">
                      <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full" />
                      <FileText size={32} className="text-zinc-600 relative z-10" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Select a Document</h3>
                    <p className="text-zinc-500 text-sm max-w-xs mx-auto leading-relaxed">
                      Choose an asset from the sidebar or initialize a new document to begin session.
                    </p>
                    <div className="flex items-center gap-4 mt-10">
                       <button 
                         onClick={handleCreateDoc}
                         className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all uppercase tracking-widest"
                       >
                         Create Doc
                       </button>
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/10 transition-all uppercase tracking-widest"
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
              className="p-8 h-full overflow-y-auto"
            >
              <div className="max-w-2xl mx-auto space-y-12">
                <section>
                  <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6">General Settings</h3>
                  <div className="space-y-4">
                    <div className="bg-[#0A0B0E] border border-white/5 p-6 rounded-2xl">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Project Title</label>
                      <input 
                        value={project.title}
                        onChange={(e) => updateProject(project.id, { title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="bg-[#0A0B0E] border border-white/5 p-6 rounded-2xl">
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                      <textarea 
                        value={project.description}
                        onChange={(e) => updateProject(project.id, { description: e.target.value })}
                        rows={4}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all resize-none"
                      />
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold text-red-500 uppercase tracking-widest mb-6">Danger Zone</h3>
                  <div className="bg-red-500/[0.02] border border-red-500/10 p-8 rounded-2xl space-y-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-white mb-1">Archive Project</h4>
                        <p className="text-xs text-zinc-500">Move this project to the archive. It will still be accessible but read-only.</p>
                      </div>
                      <button 
                        onClick={() => updateProject(project.id, { status: 'archived' }).then(() => toast.success('Project archived'))}
                        className="px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-all"
                      >
                        Archive
                      </button>
                    </div>
                    <div className="h-px bg-white/5" />
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-red-500 mb-1">Delete Project</h4>
                        <p className="text-xs text-zinc-500">Permanently remove this project and all its data. This action cannot be undone.</p>
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
                        className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-lg transition-all"
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
              className="relative w-full max-w-md bg-[#0A0B0E] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Invite Team Members</h3>
                  <p className="text-xs text-zinc-500 mt-1">Add collaborators to start shipping together.</p>
                </div>
                <button onClick={() => setIsTeamModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleInvite} className="p-8 space-y-6">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Email Address</label>
                  <div className="relative">
                    <input 
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@example.com"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all"
                      required
                    />
                    <button 
                      type="submit"
                      disabled={isInviting}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-black text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-200 transition-all disabled:opacity-50"
                    >
                      {isInviting ? <Loader2 size={12} className="animate-spin" /> : 'INVITE'}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Current Team</h4>
                  <div className="space-y-2">
                    {project.collaborators?.map(uid => {
                      const member = getCollaboratorData(uid);
                      return (
                        <div key={uid} className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                              {member.displayName?.[0] || member.email?.[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate">{member.displayName || member.email}</div>
                              <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-tighter">{uid === project.ownerId ? 'Owner' : 'Collaborator'}</div>
                            </div>
                          </div>
                          {uid === project.ownerId && <Check size={14} className="text-indigo-500" />}
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
