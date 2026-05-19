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
  updateDoc,
  getDoc,
  setDoc
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
  userProfile: any;
  allUsers: any[];
  conversations: any[];
  theme: string;
  setTheme: (theme: string) => Promise<void>;
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
  const [userProfile, setUserProfile] = useState<any>(null);
  const [theme, setInternalTheme] = useState(() => {
    return localStorage.getItem('ghostlink-theme') || 'dark';
  });

  // Sync user profile and theme
  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    
    // Check and initialize user if not exists
    const initUser = async () => {
      try {
        const snap = await getDoc(userRef);
        const presenceData = {
          status: 'online',
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Anonymous',
            photoURL: user.photoURL || '',
            theme: 'dark',
            createdAt: serverTimestamp(),
            ...presenceData
          });
        } else {
          await updateDoc(userRef, presenceData);
        }
      } catch (e: any) {
        if (!e?.message?.includes('offline')) {
          console.error("User Init Error:", e);
        }
      }
    };
    initUser();

    // Heartbeat to keep status 'online'
    let lastHeartbeat = Date.now();
    const updatePresence = async (status: 'online' | 'offline' = 'online') => {
      if (!user) return;
      // Throttling: don't write more than once every 15s for 'online'
      if (status === 'online' && Date.now() - lastHeartbeat < 15000) return;
      
      try {
        await updateDoc(doc(db, 'users', user.uid), {
          status,
          lastActive: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        lastHeartbeat = Date.now();
      } catch (e) {}
    };

    const heartbeat = setInterval(() => {
      if (document.visibilityState === 'visible') {
        updatePresence('online');
      }
    }, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence('online');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const unsub = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setUserProfile(data);
        if (data.theme) setInternalTheme(data.theme);
      }
    }, (error) => {
      console.error("[Workspace] Profile Listener Error:", error);
    });

    return () => {
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Attempt to mark offline
      updatePresence('offline').catch(() => {});
      unsub();
    };
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    console.log("[Workspace] Applying theme:", theme);
    let resolvedTheme = theme;
    if (theme === 'system') {
      resolvedTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(resolvedTheme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    localStorage.setItem('ghostlink-theme', theme);
  }, [theme]);

  // Fetch all users for discovery
  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(collection(db, 'users'), (snapshot) => {
      const now = Date.now();
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        const lastActive = (data.lastActive as any)?.toMillis?.() || 0;
        // Mark as offline if no activity for 2 minutes OR if explicitly offline
        const isStale = (now - lastActive) > 120000;
        return { 
          id: doc.id, 
          ...data,
          status: (isStale || data.status === 'offline') ? 'offline' : 'online'
        };
      });
      setAllUsers(items);
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
      where('participants', 'array-contains', user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Local sort to avoid composite index requirements
      items.sort((a: any, b: any) => {
        const timeA = a.updatedAt?.toMillis?.() || 0;
        const timeB = b.updatedAt?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setConversations(items);
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

    // Simplified query to avoid complex index requirements in dev environment
    const qLabel = `projects_for_${user.uid}`;
    console.log(`[Workspace] Initializing projects listener: ${qLabel}`);

    const q = query(
      collection(db, 'projects'),
      where('collaborators', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Project[];
      
      // Sort in-memory to bypass composite index requirement for (collaborators + updatedAt)
      items.sort((a, b) => {
        const timeA = (a.updatedAt as any)?.toMillis?.() || 0;
        const timeB = (b.updatedAt as any)?.toMillis?.() || 0;
        return timeB - timeA;
      });

      setProjects(items);
      setIsProjectsLoading(false);
      console.log(`[Workspace] Projects updated: ${items.length} items`);
    }, (error) => {
      console.error("[Workspace] Projects Listener Error:", error);
      // Don't throw here, just log and update state
      setIsProjectsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Real-time Activities Listener
  useEffect(() => {
    if (!user) {
      setActivities([]);
      setIsActivitiesLoading(false);
      return;
    }

    // List activities without complex ordering to avoid index issues
    const q = query(
      collection(db, 'activities'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      }) as Activity[];

      // Sort in-memory
      items.sort((a, b) => {
        const timeA = (a.timestamp as any)?.toMillis?.() || 0;
        const timeB = (b.timestamp as any)?.toMillis?.() || 0;
        return timeB - timeA;
      });

      const processedItems = items.map(item => {
        const ts = item.timestamp as any;
        return {
          ...item,
          time: ts ? `${Math.floor((Date.now() - (ts.toMillis ? ts.toMillis() : Date.now())) / 60000)}m ago` : 'Just now'
        };
      });

      setActivities(processedItems);
      setIsActivitiesLoading(false);
    }, (error) => {
      console.error("[Workspace] Activities Listener Error:", error);
      setIsActivitiesLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addProject = async (project: Omit<Project, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) throw new Error('Not authenticated');
    console.log("[Workspace] Mutation: addProject START", project.title);
    try {
      const projectsRef = collection(db, 'projects');
      const docRef = doc(projectsRef); // Pre-generate ID
      
      const payload = {
        id: docRef.id,
        ...project,
        ownerId: user.uid,
        collaborators: [user.uid],
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      };
      
      await setDoc(docRef, payload);
      console.log("[Workspace] Mutation: addProject SUCCESS", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("[Workspace] Mutation: addProject FAILURE", error);
      handleFirestoreError(error, OperationType.CREATE, 'projects');
      throw error;
    }
  };

  const stats = useMemo<WorkspaceStats>(() => ({
    activeProjects: projects.filter(p => p.status === 'active').length,
    totalActivities: activities.length,
    teamMembers: projects.reduce((acc, p) => acc + (p.collaborators?.length || 0), 0)
  }), [projects, activities.length]);

  const logActivity = async (activity: Omit<Activity, 'id' | 'timestamp' | 'actorId' | 'actorName'>) => {
    if (!user) return;
    try {
      const activitiesRef = collection(db, 'activities');
      const docRef = doc(activitiesRef);
      await setDoc(docRef, {
        id: docRef.id,
        ...activity,
        actorId: user.uid,
        actorName: user.displayName || user.email || 'User',
        timestamp: serverTimestamp()
      });
    } catch (e) {
      console.error("[Workspace] Activity Logging Error:", e);
    }
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

    const newUserDoc = userSnapshot.docs[0];
    const newUser = newUserDoc.data();
    if (project.collaborators.includes(newUserDoc.id)) {
      throw new Error('User is already a collaborator');
    }

    const docRef = doc(db, 'projects', projectId);
    await updateDoc(docRef, {
      collaborators: [...project.collaborators, newUserDoc.id],
      updatedAt: serverTimestamp()
    });

    await logActivity({
      type: 'member_added',
      title: `Added ${newUser.displayName || newUser.email} to ${project.title}`,
      projectId: projectId
    });
  };

  const setTheme = async (newTheme: string) => {
    setInternalTheme(newTheme);
    localStorage.setItem('ghostlink-theme', newTheme);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        theme: newTheme,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Set Theme Error:", error);
    }
  };

  const value = useMemo(() => ({ 
    projects, 
    activities, 
    stats, 
    isLoading, 
    user, 
    userProfile,
    allUsers,
    conversations,
    theme,
    setTheme,
    addProject,
    updateProject,
    deleteProject,
    logActivity,
    addCollaborator
  }), [projects, activities, stats, isLoading, user, userProfile, allUsers, conversations, theme]);

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
