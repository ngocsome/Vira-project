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

Write-Warning "Thao tác này sẽ ghi đè dữ liệu trong database Docker 'vira'."
$answer = Read-Host "Gõ RESTORE để tiếp tục"
if ($answer -cne "RESTORE") {
  throw "Đã hủy khôi phục"
}

Get-Content -LiteralPath $resolvedBackup -Raw |
  docker compose -f (Join-Path $PSScriptRoot "..\compose.yaml") exec -T mysql sh -c 'exec mysql -uroot -proot_dev_only vira'
if ($LASTEXITCODE -ne 0) { throw "Khôi phục database thất bại" }
Write-Output "Đã khôi phục database từ: $resolvedBackup"
