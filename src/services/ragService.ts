/**
 * RAG检索架构服务 - 支持向量检索、全文检索和知识图谱检索
 * @author 伍志勇
 */

// 知识来源类型定义
export interface KnowledgeSource {
  id: string;
  type: 'vector' | 'fulltext' | 'graph';
  title: string;
  content: string;
  url?: string;
  score: number;
  metadata: {
    domain?: string;
    category?: string;
    tags?: string[];
    lastUpdated?: string;
    author?: string;
    source?: string;
  };
}

// 检索查询参数
export interface SearchQuery {
  query: string;
  type?: 'all' | 'vector' | 'fulltext' | 'graph';
  limit?: number;
  threshold?: number;
  filters?: {
    domain?: string[];
    category?: string[];
    tags?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
  };
}

// 检索结果
export interface SearchResult {
  sources: KnowledgeSource[];
  totalCount: number;
  searchTime: number;
  query: string;
  retrievalMethods: string[];
}

// 向量检索器
class VectorRetriever {
  private vectorIndex: Map<string, number[]> = new Map();
  private documentEmbeddings: Map<string, KnowledgeSource> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * 初始化模拟向量数据
   */
  private initializeMockData() {
    const mockDocuments = [
      {
        id: 'vec_1',
        type: 'vector' as const,
        title: '人工智能基础概念',
        content: '人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。包括机器学习、深度学习、自然语言处理等技术。',
        score: 0.95,
        metadata: {
          domain: 'technology',
          category: 'AI基础',
          tags: ['人工智能', '机器学习', '深度学习'],
          lastUpdated: '2024-01-20',
          author: '技术团队',
          source: '内部文档'
        }
      },
      {
        id: 'vec_2',
        type: 'vector' as const,
        title: '机器学习算法分类',
        content: '机器学习算法主要分为监督学习、无监督学习和强化学习三大类。监督学习包括分类和回归，无监督学习包括聚类和降维。',
        score: 0.88,
        metadata: {
          domain: 'technology',
          category: '机器学习',
          tags: ['机器学习', '算法', '分类'],
          lastUpdated: '2024-01-18',
          author: '算法团队',
          source: '技术博客'
        }
      },
      {
        id: 'vec_3',
        type: 'vector' as const,
        title: '深度学习神经网络',
        content: '深度学习使用多层神经网络来学习数据的复杂模式。常见的网络结构包括卷积神经网络（CNN）、循环神经网络（RNN）和Transformer。',
        score: 0.82,
        metadata: {
          domain: 'technology',
          category: '深度学习',
          tags: ['深度学习', '神经网络', 'CNN', 'RNN'],
          lastUpdated: '2024-01-15',
          author: '研发团队',
          source: '研究论文'
        }
      }
    ];

    // 模拟向量嵌入（实际应用中会使用真实的向量嵌入）
    mockDocuments.forEach(doc => {
      this.documentEmbeddings.set(doc.id, doc);
      // 生成模拟向量（实际应用中会使用真实的向量）
      const mockVector = Array.from({ length: 768 }, () => Math.random());
      this.vectorIndex.set(doc.id, mockVector);
    });
  }

  /**
   * 向量相似度检索
   */
  async search(query: string, limit: number = 5, threshold: number = 0.7): Promise<KnowledgeSource[]> {
    // 模拟查询向量化过程
    await new Promise(resolve => setTimeout(resolve, 100));

    // 模拟向量相似度计算
    const results: KnowledgeSource[] = [];
    
    for (const [docId, doc] of this.documentEmbeddings) {
      // 简单的文本匹配模拟向量相似度
      const similarity = this.calculateTextSimilarity(query, doc.content);
      
      if (similarity >= threshold) {
        results.push({
          ...doc,
          score: similarity
        });
      }
    }

    // 按相似度排序并限制结果数量
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 计算文本相似度（模拟向量相似度）
   */
  private calculateTextSimilarity(query: string, content: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentWords = content.toLowerCase().split(/\s+/);
    
    let matchCount = 0;
    queryWords.forEach(word => {
      if (contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))) {
        matchCount++;
      }
    });
    
    return Math.min(0.95, (matchCount / queryWords.length) * 0.8 + Math.random() * 0.2);
  }
}

