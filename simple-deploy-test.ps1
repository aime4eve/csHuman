# 简化的部署测试脚本
# @author 伍志勇

param(
    [string]$Environment = "test"
)

Write-Host "[INFO] Starting deployment test for environment: $Environment" -ForegroundColor Cyan

# 检查关键文件
Write-Host "[INFO] Checking deployment files..." -ForegroundColor Cyan
$allPassed = $true

if (Test-Path "package.json") {
    Write-Host "[SUCCESS] package.json exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] package.json missing" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "Dockerfile") {
    Write-Host "[SUCCESS] Dockerfile exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Dockerfile missing" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "docker-compose.yml") {
    Write-Host "[SUCCESS] docker-compose.yml exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] docker-compose.yml missing" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "docker-compose.prod.yml") {
    Write-Host "[SUCCESS] docker-compose.prod.yml exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] docker-compose.prod.yml missing" -ForegroundColor Red
    $allPassed = $false
}

if (Test-Path "nginx.conf") {
    Write-Host "[SUCCESS] nginx.conf exists" -ForegroundColor Green
} else {
    Write-Host "[ERROR] nginx.conf missing" -ForegroundColor Red
    $allPassed = $false
}

# 检查Node.js
Write-Host "[INFO] Checking Node.js environment..." -ForegroundColor Cyan
$nodeCheck = $null
try {
    $nodeCheck = & node --version 2>$null
}
catch {
    # Node.js not found
}

if ($nodeCheck) {
    Write-Host "[SUCCESS] Node.js version: $nodeCheck" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Node.js not found" -ForegroundColor Red
    $allPassed = $false
}

# 检查包管理器
$pnpmCheck = $null
try {
    $pnpmCheck = & pnpm --version 2>$null
}
catch {
    # pnpm not found
}

if ($pnpmCheck) {
    Write-Host "[SUCCESS] pnpm version: $pnpmCheck" -ForegroundColor Green
} else {
    $npmCheck = $null
    try {
        $npmCheck = & npm --version 2>$null
    }
    catch {
        # npm not found
    }
    
    if ($npmCheck) {
        Write-Host "[SUCCESS] npm version: $npmCheck" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] No package manager found" -ForegroundColor Red
        $allPassed = $false
    }
}

# 检查依赖
if (Test-Path "node_modules") {
    Write-Host "[SUCCESS] Dependencies already installed" -ForegroundColor Green
} else {
    Write-Host "[INFO] Installing dependencies..." -ForegroundColor Cyan
    
    if ($pnpmCheck) {
        & pnpm install
    } else {
        & npm install
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Dependencies installed" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Dependencies installation failed" -ForegroundColor Red
        $allPassed = $false
    }
}

# 测试构建
Write-Host "[INFO] Testing production build..." -ForegroundColor Cyan

if ($pnpmCheck) {
    & pnpm run build:prod
} else {
    & npm run build:prod
}

if ($LASTEXITCODE -eq 0) {
    Write-Host "[SUCCESS] Production build successful" -ForegroundColor Green
    
    if (Test-Path "dist") {
        $distFiles = Get-ChildItem "dist" -Recurse | Measure-Object
        Write-Host "[SUCCESS] Build output: $($distFiles.Count) files" -ForegroundColor Green
    }
} else {
    Write-Host "[ERROR] Production build failed" -ForegroundColor Red
    $allPassed = $false
}

# 生成报告
$currentTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$packageStatus = if (Test-Path 'package.json') { 'OK' } else { 'MISSING' }
$dockerfileStatus = if (Test-Path 'Dockerfile') { 'OK' } else { 'MISSING' }
$composeStatus = if (Test-Path 'docker-compose.yml') { 'OK' } else { 'MISSING' }
$nginxStatus = if (Test-Path 'nginx.conf') { 'OK' } else { 'MISSING' }
$distStatus = if (Test-Path 'dist') { 'OK' } else { 'MISSING' }

$reportLines = @()
$reportLines += "Deployment Test Report"
$reportLines += "Generated: $currentTime"
$reportLines += "Environment: $Environment"
$reportLines += ""
$reportLines += "Files Status:"
$reportLines += "- package.json: $packageStatus"
$reportLines += "- Dockerfile: $dockerfileStatus"
$reportLines += "- docker-compose.yml: $composeStatus"
$reportLines += "- nginx.conf: $nginxStatus"
$reportLines += "- dist: $distStatus"

$reportLines | Out-File -FilePath "deployment-report.txt" -Encoding UTF8
Write-Host "[SUCCESS] Report generated: deployment-report.txt" -ForegroundColor Green

# 最终结果
if ($allPassed) {
    Write-Host "[SUCCESS] All tests passed! Deployment ready." -ForegroundColor Green
    Write-Host "[INFO] Next steps:" -ForegroundColor Cyan
    Write-Host "  - Development: docker-compose up -d" -ForegroundColor Cyan
    Write-Host "  - Production: docker-compose -f docker-compose.prod.yml up -d" -ForegroundColor Cyan
    exit 0
} else {
    Write-Host "[ERROR] Some tests failed. Check messages above." -ForegroundColor Red
    exit 1
}