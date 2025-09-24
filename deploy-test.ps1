# 企业级知识库管理系统部署测试脚本
# @author 伍志勇

param(
    [string]$Environment = "test"
)

# 颜色输出函数
function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

# 检查部署文件
function Test-DeploymentFiles {
    Write-Info "Checking deployment files..."
    
    $files = @(
        "package.json",
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.prod.yml",
        "Dockerfile.ai",
        "nginx.conf",
        "nginx-lb.conf",
        "deploy.sh",
        "deploy.ps1"
    )
    
    $allExist = $true
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file exists"
        } else {
            Write-Error "$file missing"
            $allExist = $false
        }
    }
    
    return $allExist
}

# 检查Node.js环境
function Test-NodeEnvironment {
    Write-Info "Checking Node.js environment..."
    
    try {
        $nodeVersion = & node --version 2>$null
        if ($nodeVersion) {
            Write-Success "Node.js version: $nodeVersion"
        } else {
            Write-Error "Node.js not found"
            return $false
        }
    } catch {
        Write-Error "Node.js not installed"
        return $false
    }
    
    try {
        $pnpmVersion = & pnpm --version 2>$null
        if ($pnpmVersion) {
            Write-Success "pnpm version: $pnpmVersion"
            return $true
        }
    } catch {
        # pnpm not found, try npm
    }
    
    try {
        $npmVersion = & npm --version 2>$null
        if ($npmVersion) {
            Write-Success "npm version: $npmVersion"
            return $true
        }
    } catch {
        Write-Error "No package manager found"
        return $false
    }
    
    return $false
}

# 测试构建流程
function Test-BuildProcess {
    Write-Info "Testing build process..."
    
    # 检查依赖
    if (Test-Path "node_modules") {
        Write-Success "Dependencies already installed"
    } else {
        Write-Info "Installing dependencies..."
        
        if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
            & pnpm install
        } else {
            & npm install
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Dependencies installation failed"
            return $false
        }
    }
    
    # 测试生产构建
    Write-Info "Testing production build..."
    
    if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
        & pnpm run build:prod
    } else {
        & npm run build:prod
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Production build failed"
        return $false
    }
    
    Write-Success "Production build successful"
    
    # 检查构建输出
    if (Test-Path "dist") {
        $distFiles = Get-ChildItem "dist" -Recurse | Measure-Object
        Write-Success "Build output: $($distFiles.Count) files"
        return $true
    } else {
        Write-Error "Build output directory does not exist"
        return $false
    }
}

# 验证配置文件
function Test-ConfigFiles {
    Write-Info "Validating configuration files..."
    
    # 检查package.json
    if (Test-Path "package.json") {
        try {
            $packageJson = Get-Content "package.json" | ConvertFrom-Json
            
            $requiredScripts = @("dev", "build", "build:prod")
            $allScriptsExist = $true
            
            foreach ($script in $requiredScripts) {
                if ($packageJson.scripts.$script) {
                    Write-Success "Script '$script' configured"
                } else {
                    Write-Error "Script '$script' missing"
                    $allScriptsExist = $false
                }
            }
            
            if ($allScriptsExist) {
                Write-Success "package.json scripts configuration complete"
            }
        } catch {
            Write-Error "Failed to parse package.json"
            return $false
        }
    }
    
    # 检查Dockerfile
    if (Test-Path "Dockerfile") {
        $dockerfileContent = Get-Content "Dockerfile" -Raw
        if ($dockerfileContent -match "FROM" -and $dockerfileContent -match "COPY" -and $dockerfileContent -match "CMD") {
            Write-Success "Dockerfile syntax check passed"
        } else {
            Write-Error "Dockerfile syntax may have issues"
        }
    }
    
    return $true
}

# 生成部署报告
function New-DeploymentReport {
    Write-Info "Generating deployment report..."
    
    $dockerfileStatus = if (Test-Path 'Dockerfile') { 'OK' } else { 'MISSING' }
    $composeStatus = if (Test-Path 'docker-compose.yml') { 'OK' } else { 'MISSING' }
    $composeProdStatus = if (Test-Path 'docker-compose.prod.yml') { 'OK' } else { 'MISSING' }
    $nginxStatus = if (Test-Path 'nginx.conf') { 'OK' } else { 'MISSING' }
    $nginxLbStatus = if (Test-Path 'nginx-lb.conf') { 'OK' } else { 'MISSING' }
    $deployStatus = if (Test-Path 'deploy.ps1') { 'OK' } else { 'MISSING' }
    $distStatus = if (Test-Path 'dist') { 'OK' } else { 'MISSING' }
    $nodeModulesStatus = if (Test-Path 'node_modules') { 'OK' } else { 'MISSING' }
    
    $currentTime = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    
    $reportLines = @(
        "Enterprise Knowledge Base Management System Deployment Report",
        "============================================================",
        "",
        "Generated: $currentTime",
        "Environment: $Environment",
        "",
        "Deployment Files Status:",
        "- Dockerfile: $dockerfileStatus",
        "- docker-compose.yml: $composeStatus",
        "- docker-compose.prod.yml: $composeProdStatus",
        "- nginx.conf: $nginxStatus",
        "- nginx-lb.conf: $nginxLbStatus",
        "- deploy.ps1: $deployStatus",
        "",
        "Build Status:",
        "- dist directory: $distStatus",
        "- node_modules: $nodeModulesStatus",
        "",
        "Recommended Deployment Steps:",
        "1. Ensure Docker and Docker Compose are installed",
        "2. Run: docker-compose up -d (development)",
        "3. Run: docker-compose -f docker-compose.prod.yml up -d (production)",
        "4. Access: http://localhost (frontend)",
        "5. Access: http://localhost:8000 (AI service)",
        "",
        "Notes:",
        "- Production environment requires SSL certificate configuration",
        "- Environment variables need to be configured",
        "- Load balancer configuration is recommended"
    )
    
    $reportLines | Out-File -FilePath "deployment-report.txt" -Encoding UTF8
    Write-Success "Deployment report generated: deployment-report.txt"
}

# 主函数
function Main {
    Write-Info "Enterprise Knowledge Base Management System Deployment Test Started"
    Write-Info "Test Environment: $Environment"
    
    $allPassed = $true
    
    # 检查部署文件
    if (-not (Test-DeploymentFiles)) {
        $allPassed = $false
    }
    
    # 检查Node.js环境
    if (-not (Test-NodeEnvironment)) {
        $allPassed = $false
    }
    
    # 验证配置文件
    if (-not (Test-ConfigFiles)) {
        $allPassed = $false
    }
    
    # 测试构建流程
    if (-not (Test-BuildProcess)) {
        $allPassed = $false
    }
    
    # 生成部署报告
    New-DeploymentReport
    
    if ($allPassed) {
        Write-Success "All tests passed! Deployment configuration ready."
        Write-Info "You can deploy using the following commands:"
        Write-Info "  Development: docker-compose up -d"
        Write-Info "  Production: docker-compose -f docker-compose.prod.yml up -d"
    } else {
        Write-Error "Some tests failed, please check the error messages above."
    }
    
    return $allPassed
}

# 执行主函数
try {
    $result = Main
    if ($result) {
        exit 0
    } else {
        exit 1
    }
} catch {
    Write-Error "Error occurred during testing: $($_.Exception.Message)"
    exit 1
}