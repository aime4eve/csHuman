# MClimate Enterprise 智能建筑管理系统 - DDD系统设计

**作者：** 伍志勇  
**创建时间：** 2025年9月9日 23:12:00  
**系统版本：** v5.6.8  
**来源：** 基于 https://enterprise.mclimate.eu/ 网站功能分析

## 1. 系统概述

MClimate Enterprise 是一个基于物联网(IoT)的智能建筑管理平台，主要用于管理和监控建筑物内的各种设备和环境参数。系统采用LoRaWAN技术进行设备连接，提供建筑物管理、设备监控、用户管理、数据分析等核心功能。

## 2. 领域分析

### 2.1 核心领域识别

通过对系统功能的深入分析，识别出以下核心领域：

#### 2.1.1 建筑管理领域 (Building Management Domain)
- **职责：** 管理建筑物的基本信息、结构层次和空间组织
- **核心概念：** 建筑物、楼层、房间、公寓、办公室

#### 2.1.2 设备管理领域 (Device Management Domain)
- **职责：** 管理IoT设备的生命周期、状态监控和数据采集
- **核心概念：** 设备、传感器、在线状态、设备类型

#### 2.1.3 用户与权限管理领域 (User & Access Management Domain)
- **职责：** 管理用户账户、角色权限和访问控制
- **核心概念：** 用户、角色、权限、认证、授权

#### 2.1.4 集成与连接领域 (Integration & Connectivity Domain)
- **职责：** 管理外部系统集成和LoRaWAN网络连接
- **核心概念：** API令牌、LoRaWAN网络、第三方集成

#### 2.1.5 数据分析与监控领域 (Analytics & Monitoring Domain)
- **职责：** 提供数据可视化、报表分析和实时监控
- **核心概念：** 仪表板、图表、报告、告警

### 2.2 支撑领域

#### 2.2.1 通知服务领域 (Notification Service Domain)
- **职责：** 处理系统通知和告警消息

#### 2.2.2 配置管理领域 (Configuration Management Domain)
- **职责：** 管理系统配置和参数设置

## 3. 限界上下文 (Bounded Context)

### 3.1 建筑管理上下文 (Building Management Context)

```
聚合根：Building (建筑物)
实体：
- Floor (楼层)
- Room (房间)
- Apartment (公寓)
- Office (办公室)

值对象：
- Address (地址)
- Coordinates (坐标)
- BuildingType (建筑类型)
```

### 3.2 设备管理上下文 (Device Management Context)

```
聚合根：Device (设备)
实体：
- Sensor (传感器)
- DeviceConfiguration (设备配置)

值对象：
- DeviceId (设备ID)
- DeviceStatus (设备状态)
- DeviceType (设备类型)
- SensorData (传感器数据)
```

### 3.3 用户管理上下文 (User Management Context)

```
聚合根：User (用户)
实体：
- Role (角色)
- Permission (权限)

值对象：
- Email (邮箱)
- UserId (用户ID)
- UserStatus (用户状态)
```

### 3.4 集成管理上下文 (Integration Management Context)

```
聚合根：Integration (集成)
实体：
- ApiToken (API令牌)
- LoRaWANNetwork (LoRaWAN网络)

值对象：
- TokenId (令牌ID)
- NetworkType (网络类型)
- IntegrationStatus (集成状态)
```

## 4. 领域模型设计

### 4.1 建筑管理领域模型

```java
/**
 * 建筑物聚合根
 * @author 伍志勇
 */
public class Building {
    private BuildingId id;
    private String name;
    private Address address;
    private Coordinates coordinates;
    private List<Floor> floors;
    private List<Device> devices;
    private BuildingStatistics statistics;
    
    // 领域行为
    public void addFloor(Floor floor) {
        // 业务逻辑：添加楼层
    }
    
    public void assignDevice(Device device) {
        // 业务逻辑：分配设备
    }
    
    public BuildingStatistics calculateStatistics() {
        // 业务逻辑：计算建筑统计信息
    }
}

/**
 * 楼层实体
 * @author 伍志勇
 */
public class Floor {
    private FloorId id;
    private String name;
    private int floorNumber;
    private List<Room> rooms;
    private List<Apartment> apartments;
    private List<Office> offices;
}
```

