/**
 * 搜索检索页 - 智能搜索、多维度筛选、知识推荐功能
 * @author 伍志勇
 */
import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Button,
  List,
  Tag,
  Typography,
  Space,
  Row,
  Col,
  Select,
  Checkbox,
  Slider,
  Collapse,
  Badge,
  Tooltip,
  Empty,
  Spin,
  App,
  Pagination,
  Divider,
  Avatar,
  Rate,
  Progress,
  DatePicker,
  Radio,
  AutoComplete,
  Affix,
  FloatButton,
  Alert
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  StarOutlined,
  EyeOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  HeartOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TagOutlined,
  FileTextOutlined,
  BulbOutlined,
  ThunderboltOutlined,
  HistoryOutlined,
  BookOutlined,
  TeamOutlined,
  CalendarOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined,
  ReloadOutlined,
  PlayCircleOutlined,
  PictureOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { mockKnowledge, mockCategories, mockUsers } from '../../data/mockData';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;
// 移除 Panel 解构，改用 items 属性
const CheckboxGroup = Checkbox.Group;

// 搜索结果接口
interface SearchResult {
  id: string;
  title: string;
  content: string;
  summary: string;
  category: string;
  tags: string[];
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  likeCount: number;
  downloadCount: number;
  rating: number;
  relevanceScore: number;
  type: 'document' | 'video' | 'image' | 'link';
  fileSize?: string;
  duration?: string;
}

// 搜索历史接口
interface SearchHistory {
  id: string;
  query: string;
  timestamp: string;
  resultCount: number;
}

// 推荐知识接口
interface RecommendedKnowledge {
  id: string;
  title: string;
  reason: string;
  score: number;
  category: string;
}

// 搜索筛选条件接口
interface SearchFilters {
  category: string[];
  dateRange: [dayjs.Dayjs, dayjs.Dayjs] | null;
  contentType: string[];
  source: string[];
  quality: [number, number];
  tags: string[];
}

/**
 * 类型图标组件
 */
const TypeIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap = {
    document: <FileTextOutlined />,
    video: <PlayCircleOutlined />,
    image: <PictureOutlined />,
    link: <LinkOutlined />
  };
  
  return iconMap[type as keyof typeof iconMap] || <FileTextOutlined />;
};

/**
 * 搜索结果卡片组件
 */
