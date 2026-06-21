$ErrorActionPreference = 'Stop'

$rootDir = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $rootDir 'backend'
$frontendDir = Join-Path $rootDir 'frontend'
$backendVenv = Join-Path $backendDir '.venv'
$backendPython = Join-Path (Join-Path $backendVenv 'Scripts') 'python.exe'
$redisUrl = if ([string]::IsNullOrWhiteSpace($env:REDIS_URL)) { 'redis://localhost:6379/0' } else { $env:REDIS_URL }
$processes = @()

function Log([string]$Message) {
  Write-Host "[start_app] $Message"
}

function Require-Cmd([string]$Name) {
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    Log "missing required command: $Name"
    exit 1
  }
}

function Stop-Services {
  $exitCode = $LASTEXITCODE

  if ($processes.Count -eq 0) {
    return
  }

  Log 'stopping services...'
  foreach ($process in $processes) {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }

  Start-Sleep -Seconds 2

  foreach ($process in $processes) {
    if (-not $process.HasExited) {
      Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
    }
  }

  Log 'all services stopped'
  exit $exitCode
}

try {
  Require-Cmd 'node'
  Require-Cmd 'npm'
  Require-Cmd 'redis-cli'

  & redis-cli -u $redisUrl ping *> $null
  if ($LASTEXITCODE -ne 0) {
    Log "Redis is not reachable at $redisUrl. Start Redis first."
    exit 1
  }

  if (-not (Test-Path $backendPython -PathType Leaf)) {
    Log 'backend venv missing at backend/.venv; create it and install deps first'
    exit 1
  }

  if (-not (Test-Path (Join-Path $frontendDir 'node_modules') -PathType Container)) {
    Log "frontend node_modules missing; run 'npm install' in frontend/ first"
    exit 1
  }

  if ([string]::IsNullOrWhiteSpace($env:DATABASE_URL)) {
    Log 'DATABASE_URL is required'
    exit 1
  }

  $env:PYTHONPATH = $backendDir

  Log 'starting backend on http://localhost:5000'
  $processes += Start-Process -FilePath $backendPython -ArgumentList @('wsgi.py') -WorkingDirectory $backendDir -PassThru -NoNewWindow

  Log 'starting worker'
  $processes += Start-Process -FilePath $backendPython -ArgumentList @('-m', 'app.scripts.run_worker') -WorkingDirectory $backendDir -PassThru -NoNewWindow

  Log 'starting frontend on http://localhost:3000'
  $processes += Start-Process -FilePath 'npm.cmd' -ArgumentList @('run', 'dev') -WorkingDirectory $frontendDir -PassThru -NoNewWindow

  Log 'services started. Press Ctrl-C to stop all services safely.'

  # ponytail: one watcher loop is enough here; a process manager would be overkill.
  while ($true) {
    if ($processes | Where-Object { $_.HasExited }) {
      Log 'a service exited; stopping the rest...'
      break
    }

    Start-Sleep -Seconds 1
  }
}
finally {
  if ($processes.Count -gt 0) {
    Stop-Services
  }
}
