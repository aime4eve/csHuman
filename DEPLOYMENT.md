# 企业级知识库管理系统 - 部署指南

> **作者**: 伍志勇  
> **更新时间**: 2025年1月27日

## 📋 目录

- [系统要求](#系统要求)
- [快速开始](#快速开始)
- [部署方式](#部署方式)
- [环境配置](#环境配置)
- [Docker部署](#docker部署)
- [生产环境部署](#生产环境部署)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)

## 🔧 系统要求

### 基础环境
- **Node.js**: 18.0+ (推荐 18.19.0 LTS)
- **包管理器**: pnpm 8.0+ 或 npm 9.0+
- **Docker**: 20.10+ (可选，用于容器化部署)
- **Docker Compose**: 2.0+ (可选)

### 服务器要求
- **CPU**: 2核心以上
- **内存**: 4GB以上 (推荐8GB)
- **存储**: 20GB以上可用空间
- **操作系统**: Linux (Ubuntu 20.04+/CentOS 8+) 或 Windows Server 2019+

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd knowledge-management-system
```

### 2. 安装依赖
```bash
# 使用 pnpm (推荐)
pnpm install

# 或使用 npm
npm install
```

### 3. 启动开发环境
```bash
# 使用部署脚本
bash deploy.sh dev

# 或直接使用 npm scripts
pnpm run dev
```

### 4. 访问应用
打开浏览器访问: http://localhost:5173

## 🏗️ 部署方式

### 方式一: 使用部署脚本 (推荐)

部署脚本 `deploy.sh` 提供了完整的部署流程:

```bash
# 开发环境部署
bash deploy.sh dev

# 测试环境部署
bash deploy.sh test

# 生产环境部署
bash deploy.sh prod

# 仅构建不部署
bash deploy.sh --build

# 清理缓存后部署
bash deploy.sh prod --clean

# 查看帮助
bash deploy.sh --help
```

### 方式二: 使用 npm scripts

```bash
# 构建项目
pnpm run build

# 预览构建结果
pnpm run preview

# 不同环境构建
pnpm run build:dev    # 开发环境
pnpm run build:test   # 测试环境
pnpm run build:prod   # 生产环境
```

### 方式三: Docker 部署

```bash
# 构建 Docker 镜像
pnpm run docker:build

# 启动容器
pnpm run docker:up

# 查看日志
pnpm run docker:logs

# 停止容器
pnpm run docker:down
```

## ⚙️ 环境配置

### 环境变量

创建 `.env` 文件配置环境变量:

```env
# 应用配置
VITE_APP_TITLE=企业级知识库管理系统
VITE_APP_VERSION=1.0.0

# API配置
VITE_API_BASE_URL=http://localhost:8080
VITE_API_TIMEOUT=30000

# 功能开关
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=false

# 第三方服务
VITE_UPLOAD_MAX_SIZE=10485760
VITE_SUPPORTED_FILE_TYPES=pdf,doc,docx,txt,md,jpg,png,gif
```

### 不同环境配置

#### 开发环境 (.env.development)
```env
VITE_API_BASE_URL=http://localhost:8080
VITE_ENABLE_MOCK=true
VITE_ENABLE_DEBUG=true
```

#### 测试环境 (.env.test)
```env
VITE_API_BASE_URL=http://test-api.example.com
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=true
```

#### 生产环境 (.env.production)
```env
VITE_API_BASE_URL=https://api.example.com
VITE_ENABLE_MOCK=false
VITE_ENABLE_DEBUG=false
```

## 🐳 Docker 部署

### 单容器部署

```bash
# 构建镜像
docker build -t knowledge-frontend .

# 运行容器
docker run -d \
  --name knowledge-frontend \
  -p 80:80 \
  -e VITE_API_BASE_URL=https://api.example.com \
  knowledge-frontend
```

### Docker Compose 部署

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f frontend

# 停止服务
docker-compose down
```

### 服务配置

`docker-compose.yml` 包含以下服务:
- **frontend**: React 前端应用
- **backend**: Spring Boot 后端服务 (占位符)
- **postgres**: PostgreSQL 数据库
- **redis**: Redis 缓存

## 🏭 生产环境部署

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. 部署应用

```bash
# 克隆代码
git clone <repository-url> /opt/knowledge-system
cd /opt/knowledge-system

# 配置环境变量
cp .env.example .env.production
vim .env.production

# 部署应用
bash deploy.sh prod
```

### 3. 配置反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. 配置 HTTPS (Let's Encrypt)

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 设置自动续期
sudo crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📊 监控和维护

### 健康检查

```bash
# 检查应用状态
curl -f http://localhost/health

# 检查 Docker 容器状态
docker ps
docker stats

# 查看应用日志
docker-compose logs -f --tail=100
```

### 备份策略

```bash
# 数据库备份
docker exec knowledge-postgres pg_dump -U knowledge_user knowledge_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 文件备份
tar -czf uploads_backup_$(date +%Y%m%d_%H%M%S).tar.gz uploads/
```

### 更新部署

```bash
# 拉取最新代码
git pull origin main

# 重新部署
bash deploy.sh prod --clean

# 或使用 Docker
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 清理缓存
pnpm run clean
rm -rf node_modules
pnpm install

# 检查 Node.js 版本
node --version  # 应该 >= 18.0.0
```

#### 2. Docker 构建失败
```bash
# 清理 Docker 缓存
docker system prune -a

# 重新构建
docker build --no-cache -t knowledge-frontend .
```

#### 3. 端口冲突
```bash
# 查看端口占用
netstat -tulpn | grep :80
lsof -i :80

# 修改端口配置
vim docker-compose.yml
# 或
vim .env
```

#### 4. 权限问题
```bash
# 修复文件权限
sudo chown -R $USER:$USER .
chmod +x deploy.sh
```

### 日志查看

```bash
# 应用日志
docker-compose logs -f frontend

# Nginx 日志
docker-compose logs -f nginx

# 数据库日志
docker-compose logs -f postgres

# 系统日志
sudo journalctl -u docker -f
```

### 性能优化

1. **启用 Gzip 压缩**: 已在 `nginx.conf` 中配置
2. **静态资源缓存**: 已配置长期缓存策略
3. **代码分割**: Vite 自动进行代码分割
4. **图片优化**: 建议使用 WebP 格式
5. **CDN 加速**: 生产环境建议使用 CDN

## 📞 技术支持

如遇到部署问题，请检查:

1. **系统要求**: 确保满足最低系统要求
2. **网络连接**: 确保能访问外部资源
3. **权限设置**: 确保有足够的文件和端口权限
4. **日志信息**: 查看详细的错误日志
5. **配置文件**: 检查环境变量和配置文件

---

**注意**: 本部署指南基于当前项目结构，实际部署时请根据具体环境调整配置。