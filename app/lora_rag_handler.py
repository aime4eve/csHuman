import os
import torch
from typing import Optional, Dict, Any, List
from dotenv import load_dotenv
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.runnables import Runnable
from transformers import AutoTokenizer, AutoModelForCausalLM
from peft import PeftModel
import asyncio
from concurrent.futures import ThreadPoolExecutor

# 加载环境变量
# 首先加载.env文件
load_dotenv(dotenv_path=os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env')))
# 然后加载.env.lora文件（如果存在），它会覆盖.env中的同名变量
lora_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env.lora'))
if os.path.exists(lora_env_path):
    load_dotenv(dotenv_path=lora_env_path, override=True)
    print(f"✅ 已加载LoRA环境配置: {lora_env_path}")
else:
    print(f"⚠️ LoRA环境配置文件不存在: {lora_env_path}")

# 定义常量
VECTOR_STORE_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store'))
OLLAMA_EMBEDDING_MODEL = os.getenv("OLLAMA_EMBEDDING_MODEL")
LORA_MODEL_PATH = os.getenv("LORA_MODEL_PATH", "./lora_adapters")
BASE_MODEL_NAME = os.getenv("BASE_MODEL_NAME", "Qwen/Qwen2.5-1.5B-Instruct")
CACHE_DIR = os.getenv("CACHE_DIR", None)

class LoRALangChainWrapper(Runnable):
    """
    LangChain兼容的LoRA模型包装器
    """
    
    def __init__(self, lora_model):
        super().__init__()
        self.lora_model = lora_model
    
    def invoke(self, input_text, config=None, **kwargs):
        """LangChain调用接口"""
        if hasattr(input_text, 'content'):
            # 处理消息对象
            return self.lora_model.generate(input_text.content)
        elif isinstance(input_text, str):
            return self.lora_model.generate(input_text)
        else:
            return self.lora_model.generate(str(input_text))
    
    def predict(self, text):
        """预测接口"""
        return self.lora_model.generate(text)
    
    async def ainvoke(self, input_text, config=None, **kwargs):
        """异步调用接口"""
        if hasattr(input_text, 'content'):
            return await self.lora_model.agenerate(input_text.content)
        elif isinstance(input_text, str):
            return await self.lora_model.agenerate(input_text)
        else:
            return await self.lora_model.agenerate(str(input_text))

class LoRALanguageModel:
    """
    基于LoRA微调模型的简单包装器
    """
    
    def __init__(self, 
                 base_model_name: str,
                 lora_model_path: str,
                 cache_dir: Optional[str] = None,
                 max_length: int = 2048,
                 temperature: float = 0.7,
                 device: str = "auto"):
        
        # 设置基本属性
        self.base_model_name = base_model_name
        self.lora_model_path = lora_model_path
        self.cache_dir = cache_dir
        self.max_length = max_length
        self.temperature = temperature
        self.device = device if device != "auto" else ("cuda" if torch.cuda.is_available() else "cpu")
        
        # 初始化线程池
        self.executor = ThreadPoolExecutor(max_workers=1)
        
        # 初始化模型相关属性
        self.tokenizer = None
        self.model = None
        self.base_model = None
        
        # 加载模型
        self._load_model()
        
        # 创建线程池用于异步推理
        self.executor = ThreadPoolExecutor(max_workers=1)
    
    def _load_model(self):
        """加载基础模型和LoRA适配器"""
        print(f"正在加载基础模型: {self.base_model_name}")
        
        # 加载tokenizer
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.base_model_name,
            cache_dir=self.cache_dir,
            trust_remote_code=True
        )
        
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        # 设备配置逻辑
        if self.device == "cpu":
            # 强制使用CPU
            device_map = None
            torch_dtype = torch.float32
            print("配置为CPU模式，使用CPU进行推理")
        elif self.device == "cuda":
            # 强制使用CUDA
            if torch.cuda.is_available():
                device_map = "auto"
                torch_dtype = torch.bfloat16
                print("配置为CUDA模式，使用GPU进行推理")
            else:
                print("Warning: 配置为CUDA模式但CUDA不可用，回退到CPU")
                device_map = None
                torch_dtype = torch.float32
        else:
            # auto模式：自动检测
            if torch.cuda.is_available():
                device_map = "auto"
                torch_dtype = torch.bfloat16
                print("自动检测到CUDA，使用GPU进行推理")
            else:
                device_map = None
                torch_dtype = torch.float32
                print("CUDA不可用，使用CPU进行推理")
        
        # 加载基础模型
        self.base_model = AutoModelForCausalLM.from_pretrained(
            self.base_model_name,
            cache_dir=self.cache_dir,
            trust_remote_code=True,
            torch_dtype=torch_dtype,
            device_map=device_map,
            low_cpu_mem_usage=True
        )
        
        # 检查LoRA适配器是否存在
        if os.path.exists(self.lora_model_path):
            print(f"正在加载LoRA适配器: {self.lora_model_path}")
            try:
                self.model = PeftModel.from_pretrained(
                    self.base_model,
                    self.lora_model_path,
                    torch_dtype=torch_dtype
                )
                print("✅ LoRA适配器加载成功")
            except Exception as e:
                print(f"⚠️ LoRA适配器加载失败: {e}")
                print("使用基础模型进行推理")
                self.model = self.base_model
        else:
            print(f"⚠️ LoRA适配器路径不存在: {self.lora_model_path}")
            print("使用基础模型进行推理")
            self.model = self.base_model
        
        # 设置为评估模式
        self.model.eval()
    
    def _generate_response(self, prompt: str) -> str:
        """生成响应"""
        try:
            # 编码输入
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                truncation=True,
                max_length=self.max_length - 512,  # 为输出预留空间
                padding=True
            )
            
            # 移动到正确的设备
            if self.device != "cpu" and torch.cuda.is_available():
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # 生成响应
            with torch.no_grad():
                outputs = self.model.generate(
                    **inputs,
                    max_new_tokens=512,
                    temperature=self.temperature,
                    do_sample=True if self.temperature > 0 else False,
                    pad_token_id=self.tokenizer.pad_token_id,
                    eos_token_id=self.tokenizer.eos_token_id,
                    repetition_penalty=1.1
                )
            
            # 解码响应
            response = self.tokenizer.decode(
                outputs[0][inputs['input_ids'].shape[1]:],
                skip_special_tokens=True
            )
            
            return response.strip()
            
        except Exception as e:
            print(f"生成响应时出错: {e}")
            return "抱歉，生成响应时出现错误。"
    
    def generate(self, prompt: str) -> str:
        """生成响应"""
        return self._generate_response(prompt)
    
    async def agenerate(self, prompt: str) -> str:
        """异步生成响应"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self._generate_response, prompt)
    
    def invoke(self, input_text: str) -> str:
        """调用接口，兼容LangChain"""
        return self.generate(input_text)
    
    def predict(self, text: str) -> str:
        """预测接口"""
        return self.generate(text)
    
    def generate_prompt(self, prompts, **kwargs):
        """生成提示接口"""
        if isinstance(prompts, list):
            return [self._call(prompt, **kwargs) for prompt in prompts]
        else:
            return self._call(prompts, **kwargs)
    
    async def apredict(self, text: str, **kwargs) -> str:
        """异步预测接口"""
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self._call, text)
    
    async def apredict_messages(self, messages, **kwargs) -> str:
        """异步消息预测接口"""
        if isinstance(messages, list):
            text = "\n".join([str(msg) for msg in messages])
        else:
            text = str(messages)
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, self._call, text)
    
    async def agenerate_prompt(self, prompts, **kwargs):
        """异步生成提示接口"""
        if isinstance(prompts, list):
            loop = asyncio.get_event_loop()
            tasks = [loop.run_in_executor(self.executor, self._call, prompt) for prompt in prompts]
            return await asyncio.gather(*tasks)
        else:
            loop = asyncio.get_event_loop()
            return await loop.run_in_executor(self.executor, self._call, prompts)

class LoRARAGHandler:
    """
    支持LoRA微调模型的RAG处理器
    """
    
    def __init__(self, 
                 base_model_name: str = BASE_MODEL_NAME,
                 lora_model_path: str = LORA_MODEL_PATH,
                 cache_dir: Optional[str] = CACHE_DIR,
                 use_lora: bool = True,
                 device: str = "cpu"):
        
        if not os.path.exists(VECTOR_STORE_PATH) or not os.listdir(VECTOR_STORE_PATH):
            raise ValueError(f"向量存储路径 {VECTOR_STORE_PATH} 不存在或为空。请先运行 ingest.py 脚本。")
        
        self.use_lora = use_lora
        self.base_model_name = base_model_name
        self.lora_model_path = lora_model_path
        self.cache_dir = cache_dir
        self.device = device
        
        # 初始化组件
        self._initialize_components()
    
    def _initialize_components(self):
        """初始化RAG组件"""
        print("正在初始化LoRA RAG处理器...")
        
        # 初始化嵌入模型
        self.embeddings = OllamaEmbeddings(
            model=OLLAMA_EMBEDDING_MODEL, 
            base_url="http://localhost:11434"
        )
        
        # 初始化语言模型
        if self.use_lora:
            print("使用LoRA微调模型")
            try:
                lora_model = LoRALanguageModel(
                    base_model_name=self.base_model_name,
                    lora_model_path=self.lora_model_path,
                    cache_dir=self.cache_dir,
                    temperature=0.1,  # 较低的温度以获得更一致的回答
                    device=self.device
                )
                # 创建LangChain兼容的包装器
                self.llm = LoRALangChainWrapper(lora_model)
                print(f"✅ LoRA模型初始化成功，base_model_name: {lora_model.base_model_name}")
            except Exception as e:
                print(f"❌ LoRA模型初始化失败: {e}")
                print(f"错误详情: {type(e).__name__}: {str(e)}")
                raise e
        else:
            print("使用Ollama模型")
            from langchain_ollama import ChatOllama
            self.llm = ChatOllama(
                model=os.getenv("OLLAMA_CHAT_MODEL", "qwen3:4b"),
                temperature=0,
                base_url="http://localhost:11434"
            )
        
        # 加载向量存储
        print("正在加载向量存储...")
        self.vector_store = FAISS.load_local(
            VECTOR_STORE_PATH, 
            self.embeddings, 
            allow_dangerous_deserialization=True
        )
        
        # 创建检索器
        self.retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
        
        # 创建提示模板
        self.prompt = self._create_prompt_template()
        
        # 创建检索链
        self.retrieval_chain = self._create_chain()
        
        print("✅ LoRA RAG处理器初始化完成")
    
    def _create_prompt_template(self):
        """创建针对微调模型优化的提示模板"""
        system_prompt = (
            "你是一个专业的企业知识库问答助理，经过专门的微调训练。"
            "请根据下面提供的上下文信息来准确回答用户的问题。"
            "你应该：\n"
            "1. 仔细分析上下文信息\n"
            "2. 提供准确、相关的答案\n"
            "3. 如果上下文中没有足够信息，明确说明\n"
            "4. 保持回答的专业性和简洁性\n\n"
            "上下文信息：\n{context}\n\n"
        )
        
        return ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "问题：{input}\n\n请根据上述上下文信息回答这个问题。")
        ])
    
    def _create_chain(self):
        """创建检索链"""
        question_answer_chain = create_stuff_documents_chain(self.llm, self.prompt)
        return create_retrieval_chain(self.retriever, question_answer_chain)
    
    async def get_answer(self, query: str) -> Dict[str, Any]:
        """根据用户提问，检索并生成答案"""
        try:
            response = await self.retrieval_chain.ainvoke({"input": query})
            
            return {
                "answer": response["answer"],
                "source_documents": [
                    {
                        "content": doc.page_content,
                        "metadata": doc.metadata
                    } for doc in response["context"]
                ],
                "model_info": {
                    "base_model": self.base_model_name,
                    "lora_model": self.lora_model_path if self.use_lora else None,
                    "using_lora": self.use_lora
                }
            }
        except Exception as e:
            print(f"生成答案时出错: {e}")
            return {
                "answer": "抱歉，处理您的问题时出现错误。",
                "source_documents": [],
                "error": str(e),
                "model_info": {
                    "base_model": self.base_model_name,
                    "lora_model": self.lora_model_path if self.use_lora else None,
                    "using_lora": self.use_lora
                }
            }
    
    def switch_model(self, use_lora: bool):
        """切换模型模式（LoRA或原始模型）"""
        if use_lora != self.use_lora:
            print(f"切换模型模式: {'LoRA' if use_lora else 'Ollama'}")
            self.use_lora = use_lora
            self._initialize_components()

# 创建全局实例（可选择是否使用LoRA）
def create_lora_rag_handler(use_lora: bool = True, device: Optional[str] = None) -> LoRARAGHandler:
    """创建LoRA RAG处理器实例"""
    # 如果没有指定设备，从环境变量读取
    if device is None:
        device = os.getenv("DEVICE", "cpu")  # 默认使用CPU确保兼容性
    
    # 从环境变量读取其他配置
    base_model_name = os.getenv("BASE_MODEL_NAME", BASE_MODEL_NAME)
    lora_model_path = os.getenv("LORA_MODEL_PATH", LORA_MODEL_PATH)
    cache_dir = os.getenv("CACHE_DIR", CACHE_DIR)
    
    return LoRARAGHandler(
        base_model_name=base_model_name,
        lora_model_path=lora_model_path,
        cache_dir=cache_dir,
        use_lora=use_lora,
        device=device
    )