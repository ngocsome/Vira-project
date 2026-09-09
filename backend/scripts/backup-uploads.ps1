param(
  [string]$OutputDirectory = (Join-Path $PSScriptRoot "..\backups")
)

$ErrorActionPreference = "Stop"
$source = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot "..\uploads"))
$destinationRoot = [System.IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $destinationRoot | Out-Null
if (-not (Test-Path -LiteralPath $source -PathType Container)) {
  Write-Output "Không có thư mục uploads để sao lưu: $source"
  exit 0
}
$archive = Join-Path $destinationRoot ("vira-uploads-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".zip")
$items = Get-ChildItem -LiteralPath $source -Force
if ($items.Count -eq 0) {
  Write-Output "Không có tệp upload để sao lưu: $source"
  exit 0
}
Compress-Archive -Path (Join-Path $source "*") -DestinationPath $archive -CompressionLevel Optimal
Write-Output "Đã tạo bản sao lưu upload: $archive"
