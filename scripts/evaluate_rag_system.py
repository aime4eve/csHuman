#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG系统自动化评估脚本

使用LLM-as-a-Judge方法评估RAG系统的性能，从准确性、相关性、完整性等维度进行评分。
支持批量评估和详细的评估报告生成。

作者: AI Assistant
创建时间: 2025-08-12
"""

import os
import sys
import json
import asyncio
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from app.rag_handler import RAGHandler
from langchain_ollama import ChatOllama

# 配置参数
EVALUATION_DATASET = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation_dataset.json'))
OUTPUT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation_results'))
JUDGE_MODEL = "qwen3:4b"  # 用作评判的模型
MAX_CONCURRENT = 3  # 最大并发评估数量

class RAGEvaluator:
    """RAG系统评估器"""
    
    def __init__(self):
        self.rag_handler = None
        self.judge_llm = None
        self.evaluation_results = []
        
    async def initialize(self):
        """初始化评估器"""
        print("初始化RAG系统...")
        try:
            self.rag_handler = RAGHandler()
            print("RAG系统初始化成功")
        except Exception as e:
            print(f"RAG系统初始化失败: {e}")
            raise
        
        print("初始化评判模型...")
        try:
            self.judge_llm = ChatOllama(
                model=JUDGE_MODEL,
                temperature=0.1,  # 低温度确保评判一致性
                base_url="http://localhost:11434"
            )
            print("评判模型初始化成功")
        except Exception as e:
            print(f"评判模型初始化失败: {e}")
            raise
    
    def load_evaluation_dataset(self) -> List[Dict[str, Any]]:
        """加载评估数据集"""
        if not os.path.exists(EVALUATION_DATASET):
            raise FileNotFoundError(f"评估数据集不存在: {EVALUATION_DATASET}")
        
        with open(EVALUATION_DATASET, 'r', encoding='utf-8') as f:
            dataset = json.load(f)
        
        print(f"成功加载 {len(dataset)} 个评估问题")
        return dataset
    
    async def get_rag_answer(self, question: str) -> Dict[str, Any]:
        """获取RAG系统的回答"""
        try:
            start_time = time.time()
            result = await self.rag_handler.get_answer(question)
            response_time = time.time() - start_time
            
            return {
                'answer': result.get('answer', ''),
                'source_documents': result.get('source_documents', []),
                'response_time': response_time,
                'success': True,
                'error': None
            }
        except Exception as e:
            return {
                'answer': '',
                'source_documents': [],
                'response_time': 0,
                'success': False,
                'error': str(e)
            }
    
    async def judge_answer(self, question: str, expected_answer: str, actual_answer: str) -> Dict[str, Any]:
        """使用LLM评判答案质量"""
        judge_prompt = f"""请评估AI回答的质量。

问题: {question}
标准答案: {expected_answer}
AI回答: {actual_answer}

请从1-5分评分（5分最高）并输出JSON格式：
{{
    "accuracy": 4,
    "relevance": 4,
    "completeness": 4,
    "clarity": 4,
    "usefulness": 4,
    "overall_score": 4,
    "explanation": "评分理由"
}}