const SearchResultCard: React.FC<{ 
  result: SearchResult;
  onView: (id: string) => void;
}> = ({ result, onView }) => {
  return (
    <Card
      className="mb-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView(result.id)}
    >
      <div className="space-y-3">
        {/* 标题和类型 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <TypeIcon type={result.type} />
              <Title level={4} className="mb-0 line-clamp-1">
                {result.title}
              </Title>
              <Badge 
                count={`${(result.relevanceScore * 100).toFixed(0)}%`} 
                style={{ backgroundColor: '#52c41a' }}
              />
            </div>
            <Paragraph className="text-gray-600 line-clamp-2 mb-2">
              {result.summary}
            </Paragraph>
          </div>
        </div>
        
        {/* 标签 */}
        <div className="flex flex-wrap gap-1">
          <Tag color="blue">{result.category}</Tag>
          {result.tags.slice(0, 3).map(tag => (
            <Tag key={tag} color="default">{tag}</Tag>
          ))}
          {result.tags.length > 3 && (
            <Tag color="default">+{result.tags.length - 3}</Tag>
          )}
        </div>
        
        {/* 元信息 */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <Space size={16}>
            <Space size={4}>
              <Avatar size={20} src={result.author.avatar} icon={<UserOutlined />} />
              <span>{result.author.name}</span>
            </Space>
            <Space size={4}>
              <CalendarOutlined />
              <span>{dayjs(result.createdAt).format('YYYY-MM-DD')}</span>
            </Space>
            {result.fileSize && (
              <Space size={4}>
                <FileTextOutlined />
                <span>{result.fileSize}</span>
              </Space>
            )}
          </Space>
          
          <Space size={16}>
            <Space size={4}>
              <EyeOutlined />
              <span>{result.viewCount}</span>
            </Space>
            <Space size={4}>
              <HeartOutlined />
              <span>{result.likeCount}</span>
            </Space>
            <Space size={4}>
              <DownloadOutlined />
              <span>{result.downloadCount}</span>
            </Space>
            <Rate disabled value={result.rating} />
          </Space>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
          <Button size="small" icon={<EyeOutlined />}>查看</Button>
          <Button size="small" icon={<DownloadOutlined />}>下载</Button>
          <Button size="small" icon={<ShareAltOutlined />}>分享</Button>
          <Button size="small" icon={<HeartOutlined />}>收藏</Button>
        </div>
      </div>
    </Card>
  );
};

/**
 * 搜索历史组件
 */
const SearchHistoryPanel: React.FC<{
  history: SearchHistory[];
  onSelectHistory: (query: string) => void;
}> = ({ history, onSelectHistory }) => {
  return (
    <Card title="搜索历史" size="small" className="mb-4">
      <div className="space-y-2">
        {history.slice(0, 5).map(item => (
          <div 
            key={item.id}
            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer"
            onClick={() => onSelectHistory(item.query)}
          >
            <div className="flex items-center space-x-2">
              <HistoryOutlined className="text-gray-400" />
              <span className="text-sm">{item.query}</span>
            </div>
            <div className="text-xs text-gray-400">
              {item.resultCount}条结果
            </div>
          </div>
        ))}
        {history.length === 0 && (
          <Empty description="暂无搜索历史" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </Card>
  );
};

/**
 * 知识推荐组件
 */
const RecommendationPanel: React.FC<{
  recommendations: RecommendedKnowledge[];
  onSelect: (id: string) => void;
}> = ({ recommendations, onSelect }) => {
  return (
    <Card title="推荐知识" size="small" className="mb-4">
      <div className="space-y-3">
        {recommendations.map(item => (
          <div 
            key={item.id}
            className="p-3 border rounded hover:shadow-sm cursor-pointer transition-shadow"
            onClick={() => onSelect(item.id)}
          >
            <div className="flex items-start justify-between mb-2">
              <Text strong className="text-sm line-clamp-1">{item.title}</Text>
              <Badge count={`${(item.score * 100).toFixed(0)}%`} size="small" />
            </div>
            <div className="text-xs text-gray-500 mb-2">{item.reason}</div>
            <Tag color="blue">{item.category}</Tag>
          </div>
        ))}
        {recommendations.length === 0 && (
          <Empty description="暂无推荐" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    </Card>
  );
};

/**
 * 搜索检索页面组件
 */
const SearchPage: React.FC = () => {
  const { message } = App.useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    category: [],
    dateRange: null,
    contentType: [],
    source: [],
    quality: [1, 5],
    tags: []
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalResults, setTotalResults] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 筛选条件
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [ratingRange, setRatingRange] = useState<[number, number]>([0, 5]);
  const [viewCountRange, setViewCountRange] = useState<[number, number]>([0, 1000]);
  
  // 搜索建议
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  
  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([
    { id: '1', query: 'React开发指南', timestamp: '2024-01-15 10:30', resultCount: 25 },
    { id: '2', query: 'TypeScript最佳实践', timestamp: '2024-01-14 15:20', resultCount: 18 },
    { id: '3', query: '前端性能优化', timestamp: '2024-01-13 09:15', resultCount: 32 }
  ]);
  
  // 推荐知识
  const [recommendations, setRecommendations] = useState<RecommendedKnowledge[]>([
    { id: '1', title: 'React Hooks 深度解析', reason: '基于您的搜索历史', score: 0.95, category: '前端开发' },
    { id: '2', title: 'TypeScript 进阶技巧', reason: '相似用户喜欢', score: 0.88, category: '编程语言' },
    { id: '3', title: '现代前端工程化实践', reason: '热门推荐', score: 0.82, category: '工程化' }
  ]);

  // 模拟搜索结果数据
  const mockSearchResults: SearchResult[] = mockKnowledge.map((item, index) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    summary: item.content.substring(0, 150) + '...',
    category: item.category,
    tags: item.tags,
    author: {
      id: item.id + '_author',
      name: item.creator,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.creator}`
    },
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    viewCount: Math.floor(Math.random() * 1000) + 50,
    likeCount: Math.floor(Math.random() * 100) + 10,
    downloadCount: Math.floor(Math.random() * 50) + 5,
    rating: Math.floor(Math.random() * 5) + 1,
    relevanceScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
    type: ['document', 'video', 'image', 'link'][Math.floor(Math.random() * 4)] as any,
    fileSize: `${Math.floor(Math.random() * 10) + 1}MB`,
    duration: `${Math.floor(Math.random() * 30) + 5}分钟`
  }));

  // 执行搜索
  const handleSearch = async (query: string = searchQuery) => {
    if (!query.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }
    
    setLoading(true);
    
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 过滤和排序结果
      let filteredResults = mockSearchResults.filter(result => {
        const matchesQuery = result.title.toLowerCase().includes(query.toLowerCase()) ||
                           result.content.toLowerCase().includes(query.toLowerCase()) ||
                           result.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
        
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(result.category);
        const matchesType = selectedTypes.length === 0 || selectedTypes.includes(result.type);
        const matchesAuthor = selectedAuthors.length === 0 || selectedAuthors.includes(result.author.id);
        
        const matchesDate = !dateRange || (
          dayjs(result.createdAt).isAfter(dateRange[0]) && 
          dayjs(result.createdAt).isBefore(dateRange[1])
        );
        
        const matchesRating = result.rating >= ratingRange[0] && result.rating <= ratingRange[1];
        const matchesViewCount = result.viewCount >= viewCountRange[0] && result.viewCount <= viewCountRange[1];
        
        return matchesQuery && matchesCategory && matchesType && matchesAuthor && 
               matchesDate && matchesRating && matchesViewCount;
      });
      
      // 排序
      filteredResults.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'relevance':
            comparison = b.relevanceScore - a.relevanceScore;
            break;
          case 'date':
            comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            break;
          case 'views':
            comparison = b.viewCount - a.viewCount;
            break;
          case 'rating':
            comparison = b.rating - a.rating;
            break;
          default:
            comparison = 0;
        }
        return sortOrder === 'asc' ? -comparison : comparison;
      });
      
      setSearchResults(filteredResults);
      setTotalResults(filteredResults.length);
      setCurrentPage(1);
      
      // 添加到搜索历史
      const newHistoryItem: SearchHistory = {
        id: Date.now().toString(),
        query,
        timestamp: dayjs().format('YYYY-MM-DD HH:mm'),
        resultCount: filteredResults.length
      };
      setSearchHistory(prev => [newHistoryItem, ...prev.slice(0, 9)]);
      
    } catch (error) {
      message.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 获取搜索建议
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.length > 1) {
      const suggestions = mockKnowledge
        .filter(item => item.title.toLowerCase().includes(value.toLowerCase()))
        .slice(0, 5)
        .map(item => item.title);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  // 处理筛选条件变化
  const handleFilterChange = () => {
    if (searchQuery) {
      handleSearch();
    }
  };

  // 清除所有筛选条件
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTypes([]);
    setSelectedAuthors([]);
    setDateRange(null);
    setRatingRange([0, 5]);
    setViewCountRange([0, 1000]);
    if (searchQuery) {
      handleSearch();
    }
  };

  // 处理查看详情
  const handleViewDetail = (id: string) => {
    message.info(`查看知识详情: ${id}`);
  };

  // 处理选择搜索历史
  const handleSelectHistory = (query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  // 处理选择推荐
  const handleSelectRecommendation = (id: string) => {
    handleViewDetail(id);
  };

  // 获取当前页数据
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return searchResults.slice(startIndex, endIndex);
  };

  useEffect(() => {
    handleFilterChange();
  }, [selectedCategories, selectedTypes, selectedAuthors, dateRange, ratingRange, viewCountRange, sortBy, sortOrder]);

  return (
    <div className="p-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2}>智能搜索</Title>
        <Text type="secondary">快速检索知识内容，发现有价值的信息</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* 左侧筛选面板 */}
        <Col xs={24} lg={6}>
          <Affix offsetTop={80}>
            <div className="space-y-4">
              {/* 搜索历史 */}
              <SearchHistoryPanel 
                history={searchHistory}
                onSelectHistory={handleSelectHistory}
              />
              
              {/* 知识推荐 */}
              <RecommendationPanel 
                recommendations={recommendations}
                onSelect={handleSelectRecommendation}
              />
              
              {/* 筛选条件 */}
              <Card title="筛选条件" size="small">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Text strong>筛选器</Text>
                    <Button size="small" type="link" onClick={clearAllFilters}>
                      清除全部
                    </Button>
                  </div>
                  
                  <Collapse 
                    ghost
                    items={[
                      {
                        key: 'category',
                        label: '分类',
                        children: (
                          <CheckboxGroup
                            value={selectedCategories}
                            onChange={setSelectedCategories}
                          >
                            <div className="space-y-2">
                              {mockCategories.flatMap(category => 
                                category.children.map(child => (
                                  <div key={child.key}>
                                    <Checkbox value={child.title}>
                                      {child.title}
                                    </Checkbox>
                                  </div>
                                ))
                              )}
                            </div>
                          </CheckboxGroup>
                        )
                      },
                      {
                        key: 'type',
                        label: '内容类型',
                        children: (
                          <CheckboxGroup
                            value={selectedTypes}
                            onChange={setSelectedTypes}
                          >
                            <div className="space-y-2">
                              <div><Checkbox value="document">文档</Checkbox></div>
                              <div><Checkbox value="video">视频</Checkbox></div>
                              <div><Checkbox value="image">图片</Checkbox></div>
                              <div><Checkbox value="link">链接</Checkbox></div>
                            </div>
                          </CheckboxGroup>
                        )
                      },
                      {
                        key: 'author',
                        label: '作者',
                        children: (
                          <CheckboxGroup
                            value={selectedAuthors}
                            onChange={setSelectedAuthors}
                          >
                            <div className="space-y-2">
                              {mockUsers.slice(0, 5).map(user => (
                                <div key={user.id}>
                                  <Checkbox value={user.id}>
                                    {user.name}
                                  </Checkbox>
                                </div>
                              ))}
                            </div>
                          </CheckboxGroup>
                        )
                      },
                      {
                        key: 'date',
                        label: '创建时间',
                        children: (
                          <RangePicker
                            value={dateRange}
                            onChange={setDateRange}
                            style={{ width: '100%' }}
                            placeholder={['开始日期', '结束日期']}
                          />
                        )
                      },
                      {
                        key: 'rating',
                        label: '评分范围',
                        children: (
                          <div className="px-2">
                            <Slider
                              range
                              min={0}
                              max={5}
                              step={0.5}
                              value={ratingRange}
                              onChange={(value) => setRatingRange(value as [number, number])}
                              marks={{
                                0: '0',
                                2.5: '2.5',
                                5: '5'
                              }}
                            />
                          </div>
                        )
                      },
                      {
                        key: 'views',
                        label: '浏览量',
                        children: (
                          <div className="px-2">
                            <Slider
                              range
                              min={0}
                              max={1000}
                              step={50}
                              value={viewCountRange}
                              onChange={(value) => setViewCountRange(value as [number, number])}
                              marks={{
                                0: '0',
                                500: '500',
                                1000: '1000+'
                              }}
                            />
                          </div>
                        )
                      }
                    ]}
                  />
                </div>
              </Card>
            </div>
          </Affix>
        </Col>

        {/* 右侧搜索结果 */}
        <Col xs={24} lg={18}>
          {/* 搜索框 */}
          <Card className="mb-4">
            <div className="space-y-4">
              <AutoComplete
                value={searchQuery}
                options={searchSuggestions.map(suggestion => ({ value: suggestion }))}
                onSelect={setSearchQuery}
                onChange={handleSearchChange}
                style={{ width: '100%' }}
              >
                <Search
                  placeholder="输入关键词搜索知识内容..."
                  enterButton={<Button type="primary" icon={<SearchOutlined />}>搜索</Button>}
                  size="large"
                  onSearch={handleSearch}
                  loading={loading}
                />
              </AutoComplete>
              
              {/* 快捷搜索标签 */}
              <div>
                <Text type="secondary" className="mr-2">热门搜索：</Text>
                <Space wrap>
                  {['React开发', 'TypeScript', '前端优化', 'Node.js', 'Vue.js'].map(tag => (
                    <Tag 
                      key={tag} 
                      className="cursor-pointer" 
                      onClick={() => {
                        setSearchQuery(tag);
                        handleSearch(tag);
                      }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Card>

          {/* 搜索结果工具栏 */}
          {searchResults.length > 0 && (
            <Card className="mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Text>找到 <Text strong>{totalResults}</Text> 条结果</Text>
                  {searchQuery && (
                    <Text type="secondary">关键词："{searchQuery}"</Text>
                  )}
                </div>
                
                <Space>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: 120 }}
                  >
                    <Option value="relevance">相关性</Option>
                    <Option value="date">时间</Option>
                    <Option value="views">浏览量</Option>
                    <Option value="rating">评分</Option>
                  </Select>
                  
                  <Button
                    icon={sortOrder === 'desc' ? <SortDescendingOutlined /> : <SortAscendingOutlined />}
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  >
                    {sortOrder === 'desc' ? '降序' : '升序'}
                  </Button>
                  
                  <Button icon={<ReloadOutlined />} onClick={() => handleSearch()}>
                    刷新
                  </Button>
                </Space>
              </div>
            </Card>
          )}

          {/* 搜索结果列表 */}
          <Spin spinning={loading}>
            {searchResults.length > 0 ? (
              <div>
                {getCurrentPageData().map(result => (
                  <SearchResultCard
                    key={result.id}
                    result={result}
                    onView={handleViewDetail}
                  />
                ))}
                
                {/* 分页 */}
                <div className="flex justify-center mt-6">
                  <Pagination
                    current={currentPage}
                    pageSize={pageSize}
                    total={totalResults}
                    onChange={setCurrentPage}
                    onShowSizeChange={(current, size) => {
                      setCurrentPage(1);
                      setPageSize(size);
                    }}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total, range) => 
                      `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                    }
                  />
                </div>
              </div>
            ) : (
              <Card>
                {searchQuery ? (
                  <Empty
                    description={
                      <div>
                        <Text>未找到相关结果</Text>
                        <div className="mt-2">
                          <Text type="secondary">建议：</Text>
                          <ul className="text-left mt-2 text-gray-500">
                            <li>• 检查关键词拼写</li>
                            <li>• 尝试使用更通用的关键词</li>
                            <li>• 减少筛选条件</li>
                            <li>• 查看推荐内容</li>
                          </ul>
                        </div>
                      </div>
                    }
                  />
                ) : (
                  <Empty
                    description="输入关键词开始搜索"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </Card>
            )}
          </Spin>
        </Col>
      </Row>

      {/* 返回顶部 */}
      <FloatButton.BackTop />
    </div>
  );
};

export default SearchPage;