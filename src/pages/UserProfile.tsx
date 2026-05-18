import React, { useState, useCallback, useEffect } from 'react';
import { 
  Shield, 
  Zap, 
  Settings, 
  LogOut, 
  Globe, 
  Mail,
  Users,
  User,
  Loader2,
  CheckCircle2,
  Edit2,
  Trash2,
  Circle,
  Layout,
  History,
  Palette,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { useWorkspace } from '../hooks/useWorkspace';
import { signOut, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function UserProfile() {
  const { user, theme: activeTheme, setTheme } = useWorkspace();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.displayName) {
      setDisplayName(user.displayName);
    }
  }, [user]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  }, [navigate]);

  const handleUpdateProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user || !displayName.trim()) return;

    setIsSaving(true);
    try {
      // Update Firebase Auth
      await updateProfile(auth.currentUser!, {
        displayName: displayName.trim()
      });

      // Update Firestore
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: displayName.trim(),
        updatedAt: serverTimestamp()
      });

      toast.success('Identity synchronized across network');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Identity sync failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || isUploading) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image too large. Max 2MB.');
      return;
    }

    const { ref: storageRef, uploadBytes, getDownloadURL } = await import('firebase/storage');
    const { storage } = await import('../lib/firebase');

    setIsUploading(true);
    try {
      const avatarRef = storageRef(storage, `users/${user.uid}/avatar_${Date.now()}`);
      await uploadBytes(avatarRef, file);
      const photoURL = await getDownloadURL(avatarRef);

      await updateProfile(auth.currentUser!, { photoURL });
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL,
        updatedAt: serverTimestamp()
      });

      toast.success('Visual identity updated');
    } catch (error) {
      console.error('Avatar upload error:', error);
      toast.error('Identity visual sync failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAccountPlaceholder = () => {
    setIsDeleting(true);
    setTimeout(() => {
      toast.error("Account deletion requires admin approval in this workspace.");
      setIsDeleting(false);
    }, 1500);
  };

  if (!user) return null;

  const userInitial = displayName ? displayName[0] : (user.email ? user.email[0] : 'U');

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24 h-full overflow-y-auto scrollbar-hidden bg-app-bg text-app-foreground">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-10 border-b border-app-border pb-12">
        <div className="relative group">
          <div className="absolute -inset-1 bg-app-primary/30 rounded-full blur-xl opacity-0 group-hover:opacity-50 transition-opacity" />
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="relative w-32 h-32 rounded-[2.5rem] border border-app-border overflow-hidden bg-app-card flex items-center justify-center shadow-2xl transition-all group-hover:scale-[1.02] cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="w-8 h-8 text-app-primary animate-spin" />
            ) : user.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-app-muted uppercase font-mono">{userInitial}</span>
            )}
            <div className={`absolute bottom-2 right-2 w-5 h-5 ${isUploading ? 'bg-app-primary' : 'bg-emerald-500'} border-4 border-app-card rounded-full shadow-lg`} />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-widest">
              Update Photo
            </div>
          </div>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleAvatarUpload}
          />
        </div>

        <div className="flex-1 text-center md:text-left space-y-4">
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
             <h1 className="text-4xl font-bold text-app-foreground tracking-tighter">{displayName || 'Anonymous Operator'}</h1>
             <span className="bg-app-primary/10 text-app-primary text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-app-primary/20 shadow-sm">Verified Operator</span>
          </div>
          <p className="text-app-muted max-w-md text-sm font-medium leading-relaxed">
            Manage your digital identity and secure workspace preferences across the GhostLink infrastructure.
          </p>
        </div>

        <div className="flex gap-4">
          <button 
            onClick={handleLogout}
            className="px-8 py-3 bg-app-card border border-app-border rounded-2xl text-red-500 hover:bg-red-500/5 transition-all flex items-center gap-3 shadow-sm font-bold text-[10px] uppercase tracking-widest active:scale-95"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Identity Section */}
          <section className="bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-xl">
             <div className="px-8 py-6 border-b border-app-border bg-app-accent/30 flex items-center justify-between">
               <h3 className="text-[10px] font-bold text-app-foreground uppercase tracking-widest">Operator Identity</h3>
               <User size={16} className="text-app-muted" />
             </div>
             <div className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Visible Alias</label>
                      <input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-app-muted-bg border border-app-border rounded-2xl px-5 py-4 text-sm text-app-foreground focus:outline-none focus:ring-2 focus:ring-app-primary/20 transition-all font-bold placeholder:text-app-muted/30"
                        placeholder="Nexus Operator"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest ml-1">Authenticated Email</label>
                      <input 
                        value={user.email || ''}
                        disabled
                        className="w-full bg-app-accent/50 border border-app-border rounded-2xl px-5 py-4 text-sm text-app-muted/50 cursor-not-allowed font-bold"
                      />
                   </div>
                </div>
                <div className="pt-6 border-t border-app-border/50 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <p className="text-[10px] text-app-muted font-bold uppercase tracking-widest opacity-40 max-w-sm">
                    Changes will propagate across all secure workspaces and encrypted signal channels.
                  </p>
                  <button 
                    onClick={() => handleUpdateProfile()}
                    disabled={isSaving || !displayName.trim()}
                    className="w-full sm:w-auto px-10 py-4 bg-app-foreground text-app-bg rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg active:scale-95"
                  >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    Update Identity
                  </button>
                </div>
             </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-app-card border border-app-border rounded-3xl overflow-hidden shadow-xl">
             <div className="px-8 py-6 border-b border-app-border bg-app-accent/30 flex items-center justify-between">
               <h3 className="text-[10px] font-bold text-app-foreground uppercase tracking-widest">Interface Appearance</h3>
               <Palette size={16} className="text-app-muted" />
             </div>
             <div className="p-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { id: 'dark', label: 'Dark Obsidian', desc: 'Default Stealth', icon: <Circle size={18} fill="currentColor" /> },
                    { id: 'light', label: 'Paper White', desc: 'High Contrast', icon: <Globe size={18} /> },
                    { id: 'system', label: 'Auto Sync', desc: 'OS Preference', icon: <Cpu size={18} /> }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setTheme(theme.id);
                        toast.success(`Theme updated to ${theme.label}`);
                      }}
                      className={`p-6 rounded-3xl border-2 transition-all text-left group ${activeTheme === theme.id ? 'bg-app-primary/5 border-app-primary shadow-sm shadow-app-primary/10' : 'bg-app-muted-bg border-app-border hover:border-app-primary/30'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl mb-6 flex items-center justify-center transition-all ${activeTheme === theme.id ? 'bg-app-primary text-white shadow-lg shadow-app-primary/30 rotate-3' : 'bg-app-card text-app-muted'}`}>
                        {theme.icon}
                      </div>
                      <p className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${activeTheme === theme.id ? 'text-app-primary' : 'text-app-foreground'}`}>{theme.label}</p>
                      <p className="text-[10px] text-app-muted font-bold uppercase tracking-tight opacity-50">{theme.desc}</p>
                    </button>
                  ))}
                </div>
             </div>
          </section>
        </div>

        <div className="space-y-12">
          {/* Metadata Section */}
          <section className="bg-app-card border border-app-border rounded-3xl p-8 space-y-10 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-widest opacity-50">Node Metadata</h3>
              <Cpu size={16} className="text-app-muted" />
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between py-1 border-b border-app-border/30">
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-tighter">Availability</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <Circle size={8} fill="currentColor" className="animate-pulse" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/30">
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-tighter">Auth Provider</span>
                <span className="text-[10px] text-app-foreground font-bold uppercase tracking-widest">{user.providerData?.[0]?.providerId || 'password'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-app-border/30">
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-tighter">Established</span>
                <span className="text-[10px] text-app-foreground font-bold">{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <span className="text-[10px] font-bold text-app-muted uppercase tracking-tighter">Access Hash</span>
                <span className="text-[10px] text-app-foreground font-mono bg-app-muted-bg p-3 rounded-xl border border-app-border break-all">{user.uid}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/[0.02] border border-red-500/20 rounded-3xl p-8 space-y-8 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Danger Zone</h3>
              <Shield size={16} className="text-red-500/30" />
            </div>
            <p className="text-[11px] text-app-muted leading-relaxed font-bold uppercase tracking-tight opacity-60">
              Decommissioning your account will purge all encrypted assets and signal history. This is irreversible.
            </p>
            <button 
              onClick={handleDeleteAccountPlaceholder}
              disabled={isDeleting}
              className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Decommission Profile
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
