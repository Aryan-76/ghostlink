import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, 
  Clock, 
  Activity, 
  BarChart3, 
  Users, 
  Plus, 
  ChevronRight,
  FileText,
  MessageSquare,
  CheckCircle2,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import { useWorkspace } from '../hooks/useWorkspace';
import { Project, Activity as ActivityType } from '../types';

const StatCard = React.memo(({ label, value, trend, icon: Icon, delay }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.3 }}
    className="bg-[#101116] border border-white/5 p-6 rounded-xl group hover:border-white/10 transition-all cursor-pointer"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 group-hover:text-indigo-400 transition-colors">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${trend.startsWith('+') ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </motion.div>
));

const ProjectCard = React.memo(({ id, title, status, collaborators, description, delay }: any) => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => navigate(`/project/${id}`)}
      className="bg-[#101116] border border-white/5 p-5 rounded-xl hover:border-white/10 hover:bg-white/[0.02] transition-all cursor-pointer flex flex-col h-full group"
    >
      <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-3">
        <h4 className="text-sm font-semibold text-zinc-100 tracking-tight line-clamp-1 group-hover:text-indigo-400 transition-colors">{title}</h4>
        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
          status === 'active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-800 text-zinc-500 border-white/5'
        }`}>
          {status}
        </span>
      </div>
      
      <p className="text-[11px] text-zinc-500 mb-6 line-clamp-3 leading-relaxed flex-grow">{description || 'No description available.'}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4">
        <div className="flex -space-x-1.5">
          {(collaborators || []).slice(0, 4).map((m: string, i: number) => (
            <div key={i} className="w-6 h-6 rounded bg-zinc-800 border border-[#101116] flex items-center justify-center text-[8px] text-zinc-500 font-bold uppercase overflow-hidden">
              U
            </div>
          ))}
          {collaborators && collaborators.length > 4 && (
            <div className="w-6 h-6 rounded bg-zinc-900 border border-[#101116] flex items-center justify-center text-[8px] text-zinc-600 font-bold">
              +{collaborators.length - 4}
            </div>
          )}
        </div>
        <ChevronRight size={14} className="text-zinc-700 group-hover:text-white transition-colors" />
      </div>
    </motion.div>
  );
});

const ActivityItem = React.memo(({ title, time, type }: { title: string; time?: string; type: ActivityType['type'] }) => (
  <motion.div 
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    className="flex items-center gap-4 group cursor-pointer p-2 rounded-lg hover:bg-white/[0.03] transition-all"
  >
    <div className={`w-8 h-8 rounded bg-[#101116] border border-white/5 flex items-center justify-center flex-shrink-0 text-indigo-400`}>
      <Activity size={14} />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-medium text-zinc-300 group-hover:text-white transition-colors truncate">{title}</p>
      <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-tight">{time || 'Just now'}</p>
    </div>
  </motion.div>
));

export default function MainWorkspace() {
  const { projects, activities, stats, isLoading, addProject, logActivity, user, allUsers } = useWorkspace();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.title.trim() || isCreating) return;
    if (!user) {
      toast.error('You must be signed in to create a project');
      return;
    }

    setIsCreating(true);
    try {
      console.log("[MainWorkspace] Initializing project creation:", newProject.title);
      
      const projectId = await addProject({
        title: newProject.title,
        description: newProject.description,
        status: 'active',
        collaborators: [user.uid]
      });
      
      console.log("[MainWorkspace] Project created with ID:", projectId);

      // Close modal and reset form IMMEDIATELY after success
      setIsModalOpen(false);
      const createdTitle = newProject.title;
      setNewProject({ title: '', description: '' });

      await logActivity({
        type: 'project_created',
        title: `Project "${createdTitle}" initialized`
      });

      toast.success('Project created successfully');
      
      // Navigate after state has settled
      navigate(`/project/${projectId}`);
    } catch (error: any) {
      console.error("[MainWorkspace] Create Project Error:", error);
      const errorMessage = error?.message?.includes('permission-denied') 
        ? 'Permission denied. Check your Firestore rules.'
        : 'Failed to create project. Please try again.';
      toast.error(errorMessage);
    } finally {
      // Ensure loading state is ALWAYS cleaned up
      setIsCreating(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-[#020306]">
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
          <Loader2 size={24} className="text-indigo-400 animate-spin" />
        </div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">GhostLink Syncing...</span>
      </motion.div>
    </div>
  );

  return (
    <div className="p-8 space-y-12 overflow-y-auto h-full scrollbar-hidden">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em] mb-1">GhostLink Workspace</h2>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Projects
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="bg-[#101116] border border-white/5 px-4 py-2 rounded-lg text-[10px] font-bold text-zinc-500 hover:text-white hover:border-white/10 transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <MessageSquare size={14} /> Messages
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-indigo-500/10"
          >
            <Plus size={14} /> New Project
          </button>
        </div>
      </motion.div>

      {/* Create Project Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0A0B0E] border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-white tracking-tight uppercase tracking-wider">New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Project Title</label>
                  <input 
                    autoFocus
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Website Redesign"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What are we working on?"
                    className="w-full h-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-700 focus:outline-none focus:border-indigo-500 transition-all resize-none font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isCreating || !newProject.title.trim()}
                  className="w-full py-4 bg-white text-black rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                >
                  {isCreating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {isCreating ? 'Creating Workspace...' : 'Create Project'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-8 flex flex-col gap-10">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard label="Active Projects" value={stats.activeProjects} icon={BarChart3} delay={0.1} />
            <StatCard label="Live Activities" value={activities.length} icon={Activity} delay={0.2} trend="+12%" />
            <StatCard label="Network Members" value={allUsers.length} icon={Users} delay={0.3} />
          </div>

          {/* Community Hub CTA */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <MessageSquare size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white tracking-tight">Community Hub is Live</h3>
                <p className="text-zinc-400 text-sm max-w-sm">Join the global conversation. Chat with other builders, share feedback, and stay updated.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/community')}
              className="px-8 py-3 bg-white text-black rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all shadow-xl"
            >
              Enter Hub
            </button>
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Active Projects</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {projects.length > 0 ? (
                projects.map((project, i) => (
                  <ProjectCard key={project.id} {...project} delay={0.4 + i * 0.1} />
                ))
              ) : (
                <div className="sm:col-span-2 border border-dashed border-white/5 bg-white/[0.01] rounded-xl p-12 text-center">
                   <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">No Projects Found</p>
                   <p className="text-xs text-zinc-500 max-w-xs mx-auto mb-6">Create your first project to start collaborating with your team.</p>
                   <button 
                     onClick={() => setIsModalOpen(true)}
                     className="px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500/20 transition-all"
                   >
                     Create Project
                   </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="md:col-span-4 space-y-6 bg-[#101116] border border-white/5 rounded-2xl p-6">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Recent Activity</h3>
            <Activity size={14} className="text-zinc-700" />
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} {...activity} />
              ))
            ) : (
              <p className="text-[10px] text-zinc-600 text-center py-8 italic uppercase tracking-widest">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
