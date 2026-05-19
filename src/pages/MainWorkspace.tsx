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
  X,
  User
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
    className="bg-app-card border border-app-border p-6 rounded-xl group hover:border-app-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md"
  >
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-lg bg-app-muted-bg border border-app-border flex items-center justify-center text-app-muted group-hover:text-app-primary transition-colors">
        <Icon size={20} />
      </div>
      {trend && (
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${trend.startsWith('+') ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500'}`}>
          {trend}
        </span>
      )}
    </div>
    <p className="text-[10px] font-bold text-app-muted uppercase tracking-widest mb-1">{label}</p>
    <p className="text-2xl font-bold text-app-foreground tracking-tight">{value}</p>
  </motion.div>
));

const ProjectCard = React.memo(({ id, title, status, collaborators, description, delay }: any) => {
  const navigate = useNavigate();
  const { allUsers } = useWorkspace();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={() => navigate(`/project/${id}`)}
      className="bg-app-card border border-app-border p-5 rounded-xl hover:border-app-primary/20 hover:bg-app-accent/50 transition-all cursor-pointer flex flex-col h-full group shadow-sm hover:shadow-md"
    >
      <div className="flex items-center justify-between mb-3 border-b border-app-border pb-3">
        <h4 className="text-sm font-semibold text-app-foreground tracking-tight line-clamp-1 group-hover:text-app-primary transition-colors">{title}</h4>
        <span className={`text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold border ${
          status === 'active' ? 'bg-app-primary/10 text-app-primary border-app-primary/20' : 'bg-app-muted-bg text-app-muted border-app-border'
        }`}>
          {status}
        </span>
      </div>
      
      <p className="text-[11px] text-app-muted mb-6 line-clamp-3 leading-relaxed flex-grow">{description || 'No description available.'}</p>
      
      <div className="flex items-center justify-between mt-auto pt-4">
        <div className="flex -space-x-1.5">
          {(collaborators || []).slice(0, 4).map((uid: string, i: number) => {
            const userProfile = allUsers.find(u => u.id === uid);
            const userInitial = userProfile?.displayName?.[0] || userProfile?.email?.[0] || 'U';
            const isOnline = userProfile?.status === 'online';
            
            return (
              <div key={i} className="relative group/avatar">
                <div className={`w-7 h-7 rounded bg-app-muted-bg border border-app-card flex items-center justify-center text-[9px] text-app-muted font-bold uppercase overflow-hidden shadow-sm transition-colors group-hover/avatar:border-app-primary/30`}>
                  {userProfile?.photoURL ? (
                    <img src={userProfile.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span>{userInitial}</span>
                  )}
                </div>
                {isOnline && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-app-card rounded-full" title="Online" />
                )}
              </div>
            );
          })}
          {collaborators && collaborators.length > 4 && (
            <div className="w-7 h-7 rounded bg-app-muted-bg border border-app-card flex items-center justify-center text-[9px] text-app-muted font-bold shadow-sm">
              +{collaborators.length - 4}
            </div>
          )}
        </div>
        <ChevronRight size={14} className="text-app-muted group-hover:text-app-foreground transition-colors" />
      </div>
    </motion.div>
  );
});