### 4.2 设备管理领域模型

```java
/**
 * 设备聚合根
 * @author 伍志勇
 */
public class Device {
    private DeviceId id;
    private String name;
    private DeviceType type;
    private DeviceStatus status;
    private BuildingId buildingId;
    private RoomId roomId;
    private List<SensorData> sensorData;
    
    // 领域行为
    public void updateStatus(DeviceStatus newStatus) {
        // 业务逻辑：更新设备状态
    }
    
    public void recordSensorData(SensorData data) {
        // 业务逻辑：记录传感器数据
    }
    
    public boolean isOnline() {
        return this.status == DeviceStatus.ONLINE;
    }
}
```

### 4.3 用户管理领域模型

```java
/**
 * 用户聚合根
 * @author 伍志勇
 */
public class User {
    private UserId id;
    private Email email;
    private UserStatus status;
    private Role role;
    private LocalDateTime joinedDate;
    private List<BuildingAccess> buildingAccesses;
    
    // 领域行为
    public boolean hasAccessToBuilding(BuildingId buildingId) {
        // 业务逻辑：检查建筑访问权限
    }
    
    public void grantBuildingAccess(BuildingId buildingId) {
        // 业务逻辑：授予建筑访问权限
    }
}
```

## 5. 应用服务设计

### 5.1 建筑管理应用服务

```java
/**
 * 建筑管理应用服务
 * @author 伍志勇
 */
@Service
public class BuildingApplicationService {
    
    private final BuildingRepository buildingRepository;
    private final DeviceRepository deviceRepository;
    private final DomainEventPublisher eventPublisher;
    
    public BuildingDto createBuilding(CreateBuildingCommand command) {
        // 应用逻辑：创建建筑物
        Building building = new Building(
            command.getName(),
            command.getAddress(),
            command.getCoordinates()
        );
        
        buildingRepository.save(building);
        eventPublisher.publish(new BuildingCreatedEvent(building.getId()));
        
        return BuildingDto.from(building);
    }
    
    public void assignDeviceToBuilding(AssignDeviceCommand command) {
        // 应用逻辑：将设备分配给建筑物
        Building building = buildingRepository.findById(command.getBuildingId());
        Device device = deviceRepository.findById(command.getDeviceId());
        
        building.assignDevice(device);
        buildingRepository.save(building);
    }
}
```

### 5.2 设备管理应用服务

```java
/**
 * 设备管理应用服务
 * @author 伍志勇
 */
@Service
public class DeviceApplicationService {
    
    private final DeviceRepository deviceRepository;
    private final SensorDataRepository sensorDataRepository;
    
    public void updateDeviceStatus(UpdateDeviceStatusCommand command) {
        Device device = deviceRepository.findById(command.getDeviceId());
        device.updateStatus(command.getStatus());
        deviceRepository.save(device);
    }
    
    public List<DeviceDto> getOnlineDevices(BuildingId buildingId) {
        return deviceRepository.findByBuildingIdAndStatus(buildingId, DeviceStatus.ONLINE)
            .stream()
            .map(DeviceDto::from)
            .collect(Collectors.toList());
    }
}
```

## 6. 基础设施层设计

### 6.1 数据持久化

```java
/**
 * 建筑物仓储实现
 * @author 伍志勇
 */
@Repository
public class JpaBuildingRepository implements BuildingRepository {
    
    @PersistenceContext
    private EntityManager entityManager;
    
    @Override
    public Building findById(BuildingId id) {
        return entityManager.find(BuildingEntity.class, id.getValue())
            .toDomainObject();
    }
    
    @Override
    public void save(Building building) {
        BuildingEntity entity = BuildingEntity.from(building);
        entityManager.merge(entity);
    }
}
```

### 6.2 外部集成

