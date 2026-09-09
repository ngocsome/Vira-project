import { test, expect } from "@playwright/test";

const api = "http://localhost:8080/api/v1";

async function responseData(response) {
  expect(response.ok(), `${response.status()} ${await response.text()}`).toBeTruthy();
  return (await response.json()).data;
}

async function seed(request, prefix = "lifecycle") {
  const tag = `${Date.now()}${Math.floor(Math.random() * 100000)}`;
  const email = `${prefix}-${tag}@vira.local`;
  const password = "E2ePass@12345";
  const auth = await responseData(await request.post(`${api}/auth/register`, { data: { fullName: prefix, email, password } }));
  const headers = { Authorization: `Bearer ${auth.accessToken}` };
  const workspace = await responseData(await request.post(`${api}/workspaces`, { headers, data: { name: `${prefix} ${tag}`, description: "" } }));
  const project = await responseData(await request.post(`${api}/workspaces/${workspace.id}/projects`, {
    headers, data: { name: `${prefix} project`, projectKey: `T${tag.slice(-8)}`, description: "", projectType: "KANBAN" },
  }));
  return { email, password, headers, workspace, project };
}

async function task(request, context, title = "E2E task") {
  return responseData(await request.post(`${api}/projects/${context.project.id}/tasks`, {
    headers: context.headers,
    data: { title, description: "Regression fixture", taskType: "TASK", priority: "MEDIUM", estimatedHours: 1, storyPoints: 1 },
  }));
}

test("reset email, upload/download và archive/restore hoạt động qua API Docker", async ({ request }) => {
  const owner = await seed(request, "lifecycle-owner");
  const work = await task(request, owner);

  const forgot = await request.post(`${api}/auth/forgot-password`, { data: { email: owner.email } });
  expect(forgot.status()).toBe(200);
  const messagesResponse = await request.get("http://localhost:8025/api/v1/messages");
  expect(messagesResponse.ok()).toBeTruthy();
  const messages = await messagesResponse.json();
  const message = messages.messages.find((item) => item.To?.some((recipient) => recipient.Address === owner.email));
  expect(message).toBeTruthy();
  const sourceResponse = await request.get(`http://localhost:8025/api/v1/message/${message.ID}`);
  expect(sourceResponse.ok()).toBeTruthy();
  const source = await sourceResponse.json();
  const token = (source.Text || source.HTML || "").match(/token=([A-Za-z0-9_-]+)/)?.[1];
  expect(token).toBeTruthy();
  const reset = await request.post(`${api}/auth/reset-password`, { data: { token, newPassword: "ResetPass@12345" } });
  expect(reset.status()).toBe(200);
  const relogin = await request.post(`${api}/auth/login`, { data: { email: owner.email, password: "ResetPass@12345" } });
  expect(relogin.status()).toBe(200);

  const uploaded = await responseData(await request.post(`${api}/projects/${owner.project.id}/tasks/${work.id}/attachments`, {
    headers: owner.headers,
    multipart: { file: { name: "proof.txt", mimeType: "text/plain", buffer: Buffer.from("Vira E2E upload proof") } },
  }));
  const download = await request.get(`${api}/projects/${owner.project.id}/tasks/${work.id}/attachments/${uploaded.id}/download`, { headers: owner.headers });
  expect(download.status()).toBe(200);
  expect((await download.body()).toString()).toContain("Vira E2E upload proof");

  expect((await request.delete(`${api}/projects/${owner.project.id}/tasks/${work.id}?version=${work.version}`, { headers: owner.headers })).status()).toBe(204);
  const deleted = await responseData(await request.get(`${api}/projects/${owner.project.id}/tasks/deleted`, { headers: owner.headers }));
  const removed = deleted.find((item) => item.id === work.id);
  expect(removed).toBeTruthy();
  expect((await request.patch(`${api}/projects/${owner.project.id}/tasks/${work.id}/restore?version=${removed.version}`, { headers: owner.headers })).status()).toBe(200);

  expect((await request.patch(`${api}/projects/${owner.project.id}/archive`, { headers: owner.headers })).status()).toBe(200);
  const archivedProjects = await responseData(await request.get(`${api}/workspaces/${owner.workspace.id}/projects/archived`, { headers: owner.headers }));
  expect(archivedProjects.some((item) => item.id === owner.project.id)).toBeTruthy();
  expect((await request.patch(`${api}/projects/${owner.project.id}/restore`, { headers: owner.headers })).status()).toBe(200);
  expect((await request.patch(`${api}/workspaces/${owner.workspace.id}/archive`, { headers: owner.headers })).status()).toBe(200);
  const archivedWorkspaces = await responseData(await request.get(`${api}/workspaces/archived`, { headers: owner.headers }));
  expect(archivedWorkspaces.some((item) => item.id === owner.workspace.id)).toBeTruthy();
  expect((await request.patch(`${api}/workspaces/${owner.workspace.id}/restore`, { headers: owner.headers })).status()).toBe(200);
});

test("IDOR bị chặn giữa workspace độc lập và collaboration có quyền truy cập", async ({ request }) => {
  const owner = await seed(request, "idor-owner");
  const outsider = await seed(request, "idor-outsider");
  const work = await task(request, owner, "Private task");

  for (const url of [
    `${api}/projects/${owner.project.id}/tasks`,
    `${api}/projects/${owner.project.id}/reports`,
    `${api}/projects/${owner.project.id}/tasks/${work.id}/comments`,
    `${api}/projects/${owner.project.id}/tasks/${work.id}/audit`,
  ]) {
    // 403 and 404 are both safe responses: neither returns another workspace's data.
    expect([403, 404]).toContain((await request.get(url, { headers: outsider.headers })).status());
  }

  expect((await request.post(`${api}/projects/${owner.project.id}/members`, { headers: owner.headers, data: { email: outsider.email, role: "MEMBER" } })).status()).toBe(201);
  expect((await request.post(`${api}/projects/${owner.project.id}/tasks/${work.id}/collaboration/join`, { headers: outsider.headers })).status()).toBe(200);
  expect((await request.post(`${api}/projects/${owner.project.id}/tasks/${work.id}/collaboration/watch`, { headers: outsider.headers })).status()).toBe(200);
  const collaboration = await responseData(await request.get(`${api}/projects/${owner.project.id}/tasks/${work.id}/collaboration`, { headers: owner.headers }));
  expect(collaboration.assignees.some((user) => user.email === outsider.email)).toBeTruthy();
  expect(collaboration.watchers.some((user) => user.email === outsider.email)).toBeTruthy();
});
