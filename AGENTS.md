# AGENTS.md — Vira Project Guidelines

## Project Overview
**Vira** là nền tảng quản lý dự án và cộng tác công việc phân cấp (**Workspace → Project → Task/Subtask**) theo chuẩn Agile (Kanban, Backlog, Sprint). Ứng dụng cung cấp hệ thống phân quyền đa tầng, khả năng kéo thả Kanban, khóa lạc quan (optimistic locking), cộng tác nhóm đa người thực hiện, theo dõi công việc, bình luận, đính kèm tệp tin và thông báo nội bộ.

---

## Tech Stack & Architecture

### 1. Frontend
- **Công nghệ**: React 19, Vite (SPA), Vanilla CSS hiện đại, `lucide-react`.
- **Cổng mặc định**: `http://localhost:5173` (được cấu hình CORS whitelist trong Backend).
- **Cấu trúc**: `src/` gồm `main.jsx` (giao diện và điều hướng), `api.js` (client gọi API), `styles.css`.

### 2. Backend
- **Công nghệ**: Java 21, Spring Boot 3.5, Spring Security, Spring Data JPA, Hibernate.
- **Xác thực**: JWT (Access token 30 phút, Refresh token 14 ngày, SHA-256 hash).
- **Cổng API**: `http://localhost:8080/api/v1`.
- **Giới hạn tần suất (Rate Limit)**: `RequestRateLimiter` hỗ trợ Redis hoặc In-Memory fallback (login: 8 req/phút; reset password: 3 req/15 phút).

### 3. Database & Supporting Services
- **Database**: MySQL 8.4 (Docker container `vira-mysql`, cổng host `3307`, cổng nội bộ `3306`).
- **Migration**: Flyway quản lý schema tự động (`V1` đến `V10`).
- **Local Mail Server**: Mailpit (Docker container `vira-mailpit`, Web UI tại `http://localhost:8025`, SMTP cổng `1025`).
- **Cache**: Redis 7.4 (Docker container `vira-redis`, cổng `6379`).
- **File Uploads**: Thư mục local `backend/uploads`.

---

## Project Structure

```text
Vira-project/
├── backend/                       # Backend Spring Boot
│   ├── compose.yaml               # Docker Compose (mysql, mailpit, redis, api)
│   ├── Dockerfile                 # Docker container cho Spring Boot JAR
│   ├── pom.xml                    # Maven dependencies
│   ├── mvnw / mvnw.cmd            # Maven wrapper
│   ├── scripts/                   # Scripts backup/restore MySQL & uploads
│   └── src/
│       ├── main/java/vn/vira/     # Mã nguồn Java theo kiến trúc module:
│       │   ├── attachment/        # Quản lý tệp đính kèm task
│       │   ├── audit/             # Activity logs
│       │   ├── auth/              # JWT, Login, Register, Password Reset
│       │   ├── bug/               # Chi tiết lỗi/bug metadata
│       │   ├── comment/           # Bình luận task (hỗ trợ pin comment)
│       │   ├── notification/      # Thông báo in-app
│       │   ├── project/           # Dự án, Kanban boards, columns, thành viên
│       │   ├── report/            # Báo cáo tổng quan overview
│       │   ├── shared/            # Security, RateLimiter, Global Exception, CORS
│       │   ├── sprint/            # Sprint lifecycle (start, complete)
│       │   ├── task/              # Task, subtask, reordering, assignees, watchers
│       │   ├── user/              # Quản lý người dùng, đổi mật khẩu, profile
│       │   └── workspace/         # Workspace và workspace members
│       └── main/resources/
│           ├── application.yml    # Cấu hình Spring Boot chung
│           ├── application-dev.yml# Cấu hình kết nối MySQL, Mailpit
│           └── db/migration/      # Flyway SQL migrations (V1 -> V10)
├── src/                           # Frontend React SPA
│   ├── api.js                     # API client wrapper
│   ├── main.jsx                   # UI component chính
│   └── styles.css                 # Toàn bộ CSS giao diện
├── scripts/                       # Scripts tiện ích
│   ├── seed-demo-data.mjs         # Khởi tạo 5 tài khoản demo, workspace, DEMO-101
│   ├── seed-members.sql           # SQL seed phân quyền thành viên
│   └── performance-smoke.mjs      # Test hiệu năng tải trang
├── e2e/                           # Playwright E2E Tests
│   ├── auth.spec.js               # Test luồng đăng ký, đăng nhập, reset pass
│   └── lifecycle.spec.js          # Test luồng vòng đời task, upload, archive
├── index.html                     # Entry HTML Vite
├── package.json                   # Cấu hình frontend dependencies
├── README.md                      # Hướng dẫn chi tiết dự án
└── AGENTS.md                      # Hướng dẫn ngữ cảnh cho AI Agents
```

