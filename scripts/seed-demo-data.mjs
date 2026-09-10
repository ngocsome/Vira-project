const API_URL = "http://localhost:8080/api/v1";

async function post(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function put(path, body, token) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function get(path, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API_URL}${path}`, { headers });
  const data = await res.json().catch(() => null);
  return { status: res.status, ok: res.ok, data };
}

async function main() {
  console.log("=== Bắt đầu khởi tạo dữ liệu mẫu Vira ===");

  const accounts = [
    { fullName: "Demo Owner", email: "demo@vira.local", password: "Demo@12345", projectRole: "OWNER", wsRole: "OWNER" },
    { fullName: "Demo Admin", email: "manager@vira.local", password: "Demo@12345", projectRole: "ADMIN", wsRole: "MEMBER" },
    { fullName: "Demo Member", email: "member@vira.local", password: "Demo@12345", projectRole: "MEMBER", wsRole: "MEMBER" },
    { fullName: "Demo Viewer", email: "guest@vira.local", password: "Demo@12345", projectRole: "VIEWER", wsRole: "MEMBER" },
  ];

  // 1. Đăng ký tài khoản
  console.log("1. Đăng ký các tài khoản demo...");
  for (const acc of accounts) {
    const res = await post("/auth/register", {
      fullName: acc.fullName,
      email: acc.email,
      password: acc.password,
    });
    if (res.ok) {
      console.log(` - Đăng ký thành công: ${acc.email} (${acc.fullName})`);
    } else {
      console.log(` - ${acc.email}: ${res.data?.message || res.status}`);
    }
  }

  // 2. Đăng nhập bằng Demo Owner
  console.log("\n2. Đăng nhập với Demo Owner...");
  const loginRes = await post("/auth/login", {
    email: "demo@vira.local",
    password: "Demo@12345",
  });
  if (!loginRes.ok) {
    console.error("Đăng nhập Demo Owner thất bại:", loginRes.data);
    process.exit(1);
  }
  const token = loginRes.data.data.accessToken;
  const ownerId = loginRes.data.data.user.id;
  console.log("Đăng nhập thành công, token nhận được.");

  // 3. Tạo Workspace
  console.log("\n3. Tạo Workspace demo...");
  const wsListRes = await get("/workspaces", token);
  let workspace = wsListRes.data?.data?.find(w => w.name === "Vira Workspace Demo");
  if (!workspace) {
    const createWsRes = await post("/workspaces", {
      name: "Vira Workspace Demo",
      description: "Không gian làm việc mẫu trải nghiệm đầy đủ các tính năng Vira",
    }, token);
    workspace = createWsRes.data?.data;
    console.log(` - Đã tạo workspace: ${workspace.name} (ID: ${workspace.id})`);
  } else {
    console.log(` - Workspace đã tồn tại: ${workspace.name} (ID: ${workspace.id})`);
  }

  // 4. Tạo Project
  console.log("\n4. Tạo Project demo...");
  const projListRes = await get(`/workspaces/${workspace.id}/projects`, token);
  let project = projListRes.data?.data?.find(p => p.projectKey === "DEMO");
  if (!project) {
    const createProjRes = await post(`/workspaces/${workspace.id}/projects`, {
      name: "Vira Demo Project",
      projectKey: "DEMO",
      description: "Dự án quản lý mẫu với Kanban, Sprint và cộng tác task",
      projectType: "KANBAN",
    }, token);
    project = createProjRes.data?.data;
    console.log(` - Đã tạo project: ${project.name} (Key: ${project.projectKey}, ID: ${project.id})`);
  } else {
    console.log(` - Project đã tồn tại: ${project.name} (Key: ${project.projectKey}, ID: ${project.id})`);
  }

  // 5. Thêm thành viên vào Project
  console.log("\n5. Mời các thành viên vào Project...");
  for (const acc of accounts) {
    if (acc.email === "demo@vira.local") continue;
    const addRes = await post(`/projects/${project.id}/members`, {
      email: acc.email,
      role: acc.projectRole,
    }, token);
    if (addRes.ok) {
      console.log(` - Đã mời ${acc.email} với vai trò ${acc.projectRole}`);
    } else {
      console.log(` - Mời ${acc.email}: ${addRes.data?.message || addRes.status}`);
    }
  }

  // 6. Tạo task DEMO-101
  console.log("\n6. Tạo task DEMO-101...");
  const tasksRes = await get(`/projects/${project.id}/tasks`, token);
  let existingTask = tasksRes.data?.data?.find(t => t.taskCode === "DEMO-101");
  let taskId = existingTask?.id;

  if (!existingTask) {
    const createTaskRes = await post(`/projects/${project.id}/tasks`, {
      title: "Thiết kế màn hình đăng nhập",
      description: "Thiết kế desktop và mobile cho toàn bộ màn hình xác thực, Kanban, và chi tiết task.",
      taskType: "TASK",
      priority: "HIGH",
      dueDate: "2026-10-15",
      estimatedHours: 8,
      storyPoints: 3,
    }, token);

    if (createTaskRes.ok) {
      const created = createTaskRes.data?.data;
      taskId = created.id;
      console.log(` - Tạo task thành công: [${created.taskCode}] ${created.title} (ID: ${created.id})`);
    } else {
      console.log(" - Lỗi tạo task:", createTaskRes.data);
    }
  } else {
    console.log(` - Task DEMO-101 đã tồn tại (ID: ${existingTask.id})`);
  }

  // 7. Tạo thêm vài task demo khác để Kanban phong phú
  const extraTasks = [
    {
      title: "Cấu hình Docker Compose và CI/CD pipeline",
      description: "Tối ưu Docker container cho MySQL, Mailpit và Redis.",
      taskType: "IMPROVEMENT",
      priority: "MEDIUM",
      estimatedHours: 4,
      storyPoints: 2,
    },
    {
      title: "Sửa lỗi hiển thị avatar trên notification bell",
      description: "Kiểm tra icon chuông thông báo khi có nhiều người được gán cùng task.",
      taskType: "BUG",
      priority: "URGENT",
      estimatedHours: 2,
      storyPoints: 1,
    },
    {
      title: "Xây dựng tính năng xuất báo cáo Sprint ra PDF",
      description: "Hỗ trợ xuất báo cáo burndown chart và thống kê story points.",
      taskType: "STORY",
      priority: "LOW",
      estimatedHours: 12,
      storyPoints: 5,
    },
  ];

  for (const t of extraTasks) {
    const res = await post(`/projects/${project.id}/tasks`, t, token);
    if (res.ok) {
      console.log(` - Đã tạo task: [${res.data?.data?.taskCode}] ${t.title}`);
    }
  }

  console.log("\n=== Hoàn tất khởi tạo dữ liệu mẫu! ===");
}

main().catch(err => {
  console.error("Lỗi:", err);
  process.exit(1);
});
