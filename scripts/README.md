# Scripts 目录说明

本目录包含了HKT智能问答系统的微调全生命周期管理脚本，支持从语料准备到模型应用的完整迭代流程。

## 🔄 微调生命周期工作流

```
语料准备 → 模型微调 → 效果评估 → 生产应用 → 新增语料 → 增量微调 → 持续优化 → 价值实现
    ↑                                                                    ↓
    ←←←←←←←←←←←←←←←← 持续迭代循环 ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
```

## 📁 按生命周期阶段组织的脚本

### 🎯 阶段1: 语料准备与知识库构建
```
├── ingest.py                      # 知识库文档摄取和向量化
├── build_finetune_dataset.py      # 构建微调训练数据集
├── build_evaluation_dataset.py    # 构建RAG系统评估数据集
└── incremental_update.py          # 增量知识库更新
```

### 🚀 阶段2: 模型微调训练
```
├── finetune_lora.py               # 初始LoRA微调训练
├── incremental_finetune_lora.py   # 增量LoRA微调
├── quick_train_and_test.py        # 快速训练和测试
└── simulate_lora_training.py      # 模拟LoRA训练过程
```

### 📊 阶段3: 效果评估与验证
```
├── test_cpu_inference.py          # CPU推理功能测试
├── test_finetuned_model.py        # 微调模型测试
├── test_incremental_model.py      # 增量微调模型测试
└── evaluate_rag_system.py         # RAG系统自动化评估
```

### 🔧 阶段4: 生产应用与持续优化
```
├── demo_incremental_training.py   # 增量训练演示
├── update_scheduler.py            # 知识库更新调度器
├── simulate_custom_cache.py       # 自定义缓存模拟
└── finetune_with_custom_cache.py  # 自定义缓存微调
```

## 🔄 完整生命周期实施指南

### 第一轮：初始微调到应用

#### 步骤1: 语料准备阶段
**目标**: 构建高质量的训练和评估数据集

##### `ingest.py` - 知识库文档摄取
将企业知识库文档转换为向量存储，为后续训练提供检索基础。
```bash
python ingest.py
```

##### `build_finetune_dataset.py` - 构建微调数据集
从知识库文档生成"指令-知识-答案"格式的训练数据。
```bash
python build_finetune_dataset.py
```

##### `build_evaluation_dataset.py` - 构建评估数据集
生成标准化的评估问题集，用于后续效果验证。
```bash
python build_evaluation_dataset.py
```

#### 步骤2: 初始微调阶段
**目标**: 基于准备好的语料进行首次LoRA微调

##### `finetune_lora.py` - 初始LoRA微调
使用QLoRA技术对基础模型进行首次微调，建立专业领域能力。
```bash
python finetune_lora.py
```

##### `quick_train_and_test.py` - 快速验证训练
进行最少训练步骤的快速功能验证。
```bash
python quick_train_and_test.py
```

#### 步骤3: 效果评估阶段
**目标**: 全面评估微调后模型的性能表现

##### `test_finetuned_model.py` - 微调效果测试
测试LoRA微调后的模型在专业问答上的表现。
```bash
python test_finetuned_model.py
```

##### `test_cpu_inference.py` - 推理性能测试
验证模型在生产环境CPU下的推理能力。
```bash
python test_cpu_inference.py
```

##### `evaluate_rag_system.py` - 系统综合评估
使用LLM-as-a-Judge方法从多维度评估RAG系统性能。
```bash
python evaluate_rag_system.py
```

#### 步骤4: 生产应用阶段
**目标**: 将微调后的模型部署到生产环境，开始为用户提供服务

此阶段模型开始在实际业务场景中运行，收集用户反馈和新的业务需求。

### 第二轮及后续：增量微调持续优化

#### 步骤5: 新增语料收集
**目标**: 基于生产应用中的反馈和新需求，收集新的训练语料

##### `incremental_update.py` - 增量知识库更新
智能检测新增文档并更新向量存储。
```bash
python incremental_update.py
```

##### 手动收集新语料
根据用户反馈、业务扩展需求，手动添加新的训练样本到数据集。

#### 步骤6: 增量微调阶段
**目标**: 在保持原有知识的基础上，学习新的领域知识

##### `incremental_finetune_lora.py` - 增量LoRA微调
在已有LoRA适配器基础上进行增量训练，实现知识的持续积累。
```bash
python incremental_finetune_lora.py --existing_lora_path ./lora_output
```

##### `demo_incremental_training.py` - 增量训练演示
完整演示从初始训练到增量训练的全流程。
```bash
python demo_incremental_training.py
```