```java
/**
 * LoRaWAN网络集成服务
 * @author 伍志勇
 */
@Service
public class LoRaWANIntegrationService {
    
    private final RestTemplate restTemplate;
    private final IntegrationConfigRepository configRepository;
    
    public void syncDeviceData(String networkType, String apiToken) {
        // 与外部LoRaWAN网络同步设备数据
        IntegrationConfig config = configRepository.findByNetworkType(networkType);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(apiToken);
        
        ResponseEntity<DeviceDataResponse> response = restTemplate.exchange(
            config.getApiEndpoint(),
            HttpMethod.GET,
            new HttpEntity<>(headers),
            DeviceDataResponse.class
        );
        
        // 处理响应数据
    }
}
```

## 7. 系统架构设计

### 7.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    前端层 (Presentation Layer)                │
├─────────────────────────────────────────────────────────────┤
│  React + TypeScript Web Application                        │
│  - 建筑物管理界面                                              │
│  - 设备监控仪表板                                              │
│  - 用户管理界面                                                │
│  - 集成配置界面                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    应用层 (Application Layer)                 │
├─────────────────────────────────────────────────────────────┤
│  Spring Cloud Gateway (API网关)                            │
│  ├── 建筑管理服务 (Building Management Service)              │
│  ├── 设备管理服务 (Device Management Service)               │
│  ├── 用户管理服务 (User Management Service)                 │
│  ├── 集成服务 (Integration Service)                         │
│  └── 通知服务 (Notification Service)                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    领域层 (Domain Layer)                      │
├─────────────────────────────────────────────────────────────┤
│  ├── 建筑管理领域 (Building Management Domain)               │
│  ├── 设备管理领域 (Device Management Domain)                │
│  ├── 用户管理领域 (User Management Domain)                  │
│  ├── 集成管理领域 (Integration Management Domain)           │
│  └── 分析监控领域 (Analytics & Monitoring Domain)           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  基础设施层 (Infrastructure Layer)            │
├─────────────────────────────────────────────────────────────┤
│  ├── 数据持久化 (PostgreSQL)                                │
│  ├── 缓存服务 (Redis)                                       │
│  ├── 消息队列 (Kafka)                                       │
│  ├── 外部集成 (LoRaWAN Networks)                           │
│  └── 监控日志 (Prometheus + Grafana + ELK)                 │
└─────────────────────────────────────────────────────────────┘
```

### 7.2 微服务架构

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   建筑管理服务      │    │   设备管理服务      │    │   用户管理服务      │
│                  │    │                  │    │                  │
│ - 建筑物CRUD      │    │ - 设备监控        │    │ - 用户认证        │
│ - 楼层管理        │    │ - 状态更新        │    │ - 权限管理        │
│ - 房间管理        │    │ - 数据采集        │    │ - 角色管理        │
└──────────────────┘    └──────────────────┘    └──────────────────┘
         │                        │                        │
         └────────────────────────┼────────────────────────┘
                                  │
                    ┌──────────────────┐
                    │   集成管理服务      │
                    │                  │
                    │ - API令牌管理     │
                    │ - LoRaWAN集成    │
                    │ - 第三方集成      │
                    └──────────────────┘
```

## 8. 数据模型设计

### 8.1 核心实体关系

```sql
-- 建筑物表
CREATE TABLE buildings (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 楼层表
CREATE TABLE floors (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT REFERENCES buildings(id),
    name VARCHAR(255) NOT NULL,
    floor_number INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 房间表
CREATE TABLE rooms (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT REFERENCES buildings(id),
    floor_id BIGINT REFERENCES floors(id),
    name VARCHAR(255) NOT NULL,
    room_type VARCHAR(50), -- apartment, office, common
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 设备表
CREATE TABLE devices (
    id BIGSERIAL PRIMARY KEY,
    building_id BIGINT REFERENCES buildings(id),
    room_id BIGINT REFERENCES rooms(id),
    name VARCHAR(255) NOT NULL,
    device_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'offline',
    last_seen TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户表
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- API令牌表
CREATE TABLE api_tokens (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    token_hash VARCHAR(255) NOT NULL,
    user_id BIGINT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);
```

## 9. 技术栈选择

