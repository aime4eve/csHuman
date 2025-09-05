
# 自定义缓存目录使用示例

## 1. 命令行方式
```bash
python scripts/finetune_lora.py     --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct"     --cache_dir "E:\LLM_Models"     --output_dir "./lora_adapters"     --num_train_epochs 1     --per_device_train_batch_size 1
```

## 2. 环境变量方式
```bash
set HF_HOME=E:\LLM_Models
python scripts/finetune_lora.py --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct"
```

## 3. Python代码方式
```python
import os
os.environ['HF_HOME'] = 'E:\LLM_Models'

# 然后运行微调脚本
```

## 缓存目录结构说明
- models--{org}--{model_name}/: 模型主目录
  - snapshots/{commit_hash}/: 特定版本的模型文件
    - config.json: 模型配置
    - tokenizer.json: 分词器
    - model.safetensors: 模型权重
  - blobs/: 二进制文件存储
  - refs/: 版本引用

## 优势
1. 🎯 指定下载位置，便于管理
2. 💾 避免重复下载，节省空间
3. 🔄 多项目共享模型缓存
4. 📁 统一的模型存储位置
