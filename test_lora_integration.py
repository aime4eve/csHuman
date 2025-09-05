#!/usr/bin/env python3
"""
LoRA RAG 集成测试脚本

此脚本用于测试 LoRA 微调模型与 RAG 系统的集成是否正常工作。
包含基本功能测试、模型切换测试和性能测试。

使用方法:
    python test_lora_integration.py [选项]

选项:
    --quick         快速测试（跳过性能测试）
    --lora-only     仅测试 LoRA 模型
    --ollama-only   仅测试 Ollama 模型
    --verbose       启用详细输出
"""

import os
import sys
import time
import argparse
import asyncio
from pathlib import Path
from typing import Dict, Any, List

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    from app.lora_rag_handler import create_lora_rag_handler, LoRARAGHandler
    from dotenv import load_dotenv
except ImportError as e:
    print(f"❌ 导入失败: {e}")
    print("请确保已安装所有依赖: pip install -r requirements.txt")
    sys.exit(1)

# 加载环境变量
load_dotenv()

class LoRAIntegrationTester:
    """LoRA 集成测试器"""
    
    def __init__(self, verbose: bool = False):
        self.verbose = verbose
        self.test_results = []
        
        # 测试问题
        self.test_questions = [
            "你好，请介绍一下你自己",
            "什么是人工智能？",
            "请解释一下机器学习的基本概念",
            "深度学习和传统机器学习有什么区别？",
            "如何评估一个机器学习模型的性能？"
        ]
    
    def log(self, message: str, level: str = "INFO"):
        """日志输出"""
        if self.verbose or level in ["ERROR", "SUCCESS", "WARNING"]:
            prefix = {
                "INFO": "ℹ️",
                "SUCCESS": "✅",
                "ERROR": "❌",
                "WARNING": "⚠️"
            }.get(level, "📝")
            print(f"{prefix} {message}")
    
    def add_result(self, test_name: str, success: bool, message: str = "", duration: float = 0):
        """添加测试结果"""
        self.test_results.append({
            "test_name": test_name,
            "success": success,
            "message": message,
            "duration": duration
        })
        
        status = "✅ 通过" if success else "❌ 失败"
        duration_str = f" ({duration:.2f}s)" if duration > 0 else ""
        self.log(f"{test_name}: {status}{duration_str}", "SUCCESS" if success else "ERROR")
        
        if message:
            self.log(f"   详情: {message}")
    
    def check_environment(self) -> bool:
        """检查环境配置"""
        self.log("检查环境配置...")
        
        checks = [
            ("向量存储", self._check_vector_store),
            ("LoRA模型", self._check_lora_model),
            ("基础模型配置", self._check_base_model),
            ("Ollama服务", self._check_ollama_service)
        ]
        
        all_passed = True
        
        for name, check_func in checks:
            try:
                start_time = time.time()
                success, message = check_func()
                duration = time.time() - start_time
                
                self.add_result(f"环境检查-{name}", success, message, duration)
                
                if not success:
                    all_passed = False
                    
            except Exception as e:
                self.add_result(f"环境检查-{name}", False, str(e))
                all_passed = False
        
        return all_passed
    
    def _check_vector_store(self) -> tuple[bool, str]:
        """检查向量存储"""
        vector_store_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'vector_store'))
        
        if not os.path.exists(vector_store_path):
            return False, f"向量存储目录不存在: {vector_store_path}"
        
        if not os.listdir(vector_store_path):
            return False, f"向量存储目录为空: {vector_store_path}"
        
        return True, f"向量存储正常: {vector_store_path}"
    
    def _check_lora_model(self) -> tuple[bool, str]:
        """检查LoRA模型"""
        lora_path = os.getenv("LORA_MODEL_PATH", "./lora_adapters")
        
        if not os.path.exists(lora_path):
            return False, f"LoRA模型目录不存在: {lora_path}"
        
        required_files = ["adapter_config.json"]
        missing_files = []
        
        for file in required_files:
            if not os.path.exists(os.path.join(lora_path, file)):
                missing_files.append(file)
        
        if missing_files:
            return False, f"缺少LoRA文件: {missing_files}"
        
        return True, f"LoRA模型正常: {lora_path}"
    
    def _check_base_model(self) -> tuple[bool, str]:
        """检查基础模型配置"""
        base_model = os.getenv("BASE_MODEL_NAME", "Qwen/Qwen2.5-1.5B-Instruct")
        cache_dir = os.getenv("CACHE_DIR")
        
        if cache_dir and not os.path.exists(cache_dir):
            return False, f"缓存目录不存在: {cache_dir}"
        
        return True, f"基础模型配置正常: {base_model}"
    
    def _check_ollama_service(self) -> tuple[bool, str]:
        """检查Ollama服务"""
        try:
            import requests
            response = requests.get("http://localhost:11434/api/tags", timeout=5)
            
            if response.status_code == 200:
                models = response.json().get("models", [])
                return True, f"Ollama服务正常，模型数量: {len(models)}"
            else:
                return False, f"Ollama服务响应异常: {response.status_code}"
                
        except ImportError:
            return False, "requests库未安装"
        except Exception as e:
            return False, f"无法连接Ollama服务: {e}"
    
    async def test_lora_model(self) -> bool:
        """测试LoRA模型"""
        self.log("测试LoRA模型...")
        
        try:
            start_time = time.time()
            
            # 创建LoRA RAG处理器
            rag_handler = create_lora_rag_handler(use_lora=True)
            
            # 测试问答
            test_question = self.test_questions[0]
            response = await rag_handler.get_answer(test_question)
            
            duration = time.time() - start_time
            
            # 验证响应
            if "answer" in response and response["answer"]:
                self.add_result("LoRA模型测试", True, f"回答长度: {len(response['answer'])}字符", duration)
                
                if self.verbose:
                    self.log(f"问题: {test_question}")
                    self.log(f"回答: {response['answer'][:100]}...")
                
                return True
            else:
                self.add_result("LoRA模型测试", False, "未获得有效回答")
                return False
                
        except Exception as e:
            self.add_result("LoRA模型测试", False, str(e))
            return False
    
    async def test_ollama_model(self) -> bool:
        """测试Ollama模型"""
        self.log("测试Ollama模型...")
        
        try:
            start_time = time.time()
            
            # 创建Ollama RAG处理器
            rag_handler = create_lora_rag_handler(use_lora=False)
            
            # 测试问答
            test_question = self.test_questions[1]
            response = await rag_handler.get_answer(test_question)
            
            duration = time.time() - start_time
            
            # 验证响应
            if "answer" in response and response["answer"]:
                self.add_result("Ollama模型测试", True, f"回答长度: {len(response['answer'])}字符", duration)
                
                if self.verbose:
                    self.log(f"问题: {test_question}")
                    self.log(f"回答: {response['answer'][:100]}...")
                
                return True
            else:
                self.add_result("Ollama模型测试", False, "未获得有效回答")
                return False
                
        except Exception as e:
            self.add_result("Ollama模型测试", False, str(e))
            return False
    
    async def test_model_switching(self) -> bool:
        """测试模型切换"""
        self.log("测试模型切换...")
        
        try:
            start_time = time.time()
            
            # 创建RAG处理器
            rag_handler = create_lora_rag_handler(use_lora=True)
            
            # 测试LoRA模式
            response1 = await rag_handler.get_answer(self.test_questions[2])
            
            # 切换到Ollama模式
            rag_handler.switch_model(use_lora=False)
            response2 = await rag_handler.get_answer(self.test_questions[2])
            
            # 切换回LoRA模式
            rag_handler.switch_model(use_lora=True)
            response3 = await rag_handler.get_answer(self.test_questions[2])
            
            duration = time.time() - start_time
            
            # 验证所有响应都有效
            if ("answer" in response1 and response1["answer"] and
                "answer" in response2 and response2["answer"] and
                "answer" in response3 and response3["answer"]):
                
                self.add_result("模型切换测试", True, "三次切换均成功", duration)
                return True
            else:
                self.add_result("模型切换测试", False, "部分切换失败")
                return False
                
        except Exception as e:
            self.add_result("模型切换测试", False, str(e))
            return False
    
    async def test_performance(self) -> bool:
        """性能测试"""
        self.log("进行性能测试...")
        
        try:
            rag_handler = create_lora_rag_handler(use_lora=True)
            
            total_time = 0
            successful_queries = 0
            
            for i, question in enumerate(self.test_questions):
                try:
                    start_time = time.time()
                    response = await rag_handler.get_answer(question)
                    duration = time.time() - start_time
                    
                    if "answer" in response and response["answer"]:
                        total_time += duration
                        successful_queries += 1
                        
                        if self.verbose:
                            self.log(f"问题 {i+1}: {duration:.2f}s")
                    
                except Exception as e:
                    self.log(f"问题 {i+1} 失败: {e}", "WARNING")
            
            if successful_queries > 0:
                avg_time = total_time / successful_queries
                self.add_result(
                    "性能测试", 
                    True, 
                    f"平均响应时间: {avg_time:.2f}s, 成功率: {successful_queries}/{len(self.test_questions)}",
                    total_time
                )
                return True
            else:
                self.add_result("性能测试", False, "所有查询都失败")
                return False
                
        except Exception as e:
            self.add_result("性能测试", False, str(e))
            return False
    
    def print_summary(self):
        """打印测试总结"""
        print("\n" + "="*60)
        print("🧪 LoRA RAG 集成测试总结")
        print("="*60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"\n📊 测试统计:")
        print(f"   总测试数: {total_tests}")
        print(f"   通过: {passed_tests} ✅")
        print(f"   失败: {failed_tests} ❌")
        print(f"   成功率: {(passed_tests/total_tests*100):.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ 失败的测试:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   - {result['test_name']}: {result['message']}")
        
        print(f"\n⏱️  性能统计:")
        total_duration = sum(result["duration"] for result in self.test_results)
        print(f"   总耗时: {total_duration:.2f}s")
        
        if passed_tests == total_tests:
            print(f"\n🎉 所有测试通过！LoRA RAG 集成正常工作。")
        else:
            print(f"\n⚠️  部分测试失败，请检查配置和依赖。")
        
        print("="*60)

