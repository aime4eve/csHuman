# API参考文档

## 概述

智能问答系统提供两套独立的 RESTful API 服务：

- **标准 RAG 服务** (端口 8000): 基于 Ollama 模型的传统 RAG 服务
- **LoRA RAG 服务** (端口 8001): 支持 LoRA 微调模型的增强 RAG 服务

所有API都返回JSON格式的响应。

**标准 RAG 基础URL**: `http://127.0.0.1:8000`
**LoRA RAG 基础URL**: `http://127.0.0.1:8001`

**API版本**: v1.0

---

## 认证

当前版本暂不需要认证。未来版本将支持API密钥认证。

---

## 通用响应格式

### 成功响应
```json
{
  "status": "success",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 错误响应
```json
{
  "status": "error",
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": "详细错误信息"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### HTTP状态码

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |
| 503 | 服务不可用 |

---

## 端点详情

### 1. 健康检查

检查系统运行状态。

```http
GET /health
```

#### 响应示例

**成功响应 (200)**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "components": {
    "ollama": "connected",
    "vector_store": "loaded",
    "knowledge_base": "ready"
  },
  "uptime": 3600,
  "memory_usage": {
    "used_mb": 1024,
    "total_mb": 8192
  }
}
```

**错误响应 (503)**
```json
{
  "status": "unhealthy",
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Ollama服务连接失败",
    "details": "Connection refused to http://localhost:11434"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 2. 智能问答

基于知识库回答用户问题。

```http
POST /ask
```

#### 请求参数

**Content-Type**: `application/json`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `question` | string | 是 | - | 用户问题 |
| `max_tokens` | integer | 否 | 500 | 最大回答长度 |
| `temperature` | float | 否 | 0.7 | 生成温度(0.0-1.0) |
| `top_k` | integer | 否 | 5 | 检索文档数量 |
| `include_sources` | boolean | 否 | true | 是否包含来源信息 |

#### 请求示例

```json
{
  "question": "什么是产业大脑？",
  "max_tokens": 300,
  "temperature": 0.5,
  "top_k": 3,
  "include_sources": true
}
```

#### 响应示例

**成功响应 (200)**
```json
{
  "answer": "产业大脑是一个综合性的数字化平台，旨在通过大数据、人工智能等技术手段，为产业发展提供智能化决策支持。它整合了产业链上下游的数据资源，构建了完整的产业知识图谱，能够为企业提供精准的市场分析、风险评估和发展建议。",
  "sources": [
    {
      "file_path": "产业大脑项目/系统设计需求.md",
      "content": "产业大脑作为数字化转型的核心平台...",
      "score": 0.92,
      "chunk_id": "chunk_001"
    },
    {
      "file_path": "产业大脑项目/技术架构设计level0.md",
      "content": "技术架构采用微服务设计...",
      "score": 0.85,
      "chunk_id": "chunk_045"
    }
  ],
  "metadata": {
    "response_time": 1.23,
    "model_used": "qwen2.5:7b",
    "tokens_used": 245,
    "search_time": 0.15,
    "generation_time": 1.08
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**错误响应 (400)**
```json
{
  "status": "error",
  "error": {
    "code": "INVALID_QUESTION",
    "message": "问题不能为空",
    "details": "question字段是必填的"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 3. 文档搜索

在知识库中搜索相关文档。

```http
POST /search
```

#### 请求参数

**Content-Type**: `application/json`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `query` | string | 是 | - | 搜索查询 |
| `top_k` | integer | 否 | 10 | 返回结果数量 |
| `score_threshold` | float | 否 | 0.0 | 相似度阈值 |
| `file_types` | array | 否 | null | 文件类型过滤 |

#### 请求示例

```json
{
  "query": "技术架构设计",
  "top_k": 5,
  "score_threshold": 0.7,
  "file_types": ["md", "pdf"]
}
```

#### 响应示例

**成功响应 (200)**
```json
{
  "results": [
    {
      "file_path": "产业大脑项目/技术架构设计level0.md",
      "content": "技术架构采用分层设计，包括数据层、服务层、应用层...",
      "score": 0.95,
      "chunk_id": "chunk_045",
      "file_type": "md",
      "file_size": 15420,
      "last_modified": "2024-01-10T14:30:00Z"
    },
    {
      "file_path": "产业大脑项目/业务架构设计level0.md",
      "content": "业务架构围绕核心业务流程设计...",
      "score": 0.87,
      "chunk_id": "chunk_023",
      "file_type": "md",
      "file_size": 12800,
      "last_modified": "2024-01-08T09:15:00Z"
    }
  ],
  "metadata": {
    "total_results": 2,
    "search_time": 0.08,
    "query_processed": "技术架构设计"
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

### 4. 触发更新

手动触发知识库更新。

```http
POST /update
```

#### 请求参数

**Content-Type**: `application/json`

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| `force_rebuild` | boolean | 否 | false | 是否强制重建 |
| `async_mode` | boolean | 否 | true | 是否异步执行 |

#### 请求示例

```json
{
  "force_rebuild": false,
  "async_mode": true
}
```

#### 响应示例

**成功响应 (200) - 异步模式**
```json
{
  "status": "accepted",
  "task_id": "update_20240115_103000",
  "message": "更新任务已启动",
  "estimated_time": 120,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**成功响应 (200) - 同步模式**
```json
{
  "status": "completed",
  "result": {
    "duration": 45.6,
    "changes": {
      "added": 3,
      "modified": 1,
      "deleted": 0
    },
    "total_documents": 156,
    "total_chunks": 1240
  },
  "timestamp": "2024-01-15T10:30:45Z"
}
```

---

### 5. 获取更新状态

查询异步更新任务的状态。

```http
GET /update/status/{task_id}
```

#### 路径参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `task_id` | string | 任务ID |

#### 响应示例

**进行中 (200)**
```json
{
  "task_id": "update_20240115_103000",
  "status": "running",
  "progress": 65,
  "current_step": "处理文档变更",
  "started_at": "2024-01-15T10:30:00Z",
  "estimated_completion": "2024-01-15T10:32:00Z"
}
```

**已完成 (200)**
```json
{
  "task_id": "update_20240115_103000",
  "status": "completed",
  "progress": 100,
  "result": {
    "duration": 45.6,
    "changes": {
      "added": 3,
      "modified": 1,
      "deleted": 0
    }
  },
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:30:45Z"
}
```

---

### 6. 系统统计

获取系统使用统计信息。

```http
GET /stats
```

#### 响应示例

**成功响应 (200)**
```json
{
  "knowledge_base": {
    "total_documents": 156,
    "total_chunks": 1240,
    "file_types": {
      "md": 120,
      "pdf": 25,
      "docx": 11
    },
    "total_size_mb": 45.6,
    "last_updated": "2024-01-15T10:30:00Z"
  },
  "usage": {
    "total_queries": 1250,
    "queries_today": 45,
    "avg_response_time": 1.23,
    "avg_score": 4.2
  },
  "system": {
    "uptime": 86400,
    "memory_usage_mb": 1024,
    "cpu_usage_percent": 15.6,
    "disk_usage_mb": 2048
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 错误代码

| 错误代码 | HTTP状态码 | 说明 |
|----------|------------|------|
| `INVALID_QUESTION` | 400 | 问题参数无效 |
| `INVALID_QUERY` | 400 | 搜索查询无效 |
| `INVALID_PARAMETERS` | 400 | 请求参数无效 |
| `OLLAMA_CONNECTION_ERROR` | 503 | Ollama服务连接失败 |
| `VECTOR_STORE_ERROR` | 500 | 向量存储错误 |
| `MODEL_ERROR` | 500 | 模型推理错误 |
| `INTERNAL_ERROR` | 500 | 内部服务器错误 |
| `TASK_NOT_FOUND` | 404 | 任务不存在 |
| `SERVICE_UNAVAILABLE` | 503 | 服务不可用 |

---

## 使用示例

### Python示例

```python
import requests
import json

class RAGClient:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
    
    def health_check(self):
        """健康检查"""
        response = requests.get(f"{self.base_url}/health")
        return response.json()
    
    def ask_question(self, question, **kwargs):
        """问答查询"""
        data = {"question": question, **kwargs}
        response = requests.post(
            f"{self.base_url}/ask",
            json=data
        )
        return response.json()
    
    def search_documents(self, query, **kwargs):
        """文档搜索"""
        data = {"query": query, **kwargs}
        response = requests.post(
            f"{self.base_url}/search",
            json=data
        )
        return response.json()
    
    def trigger_update(self, force_rebuild=False, async_mode=True):
        """触发更新"""
        data = {
            "force_rebuild": force_rebuild,
            "async_mode": async_mode
        }
        response = requests.post(
            f"{self.base_url}/update",
            json=data
        )
        return response.json()
    
    def get_update_status(self, task_id):
        """获取更新状态"""
        response = requests.get(
            f"{self.base_url}/update/status/{task_id}"
        )
        return response.json()
    
    def get_stats(self):
        """获取统计信息"""
        response = requests.get(f"{self.base_url}/stats")
        return response.json()

# 使用示例
client = RAGClient()

# 健康检查
health = client.health_check()
print(f"系统状态: {health['status']}")

# 问答查询
result = client.ask_question(
    "什么是产业大脑？",
    max_tokens=300,
    temperature=0.5
)
print(f"答案: {result['answer']}")

# 文档搜索
search_result = client.search_documents(
    "技术架构",
    top_k=5,
    score_threshold=0.7
)
print(f"找到 {len(search_result['results'])} 个相关文档")

# 触发更新
update_result = client.trigger_update(async_mode=True)
if update_result['status'] == 'accepted':
    task_id = update_result['task_id']
    print(f"更新任务已启动: {task_id}")
    
    # 查询更新状态
    status = client.get_update_status(task_id)
    print(f"更新进度: {status['progress']}%")

# 获取统计信息
stats = client.get_stats()
print(f"知识库文档数: {stats['knowledge_base']['total_documents']}")
```

### JavaScript示例

```javascript
class RAGClient {
    constructor(baseUrl = 'http://127.0.0.1:8000') {
        this.baseUrl = baseUrl;
    }
    
    async healthCheck() {
        const response = await fetch(`${this.baseUrl}/health`);
        return await response.json();
    }
    
    async askQuestion(question, options = {}) {
        const response = await fetch(`${this.baseUrl}/ask`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question, ...options })
        });
        return await response.json();
    }
    
    async searchDocuments(query, options = {}) {
        const response = await fetch(`${this.baseUrl}/search`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query, ...options })
        });
        return await response.json();
    }
}

