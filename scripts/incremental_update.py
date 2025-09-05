#!/usr/bin/env python3
"""
增量知识库更新脚本
实现智能的文档变更检测和向量存储增量更新
"""

import os
import json
import hashlib
import time
from datetime import datetime
from typing import Dict, List, Set, Tuple
from pathlib import Path

from dotenv import load_dotenv
from langchain_community.document_loaders import (
    DirectoryLoader, 
    UnstructuredMarkdownLoader,
    PyPDFLoader,
    UnstructuredWordDocumentLoader
)
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS

# 加载环境变量
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

# 定义常量
KNOWLEDGE_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'notes'))
VECTOR_STORE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store'))
METADATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'update_metadata.json'))
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL")

class IncrementalUpdater:
    """增量更新器"""
    
    def __init__(self):
        self.knowledge_base_path = KNOWLEDGE_BASE_PATH
        self.vector_store_path = VECTOR_STORE_PATH
        self.metadata_path = METADATA_PATH
        self.embeddings = OllamaEmbeddings(model=OLLAMA_EMBEDDING_MODEL)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            add_start_index=True
        )
        
        # 支持的文件类型和对应的加载器
        self.file_loaders = {
            '.md': UnstructuredMarkdownLoader,
            '.pdf': PyPDFLoader,
            '.docx': UnstructuredWordDocumentLoader,
            '.doc': UnstructuredWordDocumentLoader
        }
    
    def load_metadata(self) -> Dict:
        """加载元数据"""
        if os.path.exists(self.metadata_path):
            with open(self.metadata_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'last_update': None,
            'file_hashes': {},
            'total_documents': 0,
            'total_chunks': 0
        }
    
    def save_metadata(self, metadata: Dict):
        """保存元数据"""
        with open(self.metadata_path, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, indent=2, ensure_ascii=False)
    
    def calculate_file_hash(self, file_path: str) -> str:
        """计算文件哈希值"""
        hash_md5 = hashlib.md5()
        try:
            with open(file_path, "rb") as f:
                for chunk in iter(lambda: f.read(4096), b""):
                    hash_md5.update(chunk)
            return hash_md5.hexdigest()
        except Exception as e:
            print(f"计算文件哈希失败 {file_path}: {e}")
            return ""
    
    def scan_documents(self) -> Dict[str, Dict]:
        """扫描文档目录，返回文件信息"""
        file_info = {}
        
        for root, dirs, files in os.walk(self.knowledge_base_path):
            for file in files:
                file_path = os.path.join(root, file)
                file_ext = os.path.splitext(file)[1].lower()
                
                if file_ext in self.file_loaders:
                    rel_path = os.path.relpath(file_path, self.knowledge_base_path)
                    file_hash = self.calculate_file_hash(file_path)
                    file_stat = os.stat(file_path)
                    
                    file_info[rel_path] = {
                        'hash': file_hash,
                        'size': file_stat.st_size,
                        'mtime': file_stat.st_mtime,
                        'extension': file_ext,
                        'full_path': file_path
                    }
        
        return file_info
    
    def detect_changes(self, current_files: Dict, metadata: Dict) -> Tuple[Set[str], Set[str], Set[str]]:
        """检测文件变更"""
        old_hashes = metadata.get('file_hashes', {})
        
        # 新增文件
        added_files = set(current_files.keys()) - set(old_hashes.keys())
        
        # 删除文件
        deleted_files = set(old_hashes.keys()) - set(current_files.keys())
        
        # 修改文件
        modified_files = set()
        for file_path in set(current_files.keys()) & set(old_hashes.keys()):
            if current_files[file_path]['hash'] != old_hashes[file_path]['hash']:
                modified_files.add(file_path)
        
        return added_files, modified_files, deleted_files
    
    def load_document(self, file_path: str, file_ext: str) -> List:
        """加载单个文档"""
        try:
            loader_class = self.file_loaders[file_ext]
            loader = loader_class(file_path)
            return loader.load()
        except Exception as e:
            print(f"加载文档失败 {file_path}: {e}")
            return []
    
    def process_documents(self, file_paths: List[str], current_files: Dict) -> List:
        """处理文档列表"""
        all_documents = []
        
        for rel_path in file_paths:
            file_info = current_files[rel_path]
            full_path = file_info['full_path']
            file_ext = file_info['extension']
            
            print(f"处理文档: {rel_path}")
            documents = self.load_document(full_path, file_ext)
            
            # 为文档添加元数据
            for doc in documents:
                doc.metadata.update({
                    'file_path': rel_path,
                    'file_hash': file_info['hash'],
                    'file_size': file_info['size'],
                    'last_modified': file_info['mtime']
                })
            
            all_documents.extend(documents)
        
        return all_documents
    
    def load_existing_vector_store(self):
        """加载现有向量存储"""
        try:
            if os.path.exists(self.vector_store_path):
                return FAISS.load_local(self.vector_store_path, self.embeddings)
            return None
        except Exception as e:
            print(f"加载向量存储失败: {e}")
            return None
    
    def remove_documents_from_vector_store(self, vector_store, file_paths: Set[str]):
        """从向量存储中删除文档（模拟实现）"""
        # 注意：FAISS不直接支持删除，这里提供一个概念性实现
        # 实际应用中可能需要重建向量存储或使用支持删除的向量数据库
        print(f"需要删除的文档: {file_paths}")
        print("警告: FAISS不支持直接删除，建议使用支持删除操作的向量数据库")
        return vector_store
    
    def update_vector_store(self, vector_store, new_chunks: List, operation: str = "add"):
        """更新向量存储"""
        if not new_chunks:
            return vector_store
        
        try:
            if vector_store is None:
                # 创建新的向量存储
                print("创建新的向量存储...")
                return FAISS.from_documents(new_chunks, self.embeddings)
            else:
                # 添加新文档到现有向量存储
                print(f"向现有向量存储添加 {len(new_chunks)} 个文档块...")
                new_vector_store = FAISS.from_documents(new_chunks, self.embeddings)
                vector_store.merge_from(new_vector_store)
                return vector_store
        except Exception as e:
            print(f"更新向量存储失败: {e}")
            return vector_store
    
    def incremental_update(self, force_rebuild: bool = False) -> Dict:
        """执行增量更新"""
        start_time = time.time()
        print("开始增量更新...")
        
        # 加载元数据
        metadata = self.load_metadata()
        
        # 扫描当前文档
        print("扫描文档目录...")
        current_files = self.scan_documents()
        print(f"发现 {len(current_files)} 个支持的文档")
        
        if force_rebuild:
            print("强制重建向量存储...")
            added_files = set(current_files.keys())
            modified_files = set()
            deleted_files = set()
        else:
            # 检测变更
            added_files, modified_files, deleted_files = self.detect_changes(current_files, metadata)
        
        print(f"变更统计: 新增 {len(added_files)}, 修改 {len(modified_files)}, 删除 {len(deleted_files)}")
        
        # 如果没有变更，直接返回
        if not added_files and not modified_files and not deleted_files and not force_rebuild:
            print("没有检测到文档变更，跳过更新")
            return {
                'status': 'no_changes',
                'duration': time.time() - start_time,
                'changes': {
                    'added': 0,
                    'modified': 0,
                    'deleted': 0
                }
            }
        
        # 加载现有向量存储
        vector_store = None if force_rebuild else self.load_existing_vector_store()
        
        # 处理删除的文件
        if deleted_files:
            vector_store = self.remove_documents_from_vector_store(vector_store, deleted_files)
        
        # 处理新增和修改的文件
        changed_files = list(added_files | modified_files)
        if changed_files:
            print(f"处理 {len(changed_files)} 个变更文档...")
            documents = self.process_documents(changed_files, current_files)
            
            if documents:
                print(f"分割 {len(documents)} 个文档...")
                chunks = self.text_splitter.split_documents(documents)
                print(f"生成 {len(chunks)} 个文档块")
                
                # 更新向量存储
                vector_store = self.update_vector_store(vector_store, chunks)
        
        # 保存向量存储
        if vector_store:
            print("保存向量存储...")
            if not os.path.exists(self.vector_store_path):
                os.makedirs(self.vector_store_path)
            vector_store.save_local(self.vector_store_path)
        
        # 更新元数据
        new_metadata = {
            'last_update': datetime.now().isoformat(),
            'file_hashes': {path: info['hash'] for path, info in current_files.items()},
            'total_documents': len(current_files),
            'total_chunks': len(chunks) if 'chunks' in locals() else metadata.get('total_chunks', 0)
        }
        self.save_metadata(new_metadata)
        
        duration = time.time() - start_time
        print(f"增量更新完成，耗时 {duration:.2f} 秒")
        
        return {
            'status': 'success',
            'duration': duration,
            'changes': {
                'added': len(added_files),
                'modified': len(modified_files),
                'deleted': len(deleted_files)
            },
            'total_documents': len(current_files)
        }

def main():
    """主函数"""
    import argparse
    
    parser = argparse.ArgumentParser(description='增量更新知识库向量存储')
    parser.add_argument('--force-rebuild', action='store_true', help='强制重建整个向量存储')
    parser.add_argument('--verbose', '-v', action='store_true', help='详细输出')
    
    args = parser.parse_args()
    
    updater = IncrementalUpdater()
    
    try:
        result = updater.incremental_update(force_rebuild=args.force_rebuild)
        
        if args.verbose:
            print("\n更新结果:")
            print(json.dumps(result, indent=2, ensure_ascii=False))
        
        if result['status'] == 'success':
            print(f"\n✅ 更新成功! 处理了 {result['changes']['added'] + result['changes']['modified']} 个文档")
        elif result['status'] == 'no_changes':
            print("\n✅ 知识库已是最新状态")
        
    except Exception as e:
        print(f"\n❌ 更新失败: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    exit(main())