/**
 * Mock LLM服务 - 模拟大模型对话功能
 * @author 伍志勇
 */

import { ragService, KnowledgeSource, SearchQuery } from './ragService';

// 对话消息类型
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sources?: KnowledgeSource[];
  metadata?: {
    model?: string;
    temperature?: number;
    tokens?: number;
    responseTime?: number;
    confidence?: number;
  };
}

// 对话会话类型
export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: {
    model: string;
    systemPrompt?: string;
    parameters?: {
      temperature: number;
      maxTokens: number;
      topP: number;
    };
  };
}

// LLM配置
export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  systemPrompt: string;
  enableRAG: boolean;
  ragConfig: {
    retrievalType: 'all' | 'vector' | 'fulltext' | 'graph';
    maxSources: number;
    threshold: number;
  };
}

// 对话请求
export interface ChatRequest {
  message: string;
  sessionId?: string;
  config?: Partial<LLMConfig>;
  context?: ChatMessage[];
}

// 对话响应
export interface ChatResponse {
  message: ChatMessage;
  session: ChatSession;
  sources: KnowledgeSource[];
  suggestions: string[];
  metadata: {
    model: string;
    responseTime: number;
    tokensUsed: number;
    confidence: number;
    retrievalMethods: string[];
  };
}

// Mock LLM服务类
class MockLLMService {
  private sessions: Map<string, ChatSession> = new Map();
  private defaultConfig: LLMConfig = {
    model: 'gpt-4-turbo',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 0.9,
    systemPrompt: '你是一个专业的AI助手，能够基于提供的知识库信息回答用户问题。请确保回答准确、有用且易于理解。',
    enableRAG: true,
    ragConfig: {
      retrievalType: 'all',
      maxSources: 5,
      threshold: 0.6
    }
  };

  constructor() {
    this.initializeMockSessions();
  }

