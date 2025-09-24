# 部署检查脚本
# @author 伍志勇

param(
    [string]$Environment = "test"
)

Write-Host "Starting deployment check for environment: $Environment" -ForegroundColor Cyan

$allPassed = $true

# 检查文件
Write-Host "Checking files..." -ForegroundColor Cyan

if (Test-Path "package.json") {
    Write-Host "package.json: OK" -ForegroundColor Green
} else {
    Write-Host "package.json: MISSING" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "Dockerfile") {
    Write-Host "Dockerfile: OK" -ForegroundColor Green
} else {
    Write-Host "Dockerfile: MISSING" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "docker-compose.yml") {
    Write-Host "docker-compose.yml: OK" -ForegroundColor Green
} else {
    Write-Host "docker-compose.yml: MISSING" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "nginx.conf") {
    Write-Host "nginx.conf: OK" -ForegroundColor Green
} else {
    Write-Host "nginx.conf: MISSING" -ForegroundColor Red
    $allPassed = $false
}

# 检查Node.js
Write-Host "Checking Node.js..." -ForegroundColor Cyan
$nodeVersion = $null
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js: NOT FOUND" -ForegroundColor Red
    $allPassed = $false
}

# 检查pnpm
$pnpmVersion = $null
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host "pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "pnpm: NOT FOUND" -ForegroundColor Yellow
}

# 检查依赖
Write-Host "Checking dependencies..." -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "Dependencies: INSTALLED" -ForegroundColor Green
} else {
    Write-Host "Dependencies: NOT INSTALLED" -ForegroundColor Yellow
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    
    if ($pnpmVersion) {
        pnpm install
    } else {
        npm install
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Dependencies: INSTALLED" -ForegroundColor Green
    } else {
        Write-Host "Dependencies: INSTALL FAILED" -ForegroundColor Red
        $allPassed = $false
    }
}

# 测试构建
Write-Host "Testing build..." -ForegroundColor Cyan

if ($pnpmVersion) {
    pnpm run build:prod
} else {
    npm run build:prod
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build: SUCCESS" -ForegroundColor Green
    
    if (Test-Path "dist") {
        Write-Host "Build output: CREATED" -ForegroundColor Green
    }
} else {
    Write-Host "Build: FAILED" -ForegroundColor Red
    $allPassed = $false
}

# 生成报告
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$report = @(
    "Deployment Check Report",
    "Time: $timestamp",
    "Environment: $Environment",
    "",
    "File Status:",
    "- package.json: $(if (Test-Path 'package.json') { 'OK' } else { 'MISSING' })",
    "- Dockerfile: $(if (Test-Path 'Dockerfile') { 'OK' } else { 'MISSING' })",
    "- docker-compose.yml: $(if (Test-Path 'docker-compose.yml') { 'OK' } else { 'MISSING' })",
    "- nginx.conf: $(if (Test-Path 'nginx.conf') { 'OK' } else { 'MISSING' })",
    "- dist: $(if (Test-Path 'dist') { 'OK' } else { 'MISSING' })"
)

$report | Out-File "deployment-check.txt" -Encoding UTF8
Write-Host "Report saved: deployment-check.txt" -ForegroundColor Green

# 结果
if ($allPassed) {
    Write-Host "All checks passed! Ready for deployment." -ForegroundColor Green
    Write-Host "Next: docker-compose up -d" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "Some checks failed. See messages above." -ForegroundColor Red
    exit 1
}