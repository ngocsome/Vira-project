import { test, expect } from "@playwright/test";

async function createBrowserUser(request) {
  const tag = `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  const email = `e2e-${tag}@vira.local`;
  const password = "E2ePass@12345";
  const register = await request.post("http://localhost:8080/api/v1/auth/register", {
    data: { fullName: "E2E Browser", email, password },
  });
  expect(register.ok()).toBeTruthy();
  const token = (await register.json()).data.accessToken;
  const headers = { Authorization: `Bearer ${token}` };
  const workspace = await request.post("http://localhost:8080/api/v1/workspaces", {
    headers,
    data: { name: `E2E Workspace ${tag}`, description: "" },
  });
  expect(workspace.ok()).toBeTruthy();
  const workspaceData = (await workspace.json()).data;
  const project = await request.post(`http://localhost:8080/api/v1/workspaces/${workspaceData.id}/projects`, {
    headers,
    data: { name: `E2E Project ${tag}`, projectKey: `E${tag.slice(-8)}`, description: "", projectType: "KANBAN" },
  });
  expect(project.ok()).toBeTruthy();
  return { email, password, workspaceName: workspaceData.name };
}

test("đăng nhập và vào workspace demo", async ({ page }) => {
  const user = await createBrowserUser(page.request);
  await page.goto("/");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Mật khẩu").fill(user.password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Tổng quan").first()).toBeVisible();
  await expect(page.getByRole("complementary").getByText(user.workspaceName)).toBeVisible();
});

test("mở được luồng quên mật khẩu", async ({ page }) => {
  const user = await createBrowserUser(page.request);
  await page.goto("/");
  await page.getByRole("button", { name: "Quên mật khẩu?" }).click();
  await page.getByLabel("Email").fill(user.email);
  await page.getByRole("button", { name: "Gửi liên kết" }).click();
  await expect(page.getByText(/liên kết đặt lại mật khẩu/i)).toBeVisible();
});
