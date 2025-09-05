import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.lora_rag_handler import create_lora_rag_handler

# 创建FastAPI应用
app = FastAPI(
    title="HKT LoRA RAG API",
    description="基于LoRA微调模型的智能问答系统API",
    version="2.0.0"
)

# 全局变量存储RAG处理器
rag_handler = None

# 定义请求体模型
class QueryRequest(BaseModel):
    query: str
    use_lora: Optional[bool] = True

class ModelSwitchRequest(BaseModel):
    use_lora: bool

class ConfigRequest(BaseModel):
    base_model_name: Optional[str] = None
    lora_model_path: Optional[str] = None
    cache_dir: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    """应用启动时初始化RAG处理器"""
    global rag_handler
    try:
        # 从环境变量读取是否默认使用LoRA
        use_lora_default = os.getenv("USE_LORA_DEFAULT", "true").lower() == "true"
        lora_path = os.getenv("LORA_MODEL_PATH", "./lora_adapters")
        
        # 如果配置要使用LoRA但适配器不存在，则回退到不使用LoRA
        if use_lora_default and not os.path.exists(lora_path):
            print(f"⚠️ 配置要求使用LoRA，但适配器路径 {lora_path} 不存在，将使用原始模型")
            use_lora_default = False
        
        print(f"正在初始化RAG系统...")
        print(f"LoRA适配器路径: {lora_path}")
        print(f"默认使用LoRA: {use_lora_default}")
        
        rag_handler = create_lora_rag_handler(use_lora=use_lora_default)
        print("✅ RAG系统初始化完成")
        
    except Exception as e:
        print(f"❌ RAG系统初始化失败: {e}")
        # 如果LoRA初始化失败，尝试使用原始模型
        try:
            print("尝试使用原始Ollama模型...")
            rag_handler = create_lora_rag_handler(use_lora=False)
            print("✅ 使用原始模型初始化成功")
        except Exception as e2:
            print(f"❌ 原始模型初始化也失败: {e2}")
            rag_handler = None

@app.get("/", summary="API根路径")
async def root():
    """API根路径，返回系统状态"""
    global rag_handler
    
    if rag_handler is None:
        return {
            "message": "HKT LoRA RAG API",
            "status": "error",
            "error": "RAG系统未正确初始化"
        }
    
    return {
        "message": "HKT LoRA RAG API",
        "status": "ready",
        "model_info": {
            "base_model": rag_handler.base_model_name,
            "lora_model": rag_handler.lora_model_path if rag_handler.use_lora else None,
            "using_lora": rag_handler.use_lora,
            "cache_dir": rag_handler.cache_dir
        }
    }

@app.post("/ask",
          summary="向RAG系统提问",
          response_description="包含答案和来源文档的响应")
async def ask_question(request: QueryRequest):
    """
    接收用户的问题，并返回由RAG系统生成的答案。
    可以选择是否使用LoRA微调模型。
    """
    global rag_handler
    
    if rag_handler is None:
        raise HTTPException(status_code=500, detail="RAG系统未正确初始化")
    
    try:
        # 如果请求的模型模式与当前不同，切换模型
        if request.use_lora != rag_handler.use_lora:
            print(f"切换模型模式: {'LoRA' if request.use_lora else 'Ollama'}")
            rag_handler.switch_model(request.use_lora)
        
        # 生成回答
        response = await rag_handler.get_answer(request.query)
        return response
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"处理问题时出错: {str(e)}")

@app.post("/switch_model",
          summary="切换模型模式",
          response_description="切换结果")
async def switch_model(request: ModelSwitchRequest):
    """
    切换使用LoRA微调模型或原始模型
    """
    global rag_handler
    
    if rag_handler is None:
        raise HTTPException(status_code=500, detail="RAG系统未正确初始化")
    
    try:
        old_mode = rag_handler.use_lora
        rag_handler.switch_model(request.use_lora)
        
        return {
            "message": "模型切换成功",
            "old_mode": "LoRA" if old_mode else "Ollama",
            "new_mode": "LoRA" if request.use_lora else "Ollama",
            "model_info": {
                "base_model": rag_handler.base_model_name,
                "lora_model": rag_handler.lora_model_path if rag_handler.use_lora else None,
                "using_lora": rag_handler.use_lora
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"切换模型时出错: {str(e)}")

@app.get("/model_info",
         summary="获取模型信息",
         response_description="当前模型配置信息")
async def get_model_info():
    """
    获取当前模型的配置信息
    """
    global rag_handler
    
    if rag_handler is None:
        raise HTTPException(status_code=500, detail="RAG系统未正确初始化")
    
    lora_exists = os.path.exists(rag_handler.lora_model_path)
    
    return {
        "base_model": rag_handler.base_model_name,
        "lora_model_path": rag_handler.lora_model_path,
        "lora_exists": lora_exists,
        "using_lora": rag_handler.use_lora,
        "cache_dir": rag_handler.cache_dir,
        "vector_store_path": os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store')),
        "embedding_model": os.getenv("OLLAMA_EMBEDDING_MODEL")
    }

@app.get("/health",
         summary="健康检查",
         response_description="系统健康状态")
async def health_check():
    """
    检查系统各组件的健康状态
    """
    global rag_handler
    
    health_status = {
        "status": "healthy",
        "components": {
            "rag_handler": rag_handler is not None,
            "vector_store": False,
            "lora_model": False,
            "ollama_service": False
        },
        "details": {}
    }
    
    # 检查向量存储
    vector_store_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'vector_store'))
    health_status["components"]["vector_store"] = os.path.exists(vector_store_path) and os.listdir(vector_store_path)
    
    # 检查LoRA模型
    if rag_handler:
        health_status["components"]["lora_model"] = os.path.exists(rag_handler.lora_model_path)
        health_status["details"]["model_info"] = {
            "base_model": rag_handler.base_model_name,
            "using_lora": rag_handler.use_lora
        }
    
    # 检查Ollama服务（简单检查）
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        health_status["components"]["ollama_service"] = response.status_code == 200
    except:
        health_status["components"]["ollama_service"] = False
    
    # 判断整体状态
    if not all(health_status["components"].values()):
        health_status["status"] = "degraded"
    
    return health_status

# 启动服务器
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8001)  # 使用不同端口避免冲突