#### 步骤7: 增量效果验证
**目标**: 验证增量微调是否成功保留旧知识并学习新知识

##### `test_incremental_model.py` - 增量效果测试
测试增量微调后模型的知识保持和新知识学习效果。
```bash
python test_incremental_model.py
```

#### 步骤8: 持续优化与自动化
**目标**: 建立自动化的持续学习机制

##### `update_scheduler.py` - 自动化更新调度
实现知识库的定时自动更新和文件变更监控。
```bash
python update_scheduler.py
```

### 🎯 价值实现的关键指标

1. **知识覆盖度**: 模型能回答的专业问题范围
2. **回答准确性**: 专业问题的正确回答率
3. **响应时效**: 用户问题的响应速度
4. **用户满意度**: 实际业务场景中的用户反馈
5. **业务价值**: 降低人工客服成本、提升服务效率

## 🔧 辅助工具脚本

#### `simulate_lora_training.py` - 模拟训练过程
模拟LoRA微调过程，用于演示和测试。

#### `simulate_custom_cache.py` - 缓存模拟
模拟自定义缓存机制。

#### `finetune_with_custom_cache.py` - 自定义缓存微调
使用自定义缓存进行微调训练。

## 🚀 完整生命周期实施指南

### 环境准备
```bash
pip install torch transformers peft datasets langchain-community langchain-ollama faiss-cpu schedule watchdog
```

### 第一轮完整流程 (初始微调到应用)

```bash
# 1. 语料准备阶段
python ingest.py                    # 摄取知识库文档
python build_finetune_dataset.py   # 构建训练数据集
python build_evaluation_dataset.py # 构建评估数据集

# 2. 初始微调阶段
python finetune_lora.py            # 进行LoRA微调

# 3. 效果评估阶段
python test_finetuned_model.py     # 测试微调效果
python test_cpu_inference.py      # 测试推理性能
python evaluate_rag_system.py     # 综合系统评估

# 4. 生产应用阶段
# 部署模型到生产环境，开始为用户提供服务
```

### 第二轮及后续流程 (增量微调持续优化)

```bash
# 5. 新增语料收集
python incremental_update.py      # 更新知识库
# 手动添加新的训练样本

# 6. 增量微调阶段
python incremental_finetune_lora.py --existing_lora_path ./lora_output

# 7. 增量效果验证
python test_incremental_model.py  # 测试增量效果
python evaluate_rag_system.py     # 重新评估系统

# 8. 持续优化与自动化
python update_scheduler.py        # 启动自动化调度
```

### 完整演示流程

```bash
# 一键演示完整的增量训练流程
python demo_incremental_training.py
```

## ⚙️ 配置说明

### 环境变量配置
在项目根目录的`.env`文件中配置:
```
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_LLM_MODEL=qwen3:4b
```

### 关键路径配置
- **知识库路径**: `../../../notes/智能体项目/知识库智能体/智能问答/产品知识库`
- **向量存储路径**: `../vector_store`
- **模型缓存路径**: `e:\llm_models`
- **训练输出目录**: `./lora_output` (初始微调), `./incremental_lora_output` (增量微调)
- **数据集路径**: `../finetune_dataset.jsonl`, `../incremental_dataset.jsonl`
- **评估数据路径**: `../evaluation_dataset.json`

### 模型配置参数
- **基础模型**: `TinyLlama/TinyLlama-1.1B-Chat-v1.0`
- **评估模型**: `qwen3:4b`
- **嵌入模型**: `nomic-embed-text`
- **LoRA参数**: rank=32, alpha=32, dropout=0.05
- **训练参数**: epochs=2-3, batch_size=4-8, learning_rate=1e-4~2e-4

## 📊 生命周期各阶段的性能优化

### 语料准备阶段优化
- **文档处理**: 支持多格式并行加载 (Markdown, PDF, Word)
- **向量化**: 使用Ollama本地嵌入模型，避免API调用延迟
- **存储优化**: FAISS向量存储，支持快速相似度检索
- **增量更新**: 基于文件哈希的智能变更检测，避免重复处理

### 微调训练阶段优化
- **LoRA技术**: 大幅减少可训练参数 (通常<1%的原模型参数)
- **CPU友好**: 所有脚本支持CPU训练，使用`torch.float32`数据类型
- **内存管理**: 梯度检查点 + 合理批次大小 + 禁用内存固定
- **增量训练**: 在已有适配器基础上继续训练，避免从零开始

