import axios from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const url: string = (err.config?.url as string) || '';
      const isAuthEndpoint = url.includes('/api/auth/') || url.includes('/api/invitations/');
      if (!isAuthEndpoint) {
        const path = window.location.pathname;
        if (!path.includes('/login') && !path.includes('/register') && !path.includes('/invite')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: {
    email: string; password: string; firstName: string;
    lastName: string; phone?: string; companyName: string;
  }) => api.post('/api/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/api/auth/login', { email, password }),
  logout: () => api.post('/api/auth/logout'),
  me: () => api.get('/api/auth/me'),
  verifyEmail: (token: string) => api.get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  validateResetToken: (token: string) =>
    api.get(`/api/auth/validate-reset-token?token=${encodeURIComponent(token)}`),
  resetPassword: (token: string, password: string) =>
    api.post('/api/auth/reset-password', { token, password }),
};

// ── Invitations ───────────────────────────────────────────────────────────────
export const invitationsApi = {
  invite: (companyId: string, email: string, role: 'CO_OWNER' | 'MANAGER' | 'DEVELOPER') =>
    api.post(`/api/invitations?companyId=${companyId}`, { email, role }),
  validate: (token: string) =>
    api.get(`/api/invitations/validate?token=${encodeURIComponent(token)}`),
  accept: (data: { token: string; firstName: string; lastName: string; password: string }) =>
    api.post('/api/invitations/accept', data),
  listByCompany: (companyId: string) =>
    api.get(`/api/invitations?companyId=${companyId}`),
  cancel: (id: string) =>
    api.delete(`/api/invitations/${id}`),
};

// ── Team ──────────────────────────────────────────────────────────────────────
export const teamApi = {
  getTeam: (companyId: string) =>
    api.get(`/api/team?companyId=${companyId}`),
  deactivate: (companyId: string, userId: string) =>
    api.patch(`/api/team/${userId}/deactivate?companyId=${companyId}`),
  activate: (companyId: string, userId: string) =>
    api.patch(`/api/team/${userId}/activate?companyId=${companyId}`),
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const profileApi = {
  get: () => api.get('/api/profile'),
  update: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    api.patch('/api/profile', data),
  updateCompany: (companyId: string, name: string) =>
    api.patch(`/api/profile/company/${companyId}`, { name }),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/api/profile/change-password', { currentPassword, newPassword }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminApi = {
  getUsers: (page = 0, size = 20) => api.get(`/api/admin/users?page=${page}&size=${size}`),
  getCompanies: () => api.get('/api/admin/companies'),
  blockUser: (id: string) => api.patch(`/api/admin/users/${id}/block`),
  unblockUser: (id: string) => api.patch(`/api/admin/users/${id}/unblock`),
  updateUser: (id: string, data: { firstName?: string; lastName?: string; email?: string }) =>
    api.patch(`/api/admin/users/${id}`, data),
};

// ── Contact & Wallets ─────────────────────────────────────────────────────────
export const contactApi = {
  send: (name: string, email: string, phone: string, message: string) =>
    api.post('/api/contact', { name, email, phone, message }),
};

export const walletsApi = {
  get: () => api.get('/api/wallets'),
};

export const plansApi = {
  getPlans: () => api.get('/api/plans'),
  getSubscription: (companyId: string) => api.get(`/api/plans/subscription?companyId=${companyId}`),
};

// ── Companies ─────────────────────────────────────────────────────────────────
export const companiesApi = {
  getStatuses: (id: string) => api.get(`/api/companies/${id}/statuses`),
  updateStatuses: (id: string, statuses: string[]) => api.patch(`/api/companies/${id}/statuses`, { statuses }),
};

// ── Sprints (Boards) ──────────────────────────────────────────────────────────
export const sprintsApi = {
  list: (companyId: string) => api.get(`/api/sprints?companyId=${companyId}`),
  create: (companyId: string, data: { name: string; goal?: string; startDate?: string; endDate?: string }) =>
    api.post(`/api/sprints?companyId=${companyId}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/api/sprints/${id}/status`, { status }),
  updateColumns: (id: string, columns: string[]) => api.patch(`/api/sprints/${id}/columns`, { columns }),
  delete: (id: string) => api.delete(`/api/sprints/${id}`),
};

// ── Tickets ───────────────────────────────────────────────────────────────────
export const ticketsApi = {
  list: (companyId: string, sprintId?: string, backlog?: boolean) => {
    const params = new URLSearchParams({ companyId });
    if (sprintId) params.append('sprintId', sprintId);
    if (backlog) params.append('backlog', 'true');
    return api.get(`/api/tickets?${params}`);
  },
  get: (id: string) => api.get(`/api/tickets/${id}`),
  create: (companyId: string, data: TicketPayload) =>
    api.post(`/api/tickets?companyId=${companyId}`, data),
  update: (id: string, data: TicketPayload) => api.put(`/api/tickets/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/api/tickets/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/tickets/${id}`),
  addComment: (id: string, body: string) => api.post(`/api/tickets/${id}/comments`, { body }),
  deleteComment: (commentId: string) => api.delete(`/api/tickets/comments/${commentId}`),
  addAttachment: (id: string, data: { fileName: string; fileUrl: string; fileSize?: number; mimeType?: string }) =>
    api.post(`/api/tickets/${id}/attachments`, data),
  deleteAttachment: (attachmentId: string) => api.delete(`/api/tickets/attachments/${attachmentId}`),
  getHistory: (id: string) => api.get(`/api/tickets/${id}/history`),
};

// ── File upload ────────────────────────────────────────────────────────────────
export const filesApi = {
  upload: async (file: File, onProgress?: (pct: number) => void): Promise<{ url: string; fileName: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await api.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (e) => {
        const pct = e.total ? Math.round((e.loaded * 100) / e.total) : 0;
        onProgress(pct);
      } : undefined,
    });
    return res.data;
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  systemRole: 'ADMIN' | 'USER';
  active: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface Membership {
  companyId: string;
  companyName: string;
  role: 'OWNER' | 'CO_OWNER' | 'MANAGER' | 'DEVELOPER';
}

// ── Tracker ticket types ────────────────────────────────────────────────────────────────
export type TicketStatus = string;
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketType = 'TASK' | 'BUG' | 'STORY' | 'EPIC' | 'SUBTASK';
export type SprintStatus = 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';

export interface UserSummary {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
}

export interface TicketComment {
  id: string;
  author: UserSummary;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  mimeType?: string;
}

export interface SprintSummary {
  id: string;
  name: string;
  status: SprintStatus;
}

export interface Ticket {
  id: string;
  ticketKey: string;
  title: string;
  description?: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  points?: number;
  reporter?: UserSummary;
  assignee?: UserSummary;
  sprint?: SprintSummary;
  comments: TicketComment[];
  attachments: TicketAttachment[];
  tags: string[];
  inProgressAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Sprint {
  id: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  columns: string[];
}

export interface TicketPayload {
  title: string;
  description?: string;
  type?: string;
  priority?: string;
  status?: string;
  points?: number;
  assigneeId?: string | null;
  sprintId?: string | null;
  tags?: string[];
}

export interface TicketHistoryEntry {
  id: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  action: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  createdAt: string;
}
