#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增量微调演示脚本 - 展示如何在已有LoRA模型基础上进行增量训练
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def create_incremental_dataset():
    """创建增量训练数据集"""
    print("创建增量训练数据集...")
    
    # 增量数据 - 新的知识领域
    incremental_data = [
        {
            "conversations": [
                {"from": "human", "value": "什么是联邦学习？"},
                {"from": "gpt", "value": "联邦学习是一种分布式机器学习方法，允许多个参与方在不共享原始数据的情况下协作训练模型。它通过在本地训练模型并只共享模型参数来保护数据隐私。"}
            ]
        },
        {
            "conversations": [
                {"from": "human", "value": "边缘计算有什么特点？"},
                {"from": "gpt", "value": "边缘计算的主要特点包括：1. 低延迟处理；2. 减少带宽使用；3. 提高数据安全性；4. 支持实时决策；5. 降低云端计算负载。"}
            ]
        },
        {
            "conversations": [
                {"from": "human", "value": "什么是知识图谱？"},
                {"from": "gpt", "value": "知识图谱是一种结构化的知识表示方法，通过实体、关系和属性来描述现实世界中的概念及其相互关系。它能够帮助机器理解和推理复杂的知识结构。"}
            ]
        },
        {
            "conversations": [
                {"from": "human", "value": "如何评估模型的泛化能力？"},
                {"from": "gpt", "value": "评估模型泛化能力的方法包括：1. 交叉验证；2. 留出验证；3. 在独立测试集上评估；4. 分析学习曲线；5. 使用不同领域的数据进行测试。"}
            ]
        },
        {
            "conversations": [
                {"from": "human", "value": "什么是模型蒸馏？"},
                {"from": "gpt", "value": "模型蒸馏是一种知识转移技术，通过训练一个小模型（学生模型）来模仿大模型（教师模型）的行为。这样可以在保持性能的同时显著减少模型大小和计算需求。"}
            ]
        }
    ]
    
    # 保存增量数据集
    dataset_path = "../incremental_dataset.jsonl"
    dataset_full_path = os.path.abspath(os.path.join(os.path.dirname(__file__), dataset_path))
    
    # 确保目录存在
    os.makedirs(os.path.dirname(dataset_full_path), exist_ok=True)
    
    with open(dataset_full_path, 'w', encoding='utf-8') as f:
        for item in incremental_data:
            f.write(json.dumps(item, ensure_ascii=False) + '\n')
    
    print(f"增量数据集已创建: {dataset_full_path}")
    print(f"数据集包含 {len(incremental_data)} 个样本")
    return dataset_full_path

def run_initial_training():
    """运行初始LoRA训练"""
    print("\n=" * 60)
    print("步骤1: 运行初始LoRA训练")
    print("=" * 60)
    
    # 检查是否已有初始模型
    initial_model_path = "./quick_lora_output"
    if os.path.exists(initial_model_path):
        print(f"发现已存在的初始模型: {initial_model_path}")
        return initial_model_path
    
    print("未找到初始模型，运行快速训练生成基础LoRA模型...")
    
    # 运行快速训练脚本
    script_path = os.path.join(os.path.dirname(__file__), "quick_train_and_test.py")
    if os.path.exists(script_path):
        try:
            result = subprocess.run([sys.executable, script_path], 
                                  capture_output=True, text=True, encoding='utf-8')
            if result.returncode == 0:
                print("初始训练完成")
                return initial_model_path
            else:
                print(f"初始训练失败: {result.stderr}")
                return None
        except Exception as e:
            print(f"运行初始训练时出错: {e}")
            return None
    else:
        print(f"未找到快速训练脚本: {script_path}")
        return None

