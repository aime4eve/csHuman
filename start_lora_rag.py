#!/usr/bin/env python3
"""
LoRA RAG 系统启动脚本

此脚本用于启动集成了LoRA微调模型的RAG系统。
支持自动检测LoRA模型、配置验证和服务启动。

使用方法:
    python start_lora_rag.py [选项]

选项:
    --port PORT         指定API服务端口 (默认: 8001)
    --host HOST         指定API服务主机 (默认: 127.0.0.1)
    --use-lora BOOL     是否使用LoRA模型 (默认: auto)
    --config-check      仅检查配置，不启动服务
    --verbose           启用详细日志输出
"""

import os
import sys
import argparse
import uvicorn
from pathlib import Path
from dotenv import load_dotenv

def check_environment():
    """检查环境配置"""
    print("🔍 检查环境配置...")
    
    # 检查.env文件
    env_files = [".env", ".env.lora"]
    env_loaded = False
    
    for env_file in env_files:
        if os.path.exists(env_file):
            load_dotenv(env_file)
            print(f"✅ 加载环境配置: {env_file}")
            env_loaded = True
            break
    
    if not env_loaded:
        print("⚠️  未找到环境配置文件，使用默认配置")
        print("   建议复制 .env.lora 为 .env 并根据需要修改配置")
    
    return env_loaded

def check_lora_model():
    """检查LoRA模型"""
    print("\n🔍 检查LoRA模型...")
    
    lora_path = os.getenv("LORA_MODEL_PATH", "./lora_adapters")
    lora_path = Path(lora_path)
    
    if lora_path.exists():
        # 检查是否包含必要的文件
        required_files = ["adapter_config.json", "adapter_model.safetensors"]
        missing_files = []
        
        for file in required_files:
            if not (lora_path / file).exists():
                missing_files.append(file)
        
        if missing_files:
            print(f"⚠️  LoRA模型目录存在但缺少文件: {missing_files}")
            print(f"   路径: {lora_path.absolute()}")
            return False
        else:
            print(f"✅ LoRA模型检查通过: {lora_path.absolute()}")
            return True
    else:
        print(f"❌ LoRA模型不存在: {lora_path.absolute()}")
        print("   将使用Ollama模型作为备用")
        return False

def check_base_model():
    """检查基础模型配置"""
    print("\n🔍 检查基础模型配置...")
    
    base_model = os.getenv("BASE_MODEL_NAME", "Qwen/Qwen2.5-1.5B-Instruct")
    cache_dir = os.getenv("CACHE_DIR")
    
    print(f"📦 基础模型: {base_model}")
    
    if cache_dir:
        cache_path = Path(cache_dir)
        if cache_path.exists():
            print(f"✅ 缓存目录: {cache_path.absolute()}")
        else:
            print(f"⚠️  缓存目录不存在，将自动创建: {cache_path.absolute()}")
    else:
        print("📁 使用默认HuggingFace缓存目录")
    
    return True

def check_vector_store():
    """检查向量存储"""
    print("\n🔍 检查向量存储...")
    
    vector_store_path = Path("./vector_store")
    
    if vector_store_path.exists() and any(vector_store_path.iterdir()):
        print(f"✅ 向量存储已就绪: {vector_store_path.absolute()}")
        return True
    else:
        print(f"⚠️  向量存储为空或不存在: {vector_store_path.absolute()}")
        print("   请确保已经构建了知识库向量索引")
        return False

def check_ollama_service():
    """检查Ollama服务"""
    print("\n🔍 检查Ollama服务...")
    
    try:
        import requests
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code == 200:
            models = response.json().get("models", [])
            print(f"✅ Ollama服务运行正常，可用模型数量: {len(models)}")
            
            # 检查配置的模型是否存在
            embedding_model = os.getenv("OLLAMA_EMBEDDING_MODEL")
            chat_model = os.getenv("OLLAMA_CHAT_MODEL")
            
            model_names = [model.get("name", "") for model in models]
            
            if embedding_model and embedding_model in model_names:
                print(f"✅ 嵌入模型已安装: {embedding_model}")
            elif embedding_model:
                print(f"⚠️  嵌入模型未安装: {embedding_model}")
            
            if chat_model and chat_model in model_names:
                print(f"✅ 聊天模型已安装: {chat_model}")
            elif chat_model:
                print(f"⚠️  聊天模型未安装: {chat_model}")
            
            return True
        else:
            print(f"❌ Ollama服务响应异常: {response.status_code}")
            return False
    except ImportError:
        print("⚠️  requests库未安装，无法检查Ollama服务")
        return False
    except Exception as e:
        print(f"❌ 无法连接Ollama服务: {e}")
        print("   请确保Ollama服务正在运行 (http://localhost:11434)")
        return False

