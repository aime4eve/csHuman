#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
增量LoRA微调脚本 - 支持在已有LoRA适配器基础上继续训练新语料
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
from peft import LoraConfig, TaskType, get_peft_model, prepare_model_for_kbit_training, PeftModel
from transformers import Trainer, DataCollatorForLanguageModeling, DataCollatorForSeq2Seq
from datasets import Dataset

# 尝试导入wandb
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
    existing_lora_path: Optional[str] = field(
        default=None,
        metadata={"help": "已存在的LoRA适配器路径，用于增量训练"}
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
        default="../incremental_dataset.jsonl",
        metadata={"help": "增量训练数据集路径"}
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

class IncrementalDatasetProcessor:
    """增量数据集处理器"""
    
    def __init__(self, tokenizer, max_seq_length=2048):
        self.tokenizer = tokenizer
        self.max_seq_length = max_seq_length
    
    def load_dataset(self, dataset_path: str) -> Dataset:
        """加载并处理增量数据集"""
        print(f"正在加载增量数据集: {dataset_path}")
        
        # 检查文件是否存在
        if not os.path.exists(dataset_path):
            print(f"警告: 数据文件 {dataset_path} 不存在，创建示例增量数据")
            self._create_sample_incremental_data(dataset_path)
        
        # 检查文件扩展名并相应地加载数据
        if dataset_path.endswith('.jsonl'):
            data = []
            with open(dataset_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.strip():
                        data.append(json.loads(line.strip()))
        else:
            with open(dataset_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        
        print(f"增量数据集大小: {len(data)}")
        
        # 转换为Hugging Face Dataset格式
        processed_data = []
        for item in data:
            # 构建对话格式
            conversation = self.format_conversation(item)
            processed_data.append({"text": conversation})
        
        dataset = Dataset.from_list(processed_data)
        print(f"处理后增量数据集大小: {len(dataset)}")
        
        return dataset
    
    def _create_sample_incremental_data(self, dataset_path: str):
        """创建示例增量数据"""
        sample_data = [
            {
                "conversations": [
                    {"from": "human", "value": "什么是增量学习？"},
                    {"from": "gpt", "value": "增量学习是一种机器学习方法，允许模型在不忘记之前学到的知识的情况下，持续学习新的数据和任务。"}
                ]
            },
            {
                "conversations": [
                    {"from": "human", "value": "LoRA增量微调有什么优势？"},
                    {"from": "gpt", "value": "LoRA增量微调的优势包括：1. 保持原有知识不丢失；2. 快速适应新领域；3. 节省计算资源；4. 支持多任务学习。"}
                ]
            },
            {
                "conversations": [
                    {"from": "human", "value": "如何实现模型的持续学习？"},
                    {"from": "gpt", "value": "模型持续学习可以通过以下方式实现：1. 使用LoRA等参数高效微调方法；2. 采用知识蒸馏技术；3. 实施经验回放机制；4. 应用正则化技术防止灾难性遗忘。"}
                ]
            }
        ]
        
        # 创建目录（如果不存在）
        os.makedirs(os.path.dirname(dataset_path), exist_ok=True)
        
        # 保存为JSONL格式
        with open(dataset_path, 'w', encoding='utf-8') as f:
            for item in sample_data:
                f.write(json.dumps(item, ensure_ascii=False) + '\n')
        
        print(f"已创建示例增量数据文件: {dataset_path}")
    
    def tokenize_function(self, examples):
        """Tokenize函数，用于数据集映射"""
        # 对文本进行tokenize
        tokenized = self.tokenizer(
            examples["text"],
            truncation=True,
            max_length=self.max_seq_length,
            padding=False,  # 由data collator处理padding
            return_tensors=None
        )
        
        # 设置labels（用于语言模型训练）
        tokenized["labels"] = [ids[:] for ids in tokenized["input_ids"]]
        
        return tokenized
    
    def format_conversation(self, item: dict) -> str:
        """格式化对话为Qwen格式"""
        conversations = item.get("conversations", [])
        
        # 构建对话字符串
        formatted_text = "<|im_start|>system\n你是一个专业的企业知识库问答助理，具备增量学习能力。<|im_end|>\n"
        
        for conv in conversations:
            role = conv.get("from", "")
            content = conv.get("value", "")
            
            if role == "human":
                formatted_text += f"<|im_start|>user\n{content}<|im_end|>\n"
            elif role == "gpt":
                formatted_text += f"<|im_start|>assistant\n{content}<|im_end|>\n"
        
        return formatted_text

def setup_model_and_tokenizer(model_args: ModelArguments):
    """设置模型和tokenizer"""
    print(f"正在加载模型: {model_args.model_name_or_path}")
    
    # 使用指定的缓存目录
    cache_dir = model_args.cache_dir or "e:\\llm_models"
    print(f"使用缓存目录: {cache_dir}")
    
    # 加载tokenizer
    tokenizer = AutoTokenizer.from_pretrained(
        model_args.model_name_or_path,
        use_fast=model_args.use_fast_tokenizer,
        cache_dir=cache_dir,
        trust_remote_code=True
    )
    
    # 设置pad_token
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    # 检查是否有CUDA支持
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    torch_dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    
    if not torch.cuda.is_available():
        print("Warning: CUDA not available. Running without quantization.")
    
    # 加载模型
    model = AutoModelForCausalLM.from_pretrained(
        model_args.model_name_or_path,
        cache_dir=cache_dir,
        device_map=device_map,
        torch_dtype=torch_dtype,
        trust_remote_code=True
    )
    
    return model, tokenizer

def setup_incremental_lora_model(model, model_args: ModelArguments, lora_args: LoraArguments):
    """设置增量LoRA模型"""
    if model_args.existing_lora_path and os.path.exists(model_args.existing_lora_path):
        print(f"加载已存在的LoRA适配器: {model_args.existing_lora_path}")
        # 加载已存在的LoRA适配器
        model = PeftModel.from_pretrained(model, model_args.existing_lora_path)
        print("已加载现有LoRA适配器，将在此基础上进行增量训练")
    else:
        print("未找到现有LoRA适配器，创建新的LoRA配置")
        # 创建新的LoRA配置
        lora_config = LoraConfig(
            r=lora_args.lora_r,
            lora_alpha=lora_args.lora_alpha,
            target_modules=lora_args.target_modules.split(","),
            lora_dropout=lora_args.lora_dropout,
            bias="none",
            task_type=TaskType.CAUSAL_LM
        )
        model = get_peft_model(model, lora_config)
    
    return model

def test_incremental_model(model_path: str, tokenizer, base_model_name: str, cache_dir: str = None):
    """测试增量微调后的模型"""
    print("\n开始测试增量微调后的模型...")
    
    try:
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
        
        # 测试问题（包含原有和新增的知识）
        test_questions = [
            "什么是智能体系统？",  # 原有知识
            "企业级知识库的主要功能是什么？",  # 原有知识
            "什么是增量学习？",  # 新增知识
            "LoRA增量微调有什么优势？",  # 新增知识
            "如何实现模型的持续学习？"  # 新增知识
        ]
        
        print("\n测试问题及回答:")
        print("=" * 60)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n问题{i}: {question}")
            
            # 构建输入
            conversation = f"<|im_start|>system\n你是一个专业的企业知识库问答助理，具备增量学习能力。<|im_end|>\n<|im_start|>user\n{question}<|im_end|>\n<|im_start|>assistant\n"
            
            inputs = tokenizer(conversation, return_tensors="pt", truncation=True, max_length=512)
            
            # CPU推理
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    max_new_tokens=120,
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
            
            # 标记知识类型
            knowledge_type = "[新增知识]" if i > 2 else "[原有知识]"
            print(f"回答{i} {knowledge_type}: {answer}")
            print("-" * 50)
            
    except Exception as e:
        print(f"测试模型时出错: {e}")
        import traceback
        traceback.print_exc()

def main():
    """主函数"""
    # 解析参数
    parser = HfArgumentParser((ModelArguments, DataArguments, LoraArguments, TrainingArguments))
    model_args, data_args, lora_args, training_args = parser.parse_args_into_dataclasses()
    
    # 设置输出目录
    if not training_args.output_dir:
        training_args.output_dir = "./incremental_lora_output"
    
    print("=" * 60)
    print("增量LoRA微调开始")
    print(f"基础模型: {model_args.model_name_or_path}")
    print(f"现有LoRA路径: {model_args.existing_lora_path or '无（新建LoRA）'}")
    print(f"增量数据集: {data_args.dataset_path}")
    print(f"输出目录: {training_args.output_dir}")
    print("=" * 60)
    
    # 设置模型和tokenizer
    model, tokenizer = setup_model_and_tokenizer(model_args)
    
    # 设置增量LoRA模型
    model = setup_incremental_lora_model(model, model_args, lora_args)
    
    # 确保LoRA参数可训练
    model.train()
    for name, param in model.named_parameters():
        if 'lora_' in name:
            param.requires_grad = True
    
    # 打印可训练参数
    model.print_trainable_parameters()
    
    # 处理增量数据集
    processor = IncrementalDatasetProcessor(tokenizer, data_args.max_seq_length)
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), data_args.dataset_path))
    raw_dataset = processor.load_dataset(dataset_path)
    
    # 对数据集进行tokenization
    train_dataset = raw_dataset.map(
        processor.tokenize_function,
        batched=True,
        remove_columns=raw_dataset.column_names,
        desc="Tokenizing incremental dataset"
    )
    
    # 设置数据整理器
    data_collator = DataCollatorForSeq2Seq(
        tokenizer=tokenizer,
        model=model,
        label_pad_token_id=-100,
        pad_to_multiple_of=8,
    )
    
    # 设置训练器
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        data_collator=data_collator,
    )
    
    # 开始增量训练
    print("开始增量训练...")
    trainer.train()
    
    # 保存模型
    print(f"保存增量模型到: {training_args.output_dir}")
    trainer.save_model()
    tokenizer.save_pretrained(training_args.output_dir)
    
    print("增量训练完成！")
    
    # 测试增量模型
    print("\n测试增量微调后的模型:")
    test_incremental_model(
        training_args.output_dir, 
        tokenizer, 
        model_args.model_name_or_path,
        model_args.cache_dir
    )

if __name__ == "__main__":
    # 设置默认训练参数
    import sys
    
    default_args = [
        "--output_dir", "./incremental_lora_output",
        "--num_train_epochs", "2",
        "--per_device_train_batch_size", "4",
        "--gradient_accumulation_steps", "1",
        "--learning_rate", "1e-4",  # 增量训练使用较小的学习率
        "--warmup_steps", "20",
        "--logging_steps", "2",
        "--save_steps", "50",
        "--save_total_limit", "2",
        "--gradient_checkpointing", "True",
        "--dataloader_pin_memory", "False",
        "--fp16", "False",  # CPU训练不支持fp16
        "--report_to", "none",
        "--cache_dir", "e:\\llm_models",
    ]
    
    # 如果没有提供参数，使用默认参数
    if len(sys.argv) == 1:
        sys.argv.extend(default_args)
    
    main()