只输出JSON，不要其他内容。"""
        
        try:
            response = await self.judge_llm.ainvoke(judge_prompt)
            
            # 提取JSON内容
            response_text = response.content.strip()
            
            # 尝试解析JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            try:
                scores = json.loads(response_text)
                return scores
            except json.JSONDecodeError:
                # 如果JSON解析失败，返回默认评分
                print(f"JSON解析失败，使用默认评分: {response_text[:100]}...")
                return {
                    "accuracy": 3,
                    "relevance": 3,
                    "completeness": 3,
                    "clarity": 3,
                    "usefulness": 3,
                    "overall_score": 3,
                    "explanation": "评判模型响应格式错误，使用默认评分"
                }
                
        except Exception as e:
            print(f"评判过程出错: {e}")
            return {
                "accuracy": 2,
                "relevance": 2,
                "completeness": 2,
                "clarity": 2,
                "usefulness": 2,
                "overall_score": 2,
                "explanation": f"评判过程出错: {str(e)}"
            }
    
    async def evaluate_single_question(self, question_data: Dict[str, Any]) -> Dict[str, Any]:
        """评估单个问题"""
        question = question_data['question']
        expected_answer = question_data['expected_answer']
        
        print(f"评估问题: {question[:50]}...")
        
        # 获取RAG系统回答
        rag_result = await self.get_rag_answer(question)
        
        if not rag_result['success']:
            return {
                'question': question,
                'expected_answer': expected_answer,
                'actual_answer': '',
                'rag_success': False,
                'rag_error': rag_result['error'],
                'response_time': 0,
                'source_count': 0,
                'scores': {
                    "accuracy": 0,
                    "relevance": 0,
                    "completeness": 0,
                    "clarity": 0,
                    "usefulness": 0,
                    "overall_score": 0,
                    "explanation": "RAG系统回答失败"
                },
                'category': question_data.get('category', 'unknown'),
                'difficulty': question_data.get('difficulty', 'unknown'),
                'source_document': question_data.get('source_document', 'unknown')
            }
        
        actual_answer = rag_result['answer']
        
        # 使用LLM评判答案质量
        scores = await self.judge_answer(question, expected_answer, actual_answer)
        
        return {
            'question': question,
            'expected_answer': expected_answer,
            'actual_answer': actual_answer,
            'rag_success': True,
            'rag_error': None,
            'response_time': rag_result['response_time'],
            'source_count': len(rag_result['source_documents']),
            'scores': scores,
            'category': question_data.get('category', 'unknown'),
            'difficulty': question_data.get('difficulty', 'unknown'),
            'source_document': question_data.get('source_document', 'unknown')
        }
    
    async def evaluate_batch(self, questions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """批量评估问题"""
        results = []
        
        # 分批处理以控制并发
        for i in range(0, len(questions), MAX_CONCURRENT):
            batch = questions[i:i + MAX_CONCURRENT]
            print(f"\n处理批次 {i//MAX_CONCURRENT + 1}/{(len(questions)-1)//MAX_CONCURRENT + 1}")
            
            # 并发评估当前批次
            batch_tasks = [self.evaluate_single_question(q) for q in batch]
            batch_results = await asyncio.gather(*batch_tasks)
            
            results.extend(batch_results)
            
            # 短暂休息避免过载
            if i + MAX_CONCURRENT < len(questions):
                await asyncio.sleep(1)
        
        return results
    
    def generate_report(self, results: List[Dict[str, Any]]) -> Dict[str, Any]:
        """生成评估报告"""
        total_questions = len(results)
        successful_questions = sum(1 for r in results if r['rag_success'])
        
        if successful_questions == 0:
            return {
                'summary': {
                    'total_questions': total_questions,
                    'successful_questions': 0,
                    'success_rate': 0,
                    'average_scores': {},
                    'average_response_time': 0
                },
                'category_analysis': {},
                'difficulty_analysis': {},
                'detailed_results': results
            }
        
        # 计算平均分数
        score_keys = ['accuracy', 'relevance', 'completeness', 'clarity', 'usefulness', 'overall_score']
        average_scores = {}
        
        for key in score_keys:
            scores = [r['scores'][key] for r in results if r['rag_success'] and key in r['scores']]
            average_scores[key] = sum(scores) / len(scores) if scores else 0
        
        # 计算平均响应时间
        response_times = [r['response_time'] for r in results if r['rag_success']]
        average_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # 按类别分析
        category_analysis = {}
        for result in results:
            if not result['rag_success']:
                continue
                
            category = result['category']
            if category not in category_analysis:
                category_analysis[category] = {
                    'count': 0,
                    'average_score': 0,
                    'scores': []
                }
            
            category_analysis[category]['count'] += 1
            category_analysis[category]['scores'].append(result['scores']['overall_score'])
        
        # 计算每个类别的平均分
        for category, data in category_analysis.items():
            if data['scores']:
                data['average_score'] = sum(data['scores']) / len(data['scores'])
            del data['scores']  # 删除原始分数列表
        
        # 按难度分析
        difficulty_analysis = {}
        for result in results:
            if not result['rag_success']:
                continue
                
            difficulty = result['difficulty']
            if difficulty not in difficulty_analysis:
                difficulty_analysis[difficulty] = {
                    'count': 0,
                    'average_score': 0,
                    'scores': []
                }
            
            difficulty_analysis[difficulty]['count'] += 1
            difficulty_analysis[difficulty]['scores'].append(result['scores']['overall_score'])
        
        # 计算每个难度的平均分
        for difficulty, data in difficulty_analysis.items():
            if data['scores']:
                data['average_score'] = sum(data['scores']) / len(data['scores'])
            del data['scores']  # 删除原始分数列表
        
        return {
            'summary': {
                'total_questions': total_questions,
                'successful_questions': successful_questions,
                'success_rate': successful_questions / total_questions,
                'average_scores': average_scores,
                'average_response_time': average_response_time
            },
            'category_analysis': category_analysis,
            'difficulty_analysis': difficulty_analysis,
            'detailed_results': results
        }
    
    def save_results(self, report: Dict[str, Any]):
        """保存评估结果"""
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # 保存完整报告
        report_file = os.path.join(OUTPUT_DIR, f"evaluation_report_{timestamp}.json")
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        # 生成简化的摘要报告
        summary_file = os.path.join(OUTPUT_DIR, f"evaluation_summary_{timestamp}.md")
        self.generate_markdown_summary(report, summary_file)
        
        print(f"\n评估结果已保存:")
        print(f"  完整报告: {report_file}")
        print(f"  摘要报告: {summary_file}")
    
    def generate_markdown_summary(self, report: Dict[str, Any], output_file: str):
        """生成Markdown格式的摘要报告"""
        summary = report['summary']
        
        content = f"""# RAG系统评估报告

**评估时间**: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

## 总体表现

- **总问题数**: {summary['total_questions']}
- **成功回答数**: {summary['successful_questions']}
- **成功率**: {summary['success_rate']:.2%}
- **平均响应时间**: {summary['average_response_time']:.2f}秒

## 评分详情

