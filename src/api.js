const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080/api/v1";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function request(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    if (response.status === 401) {
      localStorage.removeItem("vira.session");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("vira:unauthorized"));
      }
    }
    const defaultMessage =
      response.status === 401
        ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
        : "Không thể kết nối tới máy chủ.";
    throw new ApiError(
      payload?.message ?? defaultMessage,
      response.status,
    );
  }

  return payload.data;
}

export async function upload(path, token, file) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success)
    throw new ApiError(
      payload?.message ?? "Không thể tải tệp lên.",
      response.status,
    );
  return payload.data;
}

export async function download(path, token) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      payload?.message ?? "Không thể tải tệp xuống.",
      response.status,
    );
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const filename =
    /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/
      .exec(disposition)?.[1]
      ?.replace(/^['"]|['"]$/g, "") ?? "tep-dinh-kem";
  return { blob: await response.blob(), filename };
}

export const authApi = {
  login: (credentials) =>
    request("/auth/login", { method: "POST", body: credentials }),
  register: (profile) =>
    request("/auth/register", { method: "POST", body: profile }),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (token, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: { token, newPassword },
    }),
};

export const viraApi = {
  profile: (token) => request("/users/me", { token }),
  updateProfile: (token, profile) =>
    request("/users/me", { method: "PUT", token, body: profile }),
  changePassword: (token, password) =>
    request("/users/me/password", { method: "PUT", token, body: password }),
  workspaces: (token) => request("/workspaces", { token }),
  archivedWorkspaces: (token) => request("/workspaces/archived", { token }),
  createWorkspace: (token, workspace) =>
    request("/workspaces", { method: "POST", token, body: workspace }),
  projects: (token, workspaceId) =>
    request(`/workspaces/${workspaceId}/projects`, { token }),
  archivedProjects: (token, workspaceId) =>
    request(`/workspaces/${workspaceId}/projects/archived`, { token }),
  createProject: (token, workspaceId, project) =>
    request(`/workspaces/${workspaceId}/projects`, {
      method: "POST",
      token,
      body: project,
    }),
  archiveWorkspace: (token, workspaceId) =>
    request(`/workspaces/${workspaceId}/archive`, { method: "PATCH", token }),
  restoreWorkspace: (token, workspaceId) =>
    request(`/workspaces/${workspaceId}/restore`, { method: "PATCH", token }),
  updateProject: (token, projectId, project) =>
    request(`/projects/${projectId}`, { method: "PUT", token, body: project }),
  archiveProject: (token, projectId) =>
    request(`/projects/${projectId}/archive`, { method: "PATCH", token }),
  restoreProject: (token, projectId) =>
    request(`/projects/${projectId}/restore`, { method: "PATCH", token }),
  tasks: (token, projectId) =>
    request(`/projects/${projectId}/tasks`, { token }),
  deletedTasks: (token, projectId) =>
    request(`/projects/${projectId}/tasks/deleted`, { token }),
  restoreTask: (token, projectId, taskId, version) =>
    request(
      `/projects/${projectId}/tasks/${taskId}/restore?version=${version}`,
      {
        method: "PATCH",
        token,
      },
    ),
  searchTasks: (token, projectId, filters) => {
    const query = new URLSearchParams(
      Object.entries(filters).filter(
        ([, value]) => value !== "" && value != null,
      ),
    );
    return request(`/projects/${projectId}/tasks/search?${query}`, { token });
  },
  savedTaskFilters: (token, projectId) =>
    request(`/projects/${projectId}/tasks/filters`, { token }),
  saveTaskFilter: (token, projectId, filter) =>
    request(`/projects/${projectId}/tasks/filters`, {
      method: "POST",
      token,
      body: filter,
    }),
  deleteTaskFilter: (token, projectId, filterId) =>
    request(`/projects/${projectId}/tasks/filters/${filterId}`, {
      method: "DELETE",
      token,
    }),
  labels: (token, projectId) =>
    request(`/projects/${projectId}/labels`, { token }),
  createLabel: (token, projectId, label) =>
    request(`/projects/${projectId}/labels`, {
      method: "POST",
      token,
      body: label,
    }),
  updateLabel: (token, projectId, labelId, label) =>
    request(`/projects/${projectId}/labels/${labelId}`, {
      method: "PUT",
      token,
      body: label,
    }),
  deleteLabel: (token, projectId, labelId) =>
    request(`/projects/${projectId}/labels/${labelId}`, {
      method: "DELETE",
      token,
    }),
  taskLabels: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/labels`, { token }),
  updateTaskLabels: (token, projectId, taskId, labelIds) =>
    request(`/projects/${projectId}/tasks/${taskId}/labels`, {
      method: "PUT",
      token,
      body: { labelIds },
    }),
  taskLinks: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/links`, { token }),
  addTaskLink: (token, projectId, taskId, link) =>
    request(`/projects/${projectId}/tasks/${taskId}/links`, {
      method: "POST",
      token,
      body: link,
    }),
  removeTaskLink: (token, projectId, taskId, linkId) =>
    request(`/projects/${projectId}/tasks/${taskId}/links/${linkId}`, {
      method: "DELETE",
      token,
    }),
  board: (token, projectId) =>
    request(`/projects/${projectId}/board`, { token }),
  updateBoardColumn: (token, projectId, columnId, column) =>
    request(`/projects/${projectId}/board/columns/${columnId}`, {
      method: "PATCH",
      token,
      body: column,
    }),
  overview: (token, projectId) =>
    request(`/projects/${projectId}/reports/overview`, { token }),
  reports: (token, projectId) =>
    request(`/projects/${projectId}/reports`, { token }),
  projectActivity: (token, projectId) =>
    request(`/projects/${projectId}/activity`, { token }),
  taskActivity: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/activity`, { token }),
  createTask: (token, projectId, task) =>
    request(`/projects/${projectId}/tasks`, {
      method: "POST",
      token,
      body: task,
    }),
  updateTaskStatus: (token, projectId, taskId, change) =>
    request(`/projects/${projectId}/tasks/${taskId}/status`, {
      method: "PATCH",
      token,
      body: change,
    }),
  moveTask: (token, projectId, taskId, change) =>
    request(`/projects/${projectId}/tasks/${taskId}/move`, {
      method: "PATCH",
      token,
      body: change,
    }),
  taskCollaboration: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration`, { token }),
  updateTaskAssignees: (token, projectId, taskId, userIds) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration/assignees`, {
      method: "PUT",
      token,
      body: { userIds },
    }),
  joinTask: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration/join`, {
      method: "POST",
      token,
    }),
  leaveTask: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration/leave`, {
      method: "DELETE",
      token,
    }),
  watchTask: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration/watch`, {
      method: "POST",
      token,
    }),
  unwatchTask: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/collaboration/watch`, {
      method: "DELETE",
      token,
    }),
  members: (token, projectId) =>
    request(`/projects/${projectId}/members`, { token }),
  addMember: (token, projectId, member) =>
    request(`/projects/${projectId}/members`, {
      method: "POST",
      token,
      body: member,
    }),
  updateMemberRole: (token, projectId, userId, role) =>
    request(`/projects/${projectId}/members/${userId}`, {
      method: "PUT",
      token,
      body: { role },
    }),
  removeMember: (token, projectId, userId) =>
    request(`/projects/${projectId}/members/${userId}`, {
      method: "DELETE",
      token,
    }),
  sprints: (token, projectId) =>
    request(`/projects/${projectId}/sprints`, { token }),
  createSprint: (token, projectId, sprint) =>
    request(`/projects/${projectId}/sprints`, {
      method: "POST",
      token,
      body: sprint,
    }),
  startSprint: (token, projectId, sprintId) =>
    request(`/projects/${projectId}/sprints/${sprintId}/start`, {
      method: "PATCH",
      token,
    }),
  completeSprint: (token, projectId, sprintId) =>
    request(`/projects/${projectId}/sprints/${sprintId}/complete`, {
      method: "PATCH",
      token,
    }),
  assignSprint: (token, projectId, taskId, sprintId) =>
    request(`/projects/${projectId}/tasks/${taskId}/sprint`, {
      method: "PATCH",
      token,
      body: { sprintId },
    }),
  comments: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/comments`, { token }),
  addComment: (token, projectId, taskId, comment) =>
    request(`/projects/${projectId}/tasks/${taskId}/comments`, {
      method: "POST",
      token,
      body: comment,
    }),
  toggleCommentPin: (token, projectId, taskId, commentId) =>
    request(
      `/projects/${projectId}/tasks/${taskId}/comments/${commentId}/pin`,
      { method: "PATCH", token },
    ),
  bug: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/bug`, { token }),
  saveBug: (token, projectId, taskId, bug) =>
    request(`/projects/${projectId}/tasks/${taskId}/bug`, {
      method: "PUT",
      token,
      body: bug,
    }),
  notifications: (token) => request("/notifications", { token }),
  markNotificationRead: (token, notificationId) =>
    request(`/notifications/${notificationId}/read`, {
      method: "PATCH",
      token,
    }),
  attachments: (token, projectId, taskId) =>
    request(`/projects/${projectId}/tasks/${taskId}/attachments`, { token }),
  uploadAttachment: (token, projectId, taskId, file) =>
    upload(`/projects/${projectId}/tasks/${taskId}/attachments`, token, file),
  downloadAttachment: (token, projectId, taskId, attachmentId) =>
    download(
      `/projects/${projectId}/tasks/${taskId}/attachments/${attachmentId}/download`,
      token,
    ),
};
