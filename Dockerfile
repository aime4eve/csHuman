# 企业级知识库管理系统 - 前端部署配置
# @author 伍志勇
# 多阶段构建：构建阶段 + 生产阶段

# 构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装pnpm
RUN npm install -g pnpm@latest

# 复制package文件
COPY package.json pnpm-lock.yaml ./

# 安装依赖（仅生产依赖）
RUN pnpm install --frozen-lockfile --prod=false

# 复制源代码
COPY . .

# 设置生产环境变量
ENV NODE_ENV=production
ENV VITE_API_BASE_URL=https://api.example.com

# 构建生产版本
RUN pnpm run build:prod

# 清理不必要文件
RUN rm -rf node_modules src public

# 生产阶段
FROM nginx:alpine AS production

# 安装必要工具和安全更新
RUN apk add --no-cache curl tzdata && \
    apk upgrade --no-cache

# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 创建非root用户
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# 复制nginx配置
COPY nginx.conf /etc/nginx/nginx.conf

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 创建必要目录
RUN mkdir -p /var/log/nginx /var/cache/nginx /var/run/nginx && \
    touch /var/run/nginx.pid

# 设置权限
RUN chown -R appuser:appgroup /usr/share/nginx/html && \
    chown -R appuser:appgroup /var/log/nginx && \
    chown -R appuser:appgroup /var/cache/nginx && \
    chown -R appuser:appgroup /var/run/nginx && \
    chmod -R 755 /usr/share/nginx/html

# 切换到非root用户
USER appuser

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]