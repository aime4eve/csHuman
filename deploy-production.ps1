# 生产环境部署脚本
# @author 伍志勇

param(
    [string]$Port = "3000",
    [string]$Environment = "production"
)

Write-Host "Starting production deployment..." -ForegroundColor Cyan
Write-Host "Port: $Port" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor Cyan

# 停止现有的开发服务器
Write-Host "Stopping development server..." -ForegroundColor Yellow
try {
    $devProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*pnpm dev*" -or $_.CommandLine -like "*npm run dev*" }
    if ($devProcesses) {
        $devProcesses | Stop-Process -Force
        Write-Host "Development server stopped" -ForegroundColor Green
    } else {
        Write-Host "No development server running" -ForegroundColor Green
    }
} catch {
    Write-Host "Could not stop development server" -ForegroundColor Yellow
}

# 清理旧的构建
Write-Host "Cleaning old build..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
    Write-Host "Old build cleaned" -ForegroundColor Green
}

# 安装依赖
Write-Host "Installing dependencies..." -ForegroundColor Cyan
if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    pnpm install --frozen-lockfile
} else {
    npm ci
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Dependencies installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "Dependencies installed" -ForegroundColor Green

# 构建生产版本
Write-Host "Building production version..." -ForegroundColor Cyan
if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
    pnpm run build:prod
} else {
    npm run build:prod
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Production build failed" -ForegroundColor Red
    exit 1
}
Write-Host "Production build completed" -ForegroundColor Green

# 验证构建输出
if (-not (Test-Path "dist")) {
    Write-Host "Build output directory not found" -ForegroundColor Red
    exit 1
}

$distFiles = Get-ChildItem "dist" -Recurse
Write-Host "Build output: $($distFiles.Count) files" -ForegroundColor Green

# 创建生产服务器脚本
Write-Host "Creating production server..." -ForegroundColor Cyan

$serverScript = @"
// 生产环境服务器
// @author 伍志勇

const express = require('express');
const path = require('path');
const compression = require('compression');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || $Port;

// 安全中间件
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.example.com"]
        }
    }
}));

// 压缩中间件
app.use(compression());

// 静态文件服务
app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    etag: true,
    lastModified: true
}));

// API 路由（如果需要）
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: '$Environment'
    });
});

// SPA 路由处理
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 Production server running on port `${PORT}`);
    console.log(`📁 Serving files from: `${path.join(__dirname, 'dist')}`);
    console.log(`🌍 Environment: $Environment`);
    console.log(`⏰ Started at: `${new Date().toISOString()}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully');
    process.exit(0);
});
"@

$serverScript | Out-File -FilePath "server.js" -Encoding UTF8
Write-Host "Production server script created" -ForegroundColor Green

# 检查必要的依赖
Write-Host "Checking server dependencies..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json

$requiredDeps = @("express", "compression", "helmet")
$missingDeps = @()

foreach ($dep in $requiredDeps) {
    if (-not $packageJson.dependencies.$dep -and -not $packageJson.devDependencies.$dep) {
        $missingDeps += $dep
    }
}

if ($missingDeps.Count -gt 0) {
    Write-Host "Installing missing server dependencies: $($missingDeps -join ', ')" -ForegroundColor Yellow
    
    foreach ($dep in $missingDeps) {
        if (Get-Command "pnpm" -ErrorAction SilentlyContinue) {
            pnpm add $dep
        } else {
            npm install $dep
        }
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Failed to install $dep" -ForegroundColor Red
            exit 1
        }
    }
    Write-Host "Server dependencies installed" -ForegroundColor Green
} else {
    Write-Host "All server dependencies available" -ForegroundColor Green
}

# 创建启动脚本
$startScript = @"
@echo off
echo Starting production server...
node server.js
"@

$startScript | Out-File -FilePath "start-production.bat" -Encoding ASCII
Write-Host "Start script created: start-production.bat" -ForegroundColor Green

# 创建PM2配置（如果需要）
$pm2Config = @"
{
  "name": "knowledge-system",
  "script": "server.js",
  "instances": 1,
  "exec_mode": "cluster",
  "env": {
    "NODE_ENV": "$Environment",
    "PORT": "$Port"
  },
  "log_file": "./logs/app.log",
  "error_file": "./logs/error.log",
  "out_file": "./logs/out.log",
  "log_date_format": "YYYY-MM-DD HH:mm:ss",
  "merge_logs": true,
  "max_memory_restart": "1G"
}
"@

$pm2Config | Out-File -FilePath "ecosystem.config.json" -Encoding UTF8
Write-Host "PM2 config created: ecosystem.config.json" -ForegroundColor Green

# 创建日志目录
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs"
    Write-Host "Logs directory created" -ForegroundColor Green
}

# 生成部署报告
$timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
$deployReport = @(
    "Production Deployment Report",
    "Generated: $timestamp",
    "Environment: $Environment",
    "Port: $Port",
    "",
    "Build Status: SUCCESS",
    "Server Script: CREATED",
    "Start Script: CREATED",
    "PM2 Config: CREATED",
    "Logs Directory: CREATED",
    "",
    "Files:",
    "- dist/: $(if (Test-Path 'dist') { 'OK' } else { 'MISSING' })",
    "- server.js: $(if (Test-Path 'server.js') { 'OK' } else { 'MISSING' })",
    "- start-production.bat: $(if (Test-Path 'start-production.bat') { 'OK' } else { 'MISSING' })",
    "- ecosystem.config.json: $(if (Test-Path 'ecosystem.config.json') { 'OK' } else { 'MISSING' })",
    "",
    "Next Steps:",
    "1. Start server: node server.js",
    "2. Or use batch: start-production.bat",
    "3. Or use PM2: pm2 start ecosystem.config.json",
    "4. Access: http://localhost:$Port",
    "5. Health check: http://localhost:$Port/api/health"
)

$deployReport | Out-File "production-deployment.txt" -Encoding UTF8
Write-Host "Deployment report saved: production-deployment.txt" -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "🎉 Production deployment completed successfully!" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "To start the server:" -ForegroundColor Cyan
Write-Host "  node server.js" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Or use the batch file:" -ForegroundColor Cyan
Write-Host "  start-production.bat" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Server will be available at:" -ForegroundColor Cyan
Write-Host "  http://localhost:$Port" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Health check endpoint:" -ForegroundColor Cyan
Write-Host "  http://localhost:$Port/api/health" -ForegroundColor White
Write-Host "" -ForegroundColor White

exit 0