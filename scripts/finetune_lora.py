#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
LoRA微调脚本

使用QLoRA技术对Qwen模型进行微调，提升在企业知识库问答任务上的表现。
基于Hugging Face的transformers和peft库实现。

作者: AI Assistant
创建时间: 2025-08-12
"""

import os
import json
import torch
from dataclasses import dataclass, field
from typing import Optional
import transformers
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    BitsAndBytesConfig,
    HfArgumentParser,
    TrainingArguments,
    pipeline,
    logging,
)
from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training
from transformers import Trainer, DataCollatorForLanguageModeling, DataCollatorForSeq2Seq
from datasets import Dataset

# 可选导入 wandb
try:
    import wandb
    WANDB_AVAILABLE = True
except ImportError:
    WANDB_AVAILABLE = False
    print("Warning: wandb not available. Training will proceed without wandb logging.")

# 设置日志级别
logging.set_verbosity_info()

@dataclass
class ModelArguments:
    """模型相关参数"""
    model_name_or_path: Optional[str] = field(
        default="TinyLlama/TinyLlama-1.1B-Chat-v1.0",
        metadata={"help": "预训练模型的路径或名称"}
    )
    use_fast_tokenizer: bool = field(
        default=True,
        metadata={"help": "是否使用快速tokenizer"}
    )
    cache_dir: Optional[str] = field(
        default=None,
        metadata={"help": "模型缓存目录路径，如果不指定则使用默认的HuggingFace缓存目录"}
    )

@dataclass
class DataArguments:
    """数据相关参数"""
    dataset_path: str = field(
        default="../finetune_dataset.jsonl",
        metadata={"help": "训练数据集路径"}
    )
    max_seq_length: int = field(
        default=2048,
        metadata={"help": "最大序列长度"}
    )

@dataclass
class LoraArguments:
    """LoRA相关参数"""
    lora_r: int = field(
        default=32,
        metadata={"help": "LoRA rank"}
    )
    lora_alpha: int = field(
        default=32,
        metadata={"help": "LoRA alpha"}
    )
    lora_dropout: float = field(
        default=0.05,
        metadata={"help": "LoRA dropout"}
    )
    target_modules: str = field(
        default="q_proj,v_proj,k_proj,o_proj,gate_proj,up_proj,down_proj",
        metadata={"help": "目标模块，用逗号分隔"}
    )

class DatasetProcessor:
    """数据集处理器"""
    
    def __init__(self, tokenizer, max_seq_length=2048):
        self.tokenizer = tokenizer
        self.max_seq_length = max_seq_length
    
    def load_dataset(self, dataset_path: str) -> Dataset:
        """加载并处理数据集"""
        print(f"正在加载数据集: {dataset_path}")
        
        # 检查文件扩展名并相应地加载数据
        if dataset_path.endswith('.jsonl'):
            data = []
            with open(dataset_path, 'r', encoding='utf-8') as f:
                for line in f:
                    data.append(json.loads(line.strip()))
        else:
            with open(dataset_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        
        print(f"原始数据集大小: {len(data)}")
        
        # 转换为Hugging Face Dataset格式
        processed_data = []
        for item in data:
            # 构建对话格式
            conversation = self.format_conversation(item)
            processed_data.append({"text": conversation})
        
        dataset = Dataset.from_list(processed_data)
        print(f"处理后数据集大小: {len(dataset)}")
        
        return dataset
    
    def tokenize_function(self, examples):
        """Tokenize函数，用于数据集映射"""
        # 对文本进行tokenize
        tokenized = self.tokenizer(
            examples["text"],
            truncation=True,
            padding=False,  # 不在这里padding，让data collator处理
            max_length=self.max_seq_length,
            return_tensors=None
        )
        # 设置labels为input_ids的副本（用于语言建模）
        # 确保labels是列表的列表，而不是嵌套的列表
        tokenized["labels"] = [ids[:] for ids in tokenized["input_ids"]]
        return tokenized
    
    def format_conversation(self, item: dict) -> str:
        """将数据格式化为对话格式"""
        # 支持新的messages格式
        if "messages" in item:
            messages = item["messages"]
            conversation_parts = []
            
            for message in messages:
                role = message["role"]
                content = message["content"]
                
                if role == "system":
                    conversation_parts.append(f"<|im_start|>system\n{content}<|im_end|>")
                elif role == "user":
                    conversation_parts.append(f"<|im_start|>user\n{content}<|im_end|>")
                elif role == "assistant":
                    conversation_parts.append(f"<|im_start|>assistant\n{content}<|im_end|>")
            
            return "\n".join(conversation_parts)
        
        # 兼容旧格式
        else:
            instruction = item.get("instruction", "")
            input_text = item.get("input", "")
            output = item.get("output", "")
            
            # 构建Qwen格式的对话
            if input_text:
                user_message = f"{instruction}\n{input_text}"
            else:
                user_message = instruction
            
            conversation = f"<|im_start|>system\n你是一个专业的企业知识库问答助理，请根据知识库内容准确回答用户问题。<|im_end|>\n<|im_start|>user\n{user_message}<|im_end|>\n<|im_start|>assistant\n{output}<|im_end|>"
            
            return conversation

def setup_model_and_tokenizer(model_args: ModelArguments):
    """设置模型和tokenizer"""
    print(f"正在加载模型: {model_args.model_name_or_path}")
    
    # 设置缓存目录
    if model_args.cache_dir:
        print(f"使用自定义缓存目录: {model_args.cache_dir}")
        # 确保缓存目录存在
        os.makedirs(model_args.cache_dir, exist_ok=True)
    else:
        print("使用默认HuggingFace缓存目录")
    
    # 检查CUDA可用性
    use_quantization = torch.cuda.is_available()
    
    if use_quantization:
        # 配置量化参数（仅在CUDA可用时）
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
    else:
        bnb_config = None
        print("Warning: CUDA not available. Running without quantization.")
    
    # 加载tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_args.model_name_or_path,
        use_fast=model_args.use_fast_tokenizer,
        trust_remote_code=True,
        cache_dir=model_args.cache_dir,
    )
    
    # 设置pad_token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # 加载模型
    if use_quantization:
        model = AutoModelForCausalLM.from_pretrained(
            model_args.model_name_or_path,
            quantization_config=bnb_config,
            device_map="auto",
            trust_remote_code=True,
            torch_dtype=torch.bfloat16,
            cache_dir=model_args.cache_dir,
        )
        # 准备模型进行k-bit训练
        model = prepare_model_for_kbit_training(model)
    else:
        model = AutoModelForCausalLM.from_pretrained(
            model_args.model_name_or_path,
            trust_remote_code=True,
            torch_dtype=torch.float32,
            cache_dir=model_args.cache_dir,
        )
        # 确保模型处于训练模式
        model.train()
        # 启用梯度计算
        for param in model.parameters():
            param.requires_grad = True
    
    return model, tokenizer

def setup_lora_config(lora_args: LoraArguments) -> LoraConfig:
    """设置LoRA配置"""
    target_modules = lora_args.target_modules.split(",")
    
    lora_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        r=lora_args.lora_r,
        lora_alpha=lora_args.lora_alpha,
        lora_dropout=lora_args.lora_dropout,
        target_modules=target_modules,
        bias="none",
    )
    
    return lora_config

def main():
    """主函数"""
    # 解析参数
    parser = HfArgumentParser((ModelArguments, DataArguments, LoraArguments, TrainingArguments))
    model_args, data_args, lora_args, training_args = parser.parse_args_into_dataclasses()
    
    # 设置输出目录
    if not training_args.output_dir:
        training_args.output_dir = "./lora_output"
    
    print("=" * 50)
    print("LoRA微调开始")
    print(f"模型: {model_args.model_name_or_path}")
    print(f"数据集: {data_args.dataset_path}")
    print(f"输出目录: {training_args.output_dir}")
    print("=" * 50)
    
    # 设置模型和tokenizer
    model, tokenizer = setup_model_and_tokenizer(model_args)
    
    # 设置LoRA配置
    lora_config = setup_lora_config(lora_args)
    model = get_peft_model(model, lora_config)
    
    # 确保LoRA参数可训练
    model.train()
    for name, param in model.named_parameters():
        if 'lora_' in name:
            param.requires_grad = True
    
    # 打印可训练参数
    model.print_trainable_parameters()
    
    # 处理数据集
    processor = DatasetProcessor(tokenizer, data_args.max_seq_length)
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), data_args.dataset_path))
    raw_dataset = processor.load_dataset(dataset_path)
    
    # 对数据集进行tokenization
    train_dataset = raw_dataset.map(
        processor.tokenize_function,
        batched=True,
        remove_columns=raw_dataset.column_names,
        desc="Tokenizing dataset"
    )
    
    # 设置数据整理器，启用padding
    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        label_pad_token_id=-100,
        pad_to_multiple_of=8,  # 为了效率，padding到8的倍数
    )
    
    # 设置训练器
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=data_collator,
    )
    
    # 开始训练
    print("开始训练...")
    trainer.train()
    
    # 保存模型
    print(f"保存模型到: {training_args.output_dir}")
    trainer.save_model()
    tokenizer.save_pretrained(training_args.output_dir)
    
    print("训练完成！")
    
    # 测试模型
    print("\n测试微调后的模型:")
    test_model(training_args.output_dir, tokenizer)

def test_model(model_path: str, tokenizer):
    """测试微调后的模型"""
    try:
        from peft import PeftModel
        import torch
        
        # 加载基础模型
        base_model = AutoModelForCausalLM.from_pretrained(
            "TinyLlama/TinyLlama-1.1B-Chat-v1.0",
            cache_dir="e:\\llm_models",  # 使用缓存目录
            torch_dtype=torch.float32,
            device_map="cpu",  # 强制使用CPU
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
        
        print("测试问题及回答:")
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
                    max_new_tokens=150,
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
            
    except Exception as e:
        print(f"测试模型时出错: {e}")
        print("注意：如果出现内存不足错误，可以尝试减少max_new_tokens参数")

if __name__ == "__main__":
    # 设置默认训练参数
    import sys
    
    default_args = [
        "--output_dir", "./lora_output",
        "--num_train_epochs", "3",
        "--per_device_train_batch_size", "8",
        "--gradient_accumulation_steps", "1",
        "--learning_rate", "2e-4",
        "--warmup_steps", "50",
        "--logging_steps", "5",
        "--save_steps", "200",
        "--save_total_limit", "2",
        "--gradient_checkpointing", "True",
        "--dataloader_pin_memory", "False",
        "--fp16", "True",
        "--report_to", "none",  # 禁用wandb
        "--cache_dir", "E:\\LLM_Models",  # 可选：自定义模型缓存目录
    ]
    
    # 如果没有提供参数，使用默认参数
    if len(sys.argv) == 1:
        sys.argv.extend(default_args)
    
    main()