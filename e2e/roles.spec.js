import { test, expect } from "@playwright/test";

const demoAccounts = [
  { name: "Demo Owner", email: "demo@vira.local", role: "Chủ sở hữu", canManage: true },
  { name: "Demo Admin", email: "manager@vira.local", role: "Quản trị viên", canManage: true },
  { name: "Demo Member", email: "member@vira.local", role: "Thành viên", canManage: false },
  { name: "Demo Contributor", email: "guest@vira.local", role: "Thành viên", canManage: false },
];

test.describe.configure({ mode: "serial" });

for (const account of demoAccounts) {
  test(`${account.name} chỉ thấy thao tác phù hợp với vai trò`, async ({ page }) => {
    test.skip(
      test.info().project.name === "mobile-chrome" && process.env.E2E_ALL_ROLE_VIEWPORTS !== "1",
      "Chạy riêng luồng role mobile để tuân thủ giới hạn đăng nhập của API.",
    );
    await page.goto("/");
    await page.getByLabel("Email").fill(account.email);
    await page.getByLabel("Mật khẩu").fill("Demo@12345");
    await page.getByRole("button", { name: "Đăng nhập" }).click();

    await expect(page.getByText(account.name, { exact: true }).first()).toBeVisible();
    await expect(page.getByText(account.role, { exact: true }).first()).toBeVisible();

    const navigate = async (name) => {
      if (test.info().project.name === "mobile-chrome") await page.locator(".menu-btn").click();
      await page.getByRole("button", { name }).click();
    };
    await navigate(/Bảng công việc/);
    await expect(page.getByRole("heading", { name: "Bảng công việc" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Tạo công việc" }).first()).toBeVisible();
    const boardSettings = page.getByRole("button", { name: "Cấu hình cột/WIP" }).first();
    if (account.canManage) await expect(boardSettings).toBeVisible();
    else await expect(boardSettings).toHaveCount(0);

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
  });
}
