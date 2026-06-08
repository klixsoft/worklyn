"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
  status: "online" | "idle" | "offline";
  activity?: string;
  role: string;
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high";
  assigneeId: string;
  dueDate: string;
  tags: string[];
  subtasks: SubTask[];
  comments: Comment[];
}

export interface Column {
  id: string;
  name: string;
  tasks: Task[];
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userIds: string[];
}

export interface Message {
  id: string;
  userId: string;
  userName: string;
  avatar: string;
  text: string;
  timestamp: string;
  reactions?: MessageReaction[];
  attachment?: {
    name: string;
    type: string;
    url: string;
  };
}

export interface Channel {
  id: string;
  name: string;
  type: "text" | "voice";
  assignedMemberIds?: string[];
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
  columns: Column[];
  channels: Channel[];
}

export interface DailyUpdate {
  id: string;
  projectId?: string;
  projectName?: string;
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  today: string;
  blockers: string;
}

export interface AttendanceLog {
  id: string;
  checkIn: string;
  checkOut: string | null;
  date: string;
  duration: number;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: "task" | "chat" | "update";
}

export interface RolePermissions {
  modules: {
    pm: boolean;
    finance: boolean;
    hr: boolean;
  };
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageProjects: boolean;
  canManageTasks: boolean;
  canViewReports: boolean;
  canManageAttendance: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: RolePermissions = {
  modules: { pm: true, finance: false, hr: false },
  canManageUsers: false,
  canManageRoles: false,
  canManageProjects: false,
  canManageTasks: true,
  canViewReports: false,
  canManageAttendance: false,
};

export type SoftwareModule = "pm" | "finance" | "hr";

export interface WorkspaceContextType {
  projects: Project[];
  activeProjectId: string | null;
  activeProject: Project | null;
  teamMembers: User[];
  currentUser: User;
  globalChannels: Channel[];
  directMessages: { [userId: string]: Message[] };
  dailyUpdates: DailyUpdate[];
  attendanceLogs: AttendanceLog[];
  notifications: Notification[];
  activeTab: "dashboard" | "board" | "chat" | "updates" | "attendance" | "notifications";
  activeChannelId: string | null;
  activeChannelType: "global" | "project" | "dm";
  activeVoiceChannelId: string | null;
  isClockedIn: boolean;
  roles: string[];
  activeSoftware: SoftwareModule;
  
  setActiveProjectId: (id: string | null) => void;
  setActiveTab: (tab: WorkspaceContextType["activeTab"]) => void;
  setActiveChannel: (id: string, type: "global" | "project" | "dm") => void;
  setActiveVoiceChannelId: (id: string | null) => void;
  setActiveSoftware: (sw: SoftwareModule) => void;
  
  addProject: (name: string, description: string, icon: string, color: string) => void;
  
  addTask: (projectId: string, columnId: string, taskData: Omit<Task, "id" | "comments" | "subtasks">) => void;
  updateTask: (projectId: string, columnId: string, taskId: string, updatedTask: Partial<Task>) => void;
  deleteTask: (projectId: string, columnId: string, taskId: string) => void;
  moveTask: (projectId: string, sourceColumnId: string, destColumnId: string, taskId: string, destIndex?: number) => void;
  addSubtask: (projectId: string, columnId: string, taskId: string, title: string) => void;
  toggleSubtask: (projectId: string, columnId: string, taskId: string, subtaskId: string) => void;
  addComment: (projectId: string, columnId: string, taskId: string, text: string) => void;
  
  addChannel: (projectId: string, name: string, type: "text" | "voice", assignedMemberIds?: string[]) => void;
  updateChannelMembers: (projectId: string, channelId: string, assignedMemberIds: string[]) => void;
  sendMessage: (text: string, attachment?: { name: string; type: string; url: string }) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  
  addDailyUpdate: (today: string, blockers: string, projectId?: string) => void;
  
  toggleClock: () => void;
  
