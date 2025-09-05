# 自定义模型缓存目录使用指南

## 概述

本指南介绍如何在LoRA微调过程中指定自定义的模型缓存目录，将HuggingFace模型下载到指定位置。

## 功能特点

- 🎯 **自定义下载路径**: 可以指定任意目录作为模型缓存位置
- 💾 **节省空间**: 避免在默认缓存目录中重复下载模型
- 🔄 **缓存复用**: 下载的模型可以在多次训练中复用
- 📁 **目录管理**: 自动创建指定的缓存目录

## 使用方法

### 方法1: 命令行参数

```bash
python scripts/finetune_lora.py \
    --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct" \
    --cache_dir "E:\LLM_Models" \
    --output_dir "./lora_adapters" \
    --num_train_epochs 1 \
    --per_device_train_batch_size 1
```

### 方法2: 使用示例脚本

```bash
python scripts/finetune_with_custom_cache.py
```

### 方法3: 修改默认参数

在 `finetune_lora.py` 中取消注释以下行：

```python
# "--cache_dir", "E:\\LLM_Models",  # 可选：自定义模型缓存目录
```

改为：

```python
"--cache_dir", "E:\\LLM_Models",  # 自定义模型缓存目录
```

## 缓存目录结构

指定缓存目录后，模型文件将按以下结构存储：

```
E:\LLM_Models/
├── models--Qwen--Qwen2.5-1.5B-Instruct/
│   ├── blobs/
│   │   ├── 模型权重文件...
│   │   └── 配置文件...
│   ├── refs/
│   └── snapshots/
│       └── [commit_hash]/
│           ├── config.json
│           ├── model.safetensors
│           ├── tokenizer.json
│           └── ...
└── 其他模型目录.../
```

## 参数说明

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `--cache_dir` | str | None | 模型缓存目录路径，如果不指定则使用HuggingFace默认缓存目录 |

## 注意事项

### 1. 路径格式
- Windows系统使用反斜杠 `\` 或双反斜杠 `\\`
- Linux/Mac系统使用正斜杠 `/`
- 建议使用绝对路径

### 2. 磁盘空间
- 确保指定目录有足够的磁盘空间
- 大型模型（如7B参数）需要约15GB空间
- 小型模型（如1.5B参数）需要约3GB空间

### 3. 权限要求
- 确保对指定目录有读写权限
- 脚本会自动创建不存在的目录

### 4. 网络环境
- 首次下载需要稳定的网络连接
- 建议在网络条件良好时进行首次下载
- 后续使用将直接从缓存加载

## 常见问题

### Q1: 如何查看当前使用的缓存目录？

A: 运行微调脚本时，会在日志中显示：
```
使用自定义缓存目录: E:\LLM_Models
```
或
```
使用默认HuggingFace缓存目录
```

### Q2: 如何清理缓存目录？

A: 可以直接删除缓存目录中的模型文件夹，或使用以下Python代码：

```python
import shutil
import os

cache_dir = "E:\\LLM_Models"
if os.path.exists(cache_dir):
    shutil.rmtree(cache_dir)
    print(f"已清理缓存目录: {cache_dir}")
```

### Q3: 多个项目可以共享同一个缓存目录吗？

A: 可以。多个项目使用相同的缓存目录可以避免重复下载相同的模型，节省磁盘空间。

### Q4: 缓存目录中的文件可以手动删除吗？

A: 可以，但建议谨慎操作。删除后下次使用该模型时需要重新下载。

### Q5: 遇到"找不到文件"错误怎么办？

A: 这通常是路径问题导致的。确保：
- 使用绝对路径而不是相对路径
- 检查文件是否存在于指定位置
- 在Windows环境下使用正确的路径分隔符

### Q6: CPU环境下训练失败怎么办？

A: 在CPU环境下需要禁用某些GPU专用功能：
- 设置 `--fp16 False`
- 设置 `--gradient_checkpointing False`
- 确保模型参数正确设置为可训练状态

### Q7: SFTTrainer API兼容性问题？

A: 如果遇到SFTTrainer参数错误，系统已自动切换到标准Trainer：
- 使用DataCollatorForLanguageModeling进行数据整理
- 确保数据集格式正确tokenized
- 自动设置labels用于语言建模任务

## 示例场景

### 场景1: 企业环境统一管理

```bash
# 所有模型统一存储在企业共享目录
python scripts/finetune_lora.py \
    --cache_dir "D:\\SharedModels" \
    --model_name_or_path "Qwen/Qwen2.5-7B-Instruct"
```

### 场景2: 个人开发环境

```bash
# 模型存储在个人工作目录
python scripts/finetune_lora.py \
    --cache_dir "C:\\Users\\YourName\\AI_Models" \
    --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct"
```

### 场景3: 外部存储设备

```bash
# 模型存储在外部硬盘
python scripts/finetune_lora.py \
    --cache_dir "F:\\LLM_Cache" \
    --model_name_or_path "Qwen/Qwen3-4B-Instruct-2507"
```

## 性能优化建议

1. **SSD存储**: 将缓存目录设置在SSD上可以提高模型加载速度
2. **网络优化**: 首次下载时使用稳定的网络连接
3. **空间预留**: 为缓存目录预留足够的空间，避免下载中断
4. **定期清理**: 定期清理不再使用的模型缓存

## 相关文件

- `scripts/finetune_lora.py` - 主要微调脚本
- `scripts/finetune_with_custom_cache.py` - 自定义缓存示例脚本
- `docs/custom_cache_directory.md` - 本文档

---

*更新时间: 2025-01-15*
*版本: 1.0*