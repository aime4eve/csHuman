# 快速开始指南

## 🚀 5分钟快速部署

本指南将帮助您在5分钟内快速部署并运行智能问答系统。系统提供两种服务模式：

- **标准 RAG 服务** (端口 8000): 基于 Ollama 模型的传统 RAG 服务
- **LoRA RAG 服务** (端口 8001): 支持 LoRA 微调模型的增强 RAG 服务

### 前置条件

- ✅ Python 3.8+ 已安装
- ✅ Git 已安装
- ✅ 至少 8GB 可用内存
- ✅ **默认支持CPU运行**，无需GPU
- 🚀 可选：NVIDIA GPU（用于加速推理）

---

## 步骤1: 安装Ollama

### Windows
```powershell
# 下载并安装 Ollama
# 访问 https://ollama.ai 下载安装包
# 或使用 winget
winget install Ollama.Ollama
```

### macOS
```bash
brew install ollama
```

### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

---

## 步骤2: 下载模型

```bash
# 启动 Ollama 服务（如果未自动启动）
ollama serve

# 在新终端中下载所需模型
ollama pull qwen2.5:7b
ollama pull nomic-embed-text
```

> 💡 **提示**: 模型下载可能需要几分钟，请耐心等待。

---

## 步骤3: 部署项目

```bash
# 1. 克隆项目
git clone <项目地址>
cd csHuman

# 2. 创建虚拟环境
python -m venv venv

# 3. 激活虚拟环境
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt
```

---

## 步骤4: 配置环境

```bash
# 复制配置文件
cp .env.example .env
```

### 标准 RAG 配置
编辑 `.env` 文件（可选，默认配置通常可以直接使用）：
```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
KNOWLEDGE_BASE_PATH=../../notes
VECTOR_STORE_PATH=./vector_store
```

### LoRA RAG 配置（可选）
如果需要使用 LoRA 微调功能：
```bash
# 复制 LoRA 配置文件
cp .env.lora.example .env.lora
```

编辑 `.env.lora` 文件：
```env
# LoRA 模型配置
LORA_MODEL_PATH=./models/lora_model
LORA_CACHE_DIR=./cache/lora
LORA_MAX_LENGTH=2048
LORA_TEMPERATURE=0.7

# API 配置
LORA_API_HOST=127.0.0.1
LORA_API_PORT=8001
```

---

## 步骤5: 初始化知识库

```bash
# 构建向量存储（首次运行必需）
python ingest.py
```

> ⏱️ **预计时间**: 根据文档数量，可能需要1-5分钟。

---

## 步骤6: 启动服务

### 启动标准 RAG 服务
```bash
# 启动标准 RAG API 服务
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

看到以下输出表示启动成功：
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
```

### 启动 LoRA RAG 服务（可选）
在新的终端窗口中运行：
```bash
# 激活虚拟环境
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# 启动 LoRA RAG 服务
python start_lora_rag.py --port 8001
```

看到以下输出表示 LoRA 服务启动成功：
```
INFO:     LoRA RAG service running on http://127.0.0.1:8001
```

---

## 🎉 测试系统

### 方法1: 浏览器测试

#### 测试标准 RAG 服务
1. 打开浏览器访问: http://127.0.0.1:8000/docs
2. 点击 `/ask` 接口
3. 点击 "Try it out"
4. 输入测试问题，例如：
   ```json
   {
     "question": "什么是产业大脑？"
   }
   ```
5. 点击 "Execute" 查看结果

#### 测试 LoRA RAG 服务（如果已启动）
1. 打开浏览器访问: http://127.0.0.1:8001/docs
2. 点击 `/ask` 接口
3. 点击 "Try it out"
4. 输入测试问题，例如：
   ```json
   {
     "question": "什么是产业大脑？"
   }
   ```
5. 点击 "Execute" 查看结果

### 方法2: 命令行测试

#### 测试标准 RAG 服务
```bash
# 健康检查
curl http://127.0.0.1:8000/health

# 问答测试
curl -X POST "http://127.0.0.1:8000/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是产业大脑？"}'
```

#### 测试 LoRA RAG 服务（如果已启动）
```bash
# 健康检查
curl http://127.0.0.1:8001/health

# 问答测试
curl -X POST "http://127.0.0.1:8001/ask" \
     -H "Content-Type: application/json" \
     -d '{"question": "什么是产业大脑？"}'

# 获取当前模型信息
curl http://127.0.0.1:8001/model_info
```

### 方法3: Python脚本测试

