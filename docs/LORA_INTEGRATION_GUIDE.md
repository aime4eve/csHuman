# LoRA 微调模型集成到 RAG 系统指南

本指南详细说明如何将 LoRA 微调后的模型集成到现有的 RAG (Retrieval-Augmented Generation) 系统中。

## 📋 目录

1. [概述](#概述)
2. [系统架构](#系统架构)
3. [文件结构](#文件结构)
4. [集成步骤](#集成步骤)
5. [配置说明](#配置说明)
6. [使用方法](#使用方法)
7. [API 接口](#api-接口)
8. [故障排除](#故障排除)
9. [性能优化](#性能优化)
10. [常见问题](#常见问题)

## 🎯 概述

### 集成目标

- 将 LoRA 微调模型无缝集成到现有 RAG 系统
- 支持动态切换 LoRA 模型和原始 Ollama 模型
- 保持向后兼容性，不影响现有功能
- 提供灵活的配置选项和部署方式

### 主要特性

- ✅ **双模型支持**: 同时支持 LoRA 微调模型和 Ollama 模型
- ✅ **动态切换**: 运行时可切换不同的模型
- ✅ **自定义缓存**: 支持自定义模型缓存目录
- ✅ **配置灵活**: 丰富的环境变量配置选项
- ✅ **健康检查**: 完整的系统状态监控
- ✅ **错误处理**: 优雅的错误处理和降级机制

## 🏗️ 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LoRA RAG 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│  API Layer (FastAPI)                                       │
│  ├── /ask          - 问答接口                               │
│  ├── /switch_model - 模型切换                               │
│  ├── /model_info   - 模型信息                               │
│  └── /health       - 健康检查                               │
├─────────────────────────────────────────────────────────────┤
│  RAG Handler Layer                                         │
│  ├── LoRARAGHandler     - LoRA RAG 处理器                  │
│  ├── LoRALanguageModel - LoRA 语言模型封装                 │
│  └── 原始 RAGHandler    - Ollama RAG 处理器                │
├─────────────────────────────────────────────────────────────┤
│  Model Layer                                               │
│  ├── LoRA Model        - 微调后的 LoRA 适配器              │
│  ├── Base Model        - HuggingFace 基础模型              │
│  └── Ollama Models     - Ollama 托管模型                   │
├─────────────────────────────────────────────────────────────┤
│  Vector Store Layer                                        │
│  ├── FAISS Vector Store - 向量数据库                       │
│  └── Embedding Model    - 文本嵌入模型                     │
└─────────────────────────────────────────────────────────────┘
```

## 📁 文件结构

```
csHuman/
├── app/
│   ├── __init__.py
│   ├── main.py                 # 原始 RAG API
│   ├── lora_main.py           # LoRA RAG API (新增)
│   ├── rag_handler.py         # 原始 RAG 处理器
│   └── lora_rag_handler.py    # LoRA RAG 处理器 (新增)
├── config/
│   └── scheduler_config.json
├── vector_store/              # 向量存储目录
├── lora_adapters/             # LoRA 适配器目录 (新增)
│   ├── adapter_config.json
│   ├── adapter_model.safetensors
│   └── ...
├── .env                       # 环境配置
├── .env.lora                  # LoRA 环境配置模板 (新增)
├── start_lora_rag.py         # LoRA RAG 启动脚本 (新增)
├── LORA_INTEGRATION_GUIDE.md # 本集成指南 (新增)
└── requirements.txt
```

## 🔧 集成步骤

### 步骤 1: 准备 LoRA 模型

1. **完成 LoRA 微调**:
   ```bash
   # 使用微调脚本训练模型
   python finetune_lora.py \
     --model_name Qwen/Qwen2.5-1.5B-Instruct \
     --cache_dir E:\LLM_Models \
     --output_dir ./lora_adapters \
     --num_train_epochs 3
   ```

2. **验证 LoRA 输出**:
   ```bash
   # 检查 LoRA 适配器文件
   ls -la ./lora_adapters/
   # 应该包含:
   # - adapter_config.json
   # - adapter_model.safetensors
   # - tokenizer 相关文件
   ```

### 步骤 2: 配置环境

1. **复制环境配置**:
   ```bash
   cp .env.lora .env
   ```

2. **修改配置文件**:
   ```bash
   # 编辑 .env 文件
   nano .env
   ```

   关键配置项:
   ```env
   # LoRA 模型配置
   BASE_MODEL_NAME=Qwen/Qwen2.5-1.5B-Instruct
   LORA_MODEL_PATH=./lora_adapters
   CACHE_DIR=E:\LLM_Models
   USE_LORA_DEFAULT=true
   
   # 设备配置
   DEVICE=auto  # auto, cuda, cpu
   
   # API 配置
   API_PORT=8001
   API_HOST=127.0.0.1
   ```

### 步骤 3: 安装依赖

```bash
# 安装 LoRA 相关依赖
pip install peft accelerate

# 确保其他依赖已安装
pip install fastapi uvicorn transformers torch langchain langchain_community langchain_ollama python-dotenv
```

### 步骤 4: 验证集成

1. **运行配置检查**:
   ```bash
   python start_lora_rag.py --config-check
   ```

2. **启动服务**:
   ```bash
   python start_lora_rag.py
   ```

3. **测试 API**:
   ```bash
   # 测试健康检查
   curl http://127.0.0.1:8001/health
   
   # 测试问答
   curl -X POST http://127.0.0.1:8001/ask \
     -H "Content-Type: application/json" \
     -d '{"query": "你好，请介绍一下你自己", "use_lora": true}'
   ```

## ⚙️ 配置说明

### 环境变量详解

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `BASE_MODEL_NAME` | `Qwen/Qwen2.5-1.5B-Instruct` | 基础模型名称 |
| `LORA_MODEL_PATH` | `./lora_adapters` | LoRA 适配器路径 |
| `CACHE_DIR` | - | 模型缓存目录 |
| `USE_LORA_DEFAULT` | `true` | 默认是否使用 LoRA |
| `DEVICE` | `auto` | 计算设备 |
| `MAX_NEW_TOKENS` | `512` | 最大生成长度 |
| `TEMPERATURE` | `0.7` | 生成温度 |
| `TOP_P` | `0.9` | Top-p 采样 |
| `API_PORT` | `8001` | API 端口 |
| `API_HOST` | `127.0.0.1` | API 主机 |

### 设备配置

系统支持自动检测和手动配置计算设备，**默认配置为CPU模式以确保最大兼容性**：

- `cpu`: 强制使用CPU（**默认配置，确保兼容性**）
- `auto`: 自动检测 CUDA 可用性
- `cuda`: 强制使用 GPU (需要 CUDA 支持)

**重要说明**：微调后的推理应用默认配置为CPU模式，无需GPU即可运行。如果您有GPU资源，可以将 `DEVICE` 设置为 `auto` 或 `cuda` 以获得更好的性能。

### 缓存目录配置

如果设置了 `CACHE_DIR`，模型将下载到指定目录:
```
CACHE_DIR/
└── models--Qwen--Qwen2.5-1.5B-Instruct/
    ├── config.json
    ├── model.safetensors
    ├── tokenizer.json
    └── ...
```

## 🚀 使用方法

### 方法 1: 使用启动脚本 (推荐)

```bash
# 基本启动
python start_lora_rag.py

# 指定端口
python start_lora_rag.py --port 8002

# 禁用 LoRA 模型
python start_lora_rag.py --use-lora false

# 启用详细日志
python start_lora_rag.py --verbose

# 仅检查配置
python start_lora_rag.py --config-check
```

### 方法 2: 直接启动

```bash
# 使用 uvicorn 直接启动
uvicorn app.lora_main:app --host 127.0.0.1 --port 8001

# 或使用 Python
python -m app.lora_main
```

### 方法 3: 同时运行两个服务

```bash
# 终端 1: 启动原始 RAG 服务
uvicorn app.main:app --host 127.0.0.1 --port 8000

# 终端 2: 启动 LoRA RAG 服务
python start_lora_rag.py --port 8001
```

## 🔌 API 接口

### 1. 问答接口

**POST** `/ask`

```json
{
  "query": "你的问题",
  "use_lora": true  // 可选，是否使用 LoRA 模型
}
```

**响应**:
```json
{
  "answer": "回答内容",
  "source_documents": [...],
  "model_used": "lora",
  "processing_time": 1.23
}
```

### 2. 模型切换接口

**POST** `/switch_model`

```json
{
  "use_lora": false  // 切换到 Ollama 模型
}
```

### 3. 模型信息接口

**GET** `/model_info`

**响应**:
```json
{
  "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
  "lora_model_path": "./lora_adapters",
  "lora_exists": true,
  "using_lora": true,
  "cache_dir": "E:\\LLM_Models",
  "vector_store_path": "./vector_store",
  "embedding_model": "quentinz/bge-large-zh-v1.5"
}
```

### 4. 健康检查接口

**GET** `/health`

**响应**:
```json
{
  "status": "healthy",
  "components": {
    "rag_handler": true,
    "vector_store": true,
    "lora_model": true,
    "ollama_service": true
  },
  "details": {
    "model_info": {
      "base_model": "Qwen/Qwen2.5-1.5B-Instruct",
      "using_lora": true
    }
  }
}
```

## 🔧 故障排除

### 常见问题及解决方案

#### 1. LoRA 模型加载失败

**错误**: `FileNotFoundError: LoRA adapter not found`

**解决方案**:
```bash
# 检查 LoRA 文件是否存在
ls -la ./lora_adapters/

# 确认配置正确
echo $LORA_MODEL_PATH

# 重新训练 LoRA 模型
python finetune_lora.py --output_dir ./lora_adapters
```

#### 2. CUDA 内存不足

**错误**: `CUDA out of memory`

**解决方案**:
```bash
# 方法 1: 使用 CPU
export DEVICE=cpu

# 方法 2: 启用量化
export ENABLE_QUANTIZATION=true
export QUANTIZATION_TYPE=int8

# 方法 3: 减少批处理大小
export BATCH_SIZE=1
```

#### 3. 模型下载失败

**错误**: `Connection timeout`

**解决方案**:
```bash
# 设置 HuggingFace 镜像
export HF_ENDPOINT=https://hf-mirror.com

# 或使用代理
export HTTP_PROXY=http://your-proxy:port
export HTTPS_PROXY=http://your-proxy:port
```

#### 4. Ollama 服务连接失败

**错误**: `Connection refused to localhost:11434`

**解决方案**:
```bash
# 启动 Ollama 服务
ollama serve

# 检查服务状态
curl http://localhost:11434/api/tags

# 安装所需模型
ollama pull qwen3:4b
ollama pull quentinz/bge-large-zh-v1.5
```

#### 5. LoRA 微调脚本路径错误

**错误**: `can't open file 'finetune_lora.py': No such file or directory`

**解决方案**:
```bash
# 确保使用绝对路径
# 脚本已自动修复，使用动态路径获取
python scripts/finetune_with_custom_cache.py
```

#### 6. SFTTrainer API 兼容性问题

**错误**: `SFTTrainer.__init__() got an unexpected keyword argument 'tokenizer'`

**解决方案**:
```bash
# 系统已自动切换到标准 Trainer
# 使用 DataCollatorForLanguageModeling 进行数据整理
# 无需手动修改，脚本已自动适配
```

#### 7. CPU 环境下梯度计算错误

**错误**: `element 0 of tensors does not require grad and does not have a grad_fn`

**解决方案**:
```bash
# 系统已自动禁用 GPU 专用功能
# --fp16 False
# --gradient_checkpointing False
# 确保 LoRA 参数正确设置为可训练状态
```

### 日志调试

```bash
# 启用详细日志
python start_lora_rag.py --verbose

# 或设置环境变量
export LOG_LEVEL=DEBUG
export VERBOSE=true
```

## ⚡ 性能优化

### 1. 模型量化

```env
# 启用 INT8 量化
ENABLE_QUANTIZATION=true
QUANTIZATION_TYPE=int8
```

### 2. 缓存优化

```env
# 使用 SSD 作为缓存目录
CACHE_DIR=/path/to/ssd/cache

# 预加载模型
preload_models=true
```

### 3. 并发配置

```bash
# 使用多个 worker
uvicorn app.lora_main:app --workers 4 --host 0.0.0.0 --port 8001
```

### 4. GPU 优化

```env
# 启用混合精度
ENABLE_FP16=true

# 设置 GPU 内存分配
CUDA_MEMORY_FRACTION=0.8
```

## ❓ 常见问题

### Q1: 如何在生产环境中部署？

**A**: 推荐使用 Docker 容器化部署:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8001

CMD ["python", "start_lora_rag.py", "--host", "0.0.0.0"]
```

### Q2: 如何切换不同的 LoRA 模型？

**A**: 有两种方式:

1. **运行时切换**: 使用 `/switch_model` API
2. **重启切换**: 修改 `LORA_MODEL_PATH` 环境变量后重启服务

### Q3: 如何监控系统性能？

**A**: 可以集成监控工具:

```python
# 添加 Prometheus 指标
from prometheus_client import Counter, Histogram

request_count = Counter('rag_requests_total', 'Total RAG requests')
response_time = Histogram('rag_response_time_seconds', 'RAG response time')
```

### Q4: 如何备份和恢复模型？

**A**: 

```bash
# 备份 LoRA 适配器
tar -czf lora_backup.tar.gz ./lora_adapters/

# 备份向量存储
tar -czf vector_store_backup.tar.gz ./vector_store/

# 恢复
tar -xzf lora_backup.tar.gz
tar -xzf vector_store_backup.tar.gz
```

## 📚 相关文档

- [LoRA 微调指南](./custom_cache_directory.md)
- [原始 RAG 系统文档](./README.md)
- [API 接口文档](./API_DOCS.md)
- [部署指南](./DEPLOYMENT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个集成方案！

## 📄 许可证

本项目采用 MIT 许可证。