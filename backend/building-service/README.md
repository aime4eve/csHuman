# 建筑管理服务 (Building Service)

基于DDD架构设计的建筑管理微服务，提供建筑物、楼层、房间和设备分配的完整管理功能。

## 项目概述

本服务是智慧建筑管理平台的核心微服务之一，负责管理建筑物的基础信息、空间结构和设备分配。采用领域驱动设计(DDD)架构，确保业务逻辑的清晰性和可维护性。

### 主要功能

- **建筑物管理**: 创建、更新、删除和查询建筑物信息
- **楼层管理**: 为建筑物添加和管理楼层结构
- **房间管理**: 管理楼层内的房间信息
- **设备分配**: 将IoT设备分配到指定建筑物
- **地理位置服务**: 基于坐标的附近建筑物搜索
- **统计分析**: 提供建筑物和设备的统计信息

## 技术架构

### 架构模式
- **领域驱动设计 (DDD)**: 清晰的领域边界和业务逻辑封装
- **CQRS模式**: 命令查询职责分离
- **事件驱动**: 领域事件发布和处理
- **微服务架构**: 独立部署和扩展

### 技术栈
- **Java 17+**: 编程语言
- **Spring Boot 2.7+**: 应用框架
- **Spring Cloud**: 微服务框架
- **Spring Data JPA**: 数据访问层
- **PostgreSQL**: 主数据库
- **Redis**: 缓存和会话存储
- **Apache Kafka**: 消息队列
- **Eureka**: 服务注册与发现
- **Docker**: 容器化部署

### 项目结构

```
building-service/
├── src/main/java/com/mclimate/building/
│   ├── domain/                    # 领域层
│   │   ├── model/                # 领域模型
│   │   ├── repository/           # 仓储接口
│   │   ├── service/              # 领域服务
│   │   └── event/                # 领域事件
│   ├── application/              # 应用层
│   │   ├── command/              # 命令对象
│   │   ├── dto/                  # 数据传输对象
│   │   ├── query/                # 查询对象
│   │   └── BuildingApplicationService.java
│   ├── infrastructure/           # 基础设施层
│   │   ├── repository/           # 仓储实现
│   │   └── entity/               # JPA实体
│   ├── interfaces/               # 接口层
│   │   └── rest/                 # REST控制器
│   └── BuildingServiceApplication.java
├── src/main/resources/
│   ├── application.yml           # 应用配置
│   └── db/migration/             # 数据库迁移脚本
└── src/test/                     # 测试代码
```

## 领域模型

### 核心聚合

#### Building (建筑物聚合根)
- **BuildingId**: 建筑物唯一标识
- **Address**: 地址值对象
- **Coordinates**: 坐标值对象
- **BuildingType**: 建筑物类型枚举
- **BuildingStatus**: 建筑物状态枚举

#### Floor (楼层实体)
- 楼层名称和编号
- 楼层描述信息
- 与建筑物的关联关系

#### DeviceAssignment (设备分配实体)
- 设备基本信息
- 分配状态和时间
- 位置和描述信息

### 值对象
- **BuildingId**: 建筑物标识符
- **Address**: 完整地址信息
- **Coordinates**: 地理坐标

### 领域事件
- **BuildingCreatedEvent**: 建筑物创建事件
- **BuildingUpdatedEvent**: 建筑物更新事件
- **BuildingDeletedEvent**: 建筑物删除事件
- **FloorAddedEvent**: 楼层添加事件
- **DeviceAssignedEvent**: 设备分配事件
- **DeviceUnassignedEvent**: 设备取消分配事件

## API接口

### 建筑物管理

```http
# 创建建筑物
POST /api/v1/buildings
Content-Type: application/json

{
  "name": "测试大厦",
  "description": "现代化办公楼",
  "type": "OFFICE",
  "street": "123 Main Street",
  "city": "Hong Kong",
  "state": "Hong Kong",
  "country": "China",
  "postalCode": "00000",
  "latitude": 22.3193,
  "longitude": 114.1694,
  "totalArea": 15000.0,
  "constructionYear": 2020
}

# 获取建筑物列表
GET /api/v1/buildings?page=0&size=10&name=测试&type=OFFICE

# 获取建筑物详情
GET /api/v1/buildings/{buildingId}

# 更新建筑物
PUT /api/v1/buildings/{buildingId}

# 删除建筑物
DELETE /api/v1/buildings/{buildingId}
```

