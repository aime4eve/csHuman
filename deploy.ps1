# 企业级知识库管理系统部署脚本 (PowerShell版本)
# @author 伍志勇
# 支持多环境部署：dev, prod, prod-cluster, local

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("dev", "prod", "prod-cluster", "local")]
    [string]$Environment,
    
    [switch]$Clean,
    [switch]$Help
)

# 全局变量
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_NAME = "knowledge-system"
$VERSION = "1.0.0"
$BUILD_TIME = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

# 颜色输出函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "[SUCCESS] $Message" "Green"
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "[ERROR] $Message" "Red"
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "[WARNING] $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "[INFO] $Message" "Cyan"
}

# 显示帮助信息
function Show-Help {
    Write-Host @"
企业级知识库管理系统部署脚本

用法:
    .\deploy.ps1 -Environment <env> [选项]

环境:
    dev          开发环境
    prod         生产环境
    prod-cluster 生产集群环境
    local        本地环境

选项:
    -Clean       清理构建缓存和Docker资源
    -Help        显示此帮助信息

示例:
    .\deploy.ps1 -Environment prod
    .\deploy.ps1 -Environment prod-cluster -Clean
"@
}

# 检查命令是否存在
function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# 检查依赖
function Test-Dependencies {
    Write-Info "检查系统依赖..."
    
    $dependencies = @(
        @{Name="docker"; Required=$true},
        @{Name="docker-compose"; Required=$true},
        @{Name="pnpm"; Required=$false},
        @{Name="npm"; Required=$false}
    )
    
    $missing = @()
    
    foreach ($dep in $dependencies) {
        if (Test-Command $dep.Name) {
            Write-Success "$($dep.Name) 已安装"
        } else {
            if ($dep.Required) {
                Write-Error "$($dep.Name) 未安装（必需）"
                $missing += $dep.Name
            } else {
                Write-Warning "$($dep.Name) 未安装（可选）"
            }
        }
    }
    
    if ($missing.Count -gt 0) {
        Write-Error "缺少必需依赖: $($missing -join ', ')"
        Write-Info "请安装缺少的依赖后重试"
        exit 1
    }
    
    Write-Success "依赖检查通过"
}

# 清理缓存
function Clear-Cache {
    Write-Info "清理构建缓存..."
    
    # 清理npm/pnpm缓存
    if (Test-Command "pnpm") {
        pnpm store prune
    } elseif (Test-Command "npm") {
        npm cache clean --force
    }
    
    # 清理Docker资源
    Write-Info "清理Docker资源..."
    docker system prune -f
    docker volume prune -f
    
    # 清理构建目录
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Info "已清理 dist 目录"
    }
    
    Write-Success "缓存清理完成"
}

# 构建生产版本
function Build-Production {
    Write-Info "构建生产版本..."
    
    if (Test-Command "pnpm") {
        pnpm run build:prod
    } else {
        npm run build:prod
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "构建失败"
        exit 1
    }
    
    Write-Success "生产版本构建完成"
}

# 服务健康检查
function Test-ServiceHealth {
    param(
        [string]$ServiceName,
        [int]$Port,
        [int]$MaxAttempts = 30
    )
    
    for ($attempt = 1; $attempt -le $MaxAttempts; $attempt++) {
        try {
            $result = docker-compose ps | Select-String "$ServiceName.*Up"
            if ($result) {
                $connection = Test-NetConnection -ComputerName "localhost" -Port $Port -InformationLevel Quiet
                if ($connection) {
                    return $true
                }
            }
        }
        catch {
            # 忽略错误，继续尝试
        }
        
        Write-Info "等待 $ServiceName 服务启动... ($attempt/$MaxAttempts)"
        Start-Sleep -Seconds 2
    }
    
    return $false
}

# 检查服务状态
function Test-Services {
    Write-Info "检查服务健康状态..."
    
    $services = @(
        @{Name="frontend"; Port=5173},
        @{Name="ai-service"; Port=8000},
        @{Name="postgres"; Port=5432},
        @{Name="redis"; Port=6379}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        if (Test-ServiceHealth -ServiceName $service.Name -Port $service.Port) {
            Write-Success "$($service.Name) 服务运行正常"
        } else {
            Write-Error "$($service.Name) 服务异常"
            $failedServices += $service.Name
        }
    }
    
    if ($failedServices.Count -eq 0) {
        Write-Success "所有服务运行正常"
        return $true
    } else {
        Write-Error "以下服务异常: $($failedServices -join ', ')"
        return $false
    }
}

