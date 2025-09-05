import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel
from app.rag_handler import rag_handler_instance

# 创建FastAPI应用
app = FastAPI(
    title="HKT RAG API",
    description="一个基于知识库的智能问答系统API",
    version="1.0.0"
)

# 定义请求体模型
class QueryRequest(BaseModel):
    query: str

# 定义API端点
@app.post("/ask",
          summary="向RAG系统提问",
          response_description="包含答案和来源文档的响应")
async def ask_question(request: QueryRequest):
    """
    接收用户的问题，并返回由RAG系统生成的答案。
    """
    response = await rag_handler_instance.get_answer(request.query)
    return response

# 启动服务器
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)