// 使用示例
const client = new RAGClient();

// 问答查询
client.askQuestion('什么是产业大脑？', {
    max_tokens: 300,
    temperature: 0.5
}).then(result => {
    console.log('答案:', result.answer);
    console.log('来源数量:', result.sources.length);
});
```

### cURL示例

```bash
# 健康检查
curl -X GET "http://127.0.0.1:8000/health"

# 问答查询
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{
       "question": "什么是产业大脑？",
       "max_tokens": 300,
       "temperature": 0.5
     }'

# 文档搜索
curl -X POST "http://127.0.0.1:8000/search" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "技术架构",
       "top_k": 5,
       "score_threshold": 0.7
     }'

# 触发更新
curl -X POST "http://127.0.0.1:8000/update" \
     -H "Content-Type: application/json" \
     -d '{
       "force_rebuild": false,
       "async_mode": true
     }'

# 获取统计信息
curl -X GET "http://127.0.0.1:8000/stats"
```

---

## 速率限制

当前版本暂无速率限制。未来版本将实施以下限制：

- 每分钟最多60次请求
- 每小时最多1000次请求
- 大型查询（>1000 tokens）每分钟最多10次

---

---

## LoRA RAG 服务 API

### 概述

LoRA RAG 服务是智能问答系统的增强版本，支持 LoRA 微调模型与传统 Ollama 模型的动态切换。

**基础URL**: `http://127.0.0.1:8001`

