[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path "$PSScriptRoot\.."
Set-Location $rootDir

Write-Host "=== Stopping Self-Management Platform ===" -ForegroundColor Cyan

# 1. Stop Docker Container
Write-Host "`n[1/2] Stopping PostgreSQL container..." -ForegroundColor Cyan
try {
  docker compose down
  Write-Host "  -> PostgreSQL container stopped." -ForegroundColor Green
} catch {
  Write-Host "  -> Warning: Docker compose down encountered an error or was already stopped." -ForegroundColor Yellow
}

# 2. Release locked development ports (kills zombie Node/Vite processes)
Write-Host "`n[2/2] Checking and releasing ports 3000 and 5173..." -ForegroundColor Cyan
$targetPorts = @(3000, 5173)
$freedCount = 0

foreach ($port in $targetPorts) {
  $listeners = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listeners) {
    foreach ($listener in $listeners) {
      $pidToKill = $listener.OwningProcess
      try {
        Stop-Process -Id $pidToKill -Force -ErrorAction SilentlyContinue
        Write-Host "  -> Terminated hanging process on port $port (PID: $pidToKill)" -ForegroundColor Yellow
        $freedCount++
      } catch {}
    }
  }
}

if ($freedCount -eq 0) {
  Write-Host "  -> Ports 3000 and 5173 were already free." -ForegroundColor Green
}

Write-Host "`nPlatform successfully stopped. System is clean.`n" -ForegroundColor Green
