export type Message = {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: any; // Timestamp
};

export type ProjectStatus = 'active' | 'planned' | 'archived' | 'completed';

export type Project = {
  id: string;
  title: string;
  status: ProjectStatus;
  ownerId: string;
  collaborators: string[];
  description?: string;
  createdAt: any;
  updatedAt: any;
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
};

export type ActivityType = 'project_created' | 'message_sent' | 'doc_updated' | 'member_added' | 'file_uploaded';

export type Activity = {
  id: string;
  type: ActivityType;
  actorId: string;
  actorName: string;
  title: string;
  time?: string; // For display
  timestamp: any;
};

export type WorkspaceStats = {
  activeProjects: number;
  totalActivities: number;
  teamMembers: number;
};