### 端点列表

#### 1. 健康检查

```http
GET /health
```

**描述**: 检查 LoRA RAG 服务健康状态

**响应示例**:
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_type": "lora",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 2. LoRA 智能问答

```http
POST /ask
```

**描述**: 使用 LoRA 微调模型回答用户问题

**请求体**:
```json
{
  "question": "什么是产业大脑？",
  "max_tokens": 500,
  "temperature": 0.7,
  "top_p": 0.9
}
```

**参数说明**:
- `question` (string, 必填): 用户问题
- `max_tokens` (integer, 可选): 最大生成令牌数，默认 2048
- `temperature` (float, 可选): 生成温度，默认 0.7
- `top_p` (float, 可选): Top-p 采样，默认 0.9

**响应示例**:
```json
{
  "answer": "产业大脑是一个综合性的数字化平台...",
  "sources": [
    {
      "file_path": "产业大脑项目/系统设计需求.md",
      "content": "相关文档片段...",
      "score": 0.85
    }
  ],
  "model_info": {
    "type": "lora",
    "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
    "lora_path": "./lora_adapters",
    "device": "cuda:0"
  },
  "response_time": 1.23,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 3. 动态模型切换

```http
POST /switch_model
```

**描述**: 动态切换使用的模型类型

**切换到 LoRA 模型**:
```json
{
  "model_type": "lora",
  "lora_path": "./lora_adapters"
}
```

**切换到 Ollama 模型**:
```json
{
  "model_type": "ollama"
}
```

**参数说明**:
- `model_type` (string, 必填): 模型类型，"lora" 或 "ollama"
- `lora_path` (string, 可选): LoRA 适配器路径，仅当 model_type 为 "lora" 时需要

**响应示例**:
```json
{
  "success": true,
  "message": "模型切换成功",
  "current_model": {
    "type": "lora",
    "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
    "lora_path": "./lora_adapters",
    "device": "cuda:0"
  }
}
```

#### 4. 模型信息查询

```http
GET /model_info
```

**描述**: 获取当前模型配置信息

**响应示例**:
```json
{
  "current_model": {
    "type": "lora",
    "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
    "lora_path": "./lora_adapters",
    "device": "cuda:0",
    "cache_dir": "E:/LLM_Models",
    "max_length": 2048,
    "temperature": 0.7
  },
  "available_models": [
    "lora",
    "ollama"
  ],
  "system_info": {
    "cuda_available": true,
    "gpu_memory": "8GB",
    "device_count": 1
  }
}
```

#### 5. 服务根路径

```http
GET /
```

**描述**: 服务欢迎页面

**响应示例**:
```json
{
  "message": "LoRA RAG 服务正在运行",
  "version": "1.0.0",
  "docs_url": "/docs"
}
```

### LoRA 特有错误码

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 422 | `MODEL_LOAD_ERROR` | LoRA 模型加载失败 |
| 422 | `MODEL_SWITCH_ERROR` | 模型切换失败 |
| 422 | `LORA_PATH_INVALID` | LoRA 路径无效 |
| 503 | `CUDA_UNAVAILABLE` | CUDA 设备不可用 |

---

## 使用示例

### Python 客户端示例

```python
import requests