async def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="LoRA RAG 集成测试脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    
    parser.add_argument("--quick", action="store_true", help="快速测试（跳过性能测试）")
    parser.add_argument("--lora-only", action="store_true", help="仅测试 LoRA 模型")
    parser.add_argument("--ollama-only", action="store_true", help="仅测试 Ollama 模型")
    parser.add_argument("--verbose", action="store_true", help="启用详细输出")
    
    args = parser.parse_args()
    
    # 创建测试器
    tester = LoRAIntegrationTester(verbose=args.verbose)
    
    print("🚀 开始 LoRA RAG 集成测试")
    print("="*60)
    
    # 环境检查
    env_ok = tester.check_environment()
    
    if not env_ok:
        print("\n⚠️  环境检查未完全通过，部分测试可能失败")
        print("是否继续测试？ (y/N): ", end="")
        response = input().strip().lower()
        if response not in ["y", "yes"]:
            print("已取消测试")
            return
    
    # 功能测试
    if not args.ollama_only:
        await tester.test_lora_model()
    
    if not args.lora_only:
        await tester.test_ollama_model()
    
    if not args.lora_only and not args.ollama_only:
        await tester.test_model_switching()
    
    # 性能测试
    if not args.quick:
        await tester.test_performance()
    
    # 打印总结
    tester.print_summary()

if __name__ == "__main__":
    asyncio.run(main())