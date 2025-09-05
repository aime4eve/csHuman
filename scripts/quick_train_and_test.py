#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
快速训练和测试脚本 - 进行最少的训练步骤然后测试CPU推理
"""

import torch
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    TrainingArguments, 
    Trainer,
    DataCollatorForSeq2Seq
)
from peft import LoraConfig, get_peft_model, PeftModel
from datasets import Dataset
import json
import os

def load_and_tokenize_data(tokenizer, data_path="../finetune_dataset.jsonl"):
    """加载和标记化数据"""
    print(f"正在加载数据集: {data_path}")
    
    # 读取数据
    data = []
    try:
        with open(data_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    data.append(json.loads(line))
    except FileNotFoundError:
        print(f"数据文件 {data_path} 不存在，使用示例数据")
        data = [
            {"conversations": [{"from": "human", "value": "什么是智能体系统？"}, {"from": "gpt", "value": "智能体系统是一种能够感知环境、做出决策并执行行动的自主系统。"}]},
            {"conversations": [{"from": "human", "value": "企业级知识库的主要功能是什么？"}, {"from": "gpt", "value": "企业级知识库主要用于存储、管理和检索企业内部的知识资产。"}]},
            {"conversations": [{"from": "human", "value": "LoRA微调的优势有哪些？"}, {"from": "gpt", "value": "LoRA微调具有参数效率高、训练速度快、内存占用少等优势。"}]}
        ]
    
    print(f"加载了 {len(data)} 条数据")
    
    # 格式化对话
    def format_conversation(conversations):
        formatted = "<|im_start|>system\n你是一个专业的企业知识库问答助理。<|im_end|>\n"
        for conv in conversations:
            if conv["from"] == "human":
                formatted += f"<|im_start|>user\n{conv['value']}<|im_end|>\n"
            elif conv["from"] == "gpt":
                formatted += f"<|im_start|>assistant\n{conv['value']}<|im_end|>\n"
        return formatted
    
    # 处理数据
    processed_data = []
    for item in data:
        text = format_conversation(item["conversations"])
        processed_data.append({"text": text})
    
    # 创建数据集
    dataset = Dataset.from_list(processed_data)
    
    # 标记化函数
    def tokenize_function(examples):
        tokenized = tokenizer(
            examples["text"],
            truncation=True,
            max_length=512,
            padding=False,  # 由data collator处理
            return_tensors=None
        )
        tokenized["labels"] = [ids[:] for ids in tokenized["input_ids"]]
        return tokenized
    
    # 应用标记化
    tokenized_dataset = dataset.map(
        tokenize_function,
        batched=True,
        remove_columns=dataset.column_names
    )
    
    print(f"数据集标记化完成，共 {len(tokenized_dataset)} 个样本")
    return tokenized_dataset

def setup_model_and_tokenizer(model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0", cache_dir="e:\\llm_models"):
    """设置模型和分词器"""
    print(f"正在加载模型: {model_name}")
    
    # 加载tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_name,
        cache_dir=cache_dir,
        trust_remote_code=True
    )
    
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # 加载模型
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        cache_dir=cache_dir,
        torch_dtype=torch.float32,
        device_map="cpu",
        trust_remote_code=True
    )
    
    # 配置LoRA
    lora_config = LoraConfig(
        r=8,
        lora_alpha=32,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.1,
        bias="none",
        task_type="CAUSAL_LM"
    )
    
    # 应用LoRA
    model = get_peft_model(model, lora_config)
    model.print_trainable_parameters()
    
    return model, tokenizer

def quick_train(model, tokenizer, dataset, output_dir="./quick_lora_output"):
    """快速训练"""
    print("开始快速训练...")
    
    # 训练参数
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=1,
        per_device_train_batch_size=2,
        gradient_accumulation_steps=1,
        learning_rate=2e-4,
        warmup_steps=2,
        logging_steps=1,
        save_steps=5,
        save_total_limit=1,
        gradient_checkpointing=False,
        dataloader_pin_memory=False,
        fp16=False,  # CPU不支持fp16
        report_to="none",
        max_steps=3  # 只训练3步
    )
    
    # 数据整理器
    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        label_pad_token_id=-100,
        pad_to_multiple_of=8
    )
    
    # 训练器
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=dataset,
        data_collator=data_collator,
        tokenizer=tokenizer
    )
    
    # 开始训练
    trainer.train()
    
    # 保存模型
    trainer.save_model()
    print(f"模型已保存到: {output_dir}")
    
    return output_dir

def test_finetuned_model(model_path, base_model_name="TinyLlama/TinyLlama-1.1B-Chat-v1.0", cache_dir="e:\\llm_models"):
    """测试微调后的模型"""
    print("\n开始测试微调后的模型...")
    
    try:
        # 加载tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            base_model_name,
            cache_dir=cache_dir,
            trust_remote_code=True
        )
        
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # 加载基础模型
        base_model = AutoModelForCausalLM.from_pretrained(
            base_model_name,
            cache_dir=cache_dir,
            torch_dtype=torch.float32,
            device_map="cpu",
            trust_remote_code=True
        )
        
        # 加载LoRA适配器
        model = PeftModel.from_pretrained(base_model, model_path)
        model.eval()
        
        # 测试问题
        test_questions = [
            "什么是智能体系统？",
            "企业级知识库的主要功能是什么？",
            "LoRA微调的优势有哪些？"
        ]
        
        print("\n测试问题及回答:")
        print("=" * 50)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n问题{i}: {question}")
            
            # 构建输入
            conversation = f"<|im_start|>system\n你是一个专业的企业知识库问答助理。<|im_end|>\n<|im_start|>user\n{question}<|im_end|>\n<|im_start|>assistant\n"
            
            inputs = tokenizer(conversation, return_tensors="pt", truncation=True, max_length=512)
            
            # CPU推理
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    max_new_tokens=100,
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    pad_token_id=tokenizer.eos_token_id
                )
            
            # 解码输出
            response = tokenizer.decode(outputs[0], skip_special_tokens=True)
            # 提取assistant的回答部分
            if "<|im_start|>assistant\n" in response:
                answer = response.split("<|im_start|>assistant\n")[-1].strip()
            else:
                answer = response[len(conversation):].strip()
            
            print(f"回答{i}: {answer}")
            print("-" * 30)
            
    except Exception as e:
        print(f"测试模型时出错: {e}")
        import traceback
        traceback.print_exc()

def main():
    """主函数"""
    print("快速LoRA微调和测试开始")
    print("=" * 50)
    
    # 设置模型和分词器
    model, tokenizer = setup_model_and_tokenizer()
    
    # 加载和处理数据
    dataset = load_and_tokenize_data(tokenizer)
    
    # 快速训练
    output_dir = quick_train(model, tokenizer, dataset)
    
    # 测试微调后的模型
    test_finetuned_model(output_dir)
    
    print("\n快速训练和测试完成！")

if __name__ == "__main__":
    main()