---

## Demo Accounts & Permissions

Tất cả tài khoản demo sử dụng chung mật khẩu: `Demo@12345`.

| Tài khoản | Email | Vai trò Workspace | Vai trò Project DEMO | Quyền hạn chính |
| :--- | :--- | :--- | :--- | :--- |
| **Demo Owner** | `demo@vira.local` | `OWNER` | `OWNER` | Toàn quyền workspace và project |
| **Demo Admin** | `manager@vira.local` | `MEMBER` | `ADMIN` | Quản trị dự án, quản lý sprint/board, mời/đổi vai trò thành viên |
| **Demo Member** | `member@vira.local` | `MEMBER` | `MEMBER` | Tạo task, nhận/gán task, kéo thả Kanban, cập nhật trạng thái, bình luận |
| **Demo Contributor** | `guest@vira.local` | `MEMBER` | `MEMBER` | Thành viên đóng góp dự án, cộng tác trên task |

---

## Operational Commands

### 1. Chạy Backend & Infrastructure (Docker)
```powershell
# Đóng gói backend (nếu có thay đổi code Java):
cd backend
.\mvnw.cmd package -DskipTests

# Khởi chạy toàn bộ MySQL, Mailpit, Redis và API container:
docker compose -f compose.yaml up -d --build

# Kiểm tra sức khỏe:
Invoke-RestMethod http://localhost:8080/api/v1/actuator/health
```

### 2. Chạy Frontend
```powershell
# Khởi chạy Vite dev server:
npm.cmd run dev -- --host 0.0.0.0
# Truy cập tại: http://localhost:5173
```

### 3. Nạp dữ liệu mẫu (Seed Data)
Nếu vừa tạo mới cơ sở dữ liệu MySQL:
```powershell
node scripts/seed-demo-data.mjs
cmd /c "docker exec -i vira-mysql mysql -uvira_app -pvira_app_dev vira < scripts\seed-members.sql"
```

### 4. Kiểm tra Email Reset Mật khẩu
Truy cập giao diện Web UI Mailpit: [http://localhost:8025](http://localhost:8025).

---

## Development Conventions

1. **API Response Envelope**:
   Mọi endpoint trả về định dạng chuẩn:
   ```json
   {
     "success": true,
     "message": "Thông điệp kết quả",
     "data": { ... }
   }
   ```

2. **Optimistic Locking**:
   - Bảng `tasks` sử dụng trường `version`.
   - Các thao tác cập nhật trạng thái, di chuyển cột (move), xóa mềm hoặc khôi phục task **bắt buộc** phải gửi kèm `version` hiện tại để tránh xung đột dữ liệu.

3. **CORS & Bảo mật**:
   - Backend chỉ cho phép các origins: `http://localhost:5173` và `http://127.0.0.1:5173`.
   - Mật khẩu mã hóa bằng BCrypt.
   - Không commit tệp `.env`, API key hoặc mật khẩu thật lên repository (tuân thủ `.agents/rules/security.md`).

4. **Ngôn ngữ**:
   - Mã nguồn (code, tên biến, commit, comment) sử dụng Tiếng Anh.
   - Tài liệu, thông báo hiển thị người dùng sử dụng Tiếng Việt.
