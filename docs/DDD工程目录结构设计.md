# DDD工程目录结构设计文档

*作者：伍志勇*  
*创建时间：2025年8月1日*

## 1. DDD架构概述

本文档基于领域驱动设计(DDD)原则，为知识图谱增强RAG系统设计了清晰的分层架构和目录结构。

### 1.1 核心设计原则

- **依赖倒置原则(DIP)**：高层模块不依赖低层模块，两者都依赖抽象
- **洋葱架构**：核心业务逻辑位于中心，外部依赖向外层扩展
- **防腐层**：保护领域模型免受外部系统污染
- **限界上下文**：清晰划分业务边界，避免概念混淆

### 1.2 四层架构模型

```
┌─────────────────────────────────────────┐
│              接口层                      │ 用户界面/API
├─────────────────────────────────────────┤
│              应用层                      │ 业务流程编排
├─────────────────────────────────────────┤
│              领域层                      │ 核心业务逻辑
├─────────────────────────────────────────┤
│            基础设施层                    │ 技术实现
└─────────────────────────────────────────┘
```

## 2. 完整目录结构

```
src/
├── domain/                           # 领域层 - 核心业务逻辑
│   ├── knowledge_graph/             # 知识图谱构建上下文
│   │   ├── entities/                 # 领域实体
│   │   │   ├── __init__.py
│   │   │   ├── knowledge_graph.py    # 知识图谱实体
│   │   │   ├── node.py              # 节点实体
│   │   │   ├── edge.py              # 边实体
│   │   │   └── metadata.py          # 元数据实体
│   │   ├── value_objects/           # 值对象
│   │   │   ├── __init__.py
│   │   │   ├── graph_id.py          # 图谱ID值对象
│   │   │   ├── node_type.py         # 节点类型值对象
│   │   │   └── relationship_type.py   # 关系类型值对象
│   │   ├── repositories/            # 仓储接口
│   │   │   ├── __init__.py
│   │   │   ├── knowledge_graph_repository.py
│   │   │   └── node_repository.py
│   │   ├── services/                # 领域服务
│   │   │   ├── __init__.py
│   │   │   ├── graph_builder.py     # 图谱构建服务
│   │   │   ├── entity_extractor.py  # 实体提取服务
│   │   │   └── relationship_analyzer.py
│   │   ├── events/                  # 领域事件
│   │   │   ├── __init__.py
│   │   │   ├── graph_created_event.py
│   │   │   └── node_added_event.py
│   │   └── exceptions/              # 领域异常
│   │       ├── __init__.py
│   │       └── graph_exceptions.py
│   ├──
│   ├── rag_retrieval/               # RAG检索上下文
│   │   ├── entities/
│   │   │   ├── __init__.py
│   │   │   ├── query.py            # 查询实体
│   │   │   ├── document.py         # 文档实体
│   │   │   └── retrieval_result.py
│   │   ├── value_objects/
│   │   │   ├── __init__.py
│   │   │   ├── query_id.py
│   │   │   ├── relevance_score.py
│   │   │   └── context_window.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── document_repository.py
│   │   │   └── vector_repository.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── vector_retriever.py
│   │   │   ├── semantic_searcher.py
│   │   │   └── context_assembler.py
│   │   ├── events/
│   │   │   ├── __init__.py
│   │   │   └── retrieval_completed_event.py
│   │   └── exceptions/
│   │       ├── __init__.py
│   │       └── retrieval_exceptions.py
│   ├──
│   ├── lora_finetuning/           # LoRA微调上下文
│   │   ├── entities/
│   │   │   ├── __init__.py
│   │   │   ├── training_config.py
│   │   │   ├── model_checkpoint.py
│   │   │   └── fine_tune_job.py
│   │   ├── value_objects/
│   │   │   ├── __init__.py
│   │   │   ├── job_id.py
│   │   │   ├── hyperparameters.py
│   │   │   └── model_version.py
│   │   ├── repositories/
│   │   │   ├── __init__.py
│   │   │   ├── checkpoint_repository.py
│   │   │   └── training_job_repository.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── lora_trainer.py
│   │   │   ├── model_manager.py
│   │   │   └── dataset_processor.py
│   │   ├── events/
│   │   │   ├── __init__.py
│   │   │   ├── training_started_event.py
│   │   │   └── training_completed_event.py
│   │   └── exceptions/
│   │       ├── __init__.py
│   │       └── training_exceptions.py
│   └──
│   └── evaluation/                 # 评估系统上下文
│       ├── entities/
│       │   ├── __init__.py
│       │   ├── evaluation_metric.py
│       │   ├── test_case.py
│       │   └── evaluation_result.py
│       ├── value_objects/
│       │   ├── __init__.py
│       │   ├── metric_name.py
│       │   └── test_id.py
│       ├── repositories/
│       │   ├── __init__.py
│       │   ├── evaluation_repository.py
│       │   └── test_case_repository.py
│       ├── services/
│       │   ├── __init__.py
│       │   ├── evaluator.py
│       │   ├── metric_calculator.py
│       │   └── report_generator.py
│       ├── events/
│       │   ├── __init__.py
│       │   └── evaluation_completed_event.py
│       └── exceptions/
│           ├── __init__.py
│           └── evaluation_exceptions.py
│
├── application/                     # 应用层 - 业务流程编排
│   ├── __init__.py
│   ├── services/                    # 应用服务
│   │   ├── __init__.py
│   │   ├── knowledge_graph_service.py
│   │   ├── rag_service.py
│   │   ├── lora_training_service.py
│   │   └── evaluation_service.py
│   ├── commands/                    # 命令对象
│   │   ├── __init__.py
│   │   ├── create_knowledge_graph_command.py
│   │   ├── execute_rag_query_command.py
│   │   ├── start_training_command.py
│   │   └── run_evaluation_command.py
│   ├── queries/                     # 查询对象
│   │   ├── __init__.py
│   │   ├── get_knowledge_graph_query.py
│   │   ├── search_documents_query.py
│   │   └── get_training_status_query.py
│   ├── handlers/                    # 命令/查询处理器
│   │   ├── __init__.py
│   │   ├── command_handlers/
│   │   └── query_handlers/
│   ├── events/                      # 领域事件处理器
│   │   ├── __init__.py
│   │   ├── graph_event_handlers.py
│   │   └── training_event_handlers.py
│   └── dto/                         # 数据传输对象
│       ├── __init__.py
│       ├── knowledge_graph_dto.py
│       ├── rag_dto.py
│       ├── training_dto.py
│       └── evaluation_dto.py
│
├── infrastructure/                  # 基础设施层 - 技术实现
│   ├── __init__.py
│   ├── adapters/                    # 外部适配器
│   │   ├── __init__.py
│   │   ├── ollama_adapter.py
│   │   ├── faiss_adapter.py
│   │   ├── transformers_adapter.py
│   │   └── external_api_adapter.py
│   ├── repositories/                # 数据持久化实现
│   │   ├── __init__.py
│   │   ├── knowledge_graph/
│   │   │   ├── __init__.py
│   │   │   ├── faiss_knowledge_graph_repository.py
│   │   │   └── json_knowledge_graph_repository.py
│   │   ├── rag/
│   │   │   ├── __init__.py
│   │   │   └── faiss_document_repository.py
│   │   ├── training/
│   │   │   ├── __init__.py
│   │   │   └── file_checkpoint_repository.py
│   │   └── evaluation/
│   │       ├── __init__.py
│   │       └── json_evaluation_repository.py
│   ├── cache/                       # 缓存实现
│   │   ├── __init__.py
│   │   ├── redis_cache.py
│   │   ├── in_memory_cache.py
│   │   └── cache_manager.py
│   ├── ml/                        # 机器学习框架集成
│   │   ├── __init__.py
│   │   ├── lora_trainer_impl.py
│   │   ├── model_loader.py
│   │   └── dataset_loader.py
│   ├── config/                    # 配置管理
│   │   ├── __init__.py
│   │   ├── app_config.py
│   │   └── environment_config.py
│   └── persistence/               # 数据持久化基础
│       ├── __init__.py
│       ├── base_repository.py
│       └── unit_of_work.py
│
└── interfaces/                    # 接口层 - 用户界面
    ├── __init__.py
    ├── api/                       # REST API
    │   ├── __init__.py
    │   ├── v1/
    │   │   ├── __init__.py
    │   │   ├── knowledge_graph_routes.py
    │   │   ├── rag_routes.py
    │   │   ├── training_routes.py
    │   │   └── evaluation_routes.py
    │   ├── middleware/
    │   │   ├── __init__.py
    │   │   ├── error_handler.py
    │   │   └── logging_middleware.py
    │   └── schemas/
    │       ├── __init__.py
    │       ├── knowledge_graph_schemas.py
    │       ├── rag_schemas.py
    │       ├── training_schemas.py
    │       └── evaluation_schemas.py
    ├── cli/                       # 命令行接口
    │   ├── __init__.py
    │   ├── commands/
    │   │   ├── __init__.py
    │   │   ├── graph_commands.py
    │   │   ├── rag_commands.py
    │   │   └── training_commands.py
    │   └── cli_main.py
    └── web/                       # Web界面
        ├── __init__.py
        ├── templates/
        ├── static/
        └── web_main.py
```