class RAGClient:
    def __init__(self, base_url="http://127.0.0.1:8000"):
        self.base_url = base_url
    
    def ask(self, question, **kwargs):
        """发送问答请求"""
        url = f"{self.base_url}/ask"
        data = {"question": question, **kwargs}
        response = requests.post(url, json=data)
        return response.json()
    
    def health_check(self):
        """健康检查"""
        url = f"{self.base_url}/health"
        response = requests.get(url)
        return response.json()

class LoRARAGClient(RAGClient):
    def __init__(self, base_url="http://127.0.0.1:8001"):
        super().__init__(base_url)
    
    def switch_model(self, model_type, lora_path=None):
        """切换模型"""
        url = f"{self.base_url}/switch_model"
        data = {"model_type": model_type}
        if lora_path:
            data["lora_path"] = lora_path
        response = requests.post(url, json=data)
        return response.json()
    
    def get_model_info(self):
        """获取模型信息"""
        url = f"{self.base_url}/model_info"
        response = requests.get(url)
        return response.json()

# 使用示例
if __name__ == "__main__":
    # 标准 RAG 客户端
    standard_client = RAGClient()
    result = standard_client.ask("什么是产业大脑？")
    print(f"标准 RAG: {result['answer']}")
    
    # LoRA RAG 客户端
    lora_client = LoRARAGClient()
    
    # 获取模型信息
    model_info = lora_client.get_model_info()
    print(f"当前模型: {model_info['current_model']['type']}")
    
    # 使用 LoRA 模型问答
    result = lora_client.ask("什么是产业大脑？")
    print(f"LoRA RAG: {result['answer']}")
    
    # 切换到 Ollama 模型
    switch_result = lora_client.switch_model("ollama")
    print(f"切换结果: {switch_result['message']}")
```

---

## 版本历史

### v1.1.0 (2024-01-15)
- 新增 LoRA RAG 服务支持
- 实现动态模型切换功能
- 添加自定义缓存目录支持
- 增强模型信息查询接口

### v1.0.0 (2024-01-15)
- 初始版本发布
- 支持基本问答和搜索功能
- 实现健康检查和统计接口
- 添加异步更新支持

---

## 联系支持

如有API使用问题，请联系技术支持团队或查阅 [用户手册](user_manual.md)。