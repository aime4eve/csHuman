# 智能问答系统使用手册

## 目录

1. [系统概述](#系统概述)
2. [环境要求](#环境要求)
3. [安装部署](#安装部署)
4. [配置说明](#配置说明)
5. [基本使用](#基本使用)
6. [高级功能](#高级功能)
7. [API接口](#api接口)
8. [维护管理](#维护管理)
9. [故障排除](#故障排除)
10. [性能优化](#性能优化)

---

## 系统概述

### 功能特性

智能问答系统是一个基于RAG（检索增强生成）技术的企业级知识问答平台，具备以下核心功能：

- **智能问答**：基于企业知识库的精准问答服务
- **多格式支持**：支持Markdown、PDF、Word等多种文档格式
- **LoRA微调**：针对特定领域的模型优化，支持自定义缓存目录
- **LoRA RAG集成**：微调模型与RAG系统的无缝集成，支持动态模型切换
- **增量更新**：智能的知识库更新和维护机制
- **自动评估**：完整的质量评估和监控体系
- **RESTful API**：标准化的API接口服务，支持双服务架构

### 技术架构

#### 双服务架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │  标准RAG服务    │    │   向量数据库    │
│   (可选)        │◄──►│  FastAPI:8000   │◄──►│   FAISS         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   RAG处理器     │
                       │   检索+生成     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Ollama模型    │
                       │   qwen2.5:7b    │
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │  LoRA RAG服务   │    │   向量数据库    │
│   (可选)        │◄──►│  FastAPI:8001   │◄──►│   FAISS         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  LoRA RAG处理器 │
                       │   检索+生成     │
                       └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   LoRA模型      │
                       │  微调+适配器    │
                       └─────────────────┘
```

---

## 环境要求

### 硬件要求

**最低配置：**
- CPU: 4核心
- 内存: 8GB RAM
- 存储: 20GB 可用空间
- GPU: 可选（推荐用于模型微调）

**推荐配置：**
- CPU: 8核心或更多
- 内存: 16GB RAM或更多
- 存储: 50GB 可用空间（SSD推荐）
- GPU: NVIDIA GPU 8GB+ VRAM（用于模型微调）

### 软件要求

- **操作系统**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Python**: 3.8 - 3.11
- **Ollama**: 最新版本
- **Git**: 用于代码管理

---

## 安装部署

### 1. 环境准备

#### 安装Python
```bash
# 检查Python版本
python --version

# 如果版本不符合要求，请从官网下载安装
# https://www.python.org/downloads/
```

#### 安装Ollama
```bash
# Windows
# 从 https://ollama.ai 下载安装包

# macOS
brew install ollama

# Linux
curl -fsSL https://ollama.ai/install.sh | sh
```

#### 下载所需模型
```bash
# 下载聊天模型
ollama pull qwen2.5:7b

# 下载嵌入模型
ollama pull nomic-embed-text
```

### 2. 项目部署

#### 克隆项目
```bash
git clone <项目地址>
cd csHuman
```

#### 创建虚拟环境
```bash
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 初始化配置

#### 创建环境配置文件
```bash
cp .env.example .env
```

#### 编辑配置文件
```env
# .env 文件内容
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
KNOWLEDGE_BASE_PATH=../../notes
VECTOR_STORE_PATH=./vector_store
```

---

## 配置说明

### 环境变量配置

#### 标准RAG服务配置 (.env)
| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `OLLAMA_BASE_URL` | Ollama服务地址 | `http://localhost:11434` | 是 |
| `OLLAMA_MODEL` | 聊天模型名称 | `qwen2.5:7b` | 是 |
| `OLLAMA_EMBEDDING_MODEL` | 嵌入模型名称 | `nomic-embed-text` | 是 |
| `KNOWLEDGE_BASE_PATH` | 知识库路径 | `../../notes` | 是 |
| `VECTOR_STORE_PATH` | 向量存储路径 | `./vector_store` | 是 |

#### LoRA RAG服务配置 (.env.lora)
| 变量名 | 说明 | 默认值 | 必填 |
|--------|------|--------|------|
| `OLLAMA_EMBEDDING_MODEL` | 嵌入模型名称 | `quentinz/bge-large-zh-v1.5` | 是 |
| `OLLAMA_CHAT_MODEL` | Ollama聊天模型 | `qwen3:4b` | 否 |
| `LORA_MODEL_PATH` | LoRA模型路径 | `./lora_adapters` | 否 |
| `BASE_MODEL_NAME` | 基础模型名称 | `Qwen/Qwen2.5-1.5B-Instruct` | 是 |
| `CACHE_DIR` | 模型缓存目录 | `~/.cache/huggingface` | 否 |
| `DEVICE` | 计算设备 | `auto` | 否 |
| `MAX_LENGTH` | 最大生成长度 | `2048` | 否 |
| `TEMPERATURE` | 生成温度 | `0.7` | 否 |
| `TOP_P` | Top-p采样 | `0.9` | 否 |

### 调度器配置

调度器配置文件位于 `config/scheduler_config.json`：

```json
{
  "scheduled_update": {
    "enabled": true,
    "interval_hours": 6,
    "time": "02:00"
  },
  "file_watch": {
    "enabled": true,
    "debounce_seconds": 30
  },
  "performance": {
    "chunk_size": 1000,
    "chunk_overlap": 200,
    "embedding_batch_size": 32
  }
}
```

---

## 基本使用

### 1. 初始化知识库

```bash
# 首次运行需要构建向量存储
python ingest.py
```

### 2. 启动服务

#### 启动标准RAG服务
```bash
# 激活虚拟环境
source venv/bin/activate  # Windows: venv\Scripts\activate

# 启动标准RAG服务 (端口8000)
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

#### 启动LoRA RAG服务
```bash
# 方法1: 使用启动脚本 (推荐)
python start_lora_rag.py --port 8001

# 方法2: 直接启动
uvicorn lora_main:app --host 127.0.0.1 --port 8001

# 方法3: 仅使用Ollama模型 (不加载LoRA)
python start_lora_rag.py --port 8001 --no-lora
```

### 3. 测试服务

#### 测试标准RAG服务
```bash
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是产业大脑？"}'
```

#### 测试LoRA RAG服务
```bash
# 基本问答
curl -X POST "http://127.0.0.1:8001/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是产业大脑？"}'

# 获取模型信息
curl "http://127.0.0.1:8001/model_info"

# 切换到Ollama模型
curl -X POST "http://127.0.0.1:8001/switch_model" \
     -H "Content-Type: application/json" \
     -d '{"model_type": "ollama"}'

# 切换回LoRA模型
curl -X POST "http://127.0.0.1:8001/switch_model" \
     -H "Content-Type: application/json" \
     -d '{"model_type": "lora", "lora_path": "./lora_adapters"}'
```

### 2. 启动API服务

```bash
# 启动FastAPI服务
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

服务启动后，可以通过以下地址访问：
- API文档: http://127.0.0.1:8000/docs
- 健康检查: http://127.0.0.1:8000/health

### 3. 基本问答

#### 通过API接口
```bash
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是产业大脑？"}'
```

#### 通过Python脚本
```python
import requests

response = requests.post(
    "http://127.0.0.1:8000/ask",
    json={"question": "什么是产业大脑？"}
)

result = response.json()
print(f"答案: {result['answer']}")
print(f"来源: {result['sources']}")
```

---

## 高级功能

### 1. LoRA模型微调与RAG集成

#### 准备训练数据
训练数据格式（JSON）：
```json
[
  {
    "messages": [
      {
        "role": "system",
        "content": "你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。"
      },
      {
        "role": "user",
        "content": "什么是产业大脑？"
      },
      {
        "role": "assistant",
        "content": "产业大脑是一个综合性的数字化平台..."
      }
    ]
  }
]
```

#### 执行微调
```bash
# 基础微调
python scripts/finetune_lora.py \
    --model_name Qwen/Qwen2.5-1.5B-Instruct \
    --dataset_path finetune_dataset.json \
    --output_dir ./lora_adapters \
    --num_epochs 3 \
    --learning_rate 1e-4

# 使用自定义缓存目录
python scripts/finetune_lora.py \
    --model_name Qwen/Qwen2.5-1.5B-Instruct \
    --dataset_path finetune_dataset.json \
    --output_dir ./lora_adapters \
    --cache_dir E:/LLM_Models \
    --num_epochs 3 \
    --learning_rate 1e-4

# 使用示例脚本
python scripts/finetune_with_custom_cache.py
```

#### LoRA RAG集成使用
```bash
# 启动LoRA RAG服务
python start_lora_rag.py --port 8001

# 测试集成
python test_lora_integration.py

# 运行缓存功能演示
python scripts/simulate_custom_cache.py
```

#### 动态模型切换
```python
import requests

# 切换到LoRA模型
response = requests.post(
    "http://127.0.0.1:8001/switch_model",
    json={"model_type": "lora", "lora_path": "./lora_adapters"}
)

# 切换到Ollama模型
response = requests.post(
    "http://127.0.0.1:8001/switch_model",
    json={"model_type": "ollama"}
)

# 获取当前模型信息
response = requests.get("http://127.0.0.1:8001/model_info")
print(response.json())
```

### 2. 增量更新

#### 手动更新
```bash
# 检查并更新知识库
python scripts/incremental_update.py

# 强制重建向量存储
python scripts/incremental_update.py --force-rebuild
```

#### 自动调度
```bash
# 启动调度器（后台运行）
python scripts/update_scheduler.py

# 使用自定义配置
python scripts/update_scheduler.py --config config/scheduler_config.json
```

### 3. 系统评估

#### 运行评估
```bash
# 执行完整评估
python scripts/evaluate_rag_system.py

# 查看评估结果
cat evaluation_results/evaluation_summary_*.md
```

#### 评估指标
- **准确性**: 答案的事实正确性
- **相关性**: 答案与问题的相关程度
- **完整性**: 答案的全面性
- **清晰度**: 答案的表达清晰度
- **有用性**: 答案的实用价值

---

## API接口

### 接口概览

#### 标准RAG服务 (端口8000)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/ask` | POST | 问答接口 |
| `/search` | POST | 文档搜索 |
| `/update` | POST | 触发更新 |

#### LoRA RAG服务 (端口8001)
| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/ask` | POST | LoRA模型问答接口 |
| `/switch_model` | POST | 动态切换模型 |
| `/model_info` | GET | 获取当前模型信息 |

### 详细接口说明

#### 1. 健康检查
```http
GET /health
```

**响应示例：**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

#### 2. 标准问答接口
```http
POST /ask
Content-Type: application/json

{
  "question": "什么是产业大脑？",
  "max_tokens": 500,
  "temperature": 0.7
}
```

**响应示例：**
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
  "response_time": 1.23,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 3. LoRA问答接口
```http
POST http://127.0.0.1:8001/ask
Content-Type: application/json

{
  "question": "什么是产业大脑？",
  "max_tokens": 500,
  "temperature": 0.7
}
```

**响应示例：**
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
    "lora_path": "./lora_adapters"
  },
  "response_time": 1.23,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### 4. 模型切换接口
```http
POST http://127.0.0.1:8001/switch_model
Content-Type: application/json

{
  "model_type": "lora",
  "lora_path": "./lora_adapters"
}
```

**响应示例：**
```json
{
  "success": true,
  "message": "模型切换成功",
  "current_model": {
    "type": "lora",
    "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
    "lora_path": "./lora_adapters"
  }
}
```

#### 5. 模型信息接口
```http
GET http://127.0.0.1:8001/model_info
```

**响应示例：**
```json
{
  "current_model": {
    "type": "lora",
    "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
    "lora_path": "./lora_adapters",
    "device": "cuda:0",
    "cache_dir": "E:/LLM_Models"
  },
  "available_models": [
    "lora",
    "ollama"
  ],
  "system_info": {
    "cuda_available": true,
    "gpu_memory": "8GB"
  }
}
```

#### 3. 文档搜索
```http
POST /search
Content-Type: application/json

{
  "query": "技术架构",
  "top_k": 5
}
```

**响应示例：**
```json
{
  "results": [
    {
      "file_path": "产业大脑项目/技术架构设计level0.md",
      "content": "技术架构相关内容...",
      "score": 0.92
    }
  ],
  "total_results": 5
}
```

---

## 维护管理

### 1. 日常维护

#### 检查系统状态
```bash
# 检查标准RAG服务状态
curl http://127.0.0.1:8000/health

# 检查LoRA RAG服务状态
curl http://127.0.0.1:8001/health

# 检查LoRA模型信息
curl http://127.0.0.1:8001/model_info

# 检查Ollama服务状态
ollama list
```

#### 查看日志
```bash
# 查看标准RAG应用日志
tail -f logs/app.log

# 查看LoRA RAG应用日志
tail -f logs/lora_app.log

# 查看更新调度器日志
tail -f logs/update_scheduler.log

# 查看LoRA集成测试日志
tail -f logs/lora_integration.log
```

#### LoRA模型管理
```bash
# 列出可用的LoRA适配器
ls -la lora_adapters/

# 检查模型缓存
ls -la E:/LLM_Models/

# 运行LoRA集成测试
python test_lora_integration.py --verbose

# 切换模型（通过API）
curl -X POST "http://127.0.0.1:8001/switch_model" \
     -H "Content-Type: application/json" \
     -d '{"model_type": "ollama"}'
```

#### 备份数据
```bash
# 备份向量存储
cp -r vector_store vector_store_backup_$(date +%Y%m%d)

# 备份配置文件
cp .env .env.backup
cp config/scheduler_config.json config/scheduler_config.json.backup
```

### 2. 性能监控

#### 系统资源监控
```bash
# 查看内存使用
ps aux | grep python

# 查看磁盘使用
du -sh vector_store/
du -sh logs/
```

#### 应用性能监控
```python
# 查看评估指标
import json
with open('evaluation_results/evaluation_report_latest.json') as f:
    metrics = json.load(f)
    print(f"平均响应时间: {metrics['avg_response_time']}ms")
    print(f"平均评分: {metrics['avg_score']}/5")
```

### 3. 数据管理

#### 清理临时文件
```bash
# 清理日志文件（保留最近7天）
find logs/ -name "*.log" -mtime +7 -delete

# 清理备份文件（保留最近30天）
find . -name "*_backup_*" -mtime +30 -delete
```

#### 优化向量存储
```bash
# 重建向量存储（优化性能）
python scripts/incremental_update.py --force-rebuild
```

---

## 故障排除

### 常见问题

#### 1. API服务无法启动

**症状**: `uvicorn` 命令执行失败

**可能原因**:
- 端口被占用
- 依赖包未安装
- 环境变量配置错误

**解决方案**:
```bash
# 检查端口占用
netstat -an | grep 8000

# 重新安装依赖
pip install -r requirements.txt

# 检查环境变量
cat .env
```

#### 2. LoRA微调脚本执行失败

**症状**: `can't open file 'finetune_lora.py': No such file or directory`

**可能原因**:
- 脚本路径配置错误
- 相对路径解析失败

**解决方案**:
```bash
# 使用修复后的脚本（已自动处理路径问题）
python scripts/finetune_with_custom_cache.py

# 或直接使用绝对路径
python E:\knowledge\src\csHuman\scripts\finetune_lora.py
```

#### 3. CPU环境下训练失败

**症状**: `element 0 of tensors does not require grad and does not have a grad_fn`

**可能原因**:
- GPU专用参数在CPU环境下不兼容
- 模型参数梯度设置错误

**解决方案**:
```bash
# 系统已自动适配CPU环境，禁用以下参数：
# --fp16 False
# --gradient_checkpointing False
# 确保LoRA参数正确设置为可训练状态
```

#### 4. SFTTrainer API兼容性问题

**症状**: `SFTTrainer.__init__() got an unexpected keyword argument 'tokenizer'`

**可能原因**:
- trl库版本更新导致API变化
- SFTTrainer参数不兼容

**解决方案**:
```bash
# 系统已自动切换到标准Trainer
# 使用DataCollatorForLanguageModeling进行数据整理
# 自动设置labels用于语言建模任务
# 无需手动修改，脚本已自动适配
```

#### 5. Ollama连接失败

**症状**: `Connection refused` 错误

**可能原因**:
- Ollama服务未启动
- 服务地址配置错误
- 防火墙阻止连接

**解决方案**:
```bash
# 启动Ollama服务
ollama serve

# 检查服务状态
curl http://localhost:11434/api/tags

# 检查配置
echo $OLLAMA_BASE_URL
```

#### 3. 向量存储加载失败

**症状**: `FAISS index not found` 错误

**可能原因**:
- 向量存储未初始化
- 文件权限问题
- 存储路径错误

**解决方案**:
```bash
# 重新构建向量存储
python ingest.py

# 检查文件权限
ls -la vector_store/

# 检查路径配置
echo $VECTOR_STORE_PATH
```

#### 4. 内存不足

**症状**: `OutOfMemoryError` 或系统响应缓慢

**可能原因**:
- 文档过大
- 批处理大小过大
- 内存泄漏

**解决方案**:
```bash
# 调整配置参数
# 在 config/scheduler_config.json 中:
{
  "performance": {
    "chunk_size": 500,        # 减小分块大小
    "embedding_batch_size": 16 # 减小批处理大小
  }
}

# 重启服务
pkill -f uvicorn
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### 调试技巧

#### 1. 启用详细日志
```python
# 在代码中添加调试日志
import logging
logging.basicConfig(level=logging.DEBUG)
```

#### 2. 使用调试模式
```bash
# 启动调试模式
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload --log-level debug
```

#### 3. 单步测试
```python
# 测试单个组件
from app.rag_handler import RAGHandler

rag = RAGHandler()
result = rag.search_documents("测试查询")
print(result)
```

---

## 性能优化

### 1. 硬件优化

#### CPU优化
- 使用多核CPU处理并发请求
- 调整进程和线程数量
- 启用CPU亲和性设置

#### 内存优化
- 增加系统内存
- 使用内存映射文件
- 实施内存池管理

#### 存储优化
- 使用SSD存储
- 分离数据和日志存储
- 定期清理临时文件

### 2. 软件优化

#### 模型优化
```bash
# 使用量化模型
ollama pull qwen2.5:7b-q4_0

# 调整模型参数
# 在API调用中设置较小的max_tokens
```

#### 向量存储优化
```python
# 使用更高效的向量数据库
# 考虑使用 Chroma 或 Pinecone 替代 FAISS

# 优化索引参数
faiss_index = faiss.IndexFlatIP(dimension)
faiss_index = faiss.IndexIVFFlat(quantizer, dimension, nlist)
```

#### 缓存优化
```python
# 实施查询缓存
from functools import lru_cache

@lru_cache(maxsize=1000)
def cached_search(query):
    return search_documents(query)
```

### 3. 配置优化

#### API服务配置
```bash
# 使用Gunicorn提高并发性能
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

#### 数据库配置
```json
{
  "performance": {
    "chunk_size": 800,
    "chunk_overlap": 100,
    "embedding_batch_size": 64,
    "max_concurrent_requests": 10
  }
}
```

### 4. 监控和调优

#### 性能指标监控
```python
# 监控关键指标
metrics = {
    "response_time": [],
    "memory_usage": [],
    "cpu_usage": [],
    "query_throughput": []
}
```

#### 自动调优
```python
# 实施自适应参数调整
def auto_tune_parameters():
    if avg_response_time > threshold:
        reduce_batch_size()
    if memory_usage > threshold:
        trigger_garbage_collection()
```

---

## 附录

### A. 配置文件模板

#### .env 模板
```env
# Ollama配置
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# 路径配置
KNOWLEDGE_BASE_PATH=../../notes
VECTOR_STORE_PATH=./vector_store

# API配置
API_HOST=127.0.0.1
API_PORT=8000

# 日志配置
LOG_LEVEL=INFO
LOG_FILE=logs/app.log
```

### B. 常用命令速查

```bash
# 服务管理
uvicorn app.main:app --host 127.0.0.1 --port 8000  # 启动API服务
python scripts/update_scheduler.py                   # 启动调度器
python scripts/incremental_update.py               # 手动更新

# 数据管理
python ingest.py                                    # 初始化知识库
python scripts/evaluate_rag_system.py              # 运行评估

# 模型管理
ollama pull qwen2.5:7b                             # 下载模型
ollama list                                         # 查看已安装模型
ollama serve                                        # 启动Ollama服务

# 测试命令
pytest tests/                                       # 运行测试
pytest --cov=app tests/                            # 运行覆盖率测试
```

### C. 技术支持

如需技术支持，请提供以下信息：
1. 系统版本和配置信息
2. 错误日志和堆栈跟踪
3. 重现问题的步骤
4. 系统资源使用情况

---

**版本**: 1.0.0  
**更新日期**: 2024年1月15日  
**文档维护**: 开发团队