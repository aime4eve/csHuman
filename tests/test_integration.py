#!/usr/bin/env python3
"""
集成测试 - 测试完整的RAG系统流程
"""

import pytest
import requests
import time
import os
import sys
from unittest.mock import patch, Mock

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

class TestRAGSystemIntegration:
    """RAG系统集成测试类"""
    
    BASE_URL = "http://127.0.0.1:8000"
    
    @pytest.fixture(scope="class")
    def api_server(self):
        """确保API服务器运行"""
        # 检查服务器是否已经运行
        try:
            response = requests.get(f"{self.BASE_URL}/health", timeout=5)
            if response.status_code == 200:
                yield self.BASE_URL
                return
        except requests.exceptions.RequestException:
            pass
        
        # 如果服务器未运行，跳过集成测试
        pytest.skip("API服务器未运行，跳过集成测试")
    
    def test_health_endpoint(self, api_server):
        """测试健康检查端点"""
        response = requests.get(f"{api_server}/health")
        
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"
    
    def test_ask_endpoint_valid_question(self, api_server):
        """测试有效问题的问答端点"""
        question = "什么是RAG系统？"
        
        response = requests.post(
            f"{api_server}/ask",
            json={"question": question},
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # 验证响应结构
        assert "answer" in data
        assert "source_documents" in data
        assert "response_time" in data
        
        # 验证内容
        assert isinstance(data["answer"], str)
        assert len(data["answer"]) > 0
        assert isinstance(data["source_documents"], list)
        assert isinstance(data["response_time"], (int, float))
        assert data["response_time"] > 0
    
    def test_ask_endpoint_empty_question(self, api_server):
        """测试空问题的处理"""
        response = requests.post(
            f"{api_server}/ask",
            json={"question": ""},
            timeout=10
        )
        
        assert response.status_code == 400
        data = response.json()
        assert "error" in data
    
    def test_ask_endpoint_missing_question(self, api_server):
        """测试缺少问题字段的处理"""
        response = requests.post(
            f"{api_server}/ask",
            json={},
            timeout=10
        )
        
        assert response.status_code == 422  # FastAPI validation error
    
    def test_ask_endpoint_invalid_json(self, api_server):
        """测试无效JSON的处理"""
        response = requests.post(
            f"{api_server}/ask",
            data="invalid json",
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        assert response.status_code == 422
    
    def test_multiple_concurrent_requests(self, api_server):
        """测试并发请求处理"""
        import concurrent.futures
        
        def send_request(question):
            response = requests.post(
                f"{api_server}/ask",
                json={"question": question},
                timeout=30
            )
            return response.status_code, response.json()
        
        questions = [
            "什么是RAG系统？",
            "如何实施LoRA微调？",
            "企业级知识库的主要功能有哪些？"
        ]
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
            futures = [executor.submit(send_request, q) for q in questions]
            results = [future.result() for future in concurrent.futures.as_completed(futures)]
        
        # 验证所有请求都成功
        for status_code, data in results:
            assert status_code == 200
            assert "answer" in data
            assert "source_documents" in data
    
    def test_response_time_performance(self, api_server):
        """测试响应时间性能"""
        question = "什么是向量数据库？"
        
        start_time = time.time()
        response = requests.post(
            f"{api_server}/ask",
            json={"question": question},
            timeout=60
        )
        end_time = time.time()
        
        assert response.status_code == 200
        
        # 验证响应时间在合理范围内（60秒内）
        response_time = end_time - start_time
        assert response_time < 60
        
        # 验证返回的响应时间字段
        data = response.json()
        assert data["response_time"] > 0
        assert data["response_time"] < response_time  # 内部计时应该小于总请求时间
    
    def test_source_documents_quality(self, api_server):
        """测试源文档质量"""
        question = "华宽通智能体的设计理念是什么？"
        
        response = requests.post(
            f"{api_server}/ask",
            json={"question": question},
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        source_docs = data["source_documents"]
        assert len(source_docs) > 0
        
        # 验证每个源文档的结构
        for doc in source_docs:
            assert "content" in doc
            assert "source" in doc
            assert isinstance(doc["content"], str)
            assert isinstance(doc["source"], str)
            assert len(doc["content"]) > 0
            assert len(doc["source"]) > 0
    
    def test_answer_consistency(self, api_server):
        """测试答案一致性（相同问题多次询问）"""
        question = "什么是LoRA微调？"
        answers = []
        
        # 询问同一个问题3次
        for _ in range(3):
            response = requests.post(
                f"{api_server}/ask",
                json={"question": question},
                timeout=30
            )
            
            assert response.status_code == 200
            data = response.json()
            answers.append(data["answer"])
            
            # 短暂等待
            time.sleep(1)
        
        # 验证所有答案都不为空
        for answer in answers:
            assert len(answer) > 0
        
        # 注意：由于LLM的随机性，答案可能不完全相同，但应该都是有意义的回答
        # 这里我们只验证答案的基本质量
    
    def test_error_handling_server_error(self, api_server):
        """测试服务器错误处理"""
        # 发送一个可能导致内部错误的复杂请求
        very_long_question = "什么是" + "非常" * 1000 + "复杂的问题？"
        
        response = requests.post(
            f"{api_server}/ask",
            json={"question": very_long_question},
            timeout=30
        )
        
        # 应该能够处理而不崩溃
        assert response.status_code in [200, 400, 500]
        
        if response.status_code != 200:
            data = response.json()
            assert "error" in data or "detail" in data

class TestRAGSystemMocked:
    """使用模拟的RAG系统测试"""
    
    def test_rag_handler_initialization(self):
        """测试RAG处理器初始化（模拟）"""
        with patch('app.rag_handler.FAISS.load_local') as mock_load, \
             patch('app.rag_handler.ChatOllama') as mock_llm:
            
            mock_load.return_value = None
            mock_llm.return_value = None
            
            from app.rag_handler import RAGHandler
            handler = RAGHandler()
            
            assert handler is not None
            mock_load.assert_called_once()
            mock_llm.assert_called_once()
    
    def test_end_to_end_workflow_mocked(self):
        """测试端到端工作流程（模拟）"""
        with patch('app.rag_handler.FAISS.load_local') as mock_load, \
             patch('app.rag_handler.ChatOllama') as mock_llm:
            
            # 设置模拟
            mock_vector_store = Mock()
            mock_vector_store.similarity_search.return_value = [
                Mock(page_content="测试内容", metadata={"source": "test.md"})
            ]
            mock_load.return_value = mock_vector_store
            
            mock_llm_instance = Mock()
            mock_llm_instance.invoke.return_value = Mock(content="测试答案")
            mock_llm.return_value = mock_llm_instance
            
            # 测试工作流程
            from app.rag_handler import RAGHandler
            handler = RAGHandler()
            
            result = handler.answer_question("测试问题")
            
            assert "answer" in result
            assert "source_documents" in result
            assert "response_time" in result
            assert result["answer"] == "测试答案"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])