### 楼层管理

```http
# 添加楼层
POST /api/v1/buildings/{buildingId}/floors
Content-Type: application/json

{
  "name": "1st Floor",
  "floorNumber": 1,
  "description": "一楼大堂"
}
```

### 设备管理

```http
# 分配设备
POST /api/v1/buildings/{buildingId}/devices
Content-Type: application/json

{
  "deviceId": "device-001",
  "deviceName": "温度传感器",
  "deviceType": "TEMPERATURE_SENSOR",
  "location": "1楼大堂",
  "description": "主要入口温度监控"
}

# 获取建筑物设备列表
GET /api/v1/buildings/{buildingId}/devices

# 取消设备分配
DELETE /api/v1/buildings/{buildingId}/devices/{deviceId}
```

### 统计和搜索

```http
# 获取统计信息
GET /api/v1/buildings/statistics

# 搜索附近建筑物
GET /api/v1/buildings/nearby?latitude=22.3193&longitude=114.1694&radiusKm=5.0
```

## 数据库设计

### 主要表结构

- **buildings**: 建筑物主表
- **floors**: 楼层表
- **rooms**: 房间表
- **device_assignments**: 设备分配表

### 索引策略

- 建筑物类型和状态索引
- 地理坐标索引（支持附近搜索）
- 设备分配状态索引
- 外键关联索引

## 部署说明

### 环境要求

- Java 17+
- PostgreSQL 13+
- Redis 6+
- Apache Kafka 2.8+

### 配置文件

主要配置项在 `application.yml` 中：

```yaml
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mclimate_building
    username: ${DB_USERNAME:mclimate}
    password: ${DB_PASSWORD:mclimate123}
  
  redis:
    host: ${REDIS_HOST:localhost}
    port: ${REDIS_PORT:6379}
  
  kafka:
    bootstrap-servers: ${KAFKA_SERVERS:localhost:9092}

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER:http://localhost:8761/eureka/}
```

### Docker部署

```bash
# 构建镜像
docker build -t building-service:1.0.0 .

# 运行容器
docker run -d \
  --name building-service \
  -p 8081:8081 \
  -e DB_USERNAME=mclimate \
  -e DB_PASSWORD=mclimate123 \
  -e REDIS_HOST=redis \
  -e KAFKA_SERVERS=kafka:9092 \
  building-service:1.0.0
```

### Kubernetes部署

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: building-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: building-service
  template:
    metadata:
      labels:
        app: building-service
    spec:
      containers:
      - name: building-service
        image: building-service:1.0.0
        ports:
        - containerPort: 8081
        env:
        - name: DB_USERNAME
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: username
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: password
```

## 开发指南

### 本地开发环境搭建

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd building-service
   ```

2. **启动依赖服务**
   ```bash
   docker-compose up -d postgres redis kafka
   ```

3. **运行应用**
   ```bash
   ./mvnw spring-boot:run
   ```

### 测试

```bash
# 运行单元测试
./mvnw test

# 运行集成测试
./mvnw verify

# 生成测试报告
./mvnw jacoco:report
```

### 代码规范

- 遵循阿里巴巴Java开发手册
- 使用Checkstyle进行代码风格检查
- 所有公共方法必须有Javadoc注释
- 单元测试覆盖率不低于80%

## 监控和运维

### 健康检查

```http
GET /building-service/actuator/health
```

### 指标监控

```http
GET /building-service/actuator/metrics
GET /building-service/actuator/prometheus
```

### 日志配置

日志文件位置：`logs/building-service.log`

支持的日志级别：
- ERROR: 错误信息
- WARN: 警告信息
- INFO: 一般信息
- DEBUG: 调试信息

## 版本历史

### v1.0.0 (2025-09-09)
- 初始版本发布
- 实现基础建筑物管理功能
- 支持楼层和设备分配管理
- 提供REST API接口
- 集成Eureka服务注册

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系方式

- 作者: 伍志勇
- 邮箱: [your-email@example.com]
- 项目链接: [https://github.com/your-username/building-service]

## 致谢

感谢所有为本项目做出贡献的开发者和测试人员。