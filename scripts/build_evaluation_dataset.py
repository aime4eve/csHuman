#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
构建RAG系统评估数据集

根据知识库内容生成高质量的"问题-标准答案"对，用于评估RAG系统的性能。
评估集将包含不同类型的问题：事实性问题、概念解释、对比分析等。

作者: AI Assistant
创建时间: 2025-08-12
"""

import os
import json
import random
from pathlib import Path
from typing import List, Dict, Any

# 配置参数
KNOWLEDGE_BASE_PATH = r"E:\knowledge\notes\智能体项目\知识库智能体\智能问答\产品知识库"
OUTPUT_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation_dataset.json'))
TARGET_QUESTIONS = 80  # 目标生成80个评估问题

def load_markdown_files() -> List[Dict[str, Any]]:
    """加载所有Markdown文件"""
    documents = []
    
    if not os.path.exists(KNOWLEDGE_BASE_PATH):
        print(f"知识库路径不存在: {KNOWLEDGE_BASE_PATH}")
        return documents
    
    for root, dirs, files in os.walk(KNOWLEDGE_BASE_PATH):
        for file in files:
            if file.endswith('.md'):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # 提取文档信息
                    relative_path = os.path.relpath(file_path, KNOWLEDGE_BASE_PATH)
                    documents.append({
                        'file_path': file_path,
                        'relative_path': relative_path,
                        'filename': file,
                        'content': content
                    })
                    
                except Exception as e:
                    print(f"读取文件失败 {file_path}: {e}")
    
    print(f"成功加载 {len(documents)} 个文档")
    return documents

def extract_sections(content: str) -> List[Dict[str, str]]:
    """从文档内容中提取章节"""
    sections = []
    lines = content.split('\n')
    current_section = {'title': '', 'content': ''}
    
    for line in lines:
        line = line.strip()
        
        # 检测标题（# ## ### 等）
        if line.startswith('#'):
            # 保存上一个章节
            if current_section['content'].strip():
                sections.append(current_section.copy())
            
            # 开始新章节
            current_section = {
                'title': line.lstrip('#').strip(),
                'content': ''
            }
        else:
            if line:
                current_section['content'] += line + '\n'
    
    # 添加最后一个章节
    if current_section['content'].strip():
        sections.append(current_section)
    
    return sections

def generate_evaluation_questions() -> List[Dict[str, Any]]:
    """生成评估问题集"""
    evaluation_set = []
    
    # 预定义的问题模板
    question_templates = {
        'factual': [
            "什么是{concept}？",
            "{concept}的定义是什么？",
            "请解释{concept}的含义。",
            "{concept}包括哪些内容？",
            "请介绍一下{concept}。"
        ],
        'functional': [
            "{system}有哪些主要功能？",
            "{system}的核心特性是什么？",
            "{system}能够实现什么功能？",
            "请列举{system}的主要特点。",
            "{system}的优势有哪些？"
        ],
        'process': [
            "如何实施{process}？",
            "{process}的步骤是什么？",
            "请描述{process}的流程。",
            "实现{process}需要哪些步骤？",
            "{process}的具体方法是什么？"
        ],
        'comparison': [
            "{concept1}和{concept2}有什么区别？",
            "请比较{concept1}与{concept2}。",
            "{concept1}相比{concept2}有什么优势？",
            "{concept1}和{concept2}的差异在哪里？"
        ],
        'application': [
            "{technology}在{domain}中如何应用？",
            "{concept}的应用场景有哪些？",
            "在{context}中，{technology}起到什么作用？",
            "{solution}适用于哪些场景？"
        ]
    }
    
    # 基于知识库内容的具体问题
    specific_questions = [
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '什么是智能体系统？'
                },
                {
                    'role': 'assistant',
                    'content': '智能体系统是一种能够感知环境、做出决策并执行行动的自主系统。在华宽通的设计中，智能体系统具备多业态支持、模块化架构、可扩展性等特点，能够为不同行业提供定制化的智能服务解决方案。'
                }
            ],
            'category': 'factual',
            'difficulty': 'basic',
            'source_document': '华宽通智能体顶层设计与务实落地策略.md'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '企业级知识库的主要功能有哪些？'
                },
                {
                    'role': 'assistant',
                    'content': '企业级知识库的主要功能包括：1）知识存储与管理：结构化存储企业文档、流程、经验等；2）智能检索：支持语义搜索和精确匹配；3）知识推荐：基于用户需求主动推送相关知识；4）协作共享：支持团队知识协作和经验分享；5）版本控制：管理知识的更新和历史版本；6）权限管理：控制不同用户的访问权限。'
                }
            ],
            'category': 'functional',
            'difficulty': 'intermediate',
            'source_document': '企业级知识库设计.md'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '如何实施LoRA模型微调？'
                },
                {
                    'role': 'assistant',
                    'content': 'LoRA模型微调的实施步骤包括：1）数据准备：构建高质量的指令-知识-答案格式训练数据；2）环境配置：安装transformers、peft、trl等必要库；3）模型配置：设置LoRA参数如rank、alpha、target_modules等；4）训练执行：使用QLoRA技术进行参数高效微调；5）模型评估：验证微调效果和性能提升；6）部署集成：将训练好的适配器集成到RAG系统中。'
                }
            ],
            'category': 'process',
            'difficulty': 'advanced',
            'source_document': 'LoRA微调相关文档'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '华宽通智能体的设计理念是什么？'
                },
                {
                    'role': 'assistant',
                    'content': '华宽通智能体的设计理念基于"务实落地"的原则，强调：1）多业态支持：能够适应不同行业和业务场景；2）模块化架构：采用微服务架构，支持灵活组合和扩展；3）渐进式实施：从MVP开始，逐步完善功能；4）用户体验优先：注重界面友好性和操作便捷性；5）技术与业务融合：确保技术方案能够解决实际业务问题。'
                }
            ],
            'category': 'factual',
            'difficulty': 'intermediate',
            'source_document': '华宽通智能体顶层设计与务实落地策略.md'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': 'RAG系统与传统搜索引擎有什么区别？'
                },
                {
                    'role': 'assistant',
                    'content': 'RAG系统与传统搜索引擎的主要区别在于：1）检索方式：RAG使用语义向量检索，传统搜索主要基于关键词匹配；2）答案生成：RAG能够基于检索到的内容生成自然语言答案，传统搜索只返回相关文档链接；3）理解能力：RAG具备上下文理解和推理能力，能够处理复杂查询；4）个性化：RAG可以根据用户意图提供定制化回答；5）知识整合：RAG能够整合多个文档的信息形成综合答案。'
                }
            ],
            'category': 'comparison',
            'difficulty': 'intermediate',
            'source_document': 'RAG系统设计文档'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '向量数据库在RAG系统中起到什么作用？'
                },
                {
                    'role': 'assistant',
                    'content': '向量数据库在RAG系统中起到关键作用：1）向量存储：存储文档的向量化表示（embeddings）；2）相似性检索：基于向量相似度快速找到相关文档；3）高效索引：支持大规模向量的快速检索；4）语义匹配：实现基于语义而非关键词的文档匹配；5）扩展性：支持知识库的动态更新和扩展。常用的向量数据库包括Chroma、Pinecone、Weaviate等。'
                }
            ],
            'category': 'application',
            'difficulty': 'intermediate',
            'source_document': 'RAG系统技术文档'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '智能客服系统的核心组件有哪些？'
                },
                {
                    'role': 'assistant',
                    'content': '智能客服系统的核心组件包括：1）自然语言理解（NLU）：理解用户意图和实体；2）对话管理：控制对话流程和状态；3）知识库：存储产品信息、FAQ、解决方案等；4）回答生成：基于检索到的知识生成自然回答；5）多轮对话：支持上下文相关的连续对话；6）人工转接：复杂问题的人工客服转接机制；7）学习优化：基于用户反馈持续改进系统性能。'
                }
            ],
            'category': 'functional',
            'difficulty': 'intermediate',
            'source_document': '智能客服系统设计'
        },
        {
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': '如何评估RAG系统的性能？'
                },
                {
                    'role': 'assistant',
                    'content': 'RAG系统性能评估可以从多个维度进行：1）准确性：答案的事实正确性和相关性；2）完整性：答案是否充分回答了用户问题；3）一致性：相同问题的答案是否保持一致；4）响应时间：系统的查询响应速度；5）用户满意度：通过用户反馈评估；6）检索质量：相关文档的召回率和精确率；7）生成质量：答案的流畅性和可读性。可以使用自动化评估工具和人工评估相结合的方式。'
                }
            ],
            'category': 'process',
            'difficulty': 'advanced',
            'source_document': 'RAG系统评估方法'
        }
    ]
    
    # 添加预定义的具体问题
    evaluation_set.extend(specific_questions)
    
    # 基于文档内容生成更多问题
    documents = load_markdown_files()
    
    for doc in documents:
        sections = extract_sections(doc['content'])
        
        for section in sections:
            if len(section['content']) > 100:  # 只处理有足够内容的章节
                # 生成基于章节的问题
                section_questions = generate_section_questions(section, doc['relative_path'])
                evaluation_set.extend(section_questions)
                
                if len(evaluation_set) >= TARGET_QUESTIONS:
                    break
        
        if len(evaluation_set) >= TARGET_QUESTIONS:
            break
    
    # 随机打乱并限制数量
    random.shuffle(evaluation_set)
    return evaluation_set[:TARGET_QUESTIONS]

def generate_section_questions(section: Dict[str, str], source_doc: str) -> List[Dict[str, Any]]:
    """基于章节内容生成问题"""
    questions = []
    title = section['title']
    content = section['content']
    
    # 简单的问题生成逻辑
    if '定义' in title or '概念' in title:
        question = f"什么是{title.replace('定义', '').replace('概念', '').strip()}？"
        answer = content[:200] + '...' if len(content) > 200 else content
        questions.append({
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': question
                },
                {
                    'role': 'assistant',
                    'content': answer
                }
            ],
            'category': 'factual',
            'difficulty': 'basic',
            'source_document': source_doc
        })
    
    elif '功能' in title or '特性' in title:
        concept = title.replace('功能', '').replace('特性', '').strip()
        question = f"{concept}有哪些主要功能？"
        answer = content[:200] + '...' if len(content) > 200 else content
        questions.append({
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': question
                },
                {
                    'role': 'assistant',
                    'content': answer
                }
            ],
            'category': 'functional',
            'difficulty': 'intermediate',
            'source_document': source_doc
        })
    
    elif '步骤' in title or '流程' in title or '方法' in title:
        process = title.replace('步骤', '').replace('流程', '').replace('方法', '').strip()
        question = f"如何实施{process}？"
        answer = content[:200] + '...' if len(content) > 200 else content
        questions.append({
            'messages': [
                {
                    'role': 'system',
                    'content': '你是华宽通企业的智能客服助手，专门回答关于公司业务、产品和服务的问题。请基于提供的知识库内容，给出准确、专业、友好的回答。'
                },
                {
                    'role': 'user',
                    'content': question
                },
                {
                    'role': 'assistant',
                    'content': answer
                }
            ],
            'category': 'process',
            'difficulty': 'advanced',
            'source_document': source_doc
        })
    
    return questions

def main():
    """主函数"""
    print("开始构建RAG系统评估数据集...")
    print(f"知识库路径: {KNOWLEDGE_BASE_PATH}")
    print(f"目标问题数量: {TARGET_QUESTIONS}")
    
    # 生成评估问题集
    evaluation_questions = generate_evaluation_questions()
    
    print(f"\n成功生成 {len(evaluation_questions)} 个评估问题")
    
    # 统计问题类型分布
    category_count = {}
    difficulty_count = {}
    
    for q in evaluation_questions:
        category = q.get('category', 'unknown')
        difficulty = q.get('difficulty', 'unknown')
        
        category_count[category] = category_count.get(category, 0) + 1
        difficulty_count[difficulty] = difficulty_count.get(difficulty, 0) + 1
    
    print("\n问题类型分布:")
    for category, count in category_count.items():
        print(f"  {category}: {count} 个")
    
    print("\n难度分布:")
    for difficulty, count in difficulty_count.items():
        print(f"  {difficulty}: {count} 个")
    
    # 保存评估数据集
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(evaluation_questions, f, indent=2, ensure_ascii=False)
    
    print(f"\n评估数据集已保存到: {OUTPUT_FILE}")
    
    # 显示示例问题
    print("\n示例问题:")
    print("=" * 50)
    for i, q in enumerate(evaluation_questions[:3], 1):
        messages = q.get('messages', [])
        user_msg = next((msg['content'] for msg in messages if msg['role'] == 'user'), 'N/A')
        assistant_msg = next((msg['content'] for msg in messages if msg['role'] == 'assistant'), 'N/A')
        
        print(f"\n问题 {i}: {user_msg}")
        print(f"类型: {q.get('category', 'unknown')}")
        print(f"难度: {q.get('difficulty', 'unknown')}")
        print(f"预期答案: {assistant_msg[:100]}...")
        print(f"来源文档: {q.get('source_document', 'unknown')}")
    
    print("\n" + "=" * 60)
    print("评估数据集构建完成！")
    print("\n下一步:")
    print("1. 运行评估脚本测试RAG系统性能")
    print("2. 根据评估结果优化系统参数")
    print("3. 定期更新评估集以保持质量")

if __name__ == "__main__":
    main()