## 3. 边界上下文详细设计

### 3.1 知识图谱构建上下文 (Knowledge Graph Bounded Context)

**业务职责**：负责从原始文档中提取实体和关系，构建和维护知识图谱

**核心聚合**：
- `KnowledgeGraph`：知识图谱聚合根
- `Node`：图谱节点实体
- `Edge`：图谱边实体

**领域服务**：
- `GraphBuilder`：图谱构建服务
- `EntityExtractor`：实体提取服务
- `RelationshipAnalyzer`：关系分析服务

**仓储接口**：
- `KnowledgeGraphRepository`：知识图谱仓储
- `NodeRepository`：节点仓储

### 3.2 RAG检索上下文 (RAG Retrieval Bounded Context)

**业务职责**：处理用户查询，从知识图谱和文档中检索相关信息

**核心聚合**：
- `Query`：用户查询实体
- `Document`：文档实体
- `RetrievalResult`：检索结果聚合

**领域服务**：
- `VectorRetriever`：向量检索服务
- `SemanticSearcher`：语义搜索服务
- `ContextAssembler`：上下文组装服务

### 3.3 LoRA微调上下文 (LoRA Fine-tuning Bounded Context)

**业务职责**：管理模型微调任务，包括训练配置、模型检查点和训练作业

**核心聚合**：
- `FineTuneJob`：微调作业聚合根
- `TrainingConfig`：训练配置值对象
- `ModelCheckpoint`：模型检查点实体

