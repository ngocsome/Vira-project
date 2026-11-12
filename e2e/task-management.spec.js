import { test, expect } from "@playwright/test";

const api = "http://localhost:8080/api/v1";
const PASSWORD = "TaskMgmtPass@12345";

async function call(request, method, path, token, data) {
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    ...(data === undefined ? {} : { data }),
  });
  const body = await response.json().catch(() => null);
  return { status: response.status(), data: body?.data, body };
}

async function expectData(request, method, path, token, data, status = 200) {
  const result = await call(request, method, path, token, data);
  expect(result.status, JSON.stringify(result.body)).toBe(status);
  return result.data;
}

async function register(request, tag, role) {
  return expectData(request, "POST", "/auth/register", null, {
    fullName: `Task ${role}`, email: `task-${role}-${tag}@vira.local`, password: PASSWORD,
  }, 201);
}

async function seedProject(request) {
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const owner = await register(request, tag, "owner");
  const editor = await register(request, tag, "editor");
  const outsider = await register(request, tag, "member");
  const workspace = await expectData(request, "POST", "/workspaces", owner.accessToken, { name: `Task mgmt ${tag}`, description: "" }, 201);
  const project = await expectData(request, "POST", `/workspaces/${workspace.id}/projects`, owner.accessToken, {
    name: "Task management", projectKey: `M${tag.slice(-8)}`, description: "", projectType: "KANBAN",
  }, 201);
  await expectData(request, "POST", `/projects/${project.id}/members`, owner.accessToken, { email: editor.user.email, role: "MEMBER" }, 201);
  await expectData(request, "POST", `/projects/${project.id}/members`, owner.accessToken, { email: outsider.user.email, role: "MEMBER" }, 201);
  return { tag, owner, editor, outsider, workspace, project };
}

function createTask(request, ctx, token, payload) {
  return expectData(request, "POST", `/projects/${ctx.project.id}/tasks`, token, {
    description: "Task management fixture", taskType: "TASK", priority: "MEDIUM", ...payload,
  }, 201);
}

