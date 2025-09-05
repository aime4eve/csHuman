import os
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
KNOWLEDGE_BASE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'notes', '智能体项目', '知识库智能体', '智能问答', '产品知识库'))
VECTOR_STORE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store'))
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL")

def load_documents_by_type(path: str, file_pattern: str, loader_cls):
    """按文件类型加载文档"""
    try:
        loader = DirectoryLoader(
            path,
            glob=file_pattern,
            loader_cls=loader_cls,
            show_progress=True,
            use_multithreading=True
        )
        return loader.load()
    except Exception as e:
        print(f"加载 {file_pattern} 文件时出错: {e}")
        return []

def ingest_data():
    """
    加载、处理知识库文档，并创建向量存储。
    支持Markdown、PDF和Word文档。
    """
    print(f"正在从 {KNOWLEDGE_BASE_PATH} 加载文档...")

    # 加载不同类型的文档
    all_documents = []
    
    # 加载Markdown文件
    print("加载Markdown文件...")
    md_docs = load_documents_by_type(KNOWLEDGE_BASE_PATH, "**/*.md", UnstructuredMarkdownLoader)
    all_documents.extend(md_docs)
    print(f"已加载 {len(md_docs)} 个Markdown文档")
    
    # 加载PDF文件
    print("加载PDF文件...")
    pdf_docs = load_documents_by_type(KNOWLEDGE_BASE_PATH, "**/*.pdf", PyPDFLoader)
    all_documents.extend(pdf_docs)
    print(f"已加载 {len(pdf_docs)} 个PDF文档")
    
    # 加载Word文档
    print("加载Word文档...")
    docx_docs = load_documents_by_type(KNOWLEDGE_BASE_PATH, "**/*.docx", UnstructuredWordDocumentLoader)
    all_documents.extend(docx_docs)
    print(f"已加载 {len(docx_docs)} 个Word文档")
    
    # 也支持.doc文件
    doc_docs = load_documents_by_type(KNOWLEDGE_BASE_PATH, "**/*.doc", UnstructuredWordDocumentLoader)
    all_documents.extend(doc_docs)
    print(f"已加载 {len(doc_docs)} 个Word(.doc)文档")
    
    documents = all_documents
    if not documents:
        print("未找到任何文档，请检查路径和文件。")
        return

    print(f"已加载 {len(documents)} 篇文档。")

    # 分割文档
    print("正在分割文档...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200,
        add_start_index=True
    )
    chunks = text_splitter.split_documents(documents)
    print(f"文档已分割成 {len(chunks)} 个片段。")

    # 创建嵌入
    print(f"正在使用Ollama模型 '{OLLAMA_EMBEDDING_MODEL}' 创建文本嵌入...")
    embeddings = OllamaEmbeddings(model=OLLAMA_EMBEDDING_MODEL)

    # 创建并保存FAISS向量存储
    print("正在创建并保存FAISS向量存储...")
    if not os.path.exists(VECTOR_STORE_PATH):
        os.makedirs(VECTOR_STORE_PATH)
        
    vector_store = FAISS.from_documents(chunks, embeddings)
    vector_store.save_local(VECTOR_STORE_PATH)
    
    print(f"向量存储已成功创建并保存至 {VECTOR_STORE_PATH}")

if __name__ == "__main__":
    ingest_data()