def check_dependencies():
    """检查Python依赖"""
    print("\n🔍 检查Python依赖...")
    
    required_packages = [
        "fastapi", "uvicorn", "transformers", "torch", 
        "langchain", "langchain_community", "langchain_ollama",
        "peft", "accelerate", "python-dotenv"
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package)
            print(f"✅ {package}")
        except ImportError:
            missing_packages.append(package)
            print(f"❌ {package}")
    
    if missing_packages:
        print(f"\n⚠️  缺少依赖包: {', '.join(missing_packages)}")
        print("   请运行: pip install " + " ".join(missing_packages))
        return False
    
    return True

def run_config_check():
    """运行完整的配置检查"""
    print("🚀 LoRA RAG 系统配置检查\n")
    
    checks = [
        ("环境配置", check_environment),
        ("Python依赖", check_dependencies),
        ("LoRA模型", check_lora_model),
        ("基础模型", check_base_model),
        ("向量存储", check_vector_store),
        ("Ollama服务", check_ollama_service)
    ]
    
    results = {}
    
    for name, check_func in checks:
        try:
            results[name] = check_func()
        except Exception as e:
            print(f"❌ {name}检查失败: {e}")
            results[name] = False
    
    print("\n" + "="*50)
    print("📋 配置检查总结:")
    
    for name, result in results.items():
        status = "✅ 通过" if result else "❌ 失败"
        print(f"   {name}: {status}")
    
    all_passed = all(results.values())
    
    if all_passed:
        print("\n🎉 所有检查通过，系统已准备就绪！")
    else:
        print("\n⚠️  部分检查未通过，系统可能无法正常运行")
        print("   请根据上述提示解决问题后重试")
    
    return all_passed

def start_server(host="127.0.0.1", port=8001, use_lora=None, verbose=False):
    """启动LoRA RAG服务器"""
    print(f"\n🚀 启动LoRA RAG服务器...")
    print(f"   主机: {host}")
    print(f"   端口: {port}")
    
    if use_lora is not None:
        os.environ["USE_LORA_DEFAULT"] = str(use_lora).lower()
        print(f"   LoRA模式: {'启用' if use_lora else '禁用'}")
    
    if verbose:
        os.environ["LOG_LEVEL"] = "DEBUG"
        os.environ["VERBOSE"] = "true"
    
    try:
        # 导入应用
        from app.lora_main import app
        
        # 启动服务器
        uvicorn.run(
            app,
            host=host,
            port=port,
            log_level="debug" if verbose else "info"
        )
    except ImportError as e:
        print(f"❌ 导入应用失败: {e}")
        print("   请确保在正确的目录中运行此脚本")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 启动服务器失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="LoRA RAG 系统启动脚本",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  python start_lora_rag.py                    # 使用默认配置启动
  python start_lora_rag.py --port 8002       # 指定端口启动
  python start_lora_rag.py --config-check    # 仅检查配置
  python start_lora_rag.py --use-lora false  # 禁用LoRA模型
        """
    )
    
    parser.add_argument(
        "--port", 
        type=int, 
        default=8001,
        help="API服务端口 (默认: 8001)"
    )
    
    parser.add_argument(
        "--host", 
        type=str, 
        default="127.0.0.1",
        help="API服务主机 (默认: 127.0.0.1)"
    )
    
    parser.add_argument(
        "--use-lora", 
        type=str, 
        choices=["true", "false", "auto"],
        default="auto",
        help="是否使用LoRA模型 (默认: auto)"
    )
    
    parser.add_argument(
        "--config-check", 
        action="store_true",
        help="仅检查配置，不启动服务"
    )
    
    parser.add_argument(
        "--verbose", 
        action="store_true",
        help="启用详细日志输出"
    )
    
    args = parser.parse_args()
    
    # 检查配置
    config_ok = run_config_check()
    
    if args.config_check:
        sys.exit(0 if config_ok else 1)
    
    if not config_ok:
        print("\n⚠️  配置检查未完全通过，是否继续启动服务？ (y/N): ", end="")
        response = input().strip().lower()
        if response not in ["y", "yes"]:
            print("已取消启动")
            sys.exit(1)
    
    # 处理use_lora参数
    use_lora = None
    if args.use_lora == "true":
        use_lora = True
    elif args.use_lora == "false":
        use_lora = False
    # auto模式下use_lora保持None，由系统自动决定
    
    # 启动服务器
    start_server(
        host=args.host,
        port=args.port,
        use_lora=use_lora,
        verbose=args.verbose
    )

if __name__ == "__main__":
    main()