param(
  [Parameter(Mandatory = $true)] [string]$BackupFile
)

$ErrorActionPreference = "Stop"
$archive = [System.IO.Path]::GetFullPath($BackupFile)
if (-not (Test-Path -LiteralPath $archive -PathType Leaf) -or [System.IO.Path]::GetExtension($archive) -ne ".zip") {
  throw "Backup upload phải là tệp .zip tồn tại."
}
$target = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\uploads"))
$confirmation = Read-Host "Thư mục '$target' sẽ được ghi đè bằng nội dung backup. Nhập RESTORE để tiếp tục"
if ($confirmation -ne "RESTORE") { throw "Đã hủy khôi phục upload." }
New-Item -ItemType Directory -Force -Path $target | Out-Null
Get-ChildItem -LiteralPath $target -Force | Remove-Item -Recurse -Force
Expand-Archive -LiteralPath $archive -DestinationPath $target -Force
Write-Output "Đã khôi phục upload vào: $target"