const ActivityItem = React.memo(({ activity }: { activity: ActivityType }) => {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={() => activity.projectId && navigate(`/project/${activity.projectId}`)}
      className={`flex items-center gap-4 group p-2 rounded-lg hover:bg-app-accent transition-all ${activity.projectId ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <div className={`w-8 h-8 rounded bg-app-muted-bg border border-app-border flex items-center justify-center flex-shrink-0 text-app-primary group-hover:bg-app-primary group-hover:text-white transition-all shadow-sm`}>
        <Activity size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-app-foreground group-hover:text-app-primary transition-colors truncate">{activity.title}</p>
        <p className="text-[9px] font-bold text-app-muted uppercase tracking-tight">{activity.time || 'Just now'}</p>
      </div>
    </motion.div>
  );
});

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
    console.log("[MainWorkspace] Mutation: createProject STAT", newProject.title);
    
    // Safety timer to prevent infinite spinner
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Project initialization timed out')), 3000)
    );

    try {
      const createPromise = addProject({
        title: newProject.title,
        description: newProject.description,
        status: 'active',
        collaborators: [user.uid]
      });

      const projectId = await Promise.race([createPromise, timeoutPromise]) as string;
      
      console.log("[MainWorkspace] Mutation: createProject SUCCESS", projectId);

      // 1. Reset input state
      const createdTitle = newProject.title;
      setNewProject({ title: '', description: '' });
      
      // 2. Clear loading & modal state
      setIsCreating(false);
      setIsModalOpen(false);

      // 3. Inform user
      toast.success('Nexus Project initialized');

      // 4. Trace activity (non-blocking)
      logActivity({
        type: 'project_created',
        title: `Project "${createdTitle}" initialized`,
        projectId: projectId
      }).catch(err => console.error("[MainWorkspace] Activity Logging Error:", err));

      // 5. Clean navigation
      setTimeout(() => navigate(`/project/${projectId}`), 150);
    } catch (error: any) {
      console.error("[MainWorkspace] Mutation: createProject FAILURE", error);
      
      let message = error.message === 'Project initialization timed out' 
        ? 'Initialization timed out. Please check your connection.'
        : 'Initialization failed: ' + (error.message?.includes('permission') ? 'Permission denied' : 'Connection failed');
      
      toast.error(message);
      
      // Force cleanup
      setIsCreating(false);
      setIsModalOpen(false);
    }
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center bg-app-bg">
      <motion.div 
        animate={{ opacity: [0.4, 1, 0.4] }} 
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-app-primary/10 border border-app-primary/30 flex items-center justify-center">
          <Loader2 size={24} className="text-app-primary animate-spin" />
        </div>
        <span className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em]">GhostLink Syncing...</span>
      </motion.div>
    </div>
  );

  return (
    <div className="p-8 space-y-12 overflow-y-auto h-full scrollbar-hidden bg-app-bg">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
      >
        <div>
          <h2 className="text-[10px] font-bold text-app-muted uppercase tracking-[0.3em] mb-1">GhostLink Workspace</h2>
          <h1 className="text-3xl font-bold text-app-foreground tracking-tight">
            Projects
          </h1>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => navigate('/messages')}
            className="bg-app-card border border-app-border px-4 py-2 rounded-lg text-[10px] font-bold text-app-muted hover:text-app-foreground hover:border-app-primary/30 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm"
          >
            <MessageSquare size={14} /> Messages
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-app-primary hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-app-primary/20"
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
              className="relative w-full max-w-md bg-app-card border border-app-border rounded-2xl shadow-2xl p-8 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6 border-b border-app-border pb-4">
                <h3 className="text-xl font-bold text-app-foreground tracking-tight uppercase">New Project</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-app-muted hover:text-app-foreground transition-colors">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Project Title</label>
                  <input 
                    autoFocus
                    required
                    value={newProject.title}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Website Redesign"
                    className="w-full bg-app-muted-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-foreground placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-primary/30 transition-all font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Description</label>
                  <textarea 
                    value={newProject.description}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What are we working on?"
                    className="w-full h-32 bg-app-muted-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-foreground placeholder:text-app-muted focus:outline-none focus:ring-1 focus:ring-app-primary/30 transition-all resize-none font-medium"
                  />
                </div>
                <button 
                  type="submit"
                  disabled={isCreating || !newProject.title.trim()}
                  className="w-full py-4 bg-app-primary text-white rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-app-primary/20"
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
            className="bg-app-primary/5 border border-app-primary/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-app-primary/10 blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-app-primary flex items-center justify-center text-white shadow-xl shadow-app-primary/30">
                <MessageSquare size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-app-foreground tracking-tight">Community Hub is Live</h3>
                <p className="text-app-muted text-sm max-w-sm">Join the global conversation. Chat with other builders, share feedback, and stay updated.</p>
              </div>
            </div>
            <button 
              onClick={() => navigate('/community')}
              className="relative z-10 px-8 py-3 bg-app-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-app-primary/20"
            >
              Enter Hub
            </button>
          </motion.div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-[0.2em]">Active Projects</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {projects.length > 0 ? (
                projects.map((project, i) => (
                  <ProjectCard key={project.id} {...project} delay={0.4 + i * 0.1} />
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="sm:col-span-2 border border-dashed border-app-border bg-app-card/30 rounded-[2rem] p-16 text-center shadow-inner"
                >
                   <div className="w-16 h-16 rounded-[1.5rem] bg-app-accent flex items-center justify-center text-app-primary mx-auto mb-6">
                     <Plus size={32} />
                   </div>
                   <h3 className="text-sm font-bold text-app-foreground uppercase tracking-widest mb-2">Neural Workspace Empty</h3>
                   <p className="text-xs text-app-muted max-w-xs mx-auto mb-8 leading-relaxed">No projects have been initialized in your secure sector. Create one to start indexing assets.</p>
                   <button 
                     onClick={() => setIsModalOpen(true)}
                     className="px-8 py-3 bg-app-primary text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-app-primary/20"
                   >
                     Create First Project
                   </button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Activity Feed */}
        <div className="md:col-span-4 space-y-6 bg-app-card border border-app-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold text-app-muted uppercase tracking-widest">Recent Activity</h3>
            <Activity size={14} className="text-app-muted opacity-50" />
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))
            ) : (
              <p className="text-[10px] text-app-muted text-center py-8 italic uppercase tracking-widest">No recent activity</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
