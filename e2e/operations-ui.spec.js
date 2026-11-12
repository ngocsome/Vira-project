import { test, expect } from "@playwright/test";

const api = "http://localhost:8080/api/v1";
let fixture;

async function apiData(request, method, path, token, data, status = 200) {
  const response = await request.fetch(`${api}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    ...(data === undefined ? {} : { data }),
  });
  const body = await response.json().catch(() => null);
  expect(response.status(), JSON.stringify(body)).toBe(status);
  return body?.data;
}

test.afterEach(async ({ request }) => {
  if (!fixture) return;
  await request.patch(`${api}/workspaces/${fixture.workspace.id}/archive`, {
    headers: { Authorization: `Bearer ${fixture.owner.accessToken}` },
  });
  fixture = null;
});

test("Owner có thể tạo/di chuyển task, lập sprint và mời thành viên trên UI", async ({ page, request }) => {
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const owner = await apiData(request, "POST", "/auth/register", null, {
    fullName: "Operations Owner", email: `operations-${tag}@vira.local`, password: "OperationsPass@12345",
  }, 201);
  const invitee = await apiData(request, "POST", "/auth/register", null, {
    fullName: "Operations Invitee", email: `invitee-${tag}@vira.local`, password: "InvitePass@12345",
  }, 201);
  const workspace = await apiData(request, "POST", "/workspaces", owner.accessToken, { name: `Operations ${tag}`, description: "" }, 201);
  fixture = { owner, workspace };
  const project = await apiData(request, "POST", `/workspaces/${workspace.id}/projects`, owner.accessToken, {
    name: "UI operations", projectKey: `O${tag.slice(-8)}`, description: "", projectType: "SCRUM",
  }, 201);

  await page.addInitScript((state) => {
    localStorage.setItem("vira.session", JSON.stringify(state.session));
    localStorage.setItem("vira.workspaceId", String(state.workspaceId));
    localStorage.setItem("vira.projectId", String(state.projectId));
  }, { session: owner, workspaceId: workspace.id, projectId: project.id });
  await page.goto("/");

  const openNavigation = async (name) => {
    if (test.info().project.name === "mobile-chrome" && !(await page.locator(".sidebar").evaluate((element) => element.classList.contains("open")))) {
      await page.locator(".menu-btn").click();
    }
    await page.locator(".sidebar").getByRole("button", { name }).click();
  };

  await openNavigation(/Bảng công việc/);
  await page.getByRole("button", { name: "Tạo công việc" }).click();
  const taskTitle = `UI task ${tag}`;
  const taskDialog = page.getByRole("dialog");
  await taskDialog.getByLabel("Tiêu đề").fill(taskTitle);
  await taskDialog.getByLabel("Mô tả").fill("Created through responsive UI");
  await taskDialog.getByLabel("Story point").fill("3");
  await taskDialog.getByRole("button", { name: "Tạo công việc" }).click();
  const taskCard = page.getByRole("button", { name: new RegExp(taskTitle) });
  await expect(taskCard).toBeVisible();
  await taskCard.click();
  const statusSelect = page.getByRole("dialog").locator(".status-select").first();
  await statusSelect.selectOption("IN_PROGRESS");
  await expect(statusSelect).toHaveValue("IN_PROGRESS");
  await page.getByRole("dialog").getByRole("button", { name: "Đóng" }).click();
  await expect(page.locator(".kanban-col").filter({ hasText: "Đang thực hiện" }).getByText(taskTitle)).toBeVisible();
  await page.getByRole("button", { name: "Cấu hình cột/WIP" }).click();
  const firstColumnConfig = page.locator(".board-column-config").first();
  await firstColumnConfig.getByLabel("WIP limit").fill("4");
  await firstColumnConfig.getByRole("button", { name: "Lưu" }).click();
  await expect(page.locator(".kanban-col").first().getByText("WIP 0/4")).toBeVisible();

  await openNavigation("Sprint");
  const today = new Date();
  const startDate = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  await page.getByPlaceholder("Tên Sprint").fill(`UI sprint ${tag}`);
  await page.getByPlaceholder("Mục tiêu").fill("Verify UI sprint lifecycle");
  await page.locator('input[type="date"]').nth(0).fill(startDate);
  await page.locator('input[type="date"]').nth(1).fill(endDate);
  await page.getByRole("button", { name: "Tạo Sprint" }).click();
  const sprintCard = page.getByRole("article").filter({ hasText: `UI sprint ${tag}` });
  await expect(sprintCard).toBeVisible();
  await sprintCard.getByRole("button", { name: "Bắt đầu" }).click();
  await expect(sprintCard.getByText("ACTIVE", { exact: true })).toBeVisible();

  await openNavigation("Thành viên");
  await page.getByPlaceholder("email@congty.vn").fill(invitee.user.email);
  await page.getByRole("button", { name: "Mời thành viên" }).click();
  await expect(page.getByText("Operations Invitee", { exact: true })).toBeVisible();

  await openNavigation(/Bảng công việc/);
  await page.getByRole("button", { name: new RegExp(taskTitle) }).click();
  const proof = Buffer.from("Uploaded through the responsive task details UI");
  await page.locator(".upload-control input[type='file']").setInputFiles({
    name: `ui-proof-${tag}.txt`, mimeType: "text/plain", buffer: proof,
  });
  const attachment = page.getByRole("button", { name: new RegExp(`ui-proof-${tag}\\.txt`) });
  await expect(attachment).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    attachment.click(),
  ]);
  expect(download.suggestedFilename()).toBe(`ui-proof-${tag}.txt`);
  await page.getByText("Phân công thành viên", { exact: true }).click();
  const inviteeAssignment = page.locator("label").filter({ hasText: "Operations Invitee" }).getByRole("checkbox");
  if (!(await inviteeAssignment.isChecked())) await inviteeAssignment.click();
  await expect(inviteeAssignment).toBeChecked();
  await page.getByRole("dialog").getByRole("button", { name: "Đóng" }).click();

  const inviteePage = await page.context().newPage();
  await inviteePage.addInitScript((state) => {
    localStorage.setItem("vira.session", JSON.stringify(state.session));
    localStorage.setItem("vira.workspaceId", String(state.workspaceId));
    localStorage.setItem("vira.projectId", String(state.projectId));
  }, { session: invitee, workspaceId: workspace.id, projectId: project.id });
  await inviteePage.goto("/");
  await inviteePage.getByRole("button", { name: "Thông báo" }).click();
  const taskNotification = inviteePage.locator(".notification-menu button").filter({ hasText: taskTitle });
  await expect(taskNotification).toBeVisible();
  await expect(taskNotification).toHaveClass(/unread/);
  await taskNotification.click();
  await expect(taskNotification).not.toHaveClass(/unread/);

  await openNavigation(/Bảng công việc/);
  await page.getByRole("button", { name: new RegExp(taskTitle) }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("dialog").getByRole("button", { name: "Xóa công việc" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: new RegExp(taskTitle) })).toHaveCount(0);

  await openNavigation(project.projectKey);
  await expect(page.getByRole("heading", { name: "Cài đặt dự án" })).toBeVisible();
  await page.getByRole("button", { name: "Tải task đã xóa" }).click();
  const deletedTask = page.locator(".entity-row").filter({ hasText: taskTitle });
  await expect(deletedTask).toBeVisible();
  await deletedTask.getByRole("button", { name: "Khôi phục" }).click();
  await expect(deletedTask).toHaveCount(0);
  await openNavigation(/Bảng công việc/);
  await expect(page.getByRole("button", { name: new RegExp(taskTitle) })).toBeVisible();

  await openNavigation(project.projectKey);
  await expect(page.getByRole("heading", { name: "Cài đặt dự án" })).toBeVisible();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Lưu trữ dự án" }).click();
  await expect(page.getByRole("heading", { name: `Operations ${tag}` })).toBeVisible();
  const archivedProject = page.locator(".archived-project").filter({ hasText: "UI operations" });
  await expect(archivedProject).toBeVisible();
  await archivedProject.getByRole("button", { name: "Khôi phục" }).click();
  await expect(page.getByRole("heading", { name: "Công việc của nhóm" })).toBeVisible();
});
