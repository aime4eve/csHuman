#!/bin/bash

# 企业级知识库管理系统 - 部署脚本
# @author 伍志勇
# 支持开发、测试、生产环境部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "企业级知识库管理系统部署脚本"
    echo ""
    echo "用法: $0 [选项] [环境]"
    echo ""
    echo "环境:"
    echo "  dev         开发环境部署"
    echo "  test        测试环境部署"
    echo "  prod        生产环境部署"
    echo ""
    echo "选项:"
    echo "  -h, --help     显示帮助信息"
    echo "  -c, --clean    清理构建缓存"
    echo "  -b, --build    仅构建不部署"
    echo "  -d, --deploy   仅部署不构建"
    echo "  -t, --test     运行测试"
    echo "  --no-cache     Docker构建时不使用缓存"
    echo ""
    echo "示例:"
    echo "  $0 dev                    # 开发环境完整部署"
    echo "  $0 prod --clean           # 生产环境部署并清理缓存"
    echo "  $0 test --build           # 仅构建测试环境"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖环境..."
    
    # 检查Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js 未安装，请先安装 Node.js 18+"
        exit 1
    fi
    
    # 检查包管理器
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
    else
        log_error "未找到包管理器，请安装 npm 或 pnpm"
        exit 1
    fi
    
    # 检查Docker
    if ! command -v docker &> /dev/null; then
        log_warning "Docker 未安装，将跳过容器化部署"
        DOCKER_AVAILABLE=false
    else
        DOCKER_AVAILABLE=true
    fi
    
    log_success "依赖检查完成，使用包管理器: $PKG_MANAGER"
}

# 清理缓存
clean_cache() {
    log_info "清理构建缓存..."
    
    # 清理node_modules
    if [ -d "node_modules" ]; then
        rm -rf node_modules
        log_info "已清理 node_modules"
    fi
    
    # 清理构建目录
    if [ -d "dist" ]; then
        rm -rf dist
        log_info "已清理 dist 目录"
    fi
    
    # 清理Docker缓存
    if [ "$DOCKER_AVAILABLE" = true ]; then
        docker system prune -f
        log_info "已清理 Docker 缓存"
    fi
    
    log_success "缓存清理完成"
}

# 安装依赖
install_dependencies() {
    log_info "安装项目依赖..."
    
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm install --frozen-lockfile
    else
        npm ci
    fi
    
    log_success "依赖安装完成"
}

# 运行测试
run_tests() {
    log_info "运行项目测试..."
    
    # TypeScript类型检查
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm run type-check
    else
        npm run type-check
    fi
    
    # 单元测试
    # if [ "$PKG_MANAGER" = "pnpm" ]; then
    #     pnpm run test
    # else
    #     npm run test
    # fi
    
    log_success "测试运行完成"
}

# 构建项目
build_project() {
    log_info "构建项目 (环境: $ENVIRONMENT)..."
    
    # 设置环境变量
    case $ENVIRONMENT in
        "dev")
            export NODE_ENV=development
            export VITE_API_BASE_URL=http://localhost:8080
            ;;
        "test")
            export NODE_ENV=production
            export VITE_API_BASE_URL=http://test-api.example.com
            ;;
        "prod")
            export NODE_ENV=production
            export VITE_API_BASE_URL=https://api.example.com
            ;;
    esac
    
    # 执行构建
    if [ "$PKG_MANAGER" = "pnpm" ]; then
        pnpm run build
    else
        npm run build
    fi
    
    log_success "项目构建完成"
}

# Docker部署
deploy_docker() {
    log_info "使用Docker部署 (环境: $ENVIRONMENT)..."
    
    if [ "$DOCKER_AVAILABLE" != true ]; then
        log_error "Docker不可用，跳过容器化部署"
        return 1
    fi
    
    # 构建Docker镜像
    DOCKER_BUILD_ARGS=""
    if [ "$NO_CACHE" = true ]; then
        DOCKER_BUILD_ARGS="--no-cache"
    fi
    
    docker build $DOCKER_BUILD_ARGS -t knowledge-frontend:$ENVIRONMENT .
    
    # 根据环境选择部署方式
    case $ENVIRONMENT in
        "dev")
            docker-compose -f docker-compose.yml up -d
            ;;
        "test")
            docker-compose -f docker-compose.test.yml up -d
            ;;
        "prod")
            docker-compose -f docker-compose.prod.yml up -d
            ;;
        "prod-cluster")
            deploy_prod_cluster
            ;;
    esac
    
    log_success "Docker部署完成"
}

# 生产集群环境部署
deploy_prod_cluster() {
    log_info "部署到生产集群环境..."
    
    # 停止现有服务
    log_info "停止现有服务..."
    docker-compose -f docker-compose.prod.yml down
    
    # 清理系统
    log_info "清理系统资源..."
    docker system prune -f
    docker volume prune -f
    
    # 构建所有镜像
    log_info "构建所有服务镜像..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # 启动生产集群服务
    log_info "启动生产集群服务..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 60
    
    log_success "生产集群环境部署完成！"
    log_info "负载均衡器地址：http://localhost:80"
    log_info "HTTPS访问地址：https://localhost:443"
    log_info "监控面板：http://localhost:3000 (Grafana)"
    log_info "指标收集：http://localhost:9090 (Prometheus)"
}

