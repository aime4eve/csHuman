# 增量更新使用指南

## 概述

增量更新系统提供了智能的知识库维护功能，支持自动检测文档变更并更新向量存储，避免了每次都需要重建整个知识库的问题。系统同时支持标准 RAG 服务和 LoRA RAG 服务的知识库更新。

## 核心功能

### 1. 增量更新脚本 (`incremental_update.py`)

**功能特性：**
- 文件哈希检测：通过MD5哈希值检测文件变更
- 支持多种格式：Markdown、PDF、Word文档
- 元数据管理：记录文件状态和更新历史
- 向量存储增量更新：只处理变更的文档

**使用方法：**
```bash
# 基本增量更新
python scripts/incremental_update.py

# 强制重建整个向量存储
python scripts/incremental_update.py --force-rebuild

# 详细输出模式
python scripts/incremental_update.py --verbose
```

### 2. 更新调度器 (`update_scheduler.py`)

**功能特性：**
- 定时更新：按时间间隔或指定时间自动更新
- 文件监控：实时监控文件变更并触发更新
- 防抖动机制：避免频繁的小变更触发过多更新
- 统计监控：记录更新次数和性能指标

**使用方法：**
```bash
# 启动调度器（守护进程模式）
python scripts/update_scheduler.py

# 使用自定义配置
python scripts/update_scheduler.py --config config/scheduler_config.json

# 手动执行一次更新
python scripts/update_scheduler.py --manual

# 手动强制重建
python scripts/update_scheduler.py --manual --force-rebuild
```

## 配置说明

### 调度器配置 (`config/scheduler_config.json`)

```json
{
  "scheduled_update": {
    "enabled": true,
    "interval_hours": 6,        // 每6小时更新一次
    "time": "02:00"             // 每天凌晨2点更新
  },
  "file_watch": {
    "enabled": true,
    "debounce_seconds": 30      // 文件变更后30秒防抖动
  },
  "performance": {
    "chunk_size": 1000,         // 文档分块大小
    "chunk_overlap": 200,       // 分块重叠大小
    "embedding_batch_size": 32  // 嵌入批处理大小
  }
}
```

### 环境变量配置

#### 标准 RAG 服务配置
确保 `.env` 文件中配置了正确的模型：
```env
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
VECTOR_STORE_PATH=./vector_store
KNOWLEDGE_BASE_PATH=../../notes
```

#### LoRA RAG 服务配置
如果使用 LoRA RAG 服务，确保 `.env.lora` 文件配置正确：
```env
# LoRA 模型配置
LORA_MODEL_PATH=./models/lora_model
LORA_CACHE_DIR=./cache/lora

# 向量存储配置（可与标准服务共享）
VECTOR_STORE_PATH=./vector_store
KNOWLEDGE_BASE_PATH=../../notes
```

## 工作流程

### 增量更新流程

1. **扫描文档目录**：遍历知识库目录，收集所有支持的文档文件
2. **计算文件哈希**：为每个文件计算MD5哈希值
3. **检测变更**：与上次更新的元数据比较，识别新增、修改、删除的文件
4. **处理变更**：
   - 新增/修改：加载文档 → 分块 → 生成嵌入 → 更新向量存储
   - 删除：从向量存储中移除（注：FAISS不直接支持删除）
5. **保存元数据**：更新文件哈希记录和统计信息

### 文件监控流程

1. **监控文件系统事件**：创建、修改、删除、移动
2. **过滤支持的文件类型**：只处理 .md、.pdf、.docx、.doc 文件
3. **防抖动处理**：收集30秒内的所有变更，批量处理
4. **触发增量更新**：调用增量更新逻辑处理变更

## 性能优化

### 1. 批处理策略
- 文档加载：批量加载多个文档
- 嵌入生成：批量生成嵌入向量
- 向量存储：批量更新向量数据库

### 2. 内存管理
- 分块处理大文档
- 及时释放不需要的对象
- 监控内存使用情况

### 3. 并发控制
- 限制同时处理的文档数量
- 避免过度并发导致的资源竞争

## 监控和日志

### 元数据文件 (`update_metadata.json`)
```json
{
  "last_update": "2024-01-15T10:30:00",
  "file_hashes": {
    "doc1.md": "abc123...",
    "doc2.pdf": "def456..."
  },
  "total_documents": 150,
  "total_chunks": 1200,
  "services": {
    "standard_rag": {
      "last_sync": "2024-01-15T10:30:00",
      "status": "active"
    },
    "lora_rag": {
      "last_sync": "2024-01-15T10:30:00",
      "status": "active"
    }
  }
}
```

### 日志输出
- 文件变更检测日志
- 更新进度和耗时统计
- 错误和异常信息
- 性能指标记录

## 故障排除

### 常见问题

1. **向量存储加载失败**
   - 检查 `vector_store` 目录是否存在
   - 确认嵌入模型配置正确
   - 尝试强制重建：`--force-rebuild`

2. **文件监控不工作**
   - 检查知识库路径是否正确
   - 确认有足够的文件系统权限
   - 查看调度器日志输出

3. **更新速度慢**
   - 调整批处理大小
   - 检查嵌入模型性能
   - 考虑使用更快的向量数据库

4. **内存使用过高**
   - 减小文档分块大小
   - 降低并发处理数量
   - 分批处理大量文档

### 调试模式

```bash
# 启用详细日志
python scripts/incremental_update.py --verbose

# 查看调度器统计信息
python scripts/update_scheduler.py --manual --verbose
```

## 最佳实践

1. **定期备份**：在重要更新前备份向量存储
2. **监控性能**：关注更新耗时和资源使用
3. **合理配置**：根据文档数量和更新频率调整参数
4. **测试验证**：在生产环境前充分测试更新逻辑
5. **日志分析**：定期检查日志，及时发现问题

## 扩展功能

### 未来改进方向

1. **支持更多文档格式**：PPT、Excel、纯文本等
2. **分布式更新**：支持多节点并行处理
3. **增量备份**：只备份变更的部分
4. **智能调度**：根据系统负载动态调整更新频率
5. **Web界面**：提供可视化的管理界面

### 集成其他系统

- **CI/CD集成**：在代码部署时自动更新知识库
- **消息队列**：使用Redis/RabbitMQ处理更新任务
- **监控告警**：集成Prometheus/Grafana监控
- **API接口**：提供RESTful API管理更新任务
- **LoRA RAG集成**：支持LoRA模型的知识库同步更新
- **多服务协调**：确保标准RAG和LoRA RAG服务的知识库一致性

## LoRA RAG 服务集成

### 知识库同步

当知识库更新时，系统会自动同步到所有活跃的服务：

```bash
# 更新知识库并同步到所有服务
python scripts/incremental_update.py --sync-all

# 仅同步到 LoRA RAG 服务
python scripts/incremental_update.py --sync-lora
```

### 服务状态检查

```bash
# 检查所有服务的知识库同步状态
curl http://127.0.0.1:8000/stats  # 标准 RAG 服务
curl http://127.0.0.1:8001/stats  # LoRA RAG 服务（如果运行）
```

### 配置示例

在 `config/scheduler_config.json` 中添加 LoRA 服务配置：

```json
{
  "services": {
    "standard_rag": {
      "enabled": true,
      "port": 8000,
      "vector_store_path": "./vector_store"
    },
    "lora_rag": {
      "enabled": true,
      "port": 8001,
      "vector_store_path": "./vector_store",
      "model_path": "./models/lora_model"
    }
  }
}
```