// 全文检索器
class FullTextRetriever {
  private documents: Map<string, KnowledgeSource> = new Map();
  private invertedIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeMockData();
    this.buildInvertedIndex();
  }

  /**
   * 初始化模拟全文检索数据
   */
  private initializeMockData() {
    const mockDocuments = [
      {
        id: 'ft_1',
        type: 'fulltext' as const,
        title: '自然语言处理技术概述',
        content: '自然语言处理（NLP）是人工智能的重要分支，涉及文本分析、语义理解、机器翻译、情感分析等技术。现代NLP广泛使用深度学习方法。',
        score: 0.92,
        metadata: {
          domain: 'technology',
          category: 'NLP',
          tags: ['自然语言处理', '文本分析', '机器翻译'],
          lastUpdated: '2024-01-19',
          author: 'NLP团队',
          source: '技术文档'
        }
      },
      {
        id: 'ft_2',
        type: 'fulltext' as const,
        title: '计算机视觉应用',
        content: '计算机视觉是使计算机能够理解和解释视觉信息的技术。主要应用包括图像识别、目标检测、人脸识别、医学影像分析等领域。',
        score: 0.85,
        metadata: {
          domain: 'technology',
          category: '计算机视觉',
          tags: ['计算机视觉', '图像识别', '目标检测'],
          lastUpdated: '2024-01-17',
          author: '视觉团队',
          source: '应用案例'
        }
      },
      {
        id: 'ft_3',
        type: 'fulltext' as const,
        title: '推荐系统算法',
        content: '推荐系统通过分析用户行为和偏好，为用户推荐相关内容。常用算法包括协同过滤、内容过滤、深度学习推荐等方法。',
        score: 0.78,
        metadata: {
          domain: 'technology',
          category: '推荐系统',
          tags: ['推荐系统', '协同过滤', '个性化'],
          lastUpdated: '2024-01-16',
          author: '推荐团队',
          source: '算法文档'
        }
      }
    ];

    mockDocuments.forEach(doc => {
      this.documents.set(doc.id, doc);
    });
  }

  /**
   * 构建倒排索引
   */
  private buildInvertedIndex() {
    for (const [docId, doc] of this.documents) {
      const words = this.tokenize(doc.title + ' ' + doc.content);
      
      words.forEach(word => {
        if (!this.invertedIndex.has(word)) {
          this.invertedIndex.set(word, new Set());
        }
        this.invertedIndex.get(word)!.add(docId);
      });
    }
  }

  /**
   * 文本分词
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 1);
  }

  /**
   * 全文检索
   */
  async search(query: string, limit: number = 5, threshold: number = 0.6): Promise<KnowledgeSource[]> {
    // 模拟检索延迟
    await new Promise(resolve => setTimeout(resolve, 80));

    const queryWords = this.tokenize(query);
    const docScores: Map<string, number> = new Map();

    // 计算文档相关性得分
    queryWords.forEach(word => {
      const docIds = this.invertedIndex.get(word);
      if (docIds) {
        docIds.forEach(docId => {
          const currentScore = docScores.get(docId) || 0;
          docScores.set(docId, currentScore + 1);
        });
      }
    });

    // 归一化得分并过滤
    const results: KnowledgeSource[] = [];
    for (const [docId, score] of docScores) {
      const normalizedScore = Math.min(0.95, score / queryWords.length + Math.random() * 0.1);
      
      if (normalizedScore >= threshold) {
        const doc = this.documents.get(docId)!;
        results.push({
          ...doc,
          score: normalizedScore
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
}

// 知识图谱检索器
class GraphRetriever {
  private entities: Map<string, any> = new Map();
  private relations: Map<string, any[]> = new Map();

  constructor() {
    this.initializeMockData();
  }

  /**
   * 初始化模拟知识图谱数据
   */
  private initializeMockData() {
    const mockEntities = [
      {
        id: 'graph_1',
        type: 'graph' as const,
        title: '人工智能发展历程',
        content: '人工智能从1956年达特茅斯会议开始，经历了符号主义、连接主义、行为主义等发展阶段，现在进入深度学习时代。',
        score: 0.90,
        metadata: {
          domain: 'technology',
          category: 'AI历史',
          tags: ['人工智能', '发展历程', '深度学习'],
          lastUpdated: '2024-01-20',
          author: '历史研究团队',
          source: '知识图谱'
        }
      },
      {
        id: 'graph_2',
        type: 'graph' as const,
        title: '机器学习与深度学习关系',
        content: '深度学习是机器学习的子集，机器学习是人工智能的子集。深度学习通过多层神经网络实现复杂模式识别。',
        score: 0.87,
        metadata: {
          domain: 'technology',
          category: '技术关系',
          tags: ['机器学习', '深度学习', '关系图'],
          lastUpdated: '2024-01-18',
          author: '技术架构师',
          source: '知识图谱'
        }
      },
      {
        id: 'graph_3',
        type: 'graph' as const,
        title: 'AI应用领域分布',
        content: '人工智能在医疗、金融、教育、交通、制造业等多个领域都有重要应用，每个领域都有特定的技术需求和挑战。',
        score: 0.83,
        metadata: {
          domain: 'application',
          category: 'AI应用',
          tags: ['AI应用', '行业分布', '应用场景'],
          lastUpdated: '2024-01-15',
          author: '应用研究团队',
          source: '知识图谱'
        }
      }
    ];

    mockEntities.forEach(entity => {
      this.entities.set(entity.id, entity);
    });

    // 模拟实体关系
    this.relations.set('人工智能', [
      { target: '机器学习', relation: '包含', weight: 0.9 },
      { target: '深度学习', relation: '包含', weight: 0.8 },
      { target: '自然语言处理', relation: '包含', weight: 0.7 }
    ]);
  }

  /**
   * 知识图谱检索
   */
  async search(query: string, limit: number = 5, threshold: number = 0.6): Promise<KnowledgeSource[]> {
    // 模拟图谱查询延迟
    await new Promise(resolve => setTimeout(resolve, 120));

    const results: KnowledgeSource[] = [];
    
    // 实体匹配
    for (const [entityId, entity] of this.entities) {
      const relevance = this.calculateEntityRelevance(query, entity);
      
      if (relevance >= threshold) {
        results.push({
          ...entity,
          score: relevance
        });
      }
    }

    // 关系推理（简化版）
    const queryEntities = this.extractEntities(query);
    queryEntities.forEach(queryEntity => {
      const relations = this.relations.get(queryEntity);
      if (relations) {
        relations.forEach(rel => {
          // 基于关系添加相关实体
          const relatedEntity = this.findEntityByName(rel.target);
          if (relatedEntity && !results.find(r => r.id === relatedEntity.id)) {
            results.push({
              ...relatedEntity,
              score: rel.weight * 0.8
            });
          }
        });
      }
    });

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * 计算实体相关性
   */
  private calculateEntityRelevance(query: string, entity: any): number {
    const queryLower = query.toLowerCase();
    const titleLower = entity.title.toLowerCase();
    const contentLower = entity.content.toLowerCase();
    
    let score = 0;
    
    // 标题匹配
    if (titleLower.includes(queryLower)) score += 0.4;
    
    // 内容匹配
    if (contentLower.includes(queryLower)) score += 0.3;
    
    // 标签匹配
    if (entity.metadata.tags) {
      entity.metadata.tags.forEach((tag: string) => {
        if (tag.toLowerCase().includes(queryLower) || queryLower.includes(tag.toLowerCase())) {
          score += 0.2;
        }
      });
    }
    
    return Math.min(0.95, score + Math.random() * 0.1);
  }

  /**
   * 从查询中提取实体
   */
  private extractEntities(query: string): string[] {
    const entities = ['人工智能', '机器学习', '深度学习', '自然语言处理', '计算机视觉'];
    return entities.filter(entity => query.includes(entity));
  }

  /**
   * 根据名称查找实体
   */
  private findEntityByName(name: string): any {
    for (const [id, entity] of this.entities) {
      if (entity.title.includes(name) || entity.content.includes(name)) {
        return entity;
      }
    }
    return null;
  }
}

// RAG检索服务主类
class RAGService {
  private vectorRetriever: VectorRetriever;
  private fullTextRetriever: FullTextRetriever;
  private graphRetriever: GraphRetriever;

  constructor() {
    this.vectorRetriever = new VectorRetriever();
    this.fullTextRetriever = new FullTextRetriever();
    this.graphRetriever = new GraphRetriever();
  }

  /**
   * 综合检索方法
   */
  async search(searchQuery: SearchQuery): Promise<SearchResult> {
    const startTime = Date.now();
    const { query, type = 'all', limit = 10, threshold = 0.6 } = searchQuery;
    
    let allSources: KnowledgeSource[] = [];
    const retrievalMethods: string[] = [];

    try {
      // 根据类型执行不同的检索策略
      if (type === 'all' || type === 'vector') {
        const vectorResults = await this.vectorRetriever.search(query, Math.ceil(limit / 3), threshold);
        allSources.push(...vectorResults);
        if (vectorResults.length > 0) retrievalMethods.push('向量检索');
      }

      if (type === 'all' || type === 'fulltext') {
        const fullTextResults = await this.fullTextRetriever.search(query, Math.ceil(limit / 3), threshold);
        allSources.push(...fullTextResults);
        if (fullTextResults.length > 0) retrievalMethods.push('全文检索');
      }

      if (type === 'all' || type === 'graph') {
        const graphResults = await this.graphRetriever.search(query, Math.ceil(limit / 3), threshold);
        allSources.push(...graphResults);
        if (graphResults.length > 0) retrievalMethods.push('知识图谱');
      }

      // 去重和融合
      const uniqueSources = this.deduplicateAndMerge(allSources);
      
      // 重新排序
      const rankedSources = this.rankSources(uniqueSources, query);
      
      // 限制结果数量
      const finalSources = rankedSources.slice(0, limit);

      const searchTime = Date.now() - startTime;

      return {
        sources: finalSources,
        totalCount: finalSources.length,
        searchTime,
        query,
        retrievalMethods
      };
    } catch (error) {
      console.error('RAG检索错误:', error);
      return {
        sources: [],
        totalCount: 0,
        searchTime: Date.now() - startTime,
        query,
        retrievalMethods: []
      };
    }
  }

  /**
   * 去重和融合结果
   */
  private deduplicateAndMerge(sources: KnowledgeSource[]): KnowledgeSource[] {
    const uniqueMap = new Map<string, KnowledgeSource>();
    
    sources.forEach(source => {
      const existing = uniqueMap.get(source.id);
      if (existing) {
        // 如果已存在，取较高的分数
        if (source.score > existing.score) {
          uniqueMap.set(source.id, source);
        }
      } else {
        uniqueMap.set(source.id, source);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  /**
   * 重新排序结果
   */
  private rankSources(sources: KnowledgeSource[], query: string): KnowledgeSource[] {
    return sources.sort((a, b) => {
      // 综合考虑相关性分数、来源类型权重等因素
      let scoreA = a.score;
      let scoreB = b.score;
      
      // 向量检索结果权重稍高
      if (a.type === 'vector') scoreA *= 1.1;
      if (b.type === 'vector') scoreB *= 1.1;
      
      // 知识图谱结果在特定查询下权重更高
      if (query.includes('关系') || query.includes('发展') || query.includes('历史')) {
        if (a.type === 'graph') scoreA *= 1.2;
        if (b.type === 'graph') scoreB *= 1.2;
      }
      
      return scoreB - scoreA;
    });
  }

  /**
   * 获取推荐查询
   */
  async getSuggestedQueries(query: string): Promise<string[]> {
    // 模拟推荐查询生成
    const suggestions = [
      '人工智能的发展历程',
      '机器学习算法分类',
      '深度学习应用场景',
      '自然语言处理技术',
      '计算机视觉原理'
    ];
    
    return suggestions.filter(s => 
      !s.toLowerCase().includes(query.toLowerCase()) && 
      query.split('').some(char => s.includes(char))
    ).slice(0, 3);
  }

  /**
   * 获取相关实体
   */
  async getRelatedEntities(query: string): Promise<Array<{ name: string; relation: string; confidence: number }>> {
    // 模拟相关实体提取
    const entities = [
      { name: '机器学习', relation: '子领域', confidence: 0.9 },
      { name: '深度学习', relation: '技术分支', confidence: 0.85 },
      { name: '神经网络', relation: '实现方法', confidence: 0.8 }
    ];
    
    return entities.filter(e => e.confidence > 0.7);
  }
}

// 导出RAG服务实例
export const ragService = new RAGService();
export default ragService;