### 9.1 后端技术栈
- **框架：** Spring Cloud + Spring Boot
- **数据库：** PostgreSQL (主数据库)
- **缓存：** Redis (会话缓存、数据缓存)
- **消息队列：** Apache Kafka (事件驱动)
- **服务发现：** Eureka Server
- **配置中心：** Spring Cloud Config
- **API网关：** Spring Cloud Gateway

### 9.2 前端技术栈
- **框架：** React 18+ with TypeScript
- **状态管理：** Redux Toolkit
- **UI组件库：** Material-UI (MUI)
- **图表库：** Chart.js / D3.js
- **构建工具：** Vite

### 9.3 运维技术栈
- **容器化：** Docker + Docker Compose
- **编排：** Kubernetes
- **监控：** Prometheus + Grafana
- **日志：** ELK Stack (Elasticsearch + Logstash + Kibana)
- **CI/CD：** Jenkins + GitLab CI

## 10. 部署架构

### 10.1 生产环境部署

```yaml
# docker-compose.yml
version: '3.8'
services:
  # API网关
  gateway:
    image: mclimate/enterprise-gateway:latest
    ports:
      - "8080:8080"
    environment:
      - EUREKA_URL=http://eureka:8761/eureka
    depends_on:
      - eureka
      - redis
  
  # 服务发现
  eureka:
    image: mclimate/enterprise-eureka:latest
    ports:
      - "8761:8761"
  
  # 建筑管理服务
  building-service:
    image: mclimate/enterprise-building-service:latest
    environment:
      - DATABASE_URL=jdbc:postgresql://postgres:5432/mclimate_buildings
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - postgres
      - redis
      - kafka
  
  # 设备管理服务
  device-service:
    image: mclimate/enterprise-device-service:latest
    environment:
      - DATABASE_URL=jdbc:postgresql://postgres:5432/mclimate_devices
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - postgres
      - redis
      - kafka
  
  # 数据库
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=mclimate
      - POSTGRES_USER=mclimate
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # 缓存
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
  
  # 消息队列
  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper
  
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181

volumes:
  postgres_data:
```

## 11. 安全设计

### 11.1 认证与授权
- **认证方式：** OAuth2 + JWT
- **权限模型：** RBAC (基于角色的访问控制)
- **API安全：** Bearer Token认证

### 11.2 数据安全
- **数据加密：** 敏感数据AES-256加密
- **传输安全：** HTTPS/TLS 1.3
- **数据库安全：** 连接加密、访问控制

## 12. 监控与运维

### 12.1 应用监控
- **性能监控：** Micrometer + Prometheus
- **健康检查：** Spring Boot Actuator
- **链路追踪：** Zipkin/Jaeger

### 12.2 业务监控
- **设备在线率监控**
- **API调用量监控**
- **用户活跃度监控**
- **系统错误率监控**

## 13. 扩展性设计

### 13.1 水平扩展
- **无状态服务设计**
- **数据库读写分离**
- **缓存集群**
- **负载均衡**

### 13.2 功能扩展
- **插件化架构**
- **事件驱动架构**
- **API版本管理**
- **多租户支持**

## 14. 总结

MClimate Enterprise系统采用DDD设计方法，通过清晰的领域划分和限界上下文，实现了高内聚、低耦合的系统架构。系统具备良好的可扩展性、可维护性和安全性，能够满足智能建筑管理的各种业务需求。

### 14.1 核心优势
1. **领域驱动：** 基于业务领域的清晰建模
2. **微服务架构：** 服务独立部署和扩展
3. **事件驱动：** 松耦合的服务间通信
4. **技术先进：** 采用现代化技术栈
5. **安全可靠：** 完善的安全和监控机制

### 14.2 未来发展方向
1. **AI集成：** 智能预测和自动化控制
2. **边缘计算：** 本地数据处理和响应
3. **移动端支持：** 原生移动应用开发
4. **国际化：** 多语言和多地区支持
5. **生态集成：** 更多第三方系统集成

---

**文档版本：** 1.0  
**最后更新：** 2025年9月9日 23:12:00  
**审核状态：** 待审核