# 检查集群服务状态
function Test-ClusterServices {
    Write-Info "检查集群服务健康状态..."
    
    $services = @(
        @{Name="nginx-lb"; Port=80; Description="HTTP Load Balancer"},
        @{Name="frontend-1"; Port=80; Description="Frontend Service 1"},
        @{Name="frontend-2"; Port=80; Description="Frontend Service 2"},
        @{Name="ai-service-1"; Port=8000; Description="AI Service 1"},
        @{Name="ai-service-2"; Port=8000; Description="AI Service 2"},
        @{Name="postgres"; Port=5432; Description="PostgreSQL Database"},
        @{Name="redis"; Port=6379; Description="Redis Cache"},
        @{Name="prometheus"; Port=9090; Description="Prometheus Monitor"},
        @{Name="grafana"; Port=3000; Description="Grafana Dashboard"}
    )
    
    $failedServices = @()
    
    foreach ($service in $services) {
        if (Test-ServiceHealth -ServiceName $service.Name -Port $service.Port) {
            Write-Success "$($service.Description) 运行正常"
        } else {
            Write-Error "$($service.Description) 异常"
            $failedServices += $service.Description
        }
    }
    
    if ($failedServices.Count -eq 0) {
        Write-Success "所有集群服务运行正常"
        return $true
    } else {
        Write-Error "以下服务异常: $($failedServices -join ', ')"
        return $false
    }
}

# 开发环境部署
function Deploy-Dev {
    Write-Info "部署到开发环境..."
    
    # 构建开发版本
    Write-Info "构建开发版本..."
    if (Test-Command "pnpm") {
        pnpm run build
    } else {
        npm run build
    }
    
    # 启动开发服务
    Write-Info "启动开发服务..."
    docker-compose -f docker-compose.yml up -d
    
    Write-Success "开发环境部署完成！"
    Write-Info "前端访问地址：http://localhost:5173"
    Write-Info "后端API地址：http://localhost:8080"
    Write-Info "AI服务地址：http://localhost:8000"
}

# 生产环境部署
function Deploy-Prod {
    Write-Info "部署到生产环境..."
    
    # 构建生产版本
    Build-Production
    
    # 停止现有服务
    Write-Info "停止现有服务..."
    docker-compose down
    
    # 清理旧镜像和容器
    Write-Info "清理旧镜像和容器..."
    docker system prune -f
    docker volume prune -f
    
    # 启动生产服务
    Write-Info "启动生产服务..."
    docker-compose up -d --build
    
    # 等待服务启动
    Write-Info "等待服务启动..."
    Start-Sleep -Seconds 30
    
    # 检查服务状态
    Test-Services
    
    Write-Success "生产环境部署完成！"
    Write-Info "服务访问地址：http://localhost"
    Write-Info "AI服务地址：http://localhost:8000"
}

# 生产集群环境部署
function Deploy-ProdCluster {
    Write-Info "部署到生产集群环境..."
    
    # 构建生产版本
    Build-Production
    
    # 停止现有服务
    Write-Info "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down
    
    # 清理系统
    Write-Info "清理系统资源..."
    docker system prune -f
    docker volume prune -f
    
    # 构建所有镜像
    Write-Info "构建所有服务镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动生产集群服务
    Write-Info "启动生产集群服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # 等待服务启动
    Write-Info "等待服务启动..."
    Start-Sleep -Seconds 60
    
    # 检查集群服务状态
    Test-ClusterServices
    
    Write-Success "生产集群环境部署完成！"
    Write-Info "负载均衡器地址：http://localhost:80"
    Write-Info "HTTPS访问地址：https://localhost:443"
    Write-Info "监控面板：http://localhost:3000 (Grafana)"
    Write-Info "指标收集：http://localhost:9090 (Prometheus)"
}

# 本地部署
function Deploy-Local {
    Write-Info "部署到本地环境..."
    
    # 启动本地开发服务
    Write-Info "启动本地开发服务..."
    if (Test-Command "pnpm") {
        Start-Process -NoNewWindow -FilePath "pnpm" -ArgumentList "dev"
    } else {
        Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run", "dev"
    }
    
    Write-Success "本地环境部署完成！"
    Write-Info "开发服务地址：http://localhost:5173"
}

# 部署后检查
function Invoke-PostDeployCheck {
    Write-Info "执行部署后检查..."
    
    # 检查Docker服务状态
    Write-Info "检查Docker服务状态..."
    docker-compose ps
    
    # 检查服务健康状态
    Test-Services
    
    # 显示服务日志摘要
    Write-Info "服务日志摘要："
    docker-compose logs --tail=5 --timestamps
    
    Write-Success "部署后检查完成！"
}

# 主函数
function Main {
    Write-Info "企业级知识库管理系统部署脚本启动"
    Write-Info "环境: $Environment"
    Write-Info "版本: $VERSION"
    Write-Info "构建时间: $BUILD_TIME"
    
    if ($Help) {
        Show-Help
        return
    }
    
    # 检查依赖
    Test-Dependencies
    
    # 清理缓存（如果指定）
    if ($Clean) {
        Clear-Cache
    }
    
    # 根据环境执行部署
    switch ($Environment) {
        "dev" {
            Deploy-Dev
        }
        "prod" {
            Deploy-Prod
            Invoke-PostDeployCheck
        }
        "prod-cluster" {
            Deploy-ProdCluster
            Invoke-PostDeployCheck
        }
        "local" {
            Deploy-Local
        }
    }
    
    Write-Success "部署完成！"
}

# 执行主函数
try {
    Main
}
catch {
    Write-Error "部署过程中发生错误: $($_.Exception.Message)"
    Write-Error $_.ScriptStackTrace
    exit 1
}