**领域服务**：
- `LoRATrainer`：LoRA训练服务
- `ModelManager`：模型管理服务
- `DatasetProcessor`：数据集处理服务

### 3.4 评估系统上下文 (Evaluation Bounded Context)

**业务职责**：评估RAG系统和微调模型的性能

**核心聚合**：
- `EvaluationResult`：评估结果聚合
- `TestCase`：测试用例实体
- `EvaluationMetric`：评估指标值对象

**领域服务**：
- `Evaluator`：评估器服务
- `MetricCalculator`：指标计算服务
- `ReportGenerator`：报告生成服务

## 4. 包组织原则

### 4.1 按业务能力组织

每个限界上下文对应一个业务能力：
- `knowledge_graph/` - 知识图谱构建
- `rag_retrieval/` - RAG检索
- `lora_finetuning/` - 模型微调
- `evaluation/` - 系统评估

### 4.2 按技术能力组织

在每个限界上下文内，按DDD技术概念组织：
- `entities/` - 领域实体
- `value_objects/` - 值对象
- `repositories/` - 仓储接口
- `services/` - 领域服务
- `events/` - 领域事件
- `exceptions/` - 领域异常

### 4.3 依赖关系

```
接口层 → 应用层 → 领域层 ← 基础设施层
```

- **接口层**：依赖应用层，处理用户输入输出
- **应用层**：依赖领域层，编排业务流程
- **领域层**：不依赖其他层，包含核心业务逻辑
- **基础设施层**：依赖领域层，实现技术细节

## 5. 代码示例

### 5.1 领域实体示例

