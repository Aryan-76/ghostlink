export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any; // Timestamp
  updatedAt?: any;
  edited?: boolean;
  editedAt?: any;
  replyTo?: {
    messageId: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string[]>; // emoji -> [userIds]
};

export type ProjectStatus = 'active' | 'planned' | 'archived' | 'completed';

export type UserProfile = {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  status?: 'online' | 'offline';
  lastActive?: any;
};

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  ownerId: string;
  collaborators: string[];
  description?: string;
  createdAt: any;
  updatedAt: any;
  lastRead?: Record<string, any>; // userId -> timestamp
};

export type Document = {
  id: string;
  title: string;
  content: string;
  createdBy: string;
  createdAt: any;
  updatedAt: any;
  type?: 'markdown' | 'file';
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
};

export type ActivityType = 'project_created' | 'message_sent' | 'doc_updated' | 'member_added' | 'file_uploaded';

export type Activity = {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  title: string;
  projectId?: string;
  targetId?: string;
  time?: string; // For display
  timestamp: any;
};

export type WorkspaceStats = {
  activeProjects: number;
  totalActivities: number;
  teamMembers: number;
};
