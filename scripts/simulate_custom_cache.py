#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
模拟自定义缓存目录功能演示脚本

此脚本模拟HuggingFace模型下载到自定义缓存目录的过程

作者: AI Assistant
创建时间: 2025-01-15
"""

import os
import json
import time
from datetime import datetime

def simulate_model_download(cache_dir, model_name):
    """
    模拟模型下载到自定义缓存目录
    """
    print(f"开始模拟下载模型: {model_name}")
    print(f"目标缓存目录: {cache_dir}")
    print("=" * 60)
    
    # 创建缓存目录结构
    model_dir_name = model_name.replace("/", "--")
    model_cache_dir = os.path.join(cache_dir, f"models--{model_dir_name}")
    
    # 模拟的commit hash
    commit_hash = "989aa7980e4cf806f80c7fef2b1adb7bc71aa306"
    snapshot_dir = os.path.join(model_cache_dir, "snapshots", commit_hash)
    blobs_dir = os.path.join(model_cache_dir, "blobs")
    refs_dir = os.path.join(model_cache_dir, "refs")
    
    # 创建目录结构
    os.makedirs(snapshot_dir, exist_ok=True)
    os.makedirs(blobs_dir, exist_ok=True)
    os.makedirs(refs_dir, exist_ok=True)
    
    print(f"✓ 创建缓存目录: {model_cache_dir}")
    
    # 模拟下载配置文件
    config_content = {
        "architectures": ["Qwen2ForCausalLM"],
        "model_type": "qwen2",
        "hidden_size": 1536,
        "num_hidden_layers": 28,
        "num_attention_heads": 12,
        "vocab_size": 151936,
        "torch_dtype": "float32",
        "transformers_version": "4.51.1"
    }
    
    config_path = os.path.join(snapshot_dir, "config.json")
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(config_content, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 下载配置文件: config.json")
    time.sleep(0.5)
    
    # 模拟下载tokenizer配置
    tokenizer_config = {
        "tokenizer_class": "Qwen2Tokenizer",
        "vocab_size": 151936,
        "model_max_length": 32768,
        "pad_token": "<|endoftext|>",
        "eos_token": "<|im_end|>",
        "bos_token": "<|im_start|>"
    }
    
    tokenizer_config_path = os.path.join(snapshot_dir, "tokenizer_config.json")
    with open(tokenizer_config_path, 'w', encoding='utf-8') as f:
        json.dump(tokenizer_config, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 下载tokenizer配置: tokenizer_config.json")
    time.sleep(0.5)
    
    # 模拟下载其他文件
    other_files = [
        "tokenizer.json",
        "vocab.json",
        "merges.txt",
        "special_tokens_map.json",
        "generation_config.json"
    ]
    
    for file_name in other_files:
        file_path = os.path.join(snapshot_dir, file_name)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"# 模拟的 {file_name} 文件内容\n")
        print(f"✓ 下载文件: {file_name}")
        time.sleep(0.3)
    
    # 模拟下载模型权重文件（创建占位符）
    model_files = [
        "model.safetensors",
        "pytorch_model.bin"
    ]
    
    for model_file in model_files:
        file_path = os.path.join(snapshot_dir, model_file)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(f"# 模拟的 {model_file} 文件（实际为二进制权重文件）\n")
            f.write(f"# 文件大小: 约3GB\n")
            f.write(f"# 下载时间: {datetime.now()}\n")
        print(f"✓ 下载模型权重: {model_file}")
        time.sleep(1.0)
    
    # 创建refs文件
    refs_main_path = os.path.join(refs_dir, "main")
    with open(refs_main_path, 'w', encoding='utf-8') as f:
        f.write(commit_hash)
    
    print(f"✓ 创建引用文件: refs/main")
    
    print("\n" + "=" * 60)
    print("✅ 模型下载完成！")
    print(f"📁 缓存位置: {model_cache_dir}")
    print(f"📄 快照目录: {snapshot_dir}")
    
    return model_cache_dir, snapshot_dir

def show_cache_structure(cache_dir):
    """
    显示缓存目录结构
    """
    print("\n" + "=" * 60)
    print("📂 缓存目录结构:")
    print("=" * 60)
    
    for root, dirs, files in os.walk(cache_dir):
        level = root.replace(cache_dir, '').count(os.sep)
        indent = '  ' * level
        folder_name = os.path.basename(root) or os.path.basename(cache_dir)
        print(f"{indent}📁 {folder_name}/")
        
        subindent = '  ' * (level + 1)
        for file in files:
            file_path = os.path.join(root, file)
            file_size = os.path.getsize(file_path)
            if file_size < 1024:
                size_str = f"{file_size}B"
            elif file_size < 1024 * 1024:
                size_str = f"{file_size/1024:.1f}KB"
            else:
                size_str = f"{file_size/(1024*1024):.1f}MB"
            
            print(f"{subindent}📄 {file} ({size_str})")

def create_usage_example():
    """
    创建使用示例
    """
    example_content = """
# 自定义缓存目录使用示例

## 1. 命令行方式
```bash
python scripts/finetune_lora.py \
    --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct" \
    --cache_dir "E:\\LLM_Models" \
    --output_dir "./lora_adapters" \
    --num_train_epochs 1 \
    --per_device_train_batch_size 1
```

## 2. 环境变量方式
```bash
set HF_HOME=E:\\LLM_Models
python scripts/finetune_lora.py --model_name_or_path "Qwen/Qwen2.5-1.5B-Instruct"
```

## 3. Python代码方式
```python
import os
os.environ['HF_HOME'] = 'E:\\LLM_Models'

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
"""
    
    example_path = "./cache_usage_example.md"
    with open(example_path, 'w', encoding='utf-8') as f:
        f.write(example_content)
    
    print(f"\n📝 使用示例已保存到: {example_path}")

def main():
    """
    主函数
    """
    print("🚀 自定义缓存目录功能演示")
    print("=" * 60)
    
    # 模拟参数
    cache_dir = "./simulated_cache/E_LLM_Models"
    model_name = "Qwen/Qwen2.5-1.5B-Instruct"
    
    # 清理之前的模拟目录
    if os.path.exists(cache_dir):
        import shutil
        shutil.rmtree(cache_dir)
    
    # 模拟下载过程
    model_cache_dir, snapshot_dir = simulate_model_download(cache_dir, model_name)
    
    # 显示目录结构
    show_cache_structure(cache_dir)
    
    # 创建使用示例
    create_usage_example()
    
    print("\n" + "=" * 60)
    print("✅ 演示完成！")
    print("\n📋 总结:")
    print(f"1. 模型文件已模拟下载到: {model_cache_dir}")
    print(f"2. 实际使用时，指定 --cache_dir 'E:\\LLM_Models' 即可")
    print(f"3. 模型文件将按HuggingFace标准结构存储")
    print(f"4. 下次使用相同模型时，将直接从缓存加载")
    print("\n🎯 下一步: 在实际环境中使用 --cache_dir 参数进行微调")

if __name__ == "__main__":
    main()