```python
# domain/knowledge_graph/entities/knowledge_graph.py
from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime

@dataclass
class KnowledgeGraph:
    """知识图谱领域实体"""
    
    id: str
    name: str
    description: str
    nodes: List['Node']
    edges: List['Edge']
    metadata: dict
    created_at: datetime
    updated_at: datetime
    
    def add_node(self, node: 'Node') -> None:
        """添加节点到图谱"""
        if node not in self.nodes:
            self.nodes.append(node)
            self.updated_at = datetime.now()
    
    def add_edge(self, edge: 'Edge') -> None:
        """添加边到图谱"""
        if edge not in self.edges:
            self.edges.append(edge)
            self.updated_at = datetime.now()
```

### 5.2 应用服务示例

```python
# application/services/knowledge_graph_service.py
from typing import Optional
from domain.knowledge_graph.entities.knowledge_graph import KnowledgeGraph
from domain.knowledge_graph.services.graph_builder import GraphBuilder
from infrastructure.repositories.knowledge_graph.faiss_knowledge_graph_repository import FaissKnowledgeGraphRepository

class KnowledgeGraphApplicationService:
    """知识图谱应用服务"""
    
    def __init__(
        self,
        graph_builder: GraphBuilder,
        repository: FaissKnowledgeGraphRepository
    ):
        self.graph_builder = graph_builder
        self.repository = repository
    
    async def create_knowledge_graph(
        self, 
        name: str, 
        description: str, 
        documents: List[str]
    ) -> str:
        """创建知识图谱"""
        graph = self.graph_builder.build_from_documents(
            name=name,
            description=description,
            documents=documents
        )
        
        await self.repository.save(graph)
        return graph.id
```

### 5.3 基础设施实现示例

```python
# infrastructure/repositories/knowledge_graph/faiss_knowledge_graph_repository.py
from typing import Optional
import faiss
import numpy as np
from domain.knowledge_graph.entities.knowledge_graph import KnowledgeGraph
from domain.knowledge_graph.repositories.knowledge_graph_repository import KnowledgeGraphRepository

class FaissKnowledgeGraphRepository(KnowledgeGraphRepository):
    """基于Faiss的知识图谱仓储实现"""
    
    def __init__(self, index_path: str):
        self.index_path = index_path
        self.index = None
    
    async def save(self, graph: KnowledgeGraph) -> None:
        """保存知识图谱"""
        # 实现保存逻辑
        pass
    
    async def find_by_id(self, graph_id: str) -> Optional[KnowledgeGraph]:
        """根据ID查找知识图谱"""
        # 实现查找逻辑
        pass
```

## 6. 迁移策略

### 6.1 阶段1：创建新结构（第1-2周）

1. **创建目录结构**
   - 按本文档创建完整的DDD目录结构
   - 不移动现有代码，保持兼容性

2. **创建适配器**
   - 为现有代码创建适配器接口
   - 确保新旧代码可以共存

### 6.2 阶段2：逐步迁移（第3-6周）

1. **按模块迁移**
   - 先迁移知识图谱模块
   - 再迁移RAG检索模块
   - 最后迁移LoRA微调和评估模块

2. **测试验证**
   - 每个模块迁移后进行完整测试
   - 确保功能不变

### 6.3 阶段3：清理旧结构（第7-8周）

1. **移除旧代码**
   - 逐步移除旧的目录结构
   - 更新所有导入路径

2. **最终验证**
   - 运行完整的测试套件
   - 验证所有功能正常

## 7. 开发规范

### 7.1 命名规范

- **包名**：使用小写字母和下划线，如 `knowledge_graph`
- **类名**：使用PascalCase，如 `KnowledgeGraph`
- **函数名**：使用snake_case，如 `create_knowledge_graph`
- **常量名**：使用UPPER_SNAKE_CASE，如 `MAX_NODES`

### 7.2 代码组织

- 每个文件只包含一个类或函数
- 使用相对导入避免循环依赖
- 添加类型注解提高代码可读性

### 7.3 测试策略

- **单元测试**：针对领域层和应用层
- **集成测试**：针对基础设施层
- **端到端测试**：针对接口层

## 8. 总结

本DDD工程目录结构设计提供了：

1. **清晰的业务边界**：每个限界上下文都有明确的职责
2. **良好的可扩展性**：支持新功能的快速添加
3. **高度的可测试性**：各层独立测试，降低耦合
4. **易于维护**：代码结构清晰，降低认知负担

通过遵循这个设计，可以构建一个可维护、可扩展、可测试的知识图谱增强RAG系统。