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

test("bộ lọc Backlog có thể lưu, áp dụng và xóa trong giao diện", async ({ page, request }) => {
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const email = `backlog-${tag}@vira.local`;
  const password = "BacklogPass@12345";
  const registered = await request.post(`${api}/auth/register`, {
    data: { fullName: "Backlog E2E", email, password },
  });
  expect(registered.status()).toBe(201);
  const auth = (await registered.json()).data;
  const headers = { Authorization: `Bearer ${auth.accessToken}` };

  const workspaceResponse = await request.post(`${api}/workspaces`, {
    headers,
    data: { name: `Backlog E2E ${tag}`, description: "" },
  });
  expect(workspaceResponse.status()).toBe(201);
  const workspace = (await workspaceResponse.json()).data;
  workspaceCleanup = { id: workspace.id, headers };

  const projectResponse = await request.post(`${api}/workspaces/${workspace.id}/projects`, {
    headers,
    data: {
      name: "Backlog E2E project",
      projectKey: `B${tag.slice(-8)}`,
      description: "",
      projectType: "KANBAN",
    },
  });
  expect(projectResponse.status()).toBe(201);
  const project = (await projectResponse.json()).data;
  const taskResponse = await request.post(`${api}/projects/${project.id}/tasks`, {
    headers,
    data: { title: "Backlog filter fixture", description: "", taskType: "TASK", priority: "MEDIUM" },
  });
  expect(taskResponse.status()).toBe(201);

  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  if (test.info().project.name === "mobile-chrome") await page.locator(".menu-btn").click();
  await expect(page.getByText("Backlog E2E", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Backlog", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Backlog dự án" })).toBeVisible();

  const filterName = `Temporary filter ${tag}`;
  await page.getByLabel("Tìm kiếm công việc").fill("Backlog filter fixture");
  await page.getByLabel("Tên bộ lọc mới").fill(filterName);
  await page.getByRole("button", { name: "Lưu bộ lọc" }).click();

  const savedFilter = page.getByRole("button", { name: filterName, exact: true });
  await expect(savedFilter).toBeVisible();
  await savedFilter.click();
  await expect(savedFilter).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: `Xóa bộ lọc ${filterName}` }).click();
  await expect(savedFilter).toHaveCount(0);

  await page.getByRole("button", { name: /Backlog filter fixture/ }).click();
  await expect(page.getByRole("heading", { name: "Backlog filter fixture" })).toBeVisible();
  await page.getByRole("button", { name: "Tham gia công việc" }).click();
  await expect(page.getByRole("button", { name: "Rời công việc" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Đang theo dõi" })).toBeVisible();
  const comment = `UI collaboration check ${tag}`;
  await page.getByPlaceholder("Viết bình luận…").fill(comment);
  await page.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(page.getByText(comment, { exact: true })).toBeVisible();
});
