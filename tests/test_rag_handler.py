#!/usr/bin/env python3
"""
RAG处理器单元测试
"""

import pytest
import os
import sys
from unittest.mock import Mock, patch, MagicMock

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.rag_handler import RAGHandler

class TestRAGHandler:
    """RAG处理器测试类"""
    
    @pytest.fixture
    def mock_vector_store(self):
        """模拟向量存储"""
        mock_store = Mock()
        mock_store.similarity_search.return_value = [
            Mock(page_content="测试文档内容1", metadata={"source": "test1.md"}),
            Mock(page_content="测试文档内容2", metadata={"source": "test2.md"})
        ]
        return mock_store
    
    @pytest.fixture
    def mock_llm(self):
        """模拟LLM"""
        mock_llm = Mock()
        mock_llm.invoke.return_value = Mock(content="这是一个测试回答")
        return mock_llm
    
    @pytest.fixture
    def rag_handler(self, mock_vector_store, mock_llm):
        """创建RAG处理器实例"""
        with patch('app.rag_handler.FAISS.load_local', return_value=mock_vector_store), \
             patch('app.rag_handler.ChatOllama', return_value=mock_llm):
            handler = RAGHandler()
            return handler
    
    def test_initialization(self, rag_handler):
        """测试RAG处理器初始化"""
        assert rag_handler is not None
        assert hasattr(rag_handler, 'vector_store')
        assert hasattr(rag_handler, 'llm')
    
    def test_search_documents(self, rag_handler):
        """测试文档搜索功能"""
        query = "测试查询"
        results = rag_handler.search_documents(query, k=2)
        
        assert len(results) == 2
        assert results[0]['content'] == "测试文档内容1"
        assert results[0]['source'] == "test1.md"
        assert results[1]['content'] == "测试文档内容2"
        assert results[1]['source'] == "test2.md"
    
    def test_generate_answer(self, rag_handler):
        """测试答案生成功能"""
        question = "测试问题"
        context = "测试上下文"
        
        answer = rag_handler.generate_answer(question, context)
        
        assert answer == "这是一个测试回答"
        rag_handler.llm.invoke.assert_called_once()
    
    def test_answer_question_integration(self, rag_handler):
        """测试完整问答流程"""
        question = "什么是RAG系统？"
        
        result = rag_handler.answer_question(question)
        
        assert 'answer' in result
        assert 'source_documents' in result
        assert 'response_time' in result
        assert result['answer'] == "这是一个测试回答"
        assert len(result['source_documents']) == 2
        assert result['response_time'] > 0
    
    def test_empty_query(self, rag_handler):
        """测试空查询处理"""
        result = rag_handler.answer_question("")
        
        assert 'error' in result
        assert "问题不能为空" in result['error']
    
    def test_vector_store_error(self, mock_llm):
        """测试向量存储加载错误"""
        with patch('app.rag_handler.FAISS.load_local', side_effect=Exception("向量存储加载失败")):
            with pytest.raises(Exception):
                RAGHandler()
    
    @patch('app.rag_handler.time.time')
    def test_response_time_calculation(self, mock_time, rag_handler):
        """测试响应时间计算"""
        mock_time.side_effect = [1000.0, 1002.5]  # 开始时间和结束时间
        
        result = rag_handler.answer_question("测试问题")
        
        assert result['response_time'] == 2.5
    
    def test_context_formatting(self, rag_handler):
        """测试上下文格式化"""
        docs = [
            {'content': '内容1', 'source': 'file1.md'},
            {'content': '内容2', 'source': 'file2.md'}
        ]
        
        context = rag_handler._format_context(docs)
        
        assert "内容1" in context
        assert "内容2" in context
        assert "file1.md" in context
        assert "file2.md" in context

if __name__ == "__main__":
    pytest.main([__file__])