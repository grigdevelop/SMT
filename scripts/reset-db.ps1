[CmdletBinding()]
param()

$ErrorActionPreference = "Stop"
$rootDir = Resolve-Path "$PSScriptRoot\.."
Set-Location $rootDir

Write-Host "=== Resetting Local PostgreSQL Database ===" -ForegroundColor Yellow
Write-Host "Warning: This will destroy and recreate local database volumes.`n" -ForegroundColor DarkYellow

# 1. Teardown container and remove volume
Write-Host "[1/4] Destroying existing PostgreSQL container and volumes..." -ForegroundColor Cyan
docker compose down -v

# 2. Boot fresh container
Write-Host "`n[2/4] Starting fresh PostgreSQL container..." -ForegroundColor Cyan
docker compose up -d postgres

# 3. Poll pg_isready until database is accepting connections
Write-Host "  -> Waiting for PostgreSQL readiness..." -ForegroundColor Gray
$maxRetries = 15
$retries = 0
$isReady = $false

while (-not $isReady -and $retries -lt $maxRetries) {
  $output = docker exec self_mgmt_postgres pg_isready -U postgres 2>&1
  if ($LASTEXITCODE -eq 0) {
    $isReady = $true
    Write-Host "  -> PostgreSQL initialized and healthy." -ForegroundColor Green
  } else {
    $retries++
    Start-Sleep -Seconds 1
  }
}

if (-not $isReady) {
  Write-Host "ERROR: PostgreSQL container failed to start in time." -ForegroundColor Red
  exit 1
}

# 4. Migrate both Development and Test databases
Write-Host "`n[3/4] Migrating development database (self_mgmt_dev)..." -ForegroundColor Cyan
npm run db:migrate

Write-Host "`n[4/4] Migrating test database (self_mgmt_test)..." -ForegroundColor Cyan
$env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/self_mgmt_test"
npm run db:migrate
Remove-Item Env:\DATABASE_URL

Write-Host "`nDatabase reset complete! Development and test databases are fresh and migrated.`n" -ForegroundColor Green
