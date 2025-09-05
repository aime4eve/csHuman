#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试CPU推理功能的独立脚本
"""

import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import os

def test_cpu_inference():
    """测试CPU推理功能"""
    try:
        print("开始测试CPU推理功能...")
        
        # 设置缓存目录
        cache_dir = "e:\\llm_models"
        model_name = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
        
        print(f"正在加载模型: {model_name}")
        print(f"使用缓存目录: {cache_dir}")
        
        # 加载tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            trust_remote_code=True
        )
        
        # 设置pad_token
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # 加载模型，强制使用CPU和float32
        model = AutoModelForCausalLM.from_pretrained(
            model_name,
            cache_dir=cache_dir,
            torch_dtype=torch.float32,
            device_map="cpu",
            trust_remote_code=True
        )
        
        model.eval()
        print("模型加载完成！")
        
        # 测试问题
        test_questions = [
            "烟雾探测器的工作温度是多少？",
            "烟雾探测器的功能有哪些？",
            "外夹式流量计有哪些好处？"
        ]
        
        print("\n开始测试问答功能:")
        print("=" * 50)
        
        for i, question in enumerate(test_questions, 1):
            print(f"\n问题{i}: {question}")
            
            # 构建对话格式
            conversation = f"<|im_start|>system\n你是一个客服数字人。<|im_end|>\n<|im_start|>user\n{question}<|im_end|>\n<|im_start|>assistant\n"
            
            # 编码输入
            inputs = tokenizer(
                conversation, 
                return_tensors="pt", 
                truncation=True, 
                max_length=512
            )
            
            print("正在生成回答...")
            
            # CPU推理
            with torch.no_grad():
                outputs = model.generate(
                    inputs.input_ids,
                    attention_mask=inputs.attention_mask,
                    max_new_tokens=100,  # 减少生成长度以提高速度
                    do_sample=True,
                    temperature=0.7,
                    top_p=0.9,
                    pad_token_id=tokenizer.eos_token_id,
                    eos_token_id=tokenizer.eos_token_id
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
            
        print("\n测试完成！CPU推理功能正常工作。")
        
    except Exception as e:
        print(f"测试过程中出错: {e}")
        import traceback
        traceback.print_exc()
        print("\n提示：如果出现内存不足错误，可以尝试:")
        print("1. 减少max_new_tokens参数")
        print("2. 关闭其他占用内存的程序")
        print("3. 使用更小的模型")

if __name__ == "__main__":
    test_cpu_inference()