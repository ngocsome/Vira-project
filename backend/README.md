# Vira API

Backend modular monolith cho Vira, dùng Spring Boot, MySQL 8, Flyway, JWT, Lombok và MapStruct.

## Chạy MySQL

```powershell
cd backend
docker compose up -d mysql
```

MySQL trong Docker được mở ở cổng host `3307` để không xung đột MySQL cục bộ.

## Chạy API

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API chạy tại `http://localhost:8080/api/v1`.

## Biến môi trường

- `DB_URL` — JDBC URL MySQL.
- `DB_USERNAME` / `DB_PASSWORD` — tài khoản MySQL.
- `JWT_SECRET` — chuỗi bí mật tối thiểu 32 byte, bắt buộc thay đổi trước môi trường production.
- `SERVER_PORT` — cổng HTTP, mặc định `8080`.

## Kiểm tra

```powershell
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
```

Xem [API.md](API.md) để tích hợp frontend với các endpoint hiện có.

## Sao lưu MySQL

Sau khi MySQL Docker đang chạy, tạo bản sao lưu SQL bằng:

```powershell
.\scripts\backup-mysql.ps1
```

Tệp sao lưu được lưu mặc định trong `backend\backups`. Có thể đổi thư mục đích bằng tham số `-OutputDirectory`.
