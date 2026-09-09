param(
  [Parameter(Mandatory = $true)]
  [ValidateScript({ Test-Path -LiteralPath $_ -PathType Leaf })]
  [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$resolvedBackup = [System.IO.Path]::GetFullPath($BackupFile)
if ([System.IO.Path]::GetExtension($resolvedBackup) -ne ".sql") {
  throw "Chỉ chấp nhận tệp sao lưu .sql"
}
if ((Get-Item -LiteralPath $resolvedBackup).Length -eq 0) {
  throw "Tệp sao lưu rỗng"
}

Write-Warning "Thao tác này sẽ thay thế hoàn toàn database Docker 'vira'. API sẽ tạm dừng trong lúc khôi phục."
$answer = Read-Host "Gõ RESTORE để tiếp tục"
if ($answer -cne "RESTORE") {
  throw "Đã hủy khôi phục"
}

$composeFile = Join-Path $PSScriptRoot "..\compose.yaml"
docker compose -f $composeFile stop api
if ($LASTEXITCODE -ne 0) { throw "Không thể dừng API trước khi khôi phục" }

docker compose -f $composeFile exec -T mysql sh -c 'mysql -uroot -proot_dev_only -e "DROP DATABASE IF EXISTS vira; CREATE DATABASE vira CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"'
if ($LASTEXITCODE -ne 0) { throw "Không thể tạo database sạch để khôi phục" }

Get-Content -LiteralPath $resolvedBackup -Raw |
  docker compose -f $composeFile exec -T mysql sh -c 'exec mysql -uroot -proot_dev_only vira'
if ($LASTEXITCODE -ne 0) { throw "Khôi phục database thất bại" }
docker compose -f $composeFile start api
if ($LASTEXITCODE -ne 0) { throw "Database đã khôi phục nhưng không thể khởi động lại API" }
Write-Output "Đã khôi phục database từ: $resolvedBackup"
