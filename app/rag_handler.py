import os
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_ollama import ChatOllama
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate

# 加载环境变量
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))

# 定义常量
VECTOR_STORE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store'))
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL")
OLLAMA_CHAT_MODEL = os.getenv("OLLAMA_CHAT_MODEL")

class RAGHandler:
    def __init__(self):
        if not os.path.exists(VECTOR_STORE_PATH) or not os.listdir(VECTOR_STORE_PATH):
            raise ValueError(f"向量存储路径 {VECTOR_STORE_PATH} 不存在或为空。请先运行 ingest.py 脚本。")

        self.embeddings = OllamaEmbeddings(model=OLLAMA_EMBEDDING_MODEL, base_url="http://localhost:11434")
        self.llm = ChatOllama(model=OLLAMA_CHAT_MODEL, temperature=0, base_url="http://localhost:11434")
        self.vector_store = FAISS.load_local(VECTOR_STORE_PATH, self.embeddings, allow_dangerous_deserialization=True)
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        self.prompt = self._create_prompt_template()
        self.retrieval_chain = self._create_chain()

    def _create_prompt_template(self):
        """创建并返回一个聊天提示模板。"""
        system_prompt = (
            "你是一个专业的企业知识库问答助理。"
            "请根据下面提供的上下文信息来回答用户的问题。"
            "如果你在上下文中找不到答案，请明确说明你不知道，不要试图编造答案。"
            "请保持回答的简洁和相关性。"
            "\n\n"
            "{context}"
        )
        return ChatPromptTemplate.from_messages(
            [("system", system_prompt), ("human", "{input}")]
        )

    def _create_chain(self):
        """创建并返回一个检索链。"""
        question_answer_chain = create_stuff_documents_chain(self.llm, self.prompt)
        return create_retrieval_chain(self.retriever, question_answer_chain)

    async def get_answer(self, query: str):
        """根据用户提问，检索并生成答案。"""
        response = await self.retrieval_chain.ainvoke({"input": query})
        return {
            "answer": response["answer"],
            "source_documents": [
                {
                    "content": doc.page_content,
                    "metadata": doc.metadata
                } for doc in response["context"]
            ]
        }

# 在模块加载时创建单例
rag_handler_instance = RAGHandler()