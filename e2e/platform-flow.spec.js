import { test, expect } from "@playwright/test";

const api = "http://localhost:8080/api/v1";
let workspaceCleanup;

test.afterEach(async ({ request }) => {
  if (!workspaceCleanup) return;
  await request.patch(`${api}/workspaces/${workspaceCleanup.id}/archive`, {
    headers: workspaceCleanup.headers,
  });
  workspaceCleanup = null;
});

async function result(response, status = 200) {
  const body = await response.json().catch(() => null);
  expect(response.status(), JSON.stringify(body)).toBe(status);
  return body?.data;
}

async function register(request, name, tag) {
  const response = await request.post(`${api}/auth/register`, {
    data: { fullName: name, email: `${name.toLowerCase().replaceAll(" ", "-")}-${tag}@vira.local`, password: "FlowPass@12345" },
  });
  const auth = await result(response, 201);
  return {
    id: auth.user.id,
    email: auth.user.email,
    refreshToken: auth.refreshToken,
    headers: { Authorization: `Bearer ${auth.accessToken}` },
  };
}

async function data(request, method, path, user, body, expected = 200) {
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: user?.headers,
    ...(body === undefined ? {} : { data: body }),
  });
  return result(response, expected);
}

test("quy trình workspace, dự án, phân quyền, task và các module nghiệp vụ", async ({ request }) => {
  test.skip(test.info().project.name === "mobile-chrome", "Các endpoint API được chạy một lần trong suite.");
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const owner = await register(request, "Flow Owner", tag);
  const admin = await register(request, "Flow Admin", tag);
  const member = await register(request, "Flow Member", tag);
  const contributor = await register(request, "Flow Contributor", tag);
  const outsider = await register(request, "Flow Outsider", tag);

  const refreshed = await data(request, "POST", "/auth/refresh", undefined, { refreshToken: owner.refreshToken });
  expect(refreshed.accessToken).toBeTruthy();
  const refreshedOwner = { headers: { Authorization: `Bearer ${refreshed.accessToken}` } };
  expect((await data(request, "GET", "/users/me", refreshedOwner)).email).toBe(owner.email);
  const updatedProfile = await data(request, "PUT", "/users/me", owner, { fullName: "Flow Owner Updated", avatarUrl: null });
  expect(updatedProfile.fullName).toBe("Flow Owner Updated");

  const workspace = await data(request, "POST", "/workspaces", owner, { name: `Flow ${tag}`, description: "" }, 201);
  workspaceCleanup = { id: workspace.id, headers: owner.headers };
  await data(request, "PUT", `/workspaces/${workspace.id}`, owner, { name: `Flow workspace ${tag}`, description: "Updated" });
  const project = await data(request, "POST", `/workspaces/${workspace.id}/projects`, owner, {
    name: "Full flow project", projectKey: `F${tag.slice(-8)}`, description: "", projectType: "SCRUM",
  }, 201);
  for (const [user, role] of [[admin, "ADMIN"], [member, "MEMBER"], [contributor, "MEMBER"]]) {
    await data(request, "POST", `/projects/${project.id}/members`, owner, { email: user.email, role }, 201);
  }
  const adminProjectUpdate = await request.put(`${api}/projects/${project.id}`, {
    headers: admin.headers,
    data: { name: "Not allowed", description: "", projectType: "SCRUM", status: "ACTIVE" },
  });
  expect(adminProjectUpdate.status()).toBe(403);
  const updatedProject = await data(request, "PUT", `/projects/${project.id}`, owner, {
    name: "Full flow project updated", description: "Updated", projectType: "SCRUM", status: "ACTIVE",
  });
  expect(updatedProject.name).toBe("Full flow project updated");
  for (const user of [owner, admin, member, contributor]) {
    await data(request, "GET", `/projects/${project.id}`, user);
  }
  expect((await data(request, "GET", `/projects/${project.id}/members`, member)).length).toBe(4);
  await data(request, "PUT", `/projects/${project.id}/members/${contributor.id}`, admin, { role: "ADMIN" });
  await data(request, "PUT", `/projects/${project.id}/members/${contributor.id}`, admin, { role: "MEMBER" });
  const memberRoleDenied = await request.put(`${api}/projects/${project.id}/members/${contributor.id}`, {
    headers: member.headers, data: { role: "ADMIN" },
  });
  expect(memberRoleDenied.status()).toBe(403);
  await data(request, "POST", `/projects/${project.id}/members`, admin, { email: outsider.email, role: "MEMBER" }, 201);
  await data(request, "DELETE", `/projects/${project.id}/members/${outsider.id}`, admin, undefined, 204);
  const outsiderRead = await request.get(`${api}/projects/${project.id}/tasks`, { headers: outsider.headers });
  expect([403, 404]).toContain(outsiderRead.status());

  const createdTask = await data(request, "POST", `/projects/${project.id}/tasks`, member, {
    title: "Parent feature", description: "Lifecycle fixture", taskType: "STORY", priority: "HIGH", estimatedHours: 3, storyPoints: 5,
  }, 201);
  const subtask = await data(request, "POST", `/projects/${project.id}/tasks`, member, {
    title: "Child implementation", description: "", taskType: "SUBTASK", priority: "MEDIUM", parentTaskId: createdTask.id,
  }, 201);
  const prematureDone = await request.patch(`${api}/projects/${project.id}/tasks/${createdTask.id}/status`, {
    headers: member.headers, data: { status: "DONE", version: createdTask.version },
  });
  expect(prematureDone.status()).toBe(400);
  await data(request, "PATCH", `/projects/${project.id}/tasks/${subtask.id}/status`, member, { status: "DONE", version: subtask.version });
  const parentInProgress = await data(request, "PATCH", `/projects/${project.id}/tasks/${createdTask.id}/move`, member, { status: "IN_PROGRESS", position: 0, version: createdTask.version });
  const staleUpdate = await request.patch(`${api}/projects/${project.id}/tasks/${createdTask.id}/status`, {
    headers: member.headers, data: { status: "DONE", version: createdTask.version },
  });
  expect(staleUpdate.status()).toBe(409);
  const parentDone = await data(request, "PATCH", `/projects/${project.id}/tasks/${createdTask.id}/status`, member, { status: "DONE", version: parentInProgress.version });
  expect(parentDone.status).toBe("DONE");

  const bugTask = await data(request, "POST", `/projects/${project.id}/tasks`, owner, {
    title: "Regression bug", description: "", taskType: "BUG", priority: "URGENT",
  }, 201);
  const bug = await data(request, "PUT", `/projects/${project.id}/tasks/${bugTask.id}/bug`, owner, {
    environment: "Chrome", severity: "HIGH", reproductionSteps: "Open page", expectedResult: "Stable", actualResult: "Crash", affectedVersion: "1.0",
  });
  expect((await data(request, "GET", `/projects/${project.id}/tasks/${bugTask.id}/bug`, member)).severity).toBe(bug.severity);

  const comment = await data(request, "POST", `/projects/${project.id}/tasks/${createdTask.id}/comments`, contributor, { body: "Implementation is ready" }, 201);
  await data(request, "POST", `/projects/${project.id}/tasks/${createdTask.id}/comments`, member, { body: "Reviewed", parentCommentId: comment.id }, 201);
  expect((await data(request, "PATCH", `/projects/${project.id}/tasks/${createdTask.id}/comments/${comment.id}/pin`, admin)).pinned).toBe(true);
  expect((await data(request, "GET", `/projects/${project.id}/tasks/${createdTask.id}/comments`, owner)).length).toBe(2);

  const label = await data(request, "POST", `/projects/${project.id}/labels`, admin, { name: "Regression", color: "#3366ff" });
  const updatedLabel = await data(request, "PUT", `/projects/${project.id}/labels/${label.id}`, admin, { name: "Verified", color: "#2244aa" });
  expect(updatedLabel.name).toBe("Verified");
  await data(request, "PUT", `/projects/${project.id}/tasks/${createdTask.id}/labels`, owner, { labelIds: [label.id] });
  expect((await data(request, "GET", `/projects/${project.id}/tasks/${createdTask.id}/labels`, member)).length).toBe(1);
  const link = await data(request, "POST", `/projects/${project.id}/tasks/${createdTask.id}/links`, owner, { targetTaskId: bugTask.id, linkType: "RELATES_TO" });
  expect((await data(request, "GET", `/projects/${project.id}/tasks/${createdTask.id}/links`, member)).length).toBe(1);
  await data(request, "DELETE", `/projects/${project.id}/tasks/${createdTask.id}/links/${link.id}`, owner);
  await data(request, "DELETE", `/projects/${project.id}/labels/${label.id}`, admin);

  const filter = await data(request, "POST", `/projects/${project.id}/tasks/filters`, member, { name: "My open tasks", filters: "{\"status\":\"TODO\"}" }, 201);
  expect((await data(request, "GET", `/projects/${project.id}/tasks/filters`, member)).some((item) => item.id === filter.id)).toBe(true);
  await data(request, "DELETE", `/projects/${project.id}/tasks/filters/${filter.id}`, member, undefined, 204);
  expect((await data(request, "GET", `/projects/${project.id}/tasks/search?q=Parent`, member)).totalItems).toBe(1);
  expect((await data(request, "GET", `/projects/${project.id}/tasks/backlog`, member)).length).toBeGreaterThan(0);

  const teamDenied = await request.post(`${api}/projects/${project.id}/teams`, { headers: member.headers, data: { name: "Denied team" } });
  expect(teamDenied.status()).toBe(403);
  const team = await data(request, "POST", `/projects/${project.id}/teams`, admin, { name: "Quality", description: "" }, 200);
  await data(request, "PUT", `/projects/${project.id}/teams/${team.id}`, admin, { name: "Engineering", description: "Updated" });
  const updatedTeam = await data(request, "PUT", `/projects/${project.id}/teams/${team.id}/members`, admin, { userIds: [member.id, contributor.id] });
  expect(updatedTeam.members).toHaveLength(2);
  await data(request, "DELETE", `/projects/${project.id}/teams/${team.id}`, admin);

  const board = await data(request, "GET", `/projects/${project.id}/board`, member);
  const firstColumn = board.columns[0];
  await data(request, "PATCH", `/projects/${project.id}/board/columns/${firstColumn.id}`, admin, { name: "To do", wipLimit: 12 });
  const newColumn = await data(request, "POST", `/projects/${project.id}/board/columns`, admin, { name: "Blocked", taskStatus: "BLOCKED", wipLimit: 4 }, 200);
  await data(request, "PATCH", `/projects/${project.id}/board/columns/order`, admin, { columnIds: [newColumn.id, ...board.columns.map((column) => column.id)] });
  const columnDenied = await request.post(`${api}/projects/${project.id}/board/columns`, {
    headers: member.headers, data: { name: "Denied", taskStatus: "ON_HOLD" },
  });
  expect(columnDenied.status()).toBe(403);
  await data(request, "DELETE", `/projects/${project.id}/board/columns/${newColumn.id}`, admin);

  const sprintDenied = await request.post(`${api}/projects/${project.id}/sprints`, {
    headers: member.headers, data: { name: "Denied sprint", startDate: "2026-11-01", endDate: "2026-11-14" },
  });
  expect(sprintDenied.status()).toBe(403);
  const sprint = await data(request, "POST", `/projects/${project.id}/sprints`, admin, {
    name: "Release sprint", goal: "Ship the feature", startDate: "2026-11-01", endDate: "2026-11-14",
  }, 201);
  const taskForSprint = await data(request, "POST", `/projects/${project.id}/tasks`, member, {
    title: "Sprint work", description: "", taskType: "TASK", priority: "MEDIUM",
  }, 201);
  await data(request, "PATCH", `/projects/${project.id}/tasks/${taskForSprint.id}/sprint`, member, { sprintId: sprint.id });
  await data(request, "PATCH", `/projects/${project.id}/sprints/${sprint.id}/start`, admin);
  const completedSprint = await data(request, "PATCH", `/projects/${project.id}/sprints/${sprint.id}/complete`, admin, { targetSprintId: null });
  expect(completedSprint.status).toBe("COMPLETED");

  await data(request, "PUT", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration/assignees`, admin, { userIds: [contributor.id] });
  await data(request, "POST", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration/watch`, contributor);
  await data(request, "DELETE", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration/watch`, contributor);
  await data(request, "POST", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration/join`, contributor);
  const collaboration = await data(request, "GET", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration`, owner);
  expect(collaboration.assignees.some((person) => person.userId === contributor.id)).toBe(true);
  await data(request, "DELETE", `/projects/${project.id}/tasks/${taskForSprint.id}/collaboration/leave`, contributor);

  const notifications = await data(request, "GET", "/notifications", contributor);
  const assignment = notifications.find((item) => item.type === "TASK_ASSIGNED");
  expect(assignment).toBeTruthy();
  await data(request, "PATCH", `/notifications/${assignment.id}/read`, contributor);
  expect((await data(request, "GET", `/projects/${project.id}/reports/overview`, owner)).totalTasks).toBeGreaterThan(0);
  expect((await data(request, "GET", `/projects/${project.id}/reports`, owner)).bugSeverity).toBeDefined();
  expect((await data(request, "GET", `/projects/${project.id}/activity`, owner)).length).toBeGreaterThan(0);
  expect((await data(request, "GET", `/projects/${project.id}/tasks/${createdTask.id}/activity`, member)).length).toBeGreaterThan(0);

  await data(request, "DELETE", `/projects/${project.id}/tasks/${bugTask.id}?version=${bugTask.version}`, owner, undefined, 204);
  const deletedTask = (await data(request, "GET", `/projects/${project.id}/tasks/deleted`, admin)).find((task) => task.id === bugTask.id);
  expect(deletedTask).toBeTruthy();
  await data(request, "PATCH", `/projects/${project.id}/tasks/${bugTask.id}/restore?version=${deletedTask.version}`, owner);

  await data(request, "PATCH", `/projects/${project.id}/archive`, owner);
  expect((await data(request, "GET", `/workspaces/${workspace.id}/projects/archived`, owner)).some((item) => item.id === project.id)).toBe(true);
  await data(request, "PATCH", `/projects/${project.id}/restore`, owner);
  await data(request, "PATCH", `/workspaces/${workspace.id}/archive`, owner);
  expect((await data(request, "GET", "/workspaces/archived", owner)).some((item) => item.id === workspace.id)).toBe(true);
});
