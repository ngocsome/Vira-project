param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups")
)

$ErrorActionPreference = "Stop"
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $resolvedOutput | Out-Null
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$destination = Join-Path $resolvedOutput "vira-$timestamp.sql"

docker compose -f (Join-Path $PSScriptRoot "..\compose.yaml") exec -T mysql sh -c 'exec mysqldump -uroot -proot_dev_only --single-transaction --routines --events vira' > $destination
if ((Get-Item -LiteralPath $destination).Length -eq 0) {
  Remove-Item -LiteralPath $destination
  throw "Bản sao lưu rỗng; không giữ lại tệp không hợp lệ."
}
Write-Output "Đã tạo bản sao lưu: $destination"
