#!/usr/bin/env python3
"""
数据摄取模块单元测试
"""

import pytest
import os
import sys
import tempfile
import shutil
from unittest.mock import Mock, patch, MagicMock

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from scripts.ingest import load_documents_by_type, ingest_data

class TestIngestModule:
    """数据摄取模块测试类"""
    
    @pytest.fixture
    def temp_dir(self):
        """创建临时目录"""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)
    
    @pytest.fixture
    def sample_files(self, temp_dir):
        """创建示例文件"""
        # 创建Markdown文件
        md_file = os.path.join(temp_dir, "test.md")
        with open(md_file, 'w', encoding='utf-8') as f:
            f.write("# 测试标题\n\n这是测试内容。")
        
        # 创建子目录和文件
        sub_dir = os.path.join(temp_dir, "subdir")
        os.makedirs(sub_dir)
        md_file2 = os.path.join(sub_dir, "test2.md")
        with open(md_file2, 'w', encoding='utf-8') as f:
            f.write("# 子目录测试\n\n这是子目录的测试内容。")
        
        return temp_dir
    
    def test_load_documents_by_type_success(self, sample_files):
        """测试成功加载文档"""
        with patch('scripts.ingest.DirectoryLoader') as mock_loader_class:
            # 模拟加载器
            mock_loader = Mock()
            mock_loader.load.return_value = [
                Mock(page_content="测试内容1", metadata={"source": "test1.md"}),
                Mock(page_content="测试内容2", metadata={"source": "test2.md"})
            ]
            mock_loader_class.return_value = mock_loader
            
            # 模拟加载器类
            mock_loader_cls = Mock()
            
            # 调用函数
            docs = load_documents_by_type(sample_files, "**/*.md", mock_loader_cls)
            
            # 验证结果
            assert len(docs) == 2
            assert docs[0].page_content == "测试内容1"
            assert docs[1].page_content == "测试内容2"
            
            # 验证调用
            mock_loader_class.assert_called_once_with(
                sample_files,
                glob="**/*.md",
                loader_cls=mock_loader_cls,
                show_progress=True,
                use_multithreading=True
            )
    
    def test_load_documents_by_type_error(self, sample_files):
        """测试加载文档时的错误处理"""
        with patch('scripts.ingest.DirectoryLoader', side_effect=Exception("加载错误")):
            mock_loader_cls = Mock()
            
            docs = load_documents_by_type(sample_files, "**/*.md", mock_loader_cls)
            
            # 错误时应返回空列表
            assert docs == []
    
    @patch('scripts.ingest.KNOWLEDGE_BASE_PATH')
    @patch('scripts.ingest.VECTOR_STORE_PATH')
    def test_ingest_data_full_process(self, mock_vector_path, mock_kb_path, sample_files):
        """测试完整的数据摄取流程"""
        # 设置路径
        mock_kb_path = sample_files
        mock_vector_path = os.path.join(sample_files, "vector_store")
        
        # 模拟文档
        mock_docs = [
            Mock(page_content="内容1", metadata={"source": "test1.md"}),
            Mock(page_content="内容2", metadata={"source": "test2.md"})
        ]
        
        # 模拟文本分割器
        mock_chunks = [
            Mock(page_content="块1", metadata={"source": "test1.md"}),
            Mock(page_content="块2", metadata={"source": "test1.md"}),
            Mock(page_content="块3", metadata={"source": "test2.md"})
        ]
        
        with patch('scripts.ingest.load_documents_by_type') as mock_load, \
             patch('scripts.ingest.RecursiveCharacterTextSplitter') as mock_splitter_class, \
             patch('scripts.ingest.OllamaEmbeddings') as mock_embeddings_class, \
             patch('scripts.ingest.FAISS') as mock_faiss_class, \
             patch('os.makedirs') as mock_makedirs, \
             patch('os.path.exists', return_value=False):
            
            # 设置模拟返回值
            mock_load.side_effect = [mock_docs, [], [], []]  # md, pdf, docx, doc
            
            mock_splitter = Mock()
            mock_splitter.split_documents.return_value = mock_chunks
            mock_splitter_class.return_value = mock_splitter
            
            mock_embeddings = Mock()
            mock_embeddings_class.return_value = mock_embeddings
            
            mock_vector_store = Mock()
            mock_faiss_class.from_documents.return_value = mock_vector_store
            
            # 调用函数
            ingest_data()
            
            # 验证调用
            assert mock_load.call_count == 4  # md, pdf, docx, doc
            mock_splitter.split_documents.assert_called_once_with(mock_docs)
            mock_faiss_class.from_documents.assert_called_once_with(mock_chunks, mock_embeddings)
            mock_vector_store.save_local.assert_called_once()
    
    @patch('scripts.ingest.load_documents_by_type')
    def test_ingest_data_no_documents(self, mock_load):
        """测试没有找到文档的情况"""
        # 模拟没有找到任何文档
        mock_load.return_value = []
        
        with patch('builtins.print') as mock_print:
            ingest_data()
            
            # 验证打印了正确的消息
            mock_print.assert_any_call("未找到任何文档，请检查路径和文件。")
    
    def test_document_type_support(self, sample_files):
        """测试支持的文档类型"""
        supported_patterns = [
            "**/*.md",
            "**/*.pdf", 
            "**/*.docx",
            "**/*.doc"
        ]
        
        with patch('scripts.ingest.DirectoryLoader') as mock_loader_class:
            mock_loader = Mock()
            mock_loader.load.return_value = []
            mock_loader_class.return_value = mock_loader
            
            mock_loader_cls = Mock()
            
            for pattern in supported_patterns:
                docs = load_documents_by_type(sample_files, pattern, mock_loader_cls)
                assert isinstance(docs, list)
    
    @patch('scripts.ingest.os.getenv')
    def test_environment_variable_loading(self, mock_getenv):
        """测试环境变量加载"""
        mock_getenv.return_value = "test_model"
        
        # 重新导入模块以触发环境变量加载
        import importlib
        import scripts.ingest
        importlib.reload(scripts.ingest)
        
        # 验证环境变量被正确读取
        mock_getenv.assert_called_with("OLLAMA_EMBEDDING_MODEL")

if __name__ == "__main__":
    pytest.main([__file__])