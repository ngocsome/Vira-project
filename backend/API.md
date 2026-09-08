# Vira API Contract

Base URL: `http://localhost:8080/api/v1`

Tất cả response thành công có dạng:

```json
{
  "success": true,
  "data": {},
  "message": "...",
  "timestamp": "2026-09-08T00:00:00Z"
}
```

## Xác thực

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| POST | `/auth/register` | Đăng ký và nhận token |
| POST | `/auth/login` | Đăng nhập và nhận token |
| POST | `/auth/refresh` | Làm mới access token |
| PUT | `/users/me/password` | Đổi mật khẩu khi đã đăng nhập |

Các endpoint còn lại cần header `Authorization: Bearer <accessToken>`.

## Workspace và Project

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET, POST | `/workspaces` | Danh sách / tạo workspace |
| PUT, PATCH | `/workspaces/{workspaceId}`, `/workspaces/{workspaceId}/archive` | Sửa / lưu trữ workspace |
| GET, POST | `/workspaces/{workspaceId}/projects` | Danh sách / tạo dự án |
| GET, PUT, PATCH | `/projects/{projectId}`, `/projects/{projectId}/archive` | Xem, sửa / lưu trữ dự án |
| GET | `/projects/{projectId}/members` | Thành viên dự án |
| POST | `/projects/{projectId}/members` | Mời thành viên |
| PUT, DELETE | `/projects/{projectId}/members/{userId}` | Đổi vai trò / thu hồi quyền |

## Công việc, Backlog và Bảng

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET, POST | `/projects/{projectId}/tasks` | Danh sách / tạo công việc |
| GET | `/projects/{projectId}/tasks/backlog` | Backlog |
| PATCH | `/projects/{projectId}/tasks/{taskId}/status` | Đổi trạng thái |
| PATCH | `/projects/{projectId}/tasks/{taskId}/move` | Di chuyển thẻ Kanban |
| PATCH | `/projects/{projectId}/tasks/{taskId}/sprint` | Gán hoặc bỏ Sprint |
| GET, PATCH | `/projects/{projectId}/tasks/deleted`, `/projects/{projectId}/tasks/{taskId}/restore` | Xem / khôi phục task đã xóa mềm |
| GET | `/projects/{projectId}/board` | Bảng Kanban mặc định |
| PATCH | `/projects/{projectId}/board/columns/{columnId}` | Đổi tên cột và WIP limit |
| GET, POST | `/projects/{projectId}/sprints` | Danh sách / tạo Sprint |
| PATCH | `/projects/{projectId}/sprints/{sprintId}/start` | Bắt đầu Sprint |
| PATCH | `/projects/{projectId}/sprints/{sprintId}/complete` | Kết thúc Sprint |

## Chi tiết công việc và Dashboard

| Method | Endpoint | Mục đích |
| --- | --- | --- |
| GET, POST | `/projects/{projectId}/tasks/{taskId}/comments` | Bình luận |
| GET, PUT | `/projects/{projectId}/tasks/{taskId}/bug` | Chi tiết Bug |
| GET | `/projects/{projectId}/reports/overview` | Số liệu dashboard |
| GET | `/notifications` | Thông báo của người dùng hiện tại |
| PATCH | `/notifications/{notificationId}/read` | Đánh dấu đã đọc |