  /**
   * 初始化模拟会话数据
   */
  private initializeMockSessions() {
    const mockSession: ChatSession = {
      id: 'session_1',
      title: '人工智能技术咨询',
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: '什么是人工智能？',
          timestamp: Date.now() - 3600000
        },
        {
          id: 'msg_2',
          role: 'assistant',
          content: '人工智能（AI）是计算机科学的一个分支，致力于创建能够执行通常需要人类智能的任务的系统。它包括机器学习、深度学习、自然语言处理等多个技术领域。',
          timestamp: Date.now() - 3599000,
          sources: [],
          metadata: {
            model: 'gpt-4-turbo',
            temperature: 0.7,
            tokens: 156,
            responseTime: 1200,
            confidence: 0.92
          }
        }
      ],
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3599000,
      metadata: {
        model: 'gpt-4-turbo',
        systemPrompt: '你是一个专业的AI助手',
        parameters: {
          temperature: 0.7,
          maxTokens: 2048,
          topP: 0.9
        }
      }
    };

    this.sessions.set(mockSession.id, mockSession);
  }

  /**
   * 发送对话消息
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const startTime = Date.now();
    const config = { ...this.defaultConfig, ...request.config };
    
    try {
      // 获取或创建会话
      let session = request.sessionId ? this.sessions.get(request.sessionId) : null;
      if (!session) {
        session = this.createNewSession(request.message, config);
      }

      // 添加用户消息
      const userMessage: ChatMessage = {
        id: this.generateMessageId(),
        role: 'user',
        content: request.message,
        timestamp: Date.now()
      };
      session.messages.push(userMessage);

      // RAG检索（如果启用）
      let sources: KnowledgeSource[] = [];
      let retrievalMethods: string[] = [];
      
      if (config.enableRAG) {
        const searchQuery: SearchQuery = {
          query: request.message,
          type: config.ragConfig.retrievalType,
          limit: config.ragConfig.maxSources,
          threshold: config.ragConfig.threshold
        };
        
        const searchResult = await ragService.search(searchQuery);
        sources = searchResult.sources;
        retrievalMethods = searchResult.retrievalMethods;
      }

      // 生成AI回复
      const assistantMessage = await this.generateResponse(
        request.message,
        sources,
        session.messages.slice(-10), // 最近10条消息作为上下文
        config
      );

      // 添加AI消息到会话
      session.messages.push(assistantMessage);
      session.updatedAt = Date.now();
      
      // 更新会话标题（如果是新会话）
      if (session.messages.length === 2) {
        session.title = this.generateSessionTitle(request.message);
      }

      // 保存会话
      this.sessions.set(session.id, session);

      // 生成建议问题
      const suggestions = await this.generateSuggestions(request.message, sources);

      const responseTime = Date.now() - startTime;

      return {
        message: assistantMessage,
        session,
        sources,
        suggestions,
        metadata: {
          model: config.model,
          responseTime,
          tokensUsed: assistantMessage.metadata?.tokens || 0,
          confidence: assistantMessage.metadata?.confidence || 0,
          retrievalMethods
        }
      };
    } catch (error) {
      console.error('LLM服务错误:', error);
      throw new Error('对话生成失败，请稍后重试');
    }
  }

  /**
   * 创建新会话
   */
  private createNewSession(firstMessage: string, config: LLMConfig): ChatSession {
    const sessionId = this.generateSessionId();
    const session: ChatSession = {
      id: sessionId,
      title: this.generateSessionTitle(firstMessage),
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      metadata: {
        model: config.model,
        systemPrompt: config.systemPrompt,
        parameters: {
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          topP: config.topP
        }
      }
    };
    
    return session;
  }

  /**
   * 生成AI回复
   */
  private async generateResponse(
    userMessage: string,
    sources: KnowledgeSource[],
    context: ChatMessage[],
    config: LLMConfig
  ): Promise<ChatMessage> {
    // 模拟AI处理延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));

    // 构建增强提示词
    const enhancedPrompt = this.buildEnhancedPrompt(userMessage, sources, context, config);
    
    // 模拟AI回复生成
    const response = await this.mockLLMGeneration(enhancedPrompt, userMessage, sources, config);
    
    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response.content,
      timestamp: Date.now(),
      sources: sources.length > 0 ? sources : undefined,
      metadata: {
        model: config.model,
        temperature: config.temperature,
        tokens: response.tokens,
        responseTime: response.responseTime,
        confidence: response.confidence
      }
    };

    return assistantMessage;
  }

  /**
   * 构建增强提示词
   */
  private buildEnhancedPrompt(
    userMessage: string,
    sources: KnowledgeSource[],
    context: ChatMessage[],
    config: LLMConfig
  ): string {
    let prompt = config.systemPrompt + '\n\n';
    
    // 添加上下文
    if (context.length > 0) {
      prompt += '对话历史:\n';
      context.slice(-6).forEach(msg => {
        prompt += `${msg.role === 'user' ? '用户' : 'AI'}: ${msg.content}\n`;
      });
      prompt += '\n';
    }
    
    // 添加知识库信息
    if (sources.length > 0) {
      prompt += '相关知识库信息:\n';
      sources.forEach((source, index) => {
        prompt += `[${index + 1}] ${source.title}\n${source.content}\n\n`;
      });
      prompt += '\n';
    }
    
    prompt += `用户问题: ${userMessage}\n\n`;
    prompt += '请基于以上信息回答用户问题，如果知识库中没有相关信息，请基于你的知识回答，并说明信息来源。';
    
    return prompt;
  }

  /**
   * 模拟LLM生成
   */
  private async mockLLMGeneration(
    prompt: string,
    userMessage: string,
    sources: KnowledgeSource[],
    config: LLMConfig
  ): Promise<{ content: string; tokens: number; responseTime: number; confidence: number }> {
    const startTime = Date.now();
    
    // 基于用户问题和知识源生成回复
    let response = '';
    let confidence = 0.8;
    
    // 分析用户问题类型
    const questionType = this.analyzeQuestionType(userMessage);
    
    if (sources.length > 0) {
      // 基于知识库回答
      response = this.generateKnowledgeBasedResponse(userMessage, sources, questionType);
      confidence = Math.min(0.95, 0.8 + sources.length * 0.03);
    } else {
      // 基于通用知识回答
      response = this.generateGeneralResponse(userMessage, questionType);
      confidence = 0.7;
    }
    
    // 添加来源引用
    if (sources.length > 0) {
      response += '\n\n**参考来源:**\n';
      sources.forEach((source, index) => {
        response += `${index + 1}. ${source.title} (${source.metadata.source || '知识库'})\n`;
      });
    }
    
    const responseTime = Date.now() - startTime;
    const tokens = Math.floor(response.length * 0.75); // 模拟token计算
    
    return {
      content: response,
      tokens,
      responseTime,
      confidence
    };
  }

  /**
   * 分析问题类型
   */
  private analyzeQuestionType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('什么是') || lowerMessage.includes('定义') || lowerMessage.includes('概念')) {
      return 'definition';
    } else if (lowerMessage.includes('如何') || lowerMessage.includes('怎么') || lowerMessage.includes('方法')) {
      return 'howto';
    } else if (lowerMessage.includes('为什么') || lowerMessage.includes('原因') || lowerMessage.includes('原理')) {
      return 'explanation';
    } else if (lowerMessage.includes('比较') || lowerMessage.includes('区别') || lowerMessage.includes('差异')) {
      return 'comparison';
    } else if (lowerMessage.includes('应用') || lowerMessage.includes('用途') || lowerMessage.includes('场景')) {
      return 'application';
    } else {
      return 'general';
    }
  }

  /**
   * 基于知识库生成回复
   */
  private generateKnowledgeBasedResponse(
    userMessage: string,
    sources: KnowledgeSource[],
    questionType: string
  ): string {
    const primarySource = sources[0];
    let response = '';
    
    switch (questionType) {
      case 'definition':
        response = `根据知识库信息，${primarySource.content}`;
        if (sources.length > 1) {
          response += ` 此外，${sources[1].content}`;
        }
        break;
        
      case 'howto':
        response = `基于相关资料，我来为您解答：\n\n${primarySource.content}`;
        if (sources.length > 1) {
          response += `\n\n另外，${sources[1].content}`;
        }
        break;
        
      case 'explanation':
        response = `让我基于知识库为您解释：\n\n${primarySource.content}`;
        break;
        
      case 'comparison':
        if (sources.length > 1) {
          response = `根据资料对比分析：\n\n**方面一：** ${primarySource.content}\n\n**方面二：** ${sources[1].content}`;
        } else {
          response = `关于您的比较问题，根据现有资料：\n\n${primarySource.content}`;
        }
        break;
        
      case 'application':
        response = `关于应用场景，根据知识库信息：\n\n${primarySource.content}`;
        if (sources.length > 1) {
          response += `\n\n补充应用信息：${sources[1].content}`;
        }
        break;
        
      default:
        response = `根据相关资料，${primarySource.content}`;
        if (sources.length > 1) {
          response += ` 相关信息还包括：${sources[1].content}`;
        }
    }
    
    return response;
  }

  /**
   * 生成通用回复
   */
  private generateGeneralResponse(userMessage: string, questionType: string): string {
    const responses = {
      definition: '这是一个很好的概念性问题。虽然我的知识库中没有找到完全匹配的信息，但基于我的理解...',
      howto: '关于您的操作问题，虽然知识库中没有具体的步骤说明，但我可以为您提供一般性的指导...',
      explanation: '这是一个需要深入解释的问题。虽然知识库中没有直接的答案，但我可以基于相关原理为您分析...',
      comparison: '您提出了一个比较性的问题。虽然知识库中没有直接的对比信息，但我可以从不同角度为您分析...',
      application: '关于应用场景的问题，虽然知识库中没有具体案例，但我可以为您介绍一般性的应用情况...',
      general: '感谢您的问题。虽然知识库中没有找到直接相关的信息，但我会尽力为您提供有用的回答...'
    };
    
    return responses[questionType as keyof typeof responses] || responses.general;
  }

  /**
   * 生成建议问题
   */
  private async generateSuggestions(userMessage: string, sources: KnowledgeSource[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    // 基于知识源生成建议
    if (sources.length > 0) {
      sources.forEach(source => {
        if (source.metadata.tags) {
          source.metadata.tags.forEach(tag => {
            if (!userMessage.includes(tag)) {
              suggestions.push(`${tag}的具体应用有哪些？`);
              suggestions.push(`${tag}与其他技术的关系？`);
            }
          });
        }
      });
    }
    
    // 添加通用建议
    const generalSuggestions = [
      '能否详细解释一下相关概念？',
      '这个技术有什么实际应用场景？',
      '与其他类似技术相比有什么优势？',
      '学习这个技术需要什么基础？',
      '未来发展趋势如何？'
    ];
    
    suggestions.push(...generalSuggestions);
    
    // 去重并限制数量
    return [...new Set(suggestions)].slice(0, 3);
  }

  /**
   * 获取会话列表
   */
  async getSessions(): Promise<ChatSession[]> {
    return Array.from(this.sessions.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * 获取特定会话
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 删除会话
   */
  async deleteSession(sessionId: string): Promise<boolean> {
    return this.sessions.delete(sessionId);
  }

  /**
   * 更新会话标题
   */
  async updateSessionTitle(sessionId: string, title: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.title = title;
      session.updatedAt = Date.now();
      return true;
    }
    return false;
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 生成会话标题
   */
  private generateSessionTitle(firstMessage: string): string {
    if (firstMessage.length <= 20) {
      return firstMessage;
    }
    return firstMessage.substring(0, 20) + '...';
  }

  /**
   * 获取模型配置
   */
  getConfig(): LLMConfig {
    return { ...this.defaultConfig };
  }

  /**
   * 更新模型配置
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.defaultConfig = { ...this.defaultConfig, ...config };
  }
}

// 导出LLM服务实例
export const llmService = new MockLLMService();
export default llmService;