function tomorrow() {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test.describe("Task & Subtask API", () => {
  test.beforeEach(() => {
    test.skip(test.info().project.name === "mobile-chrome", "API scenarios run once per suite.");
  });

  test("should_update_task_details_when_editor_sends_current_version", async ({ request }) => {
    const ctx = await seedProject(request);
    const task = await createTask(request, ctx, ctx.owner.accessToken, { title: "Original title" });

    const updated = await expectData(request, "PATCH", `/projects/${ctx.project.id}/tasks/${task.id}`, ctx.owner.accessToken, {
      title: "  Updated title  ", description: "New description", taskType: "BUG", priority: "URGENT",
      dueDate: tomorrow(), estimatedHours: 2.5, storyPoints: 5, version: task.version,
    });

    expect(updated).toMatchObject({
      title: "Updated title", description: "New description", taskType: "BUG", priority: "URGENT",
      dueDate: tomorrow(), estimatedHours: 2.5, storyPoints: 5,
    });
    expect(updated.version).toBeGreaterThan(task.version);
  });

  test("should_return_409_when_updating_with_stale_version", async ({ request }) => {
    const ctx = await seedProject(request);
    const task = await createTask(request, ctx, ctx.owner.accessToken, { title: "Stale" });
    await expectData(request, "PATCH", `/projects/${ctx.project.id}/tasks/${task.id}`, ctx.owner.accessToken, {
      title: "First write", taskType: "TASK", priority: "LOW", version: task.version,
    });

    const stale = await call(request, "PATCH", `/projects/${ctx.project.id}/tasks/${task.id}`, ctx.owner.accessToken, {
      title: "Second write", taskType: "TASK", priority: "LOW", version: task.version,
    });

    expect(stale.status).toBe(409);
  });

  test("should_return_400_when_title_is_blank", async ({ request }) => {
    const ctx = await seedProject(request);
    const task = await createTask(request, ctx, ctx.owner.accessToken, { title: "Blank check" });

    const result = await call(request, "PATCH", `/projects/${ctx.project.id}/tasks/${task.id}`, ctx.owner.accessToken, {
      title: "   ", taskType: "TASK", priority: "LOW", version: task.version,
    });

    expect(result.status).toBe(400);
  });

  test("should_return_403_when_unrelated_member_updates_task", async ({ request }) => {
    const ctx = await seedProject(request);
    const task = await createTask(request, ctx, ctx.owner.accessToken, { title: "Owner task" });

    const result = await call(request, "PATCH", `/projects/${ctx.project.id}/tasks/${task.id}`, ctx.outsider.accessToken, {
      title: "Hijack", taskType: "TASK", priority: "LOW", version: task.version,
    });

    expect(result.status).toBe(403);
  });

  test("should_return_400_when_creating_subtask_of_subtask", async ({ request }) => {
    const ctx = await seedProject(request);
    const parent = await createTask(request, ctx, ctx.owner.accessToken, { title: "Parent" });
    const child = await createTask(request, ctx, ctx.owner.accessToken, { title: "Child", taskType: "SUBTASK", parentTaskId: parent.id });

    const nested = await call(request, "POST", `/projects/${ctx.project.id}/tasks`, ctx.owner.accessToken, {
      title: "Grandchild", taskType: "SUBTASK", priority: "LOW", parentTaskId: child.id,
    });

    expect(child.parentTaskId).toBe(parent.id);
    expect(nested.status).toBe(400);
  });

  test("should_allow_parent_editor_to_delete_subtask", async ({ request }) => {
    const ctx = await seedProject(request);
    const parent = await createTask(request, ctx, ctx.editor.accessToken, { title: "Editor parent" });
    const child = await createTask(request, ctx, ctx.owner.accessToken, { title: "Owner child", taskType: "SUBTASK", parentTaskId: parent.id });

    const result = await call(request, "DELETE", `/projects/${ctx.project.id}/tasks/${child.id}?version=${child.version}`, ctx.editor.accessToken);

    expect(result.status).toBe(204);
  });

  test("should_return_403_when_unrelated_member_deletes_subtask", async ({ request }) => {
    const ctx = await seedProject(request);
    const parent = await createTask(request, ctx, ctx.editor.accessToken, { title: "Editor parent" });
    const child = await createTask(request, ctx, ctx.editor.accessToken, { title: "Editor child", taskType: "SUBTASK", parentTaskId: parent.id });

    const result = await call(request, "DELETE", `/projects/${ctx.project.id}/tasks/${child.id}?version=${child.version}`, ctx.outsider.accessToken);

    expect(result.status).toBe(403);
  });

  test("should_return_403_when_non_admin_deletes_root_task", async ({ request }) => {
    const ctx = await seedProject(request);
    const parent = await createTask(request, ctx, ctx.editor.accessToken, { title: "Editor root" });

    const result = await call(request, "DELETE", `/projects/${ctx.project.id}/tasks/${parent.id}?version=${parent.version}`, ctx.editor.accessToken);

    expect(result.status).toBe(403);
  });

  test("should_cascade_soft_delete_and_restore_subtasks_with_parent", async ({ request }) => {
    const ctx = await seedProject(request);
    const token = ctx.owner.accessToken;
    const parent = await createTask(request, ctx, token, { title: "Cascade parent" });
    const child = await createTask(request, ctx, token, { title: "Cascade child", taskType: "SUBTASK", parentTaskId: parent.id });

    await expectData(request, "DELETE", `/projects/${ctx.project.id}/tasks/${parent.id}?version=${parent.version}`, token, undefined, 204);
    const activeAfterDelete = await expectData(request, "GET", `/projects/${ctx.project.id}/tasks`, token);
    const deleted = await expectData(request, "GET", `/projects/${ctx.project.id}/tasks/deleted`, token);
    const deletedParent = deleted.find((item) => item.id === parent.id);
    await expectData(request, "PATCH", `/projects/${ctx.project.id}/tasks/${parent.id}/restore?version=${deletedParent.version}`, token);
    const activeAfterRestore = await expectData(request, "GET", `/projects/${ctx.project.id}/tasks`, token);

    expect(activeAfterDelete.map((item) => item.id)).not.toContain(child.id);
    expect(deleted.map((item) => item.id)).toEqual(expect.arrayContaining([parent.id, child.id]));
    expect(activeAfterRestore.map((item) => item.id)).toEqual(expect.arrayContaining([parent.id, child.id]));
  });

  test("should_return_400_when_restoring_subtask_while_parent_deleted", async ({ request }) => {
    const ctx = await seedProject(request);
    const token = ctx.owner.accessToken;
    const parent = await createTask(request, ctx, token, { title: "Deleted parent" });
    const child = await createTask(request, ctx, token, { title: "Orphan child", taskType: "SUBTASK", parentTaskId: parent.id });
    await expectData(request, "DELETE", `/projects/${ctx.project.id}/tasks/${parent.id}?version=${parent.version}`, token, undefined, 204);
    const deleted = await expectData(request, "GET", `/projects/${ctx.project.id}/tasks/deleted`, token);
    const deletedChild = deleted.find((item) => item.id === child.id);

    const result = await call(request, "PATCH", `/projects/${ctx.project.id}/tasks/${child.id}/restore?version=${deletedChild.version}`, token);

    expect(result.status).toBe(400);
  });
});

test("should_edit_task_and_manage_subtasks_from_task_details_ui", async ({ page, request }) => {
  const ctx = await seedProject(request);
  const parent = await createTask(request, ctx, ctx.owner.accessToken, { title: `UI parent ${ctx.tag}` });
  await page.addInitScript((state) => {
    localStorage.setItem("vira.session", JSON.stringify(state.session));
    localStorage.setItem("vira.workspaceId", String(state.workspaceId));
    localStorage.setItem("vira.projectId", String(state.projectId));
  }, { session: ctx.owner, workspaceId: ctx.workspace.id, projectId: ctx.project.id });
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto("/");

  // Edit task details (feature 6)
  await page.getByRole("button", { name: new RegExp(parent.title) }).first().click();
  const details = page.getByRole("dialog");
  await details.getByRole("button", { name: "Chỉnh sửa" }).click();
  const editForm = details.getByRole("form", { name: "Chỉnh sửa công việc" });
  const editedTitle = `UI edited ${ctx.tag}`;
  await editForm.getByLabel("Tiêu đề").fill(editedTitle);
  await editForm.getByLabel("Mô tả").fill("Edited from the task details dialog");
  await editForm.getByLabel("Ưu tiên").selectOption("HIGH");
  await editForm.getByLabel("Loại").selectOption("STORY");
  await editForm.getByLabel("Story point").fill("8");
  await editForm.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(details.getByRole("heading", { name: editedTitle })).toBeVisible();
  await expect(details.getByText("Edited from the task details dialog")).toBeVisible();
  await expect(details.getByTestId("task-type")).toHaveText("Story");
  await expect(details.getByText("8 điểm")).toBeVisible();

  // Create subtask (feature 7)
  const subtaskTitle = `UI subtask ${ctx.tag}`;
  await details.getByLabel("Tiêu đề công việc con").fill(subtaskTitle);
  await details.getByRole("button", { name: "Thêm" }).click();
  await expect(details.getByRole("heading", { name: "Công việc con (0/1)" })).toBeVisible();
  await details.getByRole("button", { name: new RegExp(subtaskTitle) }).click();
  await expect(details.getByRole("heading", { name: subtaskTitle })).toBeVisible();
  await expect(details.getByText("Thuộc công việc")).toBeVisible();
  await expect(details.getByTestId("task-type")).toHaveText("Việc con");
  await details.getByRole("button", { name: new RegExp(editedTitle) }).click();

  // Delete subtask (feature 8)
  await details.getByRole("button", { name: /Xóa công việc con/ }).click();
  await expect(details.getByText("Chưa có công việc con.")).toBeVisible();
  await expect(details.getByRole("heading", { name: "Công việc con (0/0)" })).toBeVisible();
});

test("should_group_subtasks_under_parent_on_board_and_backlog", async ({ page, request }) => {
  const ctx = await seedProject(request);
  const token = ctx.owner.accessToken;
  const parentTitle = `Grouped parent ${ctx.tag}`;
  const parent = await createTask(request, ctx, token, { title: parentTitle });
  const firstSubtask = await createTask(request, ctx, token, { title: `Grouped child A ${ctx.tag}`, taskType: "SUBTASK", parentTaskId: parent.id });
  const secondSubtask = await createTask(request, ctx, token, { title: `Grouped child B ${ctx.tag}`, taskType: "SUBTASK", parentTaskId: parent.id });
  await page.addInitScript((state) => {
    localStorage.setItem("vira.session", JSON.stringify(state.session));
    localStorage.setItem("vira.workspaceId", String(state.workspaceId));
    localStorage.setItem("vira.projectId", String(state.projectId));
  }, { session: ctx.owner, workspaceId: ctx.workspace.id, projectId: ctx.project.id });
  await page.goto("/");
  const openNavigation = async (name) => {
    if (test.info().project.name === "mobile-chrome" && !(await page.locator(".sidebar").evaluate((element) => element.classList.contains("open")))) {
      await page.locator(".menu-btn").click();
    }
    await page.locator(".sidebar").getByRole("button", { name }).click();
  };

  // Board: subtasks are nested inside the parent card, not standalone cards
  await openNavigation(/Bảng công việc/);
  const todoColumn = page.locator(".kanban-col").filter({ hasText: "Cần thực hiện" });
  const parentCard = todoColumn.locator(".task-card").filter({ hasText: parentTitle });
  await expect(todoColumn.locator(".task-card")).toHaveCount(1);
  await expect(todoColumn.locator(".column-head b")).toHaveText("1");
  await parentCard.getByRole("button", { name: "0/2 việc con" }).click();
  await expect(parentCard.locator(".card-subtask")).toHaveCount(2);
  await parentCard.getByRole("button", { name: new RegExp(firstSubtask.title) }).click();
  const details = page.getByRole("dialog");
  await expect(details.getByRole("heading", { name: firstSubtask.title })).toBeVisible();
  await details.getByRole("button", { name: "Đóng" }).click();

  // Backlog: subtasks are indented rows right below their parent
  await openNavigation("Backlog");
  const parentRow = page.locator(".backlog-row").filter({ hasText: parentTitle }).first();
  await expect(parentRow).toBeVisible();
  await expect(page.locator(".backlog-row.subtask-row")).toHaveCount(2);
  await expect(parentRow.locator("xpath=following-sibling::*[1]")).toContainText(firstSubtask.title);
  await expect(parentRow.locator("xpath=following-sibling::*[2]")).toContainText(secondSubtask.title);
});
