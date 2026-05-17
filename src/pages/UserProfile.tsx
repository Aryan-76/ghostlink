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
import { signOut, updateProfile } from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function UserProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTheme, setActiveTheme] = useState('dark');
  const [isDeleting, setIsDeleting] = useState(false);

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

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
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
    <div className="p-8 max-w-6xl mx-auto space-y-12 pb-24 h-full overflow-y-auto scrollbar-hidden">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/5 pb-10">
        <div className="relative group">
          <div className="absolute -inset-1 bg-indigo-500/20 rounded-full blur opacity-50" />
          <div className="relative w-28 h-28 rounded-full border-2 border-white/10 overflow-hidden bg-zinc-900 flex items-center justify-center">
            <span className="text-3xl font-bold text-zinc-600 uppercase">{userInitial}</span>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-zinc-900 rounded-full" />
          </div>
        </div>

        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
             <h1 className="text-3xl font-bold text-white tracking-tight">{displayName || 'Anonymous User'}</h1>
             <span className="bg-indigo-500/10 text-indigo-400 text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-indigo-500/20 self-center">Workspace Member</span>
          </div>
          <p className="text-zinc-500 max-w-md text-sm">
            Control your profile identity and workspace preferences.
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleLogout}
            className="bg-white/5 border border-white/10 px-6 py-3 rounded-xl text-red-500/80 hover:bg-red-500/10 hover:text-red-500 transition-all flex items-center gap-2"
          >
            <LogOut size={18} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
          </button>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {/* Identity Section */}
          <section className="bg-[#0A0B0E] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
             <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
               <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Profile Identity</h3>
               <User size={14} className="text-zinc-700" />
             </div>
             <div className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Display Name</label>
                      <input 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-all font-medium"
                        placeholder="e.g. John Doe"
                      />
                   </div>
                   <div className="space-y-3">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Primary Email</label>
                      <input 
                        value={user.email || ''}
                        disabled
                        className="w-full bg-white/[0.01] border border-white/5 rounded-xl px-4 py-3 text-sm text-zinc-600 cursor-not-allowed font-medium"
                      />
                   </div>
                </div>
                <div className="pt-4 flex items-center justify-between">
                  <p className="text-[10px] text-zinc-600 font-medium max-w-sm">
                    Changes will be synchronized across all your active projects and team channels.
                  </p>
                  <button 
                    onClick={() => handleUpdateProfile()}
                    disabled={isSaving || !displayName.trim()}
                    className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all disabled:opacity-50 flex items-center gap-3"
                  >
                    {isSaving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                    Sync Profile
                  </button>
                </div>
             </div>
          </section>

          {/* Preferences Section */}
          <section className="bg-[#0A0B0E] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
             <div className="px-8 py-5 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
               <h3 className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">Appearance</h3>
               <Palette size={14} className="text-zinc-700" />
             </div>
             <div className="p-8 space-y-8">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {[
                      { id: 'dark', label: 'Ghostly', desc: 'Default Obsidian' },
                      { id: 'light', label: 'Ethereal', desc: 'Paper Minimal' },
                      { id: 'system', label: 'Automata', desc: 'System Sync' }
                    ].map(theme => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          setActiveTheme(theme.id);
                          toast.success(`Theme updated to ${theme.label}`);
                        }}
                        className={`p-5 rounded-2xl border transition-all text-left ${activeTheme === theme.id ? 'bg-indigo-600/5 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl mb-4 flex items-center justify-center ${activeTheme === theme.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-zinc-900 text-zinc-600'}`}>
                          {theme.id === 'dark' ? <Circle size={18} fill="currentColor" /> : <Globe size={18} />}
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${activeTheme === theme.id ? 'text-indigo-400' : 'text-white'}`}>{theme.label}</p>
                        <p className="text-[10px] text-zinc-600 font-medium">{theme.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
             </div>
          </section>
        </div>

        <div className="space-y-10">
          {/* Metadata Section */}
          <section className="bg-[#0A0B0E] border border-white/5 rounded-2xl p-8 space-y-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Deployment Node</h3>
              <Cpu size={14} className="text-zinc-700" />
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-700 uppercase">Status</span>
                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                  <Circle size={8} fill="currentColor" /> Synchronized
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-700 uppercase">Provider</span>
                <span className="text-[10px] text-zinc-400 font-bold uppercase">{user.providerData?.[0]?.providerId || 'password'}</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-white/5">
                <span className="text-[10px] font-bold text-zinc-700 uppercase">Joined</span>
                <span className="text-[10px] text-zinc-400 font-medium">{user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] font-bold text-zinc-700 uppercase">Access Token</span>
                <span className="text-[9px] text-zinc-800 font-mono tracking-tighter truncate max-w-[120px]">{user.uid}</span>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="bg-red-500/[0.01] border border-red-500/10 rounded-2xl p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold text-red-500/60 uppercase tracking-widest">Self-Destruct</h3>
              <Shield size={14} className="text-red-500/20" />
            </div>
            <p className="text-[10px] text-zinc-600 leading-relaxed font-medium">
              Decommissioning your account will purge all personal data from the GhostLink workspace. This action is terminal.
            </p>
            <button 
              onClick={handleDeleteAccountPlaceholder}
              disabled={isDeleting}
              className="w-full py-4 border border-red-500/20 text-red-500/60 hover:bg-red-500/10 hover:text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isDeleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              Decommission Account
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