| 维度 | 平均分 | 评级 |
|------|--------|------|
| 准确性 | {summary['average_scores'].get('accuracy', 0):.2f}/5 | {self.get_grade(summary['average_scores'].get('accuracy', 0))} |
| 相关性 | {summary['average_scores'].get('relevance', 0):.2f}/5 | {self.get_grade(summary['average_scores'].get('relevance', 0))} |
| 完整性 | {summary['average_scores'].get('completeness', 0):.2f}/5 | {self.get_grade(summary['average_scores'].get('completeness', 0))} |
| 清晰度 | {summary['average_scores'].get('clarity', 0):.2f}/5 | {self.get_grade(summary['average_scores'].get('clarity', 0))} |
| 有用性 | {summary['average_scores'].get('usefulness', 0):.2f}/5 | {self.get_grade(summary['average_scores'].get('usefulness', 0))} |
| **总体评分** | **{summary['average_scores'].get('overall_score', 0):.2f}/5** | **{self.get_grade(summary['average_scores'].get('overall_score', 0))}** |

## 按类别分析

| 类别 | 问题数 | 平均分 | 评级 |
|------|--------|--------|----- |
"""
        
        for category, data in report['category_analysis'].items():
            content += f"| {category} | {data['count']} | {data['average_score']:.2f}/5 | {self.get_grade(data['average_score'])} |\n"
        
        content += "\n## 按难度分析\n\n| 难度 | 问题数 | 平均分 | 评级 |\n|------|--------|--------|------|\n"
        
        for difficulty, data in report['difficulty_analysis'].items():
            content += f"| {difficulty} | {data['count']} | {data['average_score']:.2f}/5 | {self.get_grade(data['average_score'])} |\n"
        
        content += "\n## 改进建议\n\n"
        
        overall_score = summary['average_scores'].get('overall_score', 0)
        if overall_score < 3:
            content += "- 系统整体表现需要显著改进\n"
            content += "- 建议检查知识库质量和检索策略\n"
            content += "- 考虑优化模型参数和提示词\n"
        elif overall_score < 4:
            content += "- 系统表现良好，但仍有改进空间\n"
            content += "- 建议针对低分类别进行专项优化\n"
            content += "- 可以考虑增加更多训练数据\n"
        else:
            content += "- 系统表现优秀，继续保持\n"
            content += "- 可以考虑扩展到更多应用场景\n"
            content += "- 建议定期更新知识库内容\n"
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(content)
    
    def get_grade(self, score: float) -> str:
        """根据分数获取评级"""
        if score >= 4.5:
            return "优秀"
        elif score >= 4.0:
            return "良好"
        elif score >= 3.0:
            return "一般"
        elif score >= 2.0:
            return "较差"
        else:
            return "很差"
    
    def print_summary(self, report: Dict[str, Any]):
        """打印评估摘要"""
        summary = report['summary']
        
        print("\n" + "=" * 60)
        print("RAG系统评估结果摘要")
        print("=" * 60)
        
        print(f"\n总体表现:")
        print(f"  总问题数: {summary['total_questions']}")
        print(f"  成功回答数: {summary['successful_questions']}")
        print(f"  成功率: {summary['success_rate']:.2%}")
        print(f"  平均响应时间: {summary['average_response_time']:.2f}秒")
        
        print(f"\n评分详情:")
        for key, score in summary['average_scores'].items():
            if key == 'overall_score':
                print(f"  ★ {key}: {score:.2f}/5 ({self.get_grade(score)})")
            else:
                print(f"    {key}: {score:.2f}/5 ({self.get_grade(score)})")
        
        print(f"\n按类别分析:")
        for category, data in report['category_analysis'].items():
            print(f"  {category}: {data['count']}题, 平均{data['average_score']:.2f}分 ({self.get_grade(data['average_score'])})")
        
        print(f"\n按难度分析:")
        for difficulty, data in report['difficulty_analysis'].items():
            print(f"  {difficulty}: {data['count']}题, 平均{data['average_score']:.2f}分 ({self.get_grade(data['average_score'])})")

async def main():
    """主函数"""
    print("开始RAG系统自动化评估...")
    
    # 初始化评估器
    evaluator = RAGEvaluator()
    
    try:
        await evaluator.initialize()
    except Exception as e:
        print(f"评估器初始化失败: {e}")
        return
    
    # 加载评估数据集
    try:
        questions = evaluator.load_evaluation_dataset()
    except Exception as e:
        print(f"加载评估数据集失败: {e}")
        return
    
    # 执行评估
    print(f"\n开始评估 {len(questions)} 个问题...")
    start_time = time.time()
    
    results = await evaluator.evaluate_batch(questions)
    
    total_time = time.time() - start_time
    print(f"\n评估完成，总耗时: {total_time:.2f}秒")
    
    # 生成报告
    print("\n生成评估报告...")
    report = evaluator.generate_report(results)
    
    # 保存结果
    evaluator.save_results(report)
    
    # 打印摘要
    evaluator.print_summary(report)
    
    print("\n" + "=" * 60)
    print("评估完成！")

if __name__ == "__main__":
    asyncio.run(main())