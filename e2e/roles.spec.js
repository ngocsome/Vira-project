import { test, expect } from "@playwright/test";

const api = "http://localhost:8080/api/v1";
const roles = [
  { name: "E2E Owner", role: "Chủ sở hữu", canManage: true },
  { name: "E2E Admin", role: "Quản trị viên", canManage: true },
  { name: "E2E Member", role: "Thành viên", canManage: false },
  { name: "E2E Contributor", role: "Thành viên", canManage: false },
];

let fixture;
let apiContext;

async function createUser(name, tag) {
  const response = await apiContext.post(`${api}/auth/register`, {
    data: { fullName: name, email: `${name.toLowerCase().replaceAll(" ", "-")}-${tag}@vira.local`, password: "RolePass@12345" },
  });
  expect(response.status()).toBe(201);
  return (await response.json()).data;
}

async function createResource(method, path, token, data, expectedStatus = 200) {
  const response = await apiContext.fetch(`${api}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
  const body = await response.json().catch(() => null);
  expect(response.status(), JSON.stringify(body)).toBe(expectedStatus);
  return body?.data;
}

test.beforeAll(async ({ playwright }) => {
  apiContext = await playwright.request.newContext();
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const users = await Promise.all(roles.map(({ name }) => createUser(name, tag)));
  const owner = users[0];
  const workspace = await createResource("POST", "/workspaces", owner.accessToken, { name: `Role test ${tag}`, description: "" }, 201);
  const project = await createResource("POST", `/workspaces/${workspace.id}/projects`, owner.accessToken, {
    name: "Role permissions", projectKey: `R${tag.slice(-8)}`, description: "", projectType: "KANBAN",
  }, 201);
  const roleTask = await createResource("POST", `/projects/${project.id}/tasks`, owner.accessToken, {
    title: "Role permission fixture", description: "", taskType: "TASK", priority: "MEDIUM",
  }, 201);

  for (let index = 1; index < roles.length; index += 1) {
    await createResource("POST", `/projects/${project.id}/members`, owner.accessToken, {
      email: users[index].user.email, role: index === 1 ? "ADMIN" : "MEMBER",
    }, 201);
  }

  fixture = { users, workspace, project, roleTask };
});

test.afterAll(async () => {
  if (fixture) {
    await createResource("PATCH", `/workspaces/${fixture.workspace.id}/archive`, fixture.users[0].accessToken);
  }
  await apiContext?.dispose();
});

test.describe.configure({ mode: "serial" });

for (const [index, account] of roles.entries()) {
  test(`${account.name} chỉ thấy thao tác phù hợp với vai trò`, async ({ page }) => {
    await page.addInitScript((state) => {
      localStorage.setItem("vira.session", JSON.stringify(state.session));
      localStorage.setItem("vira.workspaceId", String(state.workspaceId));
      localStorage.setItem("vira.projectId", String(state.projectId));
    }, {
      session: fixture.users[index],
      workspaceId: fixture.workspace.id,
      projectId: fixture.project.id,
    });
    await page.goto("/");
    if (test.info().project.name === "mobile-chrome") await page.locator(".menu-btn").click();

    await expect(page.getByText(account.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(account.role, { exact: true }).first()).toBeVisible();

    const navigate = async (name) => {
      if (test.info().project.name === "mobile-chrome" && !(await page.locator(".sidebar").evaluate((element) => element.classList.contains("open")))) {
        await page.locator(".menu-btn").click();
      }
      await page.getByRole("button", { name }).click();
    };
    await navigate(/Bảng công việc/);
    await expect(page.getByRole("heading", { name: "Bảng công việc" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo công việc" }).first()).toBeVisible();
    const boardSettings = page.getByRole("button", { name: "Cấu hình cột/WIP" }).first();
    if (account.canManage) await expect(boardSettings).toBeVisible();
    else await expect(boardSettings).toHaveCount(0);
    await page.getByRole("button", { name: /Role permission fixture/ }).click();
    const deleteTaskButton = page.getByRole("dialog").getByRole("button", { name: "Xóa công việc" });
    if (account.canManage) await expect(deleteTaskButton).toBeVisible();
    else await expect(deleteTaskButton).toHaveCount(0);
    await page.getByRole("dialog").getByRole("button", { name: "Đóng" }).click();

    await navigate("Thành viên");
    await expect(page.getByRole("heading", { name: "Thành viên dự án" })).toBeVisible();
    const inviteButton = page.getByRole("button", { name: "Mời thành viên" });
    if (account.canManage) await expect(inviteButton).toBeVisible();
    else await expect(inviteButton).toHaveCount(0);

    await navigate("Sprint");
    await expect(page.getByRole("heading", { name: "Sprint" })).toBeVisible();
    const createSprint = page.getByRole("button", { name: "Tạo Sprint" });
    if (account.canManage) await expect(createSprint).toBeVisible();
    else await expect(createSprint).toHaveCount(0);

    await navigate("Báo cáo");
    await expect(page.getByRole("heading", { name: "Báo cáo & tiến độ" })).toBeVisible();
  });
}