### 评估验证阶段优化
- **批量评估**: 支持并发评估多个问题，提高评估效率
- **缓存机制**: 智能缓存评估结果，避免重复计算
- **多维度评估**: 准确性、相关性、完整性、流畅性并行评分

### 生产应用阶段优化
- **推理优化**: CPU推理优化，支持生产环境部署
- **自动化调度**: 文件监控 + 定时任务，实现无人值守更新
- **防抖机制**: 避免频繁更新对系统造成冲击

## 🔍 生命周期各阶段故障排除

### 语料准备阶段常见问题

1. **知识库文档加载失败**
   - 确认知识库路径存在: `../../../notes/智能体项目/知识库智能体/智能问答/产品知识库`
   - 检查文档格式支持: Markdown (.md), PDF (.pdf), Word (.docx/.doc)
   - 验证文档编码: 确保使用UTF-8编码

2. **向量存储创建失败**
   - 检查Ollama服务是否运行: `ollama list`
   - 确认嵌入模型已下载: `nomic-embed-text`
   - 验证向量存储目录权限: `../vector_store`

### 微调训练阶段常见问题

1. **模型下载失败**
   - 检查网络连接和HuggingFace访问
   - 确认缓存目录权限: `e:\llm_models`
   - 使用镜像源: `export HF_ENDPOINT=https://hf-mirror.com`

2. **训练内存不足**
   - 减小批次大小: `--per_device_train_batch_size 2`
   - 启用梯度检查点: `--gradient_checkpointing True`
   - 增加梯度累积步数: `--gradient_accumulation_steps 4`

3. **增量训练失败**
   - 确认已有LoRA路径存在: `./lora_output`
   - 检查适配器文件完整性: `adapter_config.json`, `adapter_model.safetensors`
   - 验证基础模型一致性

### 评估验证阶段常见问题

1. **评估数据集问题**
   - 确认评估数据集存在: `../evaluation_dataset.json`
   - 检查数据格式正确性
   - 验证问题-答案对的质量

2. **模型推理失败**
   - 检查模型加载路径
   - 确认tokenizer兼容性
   - 验证CPU推理环境

### 生产应用阶段常见问题

1. **自动化调度失败**
   - 检查文件监控权限
   - 确认调度任务配置
   - 验证更新触发机制

2. **性能问题**
   - 监控系统资源使用
   - 优化批处理大小
   - 调整更新频率

### 调试技巧
- **详细日志**: 大多数脚本包含详细的日志输出
- **分步执行**: 按生命周期阶段逐步执行，定位问题
- **环境检查**: 使用 `python -c "import torch; print(torch.__version__)"` 等命令检查环境
- **缓存清理**: 必要时清理模型缓存和向量存储重新开始

## 📝 持续迭代开发指南

### 生命周期驱动的开发原则

1. **价值导向**: 每个迭代周期都应明确价值目标
2. **数据驱动**: 基于评估结果指导下一轮优化
3. **渐进式改进**: 避免大幅度变更，保持系统稳定性
4. **自动化优先**: 减少人工干预，提高迭代效率

### 新功能开发流程

1. **需求分析**: 明确新功能在生命周期中的位置
2. **影响评估**: 分析对现有流程的影响
3. **渐进实现**: 先在测试环境验证，再逐步推广
4. **效果监控**: 持续监控新功能的效果

### 代码贡献规范

#### 新增脚本要求
- 明确标注所属生命周期阶段
- 支持增量处理和断点续传
- 包含详细的配置说明和使用示例
- 实现优雅的错误处理和日志记录

#### 修改现有脚本
- 保持向后兼容性，避免破坏现有流程
- 优先考虑性能优化和稳定性提升
- 更新相关文档和配置说明
- 添加回归测试确保功能正常

### 质量保证

- **代码规范**: 遵循PEP 8，使用类型提示
- **测试覆盖**: 每个关键功能都有对应测试脚本
- **文档同步**: 代码变更必须同步更新文档
- **性能基准**: 建立性能基准，避免性能回退

### 持续改进建议

1. **定期评估**: 每个完整周期后评估整体效果
2. **瓶颈识别**: 识别并优化生命周期中的瓶颈环节
3. **工具升级**: 关注新技术，适时升级工具链
4. **经验总结**: 记录最佳实践，形成知识积累

## 📄 许可证

本项目遵循MIT许可证，详见LICENSE文件。

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这些脚本工具。

---

**重要提醒**: 本工具集专为持续迭代的知识库智能体开发设计。在生产环境部署前，请确保:
- 完成完整的生命周期测试
- 建立监控和告警机制  
- 制定回滚和应急预案
- 培训相关操作人员