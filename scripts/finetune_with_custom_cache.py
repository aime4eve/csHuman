#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
使用自定义缓存目录进行LoRA微调的示例脚本

此脚本演示如何将HuggingFace模型下载到指定的缓存目录

使用方法:
python finetune_with_custom_cache.py

作者: AI Assistant
创建时间: 2025-01-15
"""

import subprocess
import sys
import os
import argparse
import platform

def get_default_cache_dir():
    """
    获取默认的缓存目录，根据操作系统不同而不同
    """
    if platform.system() == "Windows":
        return os.path.join(os.getenv("APPDATA"), "huggingface", "hub")
    else:
        return os.path.join(os.path.expanduser("~"), ".cache", "huggingface", "hub")

def run_finetune_with_custom_cache(cache_dir):
    """
    使用自定义缓存目录运行LoRA微调
    """
    
    # 自定义缓存目录
    # cache_dir = "E:\\LLM_Models"
    
    # 确保缓存目录存在
    os.makedirs(cache_dir, exist_ok=True)
    print(f"模型将下载到: {cache_dir}")
    
    # 获取当前脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    finetune_script = os.path.join(script_dir, "finetune_lora.py")
    
    # 微调参数
    finetune_args = [
        sys.executable, finetune_script,
        "--model_name_or_path", "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        "--cache_dir", cache_dir,
        "--output_dir", "./lora_adapters",
        "--num_train_epochs", "3",
        "--per_device_train_batch_size", "1",
        "--gradient_accumulation_steps", "8",
        "--learning_rate", "2e-4",
        "--warmup_steps", "50",
        "--logging_steps", "5",
        "--save_steps", "200",
        "--save_total_limit", "2",
        "--gradient_checkpointing", "True",
        "--dataloader_pin_memory", "False",
        "--fp16", "True",
        "--report_to", "none"  # 禁用wandb
    ]
    
    print("开始微调，使用以下参数:")
    print(" ".join(finetune_args))
    print("\n" + "="*60)
    
    try:
        # 运行微调脚本
        result = subprocess.run(finetune_args, check=True, capture_output=False)
        print("\n" + "="*60)
        print("微调完成！")
        print(f"模型已保存到: ./lora_adapters")
        print(f"模型缓存位置: {cache_dir}")
        
    except subprocess.CalledProcessError as e:
        print(f"\n微调过程中出现错误: {e}")
        print("请检查错误信息并重试")
        return False
    
    return True

def check_cache_directory(cache_dir):
    """
    检查缓存目录的内容
    """
    # cache_dir = "E:\\LLM_Models"
    
    if os.path.exists(cache_dir):
        print(f"\n缓存目录内容 ({cache_dir}):")
        print("-" * 40)
        
        for root, dirs, files in os.walk(cache_dir):
            level = root.replace(cache_dir, '').count(os.sep)
            indent = ' ' * 2 * level
            print(f"{indent}{os.path.basename(root)}/")
            
            subindent = ' ' * 2 * (level + 1)
            for file in files[:5]:  # 只显示前5个文件
                print(f"{subindent}{file}")
            
            if len(files) > 5:
                print(f"{subindent}... 还有 {len(files) - 5} 个文件")
            
            # 只显示前2层目录
            if level >= 1:
                dirs.clear()
    else:
        print(f"缓存目录不存在: {cache_dir}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="使用自定义缓存目录进行LoRA微调的示例脚本")
    parser.add_argument("--cache_dir", type=str, default=get_default_cache_dir(),
                        help=f"HuggingFace模型的缓存目录，默认为: {get_default_cache_dir()}")
    args = parser.parse_args()

    print("LoRA微调 - 自定义缓存目录示例")
    print("=" * 50)
    
    # 运行微调
    success = run_finetune_with_custom_cache(args.cache_dir)
    
    if success:
        # 检查缓存目录
        check_cache_directory(args.cache_dir)
        
        print("\n使用说明:")
        print(f"1. 模型文件已下载到 {args.cache_dir}")
        print("2. LoRA适配器已保存到 ./lora_adapters")
        print("3. 下次使用相同模型时，将直接从缓存加载，无需重新下载")
        print("4. 可以通过设置 --cache_dir 参数来指定不同的缓存目录")
    else:
        print("\n微调失败，请检查错误信息")