  markAllNotificationsRead: () => void;
  markNotificationRead: (id: string) => void;
  addTeamMember: (name: string, role: string, avatar: string, status: "online" | "idle" | "offline") => void;
  removeTeamMember: (id: string) => void;
  updateTeamMember: (id: string, data: Partial<Omit<User, "id">>) => void;
  addRole: (name: string) => void;
  removeRole: (name: string) => void;
  rolePermissions: Record<string, RolePermissions>;
  updateRolePermissions: (roleName: string, permissions: RolePermissions) => void;
}

const MOCK_CURRENT_USER: User = {
  id: "user-current",
  name: "Alex Mercer",
  email: "alex@klixsoft.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
  status: "online",
  role: "Lead Developer",
};

const MOCK_TEAM_MEMBERS: User[] = [
  {
    id: "user-1",
    name: "Sarah Connor",
    email: "sarah@klixsoft.com",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    status: "online",
    activity: "Designing UI in Figma",
    role: "Lead UI Designer",
  },
  {
    id: "user-2",
    name: "John Doe",
    email: "john@klixsoft.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
    status: "idle",
    activity: "Writing tests...",
    role: "QA Engineer",
  },
  {
    id: "user-3",
    name: "Jane Smith",
    email: "jane@klixsoft.com",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    status: "online",
    activity: "Coding API endpoints",
    role: "Backend Architect",
  },
  {
    id: "user-4",
    name: "Bruce Banner",
    email: "bruce@klixsoft.com",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80",
    status: "offline",
    role: "Data Scientist",
  },
];

const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-1",
    name: "Phoenix Dashboard",
    icon: "🔥",
    color: "bg-orange-600",
    description: "Next-gen enterprise dashboard client build, using Next.js 16 and Tailwind v4.",
    columns: [
      {
        id: "col-todo",
        name: "To Do",
        tasks: [
          {
            id: "task-1-1",
            title: "Setup Next.js Boilerplate",
            description: "Initialize layout, global CSS, theme styles, and configure shadcn directories.",
            priority: "high",
            assigneeId: "user-current",
            dueDate: "2026-06-12",
            tags: ["Setup", "Next.js"],
            subtasks: [
              { id: "sub-1-1", title: "Create directory structure", completed: true },
              { id: "sub-1-2", title: "Install Radix Primitives", completed: true },
              { id: "sub-1-3", title: "Test build execution", completed: false },
            ],
            comments: [
              {
                id: "comment-1",
                authorId: "user-3",
                authorName: "Jane Smith",
                authorAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
                text: "I set up the backend uv template. Make sure to check the FastAPI endpoints.",
                timestamp: "2026-06-08T14:30:00Z",
              },
            ],
          },
          {
            id: "task-1-2",
            title: "Design System Specs",
            description: "Align color palette with brand logo and establish type hierarchy.",
            priority: "medium",
            assigneeId: "user-1",
            dueDate: "2026-06-15",
            tags: ["Design", "Specs"],
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        id: "col-progress",
        name: "In Progress",
        tasks: [
          {
            id: "task-1-3",
            title: "Discord Sidebar Navigation",
            description: "Implement dual sidebar navigation replicating Discord's desktop interface.",
            priority: "high",
            assigneeId: "user-current",
            dueDate: "2026-06-10",
            tags: ["UI", "Sidebar"],
            subtasks: [
              { id: "sub-1-4", title: "Discord server circular list", completed: true },
              { id: "sub-1-5", title: "Active tooltips on hover", completed: false },
            ],
            comments: [],
          },
        ],
      },
      {
        id: "col-review",
        name: "In Review",
        tasks: [
          {
            id: "task-1-4",
            title: "Daily Standup Feed UI",
            description: "Build stand-up submission forms and team updates log layout.",
            priority: "low",
            assigneeId: "user-2",
            dueDate: "2026-06-08",
            tags: ["UI", "Forms"],
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        id: "col-done",
        name: "Done",
        tasks: [
          {
            id: "task-1-5",
            title: "Initialize Backend Repository",
            description: "Create project structure using python uv and FastAPI.",
            priority: "high",
            assigneeId: "user-3",
            dueDate: "2026-06-07",
            tags: ["Backend", "FastAPI"],
            subtasks: [],
            comments: [],
          },
        ],
      },
    ],
    channels: [
      {
        id: "ch-1-general",
        name: "general",
        type: "text",
        messages: [
          {
            id: "msg-1-1",
            userId: "user-3",
            userName: "Jane Smith",
            avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
            text: "Welcome to the Phoenix Dashboard project workspace! Let's build something epic.",
            timestamp: "2026-06-08T10:15:00Z",
          },
          {
            id: "msg-1-2",
            userId: "user-1",
            userName: "Sarah Connor",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
            text: "Excited to work on the UI designs for this. The Discord styling is going to be so clean.",
            timestamp: "2026-06-08T10:20:00Z",
          },
        ],
      },
      {
        id: "ch-1-dev",
        name: "development",
        type: "text",
        messages: [],
      },
    ],
  },
  {
    id: "proj-2",
    name: "Marketing Launch",
    icon: "🚀",
    color: "bg-indigo-600",
    description: "Launch activities and social campaigns for the summer rollout.",
    columns: [
      {
        id: "col-todo-2",
        name: "To Do",
        tasks: [
          {
            id: "task-2-1",
            title: "Write Press Release",
            description: "Draft the official press release for tech media outlets.",
            priority: "high",
            assigneeId: "user-1",
            dueDate: "2026-06-18",
            tags: ["PR", "Copy"],
            subtasks: [],
            comments: [],
          },
        ],
      },
      {
        id: "col-progress-2",
        name: "In Progress",
        tasks: [],
      },
      {
        id: "col-review-2",
        name: "In Review",
        tasks: [],
      },
      {
        id: "col-done-2",
        name: "Done",
        tasks: [],
      },
    ],
    channels: [
      {
        id: "ch-2-general",
        name: "general",
        type: "text",
        messages: [
          {
            id: "msg-2-1",
            userId: "user-1",
            userName: "Sarah Connor",
            avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
            text: "Hey everyone, this is the communication channel for the launch project.",
            timestamp: "2026-06-08T09:00:00Z",
          },
        ],
      },
    ],
  },
];

const INITIAL_GLOBAL_CHANNELS: Channel[] = [
  {
    id: "gch-announcements",
    name: "announcements",
    type: "text",
    messages: [
      {
        id: "gmsg-1",
        userId: "user-1",
        userName: "Sarah Connor",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        text: "📢 Reminder: Submitting Daily Updates is mandatory for all active sprints! Let's make sure updates are logged before 6 PM daily.",
        timestamp: "2026-06-08T08:00:00Z",
      },
    ],
  },
  {
    id: "gch-random",
    name: "random",
    type: "text",
    messages: [
      {
        id: "gmsg-2",
        userId: "user-2",
        userName: "John Doe",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
        text: "Did anyone see the new release logs? That compiler speedup is incredible.",
        timestamp: "2026-06-08T08:30:00Z",
      },
    ],
  },
];

const INITIAL_DAILY_UPDATES: DailyUpdate[] = [
  {
    id: "up-1",
    projectId: "proj-1",
    projectName: "Phoenix Dashboard",
    userId: "user-3",
    userName: "Jane Smith",
    userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&auto=format&fit=crop&q=80",
    date: "2026-06-08",
    today: "Finishing route authorization. Syncing with Alex on the frontend client connection.",
    blockers: "Waiting on deployment environment details.",
  },
  {
    id: "up-2",
    projectId: "proj-1",
    projectName: "Phoenix Dashboard",
    userId: "user-1",
    userName: "Sarah Connor",
    userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
    date: "2026-06-08",
    today: "Reviewing layout constraints and designing components for the attendance clock module.",
    blockers: "None.",
  },
];

const INITIAL_ATTENDANCE_LOGS: AttendanceLog[] = [
  {
    id: "att-1",
    checkIn: "2026-06-07T09:00:00Z",
    checkOut: "2026-06-07T17:30:00Z",
    date: "2026-06-07",
    duration: 510,
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "not-1",
    title: "New Task Assigned",
    description: "Sarah Connor assigned you 'Setup Next.js Boilerplate'",
    timestamp: "2026-06-08T11:20:00Z",
    read: false,
    type: "task",
  },
  {
    id: "not-2",
    title: "New Message in #general",
    description: "Jane Smith posted: 'Welcome to the Phoenix Dashboard project workspace! ...'",
    timestamp: "2026-06-08T10:15:00Z",
    read: false,
    type: "chat",
  },
];

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

const INITIAL_ROLES: string[] = [
  "Lead Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "UI/UX Designer",
  "QA Engineer",
  "Product Manager",
  "Project Manager",
  "DevOps Engineer",
  "Data Scientist",
  "Business Analyst",
  "Scrum Master",
];

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(INITIAL_PROJECTS[0]?.id || null);
  const [activeTab, setActiveTab] = useState<WorkspaceContextType["activeTab"]>("dashboard");
  const [globalChannels, setGlobalChannels] = useState<Channel[]>(INITIAL_GLOBAL_CHANNELS);
  const [directMessages, setDirectMessages] = useState<{ [userId: string]: Message[] }>({
    "user-1": [
      {
        id: "dm-1-1",
        userId: "user-1",
        userName: "Sarah Connor",
        avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80",
        text: "Hey Alex! Do you have a minute to chat about the dashboard layout variables?",
        timestamp: "2026-06-08T15:00:00Z",
      },
    ],
  });
  const [dailyUpdates, setDailyUpdates] = useState<DailyUpdate[]>(INITIAL_DAILY_UPDATES);
  const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>(INITIAL_ATTENDANCE_LOGS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [activeChannelId, setActiveChannelId] = useState<string | null>("gch-announcements");
  const [activeChannelType, setActiveChannelType] = useState<WorkspaceContextType["activeChannelType"]>("global");
  const [activeVoiceChannelId, setActiveVoiceChannelId] = useState<string | null>(null);
  const [isClockedIn, setIsClockedIn] = useState<boolean>(false);
  const [roles, setRoles] = useState<string[]>(INITIAL_ROLES);
  const [activeSoftware, setActiveSoftware] = useState<SoftwareModule>("pm");
  const [rolePermissions, setRolePermissions] = useState<Record<string, RolePermissions>>({});

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;
  const [teamMembers, setTeamMembers] = useState<User[]>(MOCK_TEAM_MEMBERS);
  const currentUser = MOCK_CURRENT_USER;

  useEffect(() => {
    const savedProjects = localStorage.getItem("pm_projects");
    if (savedProjects) setProjects(JSON.parse(savedProjects));

    const savedActiveProject = localStorage.getItem("pm_active_project_id");
    if (savedActiveProject) setActiveProjectId(savedActiveProject);

    const savedTab = localStorage.getItem("pm_active_tab");
    if (savedTab) setActiveTab(savedTab as any);

    const savedGlobalChannels = localStorage.getItem("pm_global_channels");
    if (savedGlobalChannels) setGlobalChannels(JSON.parse(savedGlobalChannels));

    const savedDirectMessages = localStorage.getItem("pm_direct_messages");
    if (savedDirectMessages) setDirectMessages(JSON.parse(savedDirectMessages));

    const savedDailyUpdates = localStorage.getItem("pm_daily_updates");
    if (savedDailyUpdates) setDailyUpdates(JSON.parse(savedDailyUpdates));

    const savedAttendanceLogs = localStorage.getItem("pm_attendance_logs");
    if (savedAttendanceLogs) setAttendanceLogs(JSON.parse(savedAttendanceLogs));

    const savedNotifications = localStorage.getItem("pm_notifications");
    if (savedNotifications) setNotifications(JSON.parse(savedNotifications));

    const savedActiveChannel = localStorage.getItem("pm_active_channel_id");
    if (savedActiveChannel) setActiveChannelId(savedActiveChannel);

    const savedActiveChannelType = localStorage.getItem("pm_active_channel_type");
    if (savedActiveChannelType) setActiveChannelType(savedActiveChannelType as any);

    const savedIsClockedIn = localStorage.getItem("pm_is_clocked_in");
    if (savedIsClockedIn) setIsClockedIn(JSON.parse(savedIsClockedIn));

    const savedTeamMembers = localStorage.getItem("pm_team_members");
    if (savedTeamMembers) setTeamMembers(JSON.parse(savedTeamMembers));

    const savedRoles = localStorage.getItem("pm_roles");
    if (savedRoles) setRoles(JSON.parse(savedRoles));

    const savedSoftware = localStorage.getItem("pm_active_software");
    if (savedSoftware) setActiveSoftware(savedSoftware as SoftwareModule);

    const savedRolePerms = localStorage.getItem("pm_role_permissions");
    if (savedRolePerms) setRolePermissions(JSON.parse(savedRolePerms));
  }, []);

  useEffect(() => {
    localStorage.setItem("pm_projects", JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    if (activeProjectId) localStorage.setItem("pm_active_project_id", activeProjectId);
  }, [activeProjectId]);

  useEffect(() => {
    localStorage.setItem("pm_active_tab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("pm_global_channels", JSON.stringify(globalChannels));
  }, [globalChannels]);

  useEffect(() => {
    localStorage.setItem("pm_direct_messages", JSON.stringify(directMessages));
  }, [directMessages]);

  useEffect(() => {
    localStorage.setItem("pm_daily_updates", JSON.stringify(dailyUpdates));
  }, [dailyUpdates]);

  useEffect(() => {
    localStorage.setItem("pm_attendance_logs", JSON.stringify(attendanceLogs));
  }, [attendanceLogs]);

  useEffect(() => {
    localStorage.setItem("pm_notifications", JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    if (activeChannelId) localStorage.setItem("pm_active_channel_id", activeChannelId);
  }, [activeChannelId]);

  useEffect(() => {
    localStorage.setItem("pm_active_channel_type", activeChannelType);
  }, [activeChannelType]);

  useEffect(() => {
    localStorage.setItem("pm_is_clocked_in", JSON.stringify(isClockedIn));
  }, [isClockedIn]);

  useEffect(() => {
    localStorage.setItem("pm_team_members", JSON.stringify(teamMembers));
  }, [teamMembers]);

  useEffect(() => {
    localStorage.setItem("pm_roles", JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem("pm_active_software", activeSoftware);
  }, [activeSoftware]);

  useEffect(() => {
    localStorage.setItem("pm_role_permissions", JSON.stringify(rolePermissions));
  }, [rolePermissions]);

  const setActiveChannel = (id: string, type: "global" | "project" | "dm") => {
    setActiveChannelId(id);
    setActiveChannelType(type);
  };

  const addProject = (name: string, description: string, icon: string, color: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      name,
      description,
      icon: icon || "📁",
      color: color || "bg-zinc-600",
      columns: [
        { id: `col-todo-${Date.now()}`, name: "To Do", tasks: [] },
        { id: `col-progress-${Date.now()}`, name: "In Progress", tasks: [] },
        { id: `col-review-${Date.now()}`, name: "In Review", tasks: [] },
        { id: `col-done-${Date.now()}`, name: "Done", tasks: [] },
      ],
      channels: [
        { id: `ch-${Date.now()}-general`, name: "general", type: "text", messages: [] },
        { id: `ch-${Date.now()}-development`, name: "development", type: "text", messages: [] },
      ],
    };
    setProjects((prev) => [...prev, newProj]);
    setActiveProjectId(newProj.id);
    setActiveChannelId(`ch-${Date.now()}-general`);
    setActiveChannelType("project");
  };

  const addTask = (
    projectId: string,
    columnId: string,
    taskData: Omit<Task, "id" | "comments" | "subtasks">
  ) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}`,
      subtasks: [],
      comments: [],
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return { ...col, tasks: [...col.tasks, newTask] };
          }),
        };
      })
    );

    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      title: "New Task Created",
      description: `Task '${newTask.title}' added to column.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "task",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const updateTask = (projectId: string, columnId: string, taskId: string, updatedTask: Partial<Task>) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              tasks: col.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return { ...task, ...updatedTask };
              }),
            };
          }),
        };
      })
    );
  };

  const deleteTask = (projectId: string, columnId: string, taskId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }),
        };
      })
    );
  };

  const moveTask = (
    projectId: string,
    sourceColumnId: string,
    destColumnId: string,
    taskId: string,
    destIndex?: number
  ) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;

        let movedTask: Task | null = null;
        
        const updatedColumns = proj.columns.map((col) => {
          if (col.id === sourceColumnId) {
            movedTask = col.tasks.find((t) => t.id === taskId) || null;
            return { ...col, tasks: col.tasks.filter((t) => t.id !== taskId) };
          }
          return col;
        });

        if (!movedTask) return proj;

        return {
          ...proj,
          columns: updatedColumns.map((col) => {
            if (col.id === destColumnId) {
              const newTasks = [...col.tasks];
              if (destIndex !== undefined) {
                newTasks.splice(destIndex, 0, movedTask!);
              } else {
                newTasks.push(movedTask!);
              }
              return { ...col, tasks: newTasks };
            }
            return col;
          }),
        };
      })
    );
  };

  const addSubtask = (projectId: string, columnId: string, taskId: string, title: string) => {
    const newSub: SubTask = {
      id: `sub-${Date.now()}`,
      title,
      completed: false,
    };
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              tasks: col.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return { ...task, subtasks: [...task.subtasks, newSub] };
              }),
            };
          }),
        };
      })
    );
  };

  const toggleSubtask = (projectId: string, columnId: string, taskId: string, subtaskId: string) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              tasks: col.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return {
                  ...task,
                  subtasks: task.subtasks.map((sub) => {
                    if (sub.id !== subtaskId) return sub;
                    return { ...sub, completed: !sub.completed };
                  }),
                };
              }),
            };
          }),
        };
      })
    );
  };

  const addComment = (projectId: string, columnId: string, taskId: string, text: string) => {
    const newComment: Comment = {
      id: `com-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      text,
      timestamp: new Date().toISOString(),
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          columns: proj.columns.map((col) => {
            if (col.id !== columnId) return col;
            return {
              ...col,
              tasks: col.tasks.map((task) => {
                if (task.id !== taskId) return task;
                return { ...task, comments: [...task.comments, newComment] };
              }),
            };
          }),
        };
      })
    );
  };

  const addChannel = (projectId: string, name: string, type: "text" | "voice", assignedMemberIds?: string[]) => {
    const cleanName = name.trim().toLowerCase().replace(/\s+/g, "-");
    const newChannel: Channel = {
      id: `ch-${Date.now()}-${cleanName}`,
      name: cleanName,
      type,
      assignedMemberIds: assignedMemberIds && assignedMemberIds.length > 0 ? assignedMemberIds : undefined,
      messages: [],
    };

    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          channels: [...proj.channels, newChannel],
        };
      })
    );
  };

  const updateChannelMembers = (projectId: string, channelId: string, assignedMemberIds: string[]) => {
    setProjects((prev) =>
      prev.map((proj) => {
        if (proj.id !== projectId) return proj;
        return {
          ...proj,
          channels: proj.channels.map((ch) => {
            if (ch.id !== channelId) return ch;
            return {
              ...ch,
              assignedMemberIds: assignedMemberIds.length > 0 ? assignedMemberIds : undefined,
            };
          }),
        };
      })
    );
  };

  const sendMessage = (text: string, attachment?: { name: string; type: string; url: string }) => {
    if (!text.trim() && !attachment) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      avatar: currentUser.avatar,
      text,
      timestamp: new Date().toISOString(),
      attachment,
    };

    if (activeChannelType === "global") {
      setGlobalChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== activeChannelId) return ch;
          return { ...ch, messages: [...ch.messages, newMessage] };
        })
      );
      simulateAutoReply(activeChannelId!, "global", text);
    } else if (activeChannelType === "project") {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProjectId) return proj;
          return {
            ...proj,
            channels: proj.channels.map((ch) => {
              if (ch.id !== activeChannelId) return ch;
              return { ...ch, messages: [...ch.messages, newMessage] };
            }),
          };
        })
      );
      simulateAutoReply(activeChannelId!, "project", text);
    } else if (activeChannelType === "dm") {
      setDirectMessages((prev) => {
        const partnerId = activeChannelId!;
        const currentMessages = prev[partnerId] || [];
        return {
          ...prev,
          [partnerId]: [...currentMessages, newMessage],
        };
      });
      simulateAutoReply(activeChannelId!, "dm", text);
    }
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    const updateMsgReactions = (messages: Message[]): Message[] => {
      return messages.map((msg) => {
        if (msg.id !== messageId) return msg;

        const reactions = msg.reactions ? [...msg.reactions] : [];
        const existingReactIdx = reactions.findIndex((r) => r.emoji === emoji);

        if (existingReactIdx > -1) {
          const react = reactions[existingReactIdx];
          const hasReacted = react.userIds.includes(currentUser.id);
          
          if (hasReacted) {
            const newUserIds = react.userIds.filter((uid) => uid !== currentUser.id);
            if (newUserIds.length === 0) {
              reactions.splice(existingReactIdx, 1);
            } else {
              reactions[existingReactIdx] = {
                ...react,
                count: react.count - 1,
                userIds: newUserIds,
              };
            }
          } else {
            reactions[existingReactIdx] = {
              ...react,
              count: react.count + 1,
              userIds: [...react.userIds, currentUser.id],
            };
          }
        } else {
          reactions.push({
            emoji,
            count: 1,
            userIds: [currentUser.id],
          });
        }

        return { ...msg, reactions };
      });
    };

    if (activeChannelType === "global") {
      setGlobalChannels((prev) =>
        prev.map((ch) => {
          if (ch.id !== activeChannelId) return ch;
          return { ...ch, messages: updateMsgReactions(ch.messages) };
        })
      );
    } else if (activeChannelType === "project") {
      setProjects((prev) =>
        prev.map((proj) => {
          if (proj.id !== activeProjectId) return proj;
          return {
            ...proj,
            channels: proj.channels.map((ch) => {
              if (ch.id !== activeChannelId) return ch;
              return { ...ch, messages: updateMsgReactions(ch.messages) };
            }),
          };
        })
      );
    } else if (activeChannelType === "dm") {
      setDirectMessages((prev) => {
        const partnerId = activeChannelId!;
        const currentMessages = prev[partnerId] || [];
        return {
          ...prev,
          [partnerId]: updateMsgReactions(currentMessages),
        };
      });
    }
  };

  const simulateAutoReply = (channelOrUserId: string, type: "global" | "project" | "dm", userText: string) => {
    const activeMembers = teamMembers.filter((m) => m.status === "online" || m.status === "idle");
    if (activeMembers.length === 0) return;
    const randomMember = activeMembers[Math.floor(Math.random() * activeMembers.length)];

    const botMessages = [
      "Interesting perspective, let me look into this further.",
      "Got it! I will update my local branch and review.",
      "Awesome work! Let's sync on the design parameters during the daily standard meeting.",
      "Could you create a quick task in our backlog for this?",
      "That sounds like a plan. Let's make sure it satisfies our Tailwind v4 guidelines.",
      "Understood. I am on it!",
    ];
    const replyText = `Hey Alex, ${botMessages[Math.floor(Math.random() * botMessages.length)]}`;

    setTimeout(() => {
      const replyMessage: Message = {
        id: `msg-reply-${Date.now()}`,
        userId: type === "dm" ? channelOrUserId : randomMember.id,
        userName: type === "dm" ? (teamMembers.find(t => t.id === channelOrUserId)?.name || "Sarah Connor") : randomMember.name,
        avatar: type === "dm" ? (teamMembers.find(t => t.id === channelOrUserId)?.avatar || randomMember.avatar) : randomMember.avatar,
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      if (type === "global") {
        setGlobalChannels((prev) =>
          prev.map((ch) => {
            if (ch.id !== channelOrUserId) return ch;
            return { ...ch, messages: [...ch.messages, replyMessage] };
          })
        );
      } else if (type === "project") {
        setProjects((prev) =>
          prev.map((proj) => {
            if (proj.id !== activeProjectId) return proj;
            return {
              ...proj,
              channels: proj.channels.map((ch) => {
                if (ch.id !== channelOrUserId) return ch;
                return { ...ch, messages: [...ch.messages, replyMessage] };
              }),
            };
          })
        );
      } else if (type === "dm") {
        setDirectMessages((prev) => {
          const currentMessages = prev[channelOrUserId] || [];
          return {
            ...prev,
            [channelOrUserId]: [...currentMessages, replyMessage],
          };
        });
      }

      const newNotif: Notification = {
        id: `not-${Date.now()}`,
        title: `Message from ${replyMessage.userName}`,
        description: replyMessage.text,
        timestamp: new Date().toISOString(),
        read: false,
        type: "chat",
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }, 2000);
  };

  const addDailyUpdate = (today: string, blockers: string, projectId?: string) => {
    const activeProjObj = projects.find((p) => p.id === projectId);
    
    const newUpdate: DailyUpdate = {
      id: `up-${Date.now()}`,
      projectId,
      projectName: activeProjObj?.name,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      date: new Date().toISOString().split("T")[0],
      today,
      blockers: blockers || "None.",
    };

    setDailyUpdates((prev) => [newUpdate, ...prev]);
    
    const newNotif: Notification = {
      id: `not-${Date.now()}`,
      title: "Daily Update Submitted",
      description: `${currentUser.name} posted daily stand-up report.`,
      timestamp: new Date().toISOString(),
      read: false,
      type: "update",
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const toggleClock = () => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (!isClockedIn) {
      const newLog: AttendanceLog = {
        id: `att-${Date.now()}`,
        checkIn: now.toISOString(),
        checkOut: null,
        date: todayStr,
        duration: 0,
      };
      setAttendanceLogs((prev) => [newLog, ...prev]);
      setIsClockedIn(true);
    } else {
      setAttendanceLogs((prev) => {
        const logs = [...prev];
        const activeLogIdx = logs.findIndex((l) => l.checkOut === null);
        if (activeLogIdx > -1) {
          const log = logs[activeLogIdx];
          const checkInDate = new Date(log.checkIn);
          const durationMin = Math.round((now.getTime() - checkInDate.getTime()) / (1000 * 60));
          
          logs[activeLogIdx] = {
            ...log,
            checkOut: now.toISOString(),
            duration: durationMin,
          };
        }
        return logs;
      });
      setIsClockedIn(false);
    }
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const addTeamMember = (name: string, role: string, avatar: string, status: "online" | "idle" | "offline") => {
    const newMember: User = {
      id: `usr-${Date.now()}`,
      name,
      email: `${name.toLowerCase().replace(/\s+/g, ".")}@klixsoft.com`,
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80",
      status: status || "online",
      role,
    };
    setTeamMembers((prev) => [...prev, newMember]);
  };

  const removeTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const updateTeamMember = (id: string, data: Partial<Omit<User, "id">>) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
  };

  const addRole = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || roles.includes(trimmed)) return;
    setRoles((prev) => [...prev, trimmed]);
  };

  const removeRole = (name: string) => {
    setRoles((prev) => prev.filter((r) => r !== name));
  };

  const updateRolePermissions = (roleName: string, permissions: RolePermissions) => {
    setRolePermissions((prev) => ({ ...prev, [roleName]: permissions }));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceContext.Provider
        value={{
          projects,
          activeProjectId,
          activeProject,
          teamMembers,
          currentUser,
          globalChannels,
          directMessages,
          dailyUpdates,
          attendanceLogs,
          notifications,
          activeTab,
          activeChannelId,
          activeChannelType,
          activeVoiceChannelId,
          isClockedIn,
          roles,
          activeSoftware,
          
          setActiveProjectId,
          setActiveTab,
          setActiveChannel,
          setActiveVoiceChannelId,
          setActiveSoftware,
          
          addProject,
          addTask,
          updateTask,
          deleteTask,
          moveTask,
          addSubtask,
          toggleSubtask,
          addComment,
          
          addChannel,
          updateChannelMembers,
          sendMessage,
          reactToMessage,
          
          addDailyUpdate,
          toggleClock,
          
          markAllNotificationsRead,
          markNotificationRead,
          addTeamMember,
          removeTeamMember,
          updateTeamMember,
          addRole,
          removeRole,
          rolePermissions,
          updateRolePermissions,
        }}
      >
        {children}
      </WorkspaceContext.Provider>
    </QueryClientProvider>
  );
};

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
