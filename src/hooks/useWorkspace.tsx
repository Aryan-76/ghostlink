import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  addDoc, 
  serverTimestamp, 
  where,
  or,
  getDocs,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Project, Activity, WorkspaceStats } from '../types';
import { useAuthStore } from '../store/authStore';

interface WorkspaceContextType {
  projects: Project[];
  activities: Activity[];
  stats: WorkspaceStats;
  isLoading: boolean;
  user: any;
  allUsers: any[];
  conversations: any[];
  addProject: (project: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  logActivity: (activity: Omit<Activity, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => Promise<void>;
  addCollaborator: (projectId: string, email: string) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuthStore();
  const queryClient = useQueryClient();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState(true);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);

  // Fetch all users for discovery
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      setAllUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // Direct conversations
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    const q = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setConversations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [user]);

  // Real-time Projects Listener
  useEffect(() => {
    if (!user) {
      setProjects([]);
      setIsProjectsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'projects'),
      or(
        where('ownerId', '==', user.uid),
        where('collaborators', 'array-contains', user.uid)
      ),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Project[];
      setProjects(items);
      setIsProjectsLoading(false);
    }, (error) => {
      console.error("Projects Listener Error:", error);
      handleFirestoreError(error, OperationType.LIST, 'projects');
      setIsProjectsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time Activities Listener (Global feed)
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setIsActivitiesLoading(false);
      return;
    }

    const q = query(
      collection(db, 'activities'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        const ts = data.timestamp;
        return {
          id: doc.id,
          ...data,
          time: ts ? `${Math.floor((Date.now() - (ts.toMillis ? ts.toMillis() : Date.now())) / 60000)}m ago` : 'Just now'
        };
      }) as Activity[];
      setActivities(items);
      setIsActivitiesLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'activities');
      setIsActivitiesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const projectMutation = useMutation({
    mutationFn: async (project: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
      if (!user) throw new Error('Not authenticated');
      try {
        const docRef = await addDoc(collection(db, 'projects'), {
          ...project,
          ownerId: user.uid,
          collaborators: [user.uid],
          updatedAt: serverTimestamp(),
          createdAt: serverTimestamp()
        });
        return docRef.id;
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'projects');
        throw error;
      }
    }
  });

  const stats = useMemo<WorkspaceStats>(() => ({
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalActivities: activities.length,
    teamMembers: projects.reduce((acc, p) => acc + (p.collaborators?.length || 0), 0)
  }), [projects, activities.length]);

  const logActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => {
    if (!user) return;
    await addDoc(collection(db, 'activities'), {
      ...activity,
      actorId: user.uid,
      actorName: user.displayName || user.email || 'User',
      timestamp: serverTimestamp()
    });
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const docRef = doc(db, 'projects', id);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    queryClient.invalidateQueries({ queryKey: ['projects', user?.uid] });
  };

  const deleteProject = async (id: string) => {
    await deleteDoc(doc(db, 'projects', id));
    queryClient.invalidateQueries({ queryKey: ['projects', user?.uid] });
  };

  const isLoading = isAuthLoading || isProjectsLoading || isActivitiesLoading;

  const addCollaborator = async (projectId: string, email: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) throw new Error('Project not found');

    // Find user by email
    const userQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
    const userSnapshot = await getDocs(userQuery);
    
    if (userSnapshot.empty) {
      throw new Error('User not found. They must sign up first.');
    }

    const newUser = userSnapshot.docs[0].data();
    if (project.collaborators.includes(newUser.uid)) {
      throw new Error('User is already a collaborator');
    }

    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      collaborators: [...project.collaborators, newUser.uid],
      updatedAt: serverTimestamp()
    });

    await logActivity({
      type: 'member_added',
      title: `Added ${newUser.displayName || newUser.email} to ${project.title}`
    });
  };

  const value = useMemo(() => ({ 
    projects, 
    activities, 
    stats, 
    isLoading, 
    user, 
    allUsers,
    conversations,
    addProject: projectMutation.mutateAsync,
    updateProject,
    deleteProject,
    logActivity,
    addCollaborator
  }), [projects, activities, stats, isLoading, user, allUsers, conversations, projectMutation]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
