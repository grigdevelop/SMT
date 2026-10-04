[CmdletBinding()]
param(
  [switch]$OnlyDb
)

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path "$PSScriptRoot\.."
Set-Location $rootDir

Write-Host "=== Starting Self-Management Platform ===" -ForegroundColor Cyan

# 1. Verify Docker daemon availability
try {
  docker info > $null 2>&1
  if ($LASTEXITCODE -ne 0) {
    throw "Docker daemon not running"
  }
} catch {
  Write-Host "ERROR: Docker Desktop does not appear to be running. Please start Docker and retry." -ForegroundColor Red
  exit 1
}

# 2. Boot PostgreSQL Container
Write-Host "`n[1/3] Starting PostgreSQL container..." -ForegroundColor Cyan
docker compose up -d postgres

# 3. Wait for PostgreSQL readiness (poll pg_isready to prevent startup race condition)
Write-Host "  -> Waiting for database port 5432 to accept connections..." -ForegroundColor Gray
$maxRetries = 15
$retries = 0
$isReady = $false

while (-not $isReady -and $retries -lt $maxRetries) {
  $output = docker exec self_mgmt_postgres pg_isready -U postgres 2>&1
  if ($LASTEXITCODE -eq 0) {
    $isReady = $true
    Write-Host "  -> PostgreSQL is healthy and accepting connections." -ForegroundColor Green
  } else {
    $retries++
    Start-Sleep -Seconds 1
  }
}

if (-not $isReady) {
  Write-Host "ERROR: PostgreSQL container timed out waiting for readiness." -ForegroundColor Red
  exit 1
}

# 4. Run Kysely migrations
Write-Host "`n[2/3] Applying database migrations..." -ForegroundColor Cyan
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Database migration failed." -ForegroundColor Red
  exit 1
}

if ($OnlyDb) {
  Write-Host "`nDatabase environment started successfully (-OnlyDb flag specified)." -ForegroundColor Green
  exit 0
}

# 5. Launch Dev Servers concurrently (Ctrl+C kills both)
Write-Host "`n[3/3] Starting Backend API (port 3000) and Frontend Client (port 5173)..." -ForegroundColor Cyan
Write-Host "      Press Ctrl+C to stop both servers.`n" -ForegroundColor Yellow

npx concurrently -k -p "[{name}]" -n "API,WEB" -c "cyan,magenta" "npm run dev:server" "npm run dev:client"
