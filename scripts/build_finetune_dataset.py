#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
微调数据集构建脚本

该脚本用于从知识库文档中生成LoRA微调所需的"指令-知识-答案"格式的训练数据。
数据格式遵循Alpaca格式，适用于QLoRA微调。

作者: AI Assistant
创建时间: 2025-08-12
"""

import os
import json
import random
from typing import List, Dict, Any
from pathlib import Path
import re

# 配置参数 notes\智能体项目\知识库智能体\智能问答\产品知识库
KNOWLEDGE_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'notes\智能体项目\知识库智能体\智能问答\产品知识库'))
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'finetune_dataset.json'))
MIN_CONTENT_LENGTH = 100  # 最小内容长度
MAX_SAMPLES_PER_FILE = 5  # 每个文件最大生成样本数

class DatasetBuilder:
    def __init__(self):
        self.dataset = []
        self.question_templates = [
            "请介绍一下{topic}",
            "什么是{topic}？",
            "能详细说明{topic}吗？",
            "关于{topic}，你了解多少？",
            "{topic}的主要内容是什么？",
            "请解释{topic}的概念",
            "我想了解{topic}的相关信息",
            "请简述{topic}",
            "能给我讲讲{topic}吗？",
            "{topic}包含哪些方面？"
        ]
        
        # 企业相关的问题模板
        self.business_templates = [
            "在{context}方面，{topic}是如何实现的？",
            "从业务角度来看，{topic}有什么优势？",
            "在实际应用中，{topic}需要注意什么？",
            "如何在企业中实施{topic}？",
            "{topic}的实施步骤是什么？",
            "{topic}在企业管理中的作用是什么？",
            "采用{topic}能带来什么价值？"
        ]
    
    def extract_markdown_sections(self, content: str, filename: str) -> List[Dict[str, str]]:
        """从Markdown内容中提取章节信息"""
        sections = []
        lines = content.split('\n')
        current_section = {'title': '', 'content': '', 'level': 0}
        
        for line in lines:
            # 检测标题行
            if line.strip().startswith('#'):
                # 保存前一个章节
                if current_section['content'].strip() and len(current_section['content']) > MIN_CONTENT_LENGTH:
                    sections.append(current_section.copy())
                
                # 开始新章节
                level = len(line) - len(line.lstrip('#'))
                title = line.lstrip('#').strip()
                current_section = {
                    'title': title,
                    'content': '',
                    'level': level,
                    'filename': filename
                }
            else:
                # 添加内容到当前章节
                if line.strip():
                    current_section['content'] += line + '\n'
        
        # 添加最后一个章节
        if current_section['content'].strip() and len(current_section['content']) > MIN_CONTENT_LENGTH:
            sections.append(current_section)
        
        return sections
    
    def generate_questions_for_section(self, section: Dict[str, str]) -> List[Dict[str, Any]]:
        """为章节生成问答对"""
        samples = []
        title = section['title']
        content = section['content'].strip()
        filename = section.get('filename', '')
        
        # 清理内容，移除过多的换行和特殊字符
        content = re.sub(r'\n{3,}', '\n\n', content)
        content = re.sub(r'```[\s\S]*?```', '[代码示例]', content)  # 替换代码块
        content = content.replace('---', '').strip()
        
        if len(content) < MIN_CONTENT_LENGTH:
            return samples
        
        # 生成基础问题
        basic_questions = random.sample(self.question_templates, min(3, len(self.question_templates)))
        for template in basic_questions:
            question = template.format(topic=title)
            sample = {
                "messages": [
                    {"role": "system", "content": "你是客服数字人"},
                    {"role": "user", "content": question},
                    {"role": "assistant", "content": self.format_answer(title, content, filename)}
                ]
            }
            samples.append(sample)
        
        # 生成业务相关问题
        if any(keyword in filename.lower() for keyword in ['智能体', '企业', '管理', '系统', '设计']):
            business_questions = random.sample(self.business_templates, min(2, len(self.business_templates)))
            context = self.extract_context_from_filename(filename)
            
            for template in business_questions:
                question = template.format(topic=title, context=context)
                sample = {
                    "messages": [
                        {"role": "system", "content": "你是客服数字人"},
                        {"role": "user", "content": question},
                        {"role": "assistant", "content": self.format_business_answer(title, content, context)}
                    ]
                }
                samples.append(sample)
        
        return samples[:MAX_SAMPLES_PER_FILE]
    
    def extract_context_from_filename(self, filename: str) -> str:
        """从文件名提取业务上下文"""
        if '智能体' in filename:
            return '智能体系统'
        elif '企业' in filename:
            return '企业管理'
        elif '设计' in filename:
            return '系统设计'
        elif '推广' in filename:
            return '市场推广'
        else:
            return '业务系统'
    
    def format_answer(self, title: str, content: str, filename: str) -> str:
        """格式化标准答案"""
        # 截取内容的前500个字符作为答案
        answer = content[:500].strip()
        if len(content) > 500:
            answer += "..."
        
        return f"根据我们的知识库，{title}的相关信息如下：\n\n{answer}"
    
    def format_business_answer(self, title: str, content: str, context: str) -> str:
        """格式化业务相关答案"""
        answer = content[:400].strip()
        if len(content) > 400:
            answer += "..."
        
        return f"在{context}领域，{title}具有重要意义。具体来说：\n\n{answer}\n\n这些内容对于企业的实际应用具有重要的指导价值。"
    
    def process_markdown_file(self, file_path: str) -> None:
        """处理单个Markdown文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = os.path.basename(file_path)
            sections = self.extract_markdown_sections(content, filename)
            
            for section in sections:
                samples = self.generate_questions_for_section(section)
                self.dataset.extend(samples)
                
            print(f"已处理文件: {filename}, 生成样本数: {len([s for s in sections])}")
            
        except Exception as e:
            print(f"处理文件 {file_path} 时出错: {e}")
    
    def scan_knowledge_base(self) -> None:
        """扫描知识库目录，处理所有Markdown文件"""
        knowledge_path = Path(KNOWLEDGE_BASE_PATH)
        
        if not knowledge_path.exists():
            print(f"知识库路径不存在: {KNOWLEDGE_BASE_PATH}")
            return
        
        md_files = list(knowledge_path.rglob('*.md'))
        print(f"找到 {len(md_files)} 个Markdown文件")
        
        for md_file in md_files:
            self.process_markdown_file(str(md_file))
    
    def save_dataset(self) -> None:
        """保存数据集到JSON文件"""
        if not self.dataset:
            print("没有生成任何训练样本")
            return
        
        # 随机打乱数据集
        random.shuffle(self.dataset)
        
        # 保存到文件
        os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(self.dataset, f, ensure_ascii=False, indent=2)
        
        print(f"\n数据集构建完成!")
        print(f"总样本数: {len(self.dataset)}")
        print(f"保存路径: {OUTPUT_FILE}")
        
        # 显示样本示例
        if self.dataset:
            print("\n样本示例:")
            sample = random.choice(self.dataset)
            print(f"对话格式: {json.dumps(sample, ensure_ascii=False, indent=2)[:300]}...")

def main():
    """主函数"""
    print("开始构建LoRA微调数据集...")
    print(f"知识库路径: {KNOWLEDGE_BASE_PATH}")
    print(f"输出文件: {OUTPUT_FILE}")
    print("-" * 50)
    
    builder = DatasetBuilder()
    builder.scan_knowledge_base()
    builder.save_dataset()

if __name__ == "__main__":
    main()