# 本地部署
deploy_local() {
    log_info "本地部署 (环境: $ENVIRONMENT)..."
    
    # 启动开发服务器
    if [ "$ENVIRONMENT" = "dev" ]; then
        if [ "$PKG_MANAGER" = "pnpm" ]; then
            pnpm run dev
        else
            npm run dev
        fi
    else
        # 生产环境需要静态文件服务器
        if command -v serve &> /dev/null; then
            serve -s dist -l 3000
        else
            log_warning "未安装 serve，请运行: npm install -g serve"
            log_info "或手动部署 dist 目录到Web服务器"
        fi
    fi
}

# 服务健康检查
check_services() {
    log_info "检查服务健康状态..."
    
    local services=("frontend:5173" "ai-service:8000" "postgres:5432" "redis:6379")
    local failed_services=()
    
    for service in "${services[@]}"; do
        local name=${service%:*}
        local port=${service#*:}
        
        if check_service_health "$name" "$port"; then
            log_success "$name 服务运行正常"
        else
            log_error "$name 服务异常"
            failed_services+=("$name")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有服务运行正常"
        return 0
    else
        log_error "以下服务异常: ${failed_services[*]}"
        return 1
    fi
}

# 集群服务健康检查
check_cluster_services() {
    log_info "检查集群服务健康状态..."
    
    local services=(
        "nginx-lb:80:HTTP负载均衡器"
        "frontend-1:80:前端服务1"
        "frontend-2:80:前端服务2"
        "ai-service-1:8000:AI服务1"
        "ai-service-2:8000:AI服务2"
        "postgres:5432:PostgreSQL数据库"
        "redis:6379:Redis缓存"
        "prometheus:9090:Prometheus监控"
        "grafana:3000:Grafana面板"
    )
    
    local failed_services=()
    
    for service in "${services[@]}"; do
        local name=${service%%:*}
        local port=$(echo $service | cut -d':' -f2)
        local desc=$(echo $service | cut -d':' -f3)
        
        if check_service_health "$name" "$port"; then
            log_success "$desc 运行正常"
        else
            log_error "$desc 异常"
            failed_services+=("$desc")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "所有集群服务运行正常"
        return 0
    else
        log_error "以下服务异常: ${failed_services[*]}"
        return 1
    fi
}

# 单个服务健康检查
check_service_health() {
    local service_name=$1
    local port=$2
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps | grep -q "$service_name.*Up"; then
            if nc -z localhost "$port" 2>/dev/null; then
                return 0
            fi
        fi
        
        log_info "等待 $service_name 服务启动... ($attempt/$max_attempts)"
        sleep 2
        ((attempt++))
    done
    
    return 1
}

# 部署后检查
post_deploy_check() {
    log_info "执行部署后检查..."
    
    # 检查Docker服务状态
    log_info "检查Docker服务状态..."
    docker-compose ps
    
    # 检查服务健康状态
    check_services
    
    # 显示服务日志摘要
    log_info "服务日志摘要："
    docker-compose logs --tail=5 --timestamps
    
    # 显示服务信息
    case $ENVIRONMENT in
        "dev")
            log_info "开发环境访问地址: http://localhost:5173"
            ;;
        "test")
            log_info "测试环境访问地址: http://localhost:3000"
            ;;
        "prod")
            log_info "生产环境访问地址: http://localhost"
            ;;
    esac
    
    log_success "部署后检查完成！"
}

# 主函数
main() {
    # 默认值
    ENVIRONMENT="dev"
    CLEAN_CACHE=false
    BUILD_ONLY=false
    DEPLOY_ONLY=false
    RUN_TESTS=false
    NO_CACHE=false
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--clean)
                CLEAN_CACHE=true
                shift
                ;;
            -b|--build)
                BUILD_ONLY=true
                shift
                ;;
            -d|--deploy)
                DEPLOY_ONLY=true
                shift
                ;;
            -t|--test)
                RUN_TESTS=true
                shift
                ;;
            --no-cache)
                NO_CACHE=true
                shift
                ;;
            dev|test|prod|prod-cluster)
                ENVIRONMENT=$1
                shift
                ;;
            *)
                log_error "未知参数: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    log_info "开始部署企业级知识库管理系统 (环境: $ENVIRONMENT)"
    
    # 检查依赖
    check_dependencies
    
    # 清理缓存
    if [ "$CLEAN_CACHE" = true ]; then
        clean_cache
    fi
    
    # 仅部署模式
    if [ "$DEPLOY_ONLY" = true ]; then
        deploy_docker || deploy_local
        post_deploy_check
        exit 0
    fi
    
    # 安装依赖
    install_dependencies
    
    # 运行测试
    if [ "$RUN_TESTS" = true ]; then
        run_tests
    fi
    
    # 构建项目
    build_project
    
    # 仅构建模式
    if [ "$BUILD_ONLY" = true ]; then
        log_success "构建完成，跳过部署"
        exit 0
    fi
    
    # 部署
    deploy_docker || deploy_local
    
    # 部署后检查
    post_deploy_check
    
    log_success "部署完成！"
}

# 捕获中断信号
trap 'log_error "部署被中断"; exit 1' INT TERM

# 执行主函数
main "$@"