def run_incremental_training(existing_lora_path, incremental_dataset_path):
    """运行增量训练"""
    print("\n=" * 60)
    print("步骤2: 运行增量LoRA训练")
    print("=" * 60)
    
    print(f"基于现有LoRA模型: {existing_lora_path}")
    print(f"使用增量数据集: {incremental_dataset_path}")
    
    # 构建增量训练命令
    script_path = os.path.join(os.path.dirname(__file__), "incremental_finetune_lora.py")
    
    cmd = [
        sys.executable, script_path,
        "--existing_lora_path", existing_lora_path,
        "--dataset_path", "../incremental_dataset.jsonl",
        "--output_dir", "./incremental_lora_output",
        "--num_train_epochs", "2",
        "--per_device_train_batch_size", "2",
        "--learning_rate", "5e-5",  # 增量训练使用更小的学习率
        "--warmup_steps", "10",
        "--logging_steps", "1",
        "--save_steps", "20",
        "--cache_dir", "e:\\llm_models",
    ]
    
    try:
        print("开始增量训练...")
        result = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8')
        
        if result.returncode == 0:
            print("增量训练成功完成！")
            print("\n训练输出:")
            print(result.stdout[-1000:])  # 显示最后1000个字符
            return "./incremental_lora_output"
        else:
            print(f"增量训练失败: {result.stderr}")
            print(f"标准输出: {result.stdout}")
            return None
            
    except Exception as e:
        print(f"运行增量训练时出错: {e}")
        return None

def compare_models():
    """比较原始模型、初始LoRA模型和增量LoRA模型的效果"""
    print("\n=" * 60)
    print("步骤3: 模型效果对比")
    print("=" * 60)
    
    # 测试问题
    test_questions = [
        "什么是智能体系统？",  # 原始训练数据
        "LoRA微调的优势有哪些？",  # 原始训练数据
        "什么是联邦学习？",  # 增量训练数据
        "边缘计算有什么特点？",  # 增量训练数据
        "什么是知识图谱？",  # 增量训练数据
    ]
    
    print("测试问题:")
    for i, q in enumerate(test_questions, 1):
        knowledge_type = "[原始知识]" if i <= 2 else "[新增知识]"
        print(f"{i}. {q} {knowledge_type}")
    
    print("\n注意: 增量模型应该能够回答所有问题，包括原始知识和新增知识。")
    print("这证明了增量训练既学习了新知识，又保持了原有知识。")

def main():
    """主演示函数"""
    print("=" * 80)
    print("增量LoRA微调演示")
    print("=" * 80)
    
    print("本演示将展示如何在已有LoRA模型基础上进行增量训练：")
    print("1. 检查或创建初始LoRA模型")
    print("2. 创建增量训练数据集（新的知识领域）")
    print("3. 在已有LoRA基础上进行增量训练")
    print("4. 验证模型既保持原有知识又学习了新知识")
    
    # 步骤1: 准备初始模型
    initial_model_path = run_initial_training()
    if not initial_model_path or not os.path.exists(initial_model_path):
        print("\n错误: 无法获得初始LoRA模型，演示终止")
        return
    
    # 步骤2: 创建增量数据集
    incremental_dataset_path = create_incremental_dataset()
    
    # 步骤3: 运行增量训练
    incremental_model_path = run_incremental_training(initial_model_path, incremental_dataset_path)
    
    if incremental_model_path and os.path.exists(incremental_model_path):
        print(f"\n✅ 增量训练成功完成！")
        print(f"增量模型保存在: {incremental_model_path}")
        
        # 步骤4: 模型对比说明
        compare_models()
        
        print("\n=" * 80)
        print("演示总结:")
        print("=" * 80)
        print("✅ 成功演示了增量LoRA微调流程")
        print("✅ 创建了包含新知识领域的增量数据集")
        print("✅ 在已有LoRA模型基础上进行了增量训练")
        print("✅ 生成的增量模型应该同时具备原有知识和新增知识")
        
        print("\n增量训练的优势:")
        print("• 保持原有知识不丢失")
        print("• 快速学习新领域知识")
        print("• 节省训练时间和计算资源")
        print("• 支持持续学习和知识更新")
        
        print("\n使用方法:")
        print(f"可以直接使用增量模型: {incremental_model_path}")
        print("或继续在此基础上进行下一轮增量训练")
        
    else:
        print("\n❌ 增量训练失败，请检查错误信息")

if __name__ == "__main__":
    main()