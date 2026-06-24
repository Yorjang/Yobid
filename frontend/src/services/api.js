/**
 * Centralized API service for TaskFlow AI (Yobid)
 * All fetch calls go through here to ensure consistent auth headers & base URL.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/** Get the stored JWT token */
const getToken = () => localStorage.getItem('access_token');

/** Build common headers */
const authHeaders = (extra = {}) => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
  ...extra,
});

/** Generic request helper – throws on non-2xx */
async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers || {}) },
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg =
      (Array.isArray(data?.message) ? data.message[0] : data?.message) ||
      `Request failed (${res.status})`;
    throw new Error(msg);
  }

  return data;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authApi = {
  /** POST /auth/login → { access_token, user } */
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  /** POST /auth/register → user */
  register: (email, password, name) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name: name || undefined }),
    }),

  /** GET /auth/profile → user */
  getProfile: () => request('/auth/profile'),

  /** PATCH /auth/profile → user */
  updateProfile: (payload) =>
    request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  /** OAuth redirect URLs */
  googleAuthUrl: () => `${API_BASE}/auth/google`,
  githubAuthUrl: () => `${API_BASE}/auth/github`,
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const usersApi = {
  /** GET /users */
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/users${qs ? `?${qs}` : ''}`);
  },

  /** GET /users/stats */
  stats: () => request('/users/stats'),

  /** GET /users/:id */
  get: (id) => request(`/users/${id}`),

  /** PATCH /users/:id */
  update: (id, payload) =>
    request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  /** PATCH /users/:id/role */
  changeRole: (id, role) =>
    request(`/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),

  /** DELETE /users/:id */
  deactivate: (id) => request(`/users/${id}`, { method: 'DELETE' }),

  /** PATCH /users/:id/activate */
  activate: (id) => request(`/users/${id}/activate`, { method: 'PATCH' }),
};

// ─── Workspaces ──────────────────────────────────────────────────────────────

export const workspacesApi = {
  /** POST /workspaces */
  create: (payload) =>
    request('/workspaces', { method: 'POST', body: JSON.stringify(payload) }),

  /** GET /workspaces */
  list: () => request('/workspaces'),

  /** GET /workspaces/:id */
  get: (id) => request(`/workspaces/${id}`),

  /** PATCH /workspaces/:id */
  update: (id, payload) =>
    request(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  /** DELETE /workspaces/:id */
  remove: (id) => request(`/workspaces/${id}`, { method: 'DELETE' }),

  /** POST /workspaces/:id/members */
  addMember: (id, userId, role) =>
    request(`/workspaces/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  /** DELETE /workspaces/:id/members/:userId */
  removeMember: (id, userId) =>
    request(`/workspaces/${id}/members/${userId}`, { method: 'DELETE' }),
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const projectsApi = {
  /** POST /projects */
  create: (payload) =>
    request('/projects', { method: 'POST', body: JSON.stringify(payload) }),

  /** GET /projects?workspaceId= */
  list: (workspaceId) => request(`/projects?workspaceId=${workspaceId}`),

  /** GET /projects/:id */
  get: (id) => request(`/projects/${id}`),

  /** GET /projects/:id/stats */
  stats: (id) => request(`/projects/${id}/stats`),

  /** PATCH /projects/:id */
  update: (id, payload) =>
    request(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  /** DELETE /projects/:id */
  remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  /** POST /projects/:id/members */
  addMember: (id, userId, role) =>
    request(`/projects/${id}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  /** DELETE /projects/:id/members/:userId */
  removeMember: (id, userId) =>
    request(`/projects/${id}/members/${userId}`, { method: 'DELETE' }),
};

// ─── Tasks ───────────────────────────────────────────────────────────────────

export const tasksApi = {
  /** POST /tasks */
  create: (payload) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(payload) }),

  /** GET /tasks?projectId=&status=&assigneeId=&priority= */
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
    ).toString();
    return request(`/tasks?${qs}`);
  },

  /** GET /tasks/:id */
  get: (id) => request(`/tasks/${id}`),

  /** PATCH /tasks/:id */
  update: (id, payload) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),

  /** DELETE /tasks/:id */
  remove: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Subtasks
  createSubtask: (taskId, payload) =>
    request(`/tasks/${taskId}/subtasks`, { method: 'POST', body: JSON.stringify(payload) }),
  updateSubtask: (subtaskId, payload) =>
    request(`/tasks/subtasks/${subtaskId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteSubtask: (subtaskId) =>
    request(`/tasks/subtasks/${subtaskId}`, { method: 'DELETE' }),

  // Comments
  createComment: (taskId, content) =>
    request(`/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
  updateComment: (commentId, content) =>
    request(`/tasks/comments/${commentId}`, { method: 'PATCH', body: JSON.stringify({ content }) }),
  deleteComment: (commentId) =>
    request(`/tasks/comments/${commentId}`, { method: 'DELETE' }),
};

// ─── Notifications ───────────────────────────────────────────────────────────

export const notificationsApi = {
  /** GET /notifications */
  list: (onlyUnread = false) =>
    request(`/notifications${onlyUnread ? '?unread=true' : ''}`),

  /** GET /notifications/count */
  countUnread: () => request('/notifications/count'),

  /** PATCH /notifications/read-all */
  markAllRead: () => request('/notifications/read-all', { method: 'PATCH' }),

  /** PATCH /notifications/:id/read */
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),

  /** DELETE /notifications/:id */
  remove: (id) => request(`/notifications/${id}`, { method: 'DELETE' }),

  /** DELETE /notifications/clear-read */
  clearRead: () => request('/notifications/clear-read', { method: 'DELETE' }),
};

// ─── Trash ───────────────────────────────────────────────────────────────────

export const trashApi = {
  /** GET /trash */
  list: () => request('/trash'),

  /** POST /trash/restore/:type/:id */
  restore: (type, id) =>
    request(`/trash/restore/${type}/${id}`, { method: 'POST' }),

  /** DELETE /trash/permanent/:type/:id */
  permanentDelete: (type, id) =>
    request(`/trash/permanent/${type}/${id}`, { method: 'DELETE' }),
};