```python
import requests

# 测试标准 RAG 服务
print("=== 测试标准 RAG 服务 ===")
response = requests.post(
    "http://127.0.0.1:8000/ask",
    json={"question": "什么是产业大脑？"}
)

if response.status_code == 200:
    result = response.json()
    print(f"✅ 标准 RAG 答案: {result['answer']}")
    print(f"📚 来源: {len(result['sources'])} 个文档")
else:
    print(f"❌ 标准 RAG 错误: {response.status_code}")

# 测试 LoRA RAG 服务（如果已启动）
print("\n=== 测试 LoRA RAG 服务 ===")
try:
    response = requests.post(
        "http://127.0.0.1:8001/ask",
        json={"question": "什么是产业大脑？"}
    )
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ LoRA RAG 答案: {result['answer']}")
        print(f"📚 来源: {len(result['sources'])} 个文档")
        
        # 获取当前模型信息
        model_info = requests.get("http://127.0.0.1:8001/model_info")
        if model_info.status_code == 200:
            info = model_info.json()
            print(f"🤖 当前模型: {info['current_model']}")
    else:
        print(f"❌ LoRA RAG 错误: {response.status_code}")
except requests.exceptions.ConnectionError:
    print("⚠️  LoRA RAG 服务未启动或不可用")
```

---

## 🔧 常见问题快速解决

### Q1: Ollama连接失败
```bash
# 检查Ollama是否运行
ollama list

# 如果没有运行，启动服务
ollama serve
```

### Q2: 端口被占用
```bash
# 使用不同端口启动
uvicorn app.main:app --host 127.0.0.1 --port 8001
```

### Q3: 模型下载失败
```bash
# 检查网络连接，重试下载
ollama pull qwen2.5:7b
```

### Q4: 向量存储错误
```bash
# 删除并重建向量存储
rm -rf vector_store
python ingest.py
```

### Q5: LoRA 微调脚本执行失败

**问题**: `can't open file 'finetune_lora.py': No such file or directory`

**解决方案**:
```bash
# 使用修复后的脚本（已自动处理路径问题）
python scripts/finetune_with_custom_cache.py
```

### Q6: CPU 环境下训练错误

**问题**: `element 0 of tensors does not require grad`

**解决方案**:
```bash
# 系统已自动适配 CPU 环境
# 自动禁用 fp16 和 gradient_checkpointing
# 确保 LoRA 参数正确设置
```

### Q7: SFTTrainer API 兼容性问题

**问题**: `SFTTrainer.__init__() got an unexpected keyword argument`

**解决方案**:
```bash
# 系统已自动切换到标准 Trainer
# 使用 DataCollatorForLanguageModeling
# 无需手动修改
```

---

## 📚 下一步

恭喜！您已成功部署智能问答系统。接下来可以：

### 🎯 基础使用
- 📖 阅读 [用户手册](user_manual.md) 了解详细功能
- 🔄 设置 [增量更新](incremental_update_guide.md) 自动维护知识库
- 📊 运行 [系统评估](../scripts/evaluate_rag_system.py) 检查性能

### 🚀 高级功能
- 🎛️ **LoRA 微调**: 使用 [LoRA 微调脚本](../scripts/finetune_lora.py) 优化模型性能
- 🔄 **LoRA RAG 集成**: 启动 [LoRA RAG 服务](../start_lora_rag.py) 使用微调模型
- 🎯 **动态模型切换**: 通过 API 在 LoRA 和 Ollama 模型间切换
- 📈 **自动调度器**: 配置 [更新调度器](../scripts/update_scheduler.py) 自动维护
- 🧪 **测试套件**: 运行 [集成测试](../tests/) 验证系统稳定性
- 💾 **自定义缓存**: 使用 [缓存示例](../examples/custom_cache_example.py) 优化性能

### 🔧 自定义配置
- 📝 修改 [调度器配置](../config/scheduler_config.json)
- 📁 添加更多文档到知识库
- 🎨 集成到您的应用程序

---

## 💡 使用技巧

### 优化问答质量
1. **具体化问题**: "产业大脑的技术架构是什么？" 比 "技术架构" 效果更好
2. **使用关键词**: 包含文档中的专业术语
3. **分步提问**: 复杂问题可以拆分为多个简单问题

### 提升系统性能
1. **定期更新**: 使用增量更新保持知识库最新
2. **监控资源**: 关注内存和CPU使用情况
3. **优化配置**: 根据硬件调整批处理大小

---

## 🆘 获取帮助

如果遇到问题：

1. 📋 查看 [故障排除指南](user_manual.md#故障排除)
2. 📝 检查日志文件: `logs/app.log`
3. 🔍 搜索 [常见问题](user_manual.md#常见问题)
4. 💬 联系技术支持团队

---

**🎉 享受您的智能问答系统！**

> 💡 **小贴士**: 将此页面加入书签，方便随时查阅部署步骤。