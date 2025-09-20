/**
 * SVG图谱可视化组件
 * @author 伍志勇
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GraphNode, GraphRelation, GraphData } from '../../types/graph';

interface GraphVisualizationProps {
  data: GraphData;
  width: number;
  height: number;
  nodeSize?: number;
  showLabels?: boolean;
  layoutType?: 'force' | 'circular' | 'grid' | 'hierarchical';
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
}

interface Position {
  x: number;
  y: number;
}

interface NodeWithPosition extends GraphNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
}

/**
 * SVG图谱可视化组件
 */
const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width,
  height,
  nodeSize = 40,
  showLabels = true,
  layoutType = 'force',
  onNodeClick,
  onNodeHover
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodes, setNodes] = useState<NodeWithPosition[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<NodeWithPosition | null>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [hoveredNode, setHoveredNode] = useState<NodeWithPosition | null>(null);

  // 节点类型颜色映射
  const nodeTypeColors = {
    person: '#1677FF',
    organization: '#52C41A',
    concept: '#FA8C16',
    document: '#722ED1',
    process: '#EB2F96',
    system: '#13C2C2'
  };

  // 初始化节点位置
  const initializeNodes = useCallback(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    
    const initialNodes: NodeWithPosition[] = data.nodes.map((node, index) => {
      let x, y;
      
      switch (layoutType) {
        case 'circular':
          const angle = (index / data.nodes.length) * 2 * Math.PI;
          const radius = Math.min(width, height) * 0.3;
          x = centerX + radius * Math.cos(angle);
          y = centerY + radius * Math.sin(angle);
          break;
        case 'grid':
          const cols = Math.ceil(Math.sqrt(data.nodes.length));
          const cellWidth = width / cols;
          const cellHeight = height / Math.ceil(data.nodes.length / cols);
          x = (index % cols) * cellWidth + cellWidth / 2;
          y = Math.floor(index / cols) * cellHeight + cellHeight / 2;
          break;
        case 'hierarchical':
          const levels = 3;
          const level = index % levels;
          const nodesInLevel = Math.ceil(data.nodes.length / levels);
          const posInLevel = Math.floor(index / levels);
          x = (posInLevel / nodesInLevel) * width + width / (nodesInLevel * 2);
          y = (level / levels) * height + height / (levels * 2);
          break;
        default: // force
          x = centerX + (Math.random() - 0.5) * width * 0.6;
          y = centerY + (Math.random() - 0.5) * height * 0.6;
          break;
      }
      
      return {
        ...node,
        x,
        y,
        vx: 0,
        vy: 0
      };
    });
    
    setNodes(initialNodes);
  }, [data.nodes, width, height, layoutType]);

  // 力导向布局算法
  const applyForceLayout = useCallback(() => {
    if (layoutType !== 'force' || isDragging) return;

    setNodes(prevNodes => {
      const newNodes = [...prevNodes];
      const alpha = 0.1;
      const linkDistance = 100;
      const linkStrength = 0.1;
      const chargeStrength = -300;
      const centerStrength = 0.05;

      // 重置力
      newNodes.forEach(node => {
        node.vx = (node.vx || 0) * 0.9;
        node.vy = (node.vy || 0) * 0.9;
      });

      // 链接力
      data.relations.forEach(relation => {
        const source = newNodes.find(n => n.id === relation.source);
        const target = newNodes.find(n => n.id === relation.target);
        
        if (source && target) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = (distance - linkDistance) * linkStrength;
          
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          source.vx = (source.vx || 0) + fx;
          source.vy = (source.vy || 0) + fy;
          target.vx = (target.vx || 0) - fx;
          target.vy = (target.vy || 0) - fy;
        }
      });

      // 排斥力
      for (let i = 0; i < newNodes.length; i++) {
        for (let j = i + 1; j < newNodes.length; j++) {
          const nodeA = newNodes[i];
          const nodeB = newNodes[j];
          
          const dx = nodeB.x - nodeA.x;
          const dy = nodeB.y - nodeA.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = chargeStrength / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          nodeA.vx = (nodeA.vx || 0) - fx;
          nodeA.vy = (nodeA.vy || 0) - fy;
          nodeB.vx = (nodeB.vx || 0) + fx;
          nodeB.vy = (nodeB.vy || 0) + fy;
        }
      }

      // 中心力
      const centerX = width / 2;
      const centerY = height / 2;
      newNodes.forEach(node => {
        const dx = centerX - node.x;
        const dy = centerY - node.y;
        node.vx = (node.vx || 0) + dx * centerStrength;
        node.vy = (node.vy || 0) + dy * centerStrength;
      });

      // 应用速度
      newNodes.forEach(node => {
        node.x += (node.vx || 0) * alpha;
        node.y += (node.vy || 0) * alpha;
        
        // 边界约束
        const margin = nodeSize;
        node.x = Math.max(margin, Math.min(width - margin, node.x));
        node.y = Math.max(margin, Math.min(height - margin, node.y));
      });

      return newNodes;
    });
  }, [data.relations, width, height, nodeSize, layoutType, isDragging]);

  // 鼠标事件处理
  const handleMouseDown = (event: React.MouseEvent, node: NodeWithPosition) => {
    event.preventDefault();
    setIsDragging(true);
    setDragNode(node);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (isDragging && dragNode && svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const x = (event.clientX - rect.left - transform.x) / transform.scale;
      const y = (event.clientY - rect.top - transform.y) / transform.scale;
      
      setNodes(prevNodes => 
        prevNodes.map(node => 
          node.id === dragNode.id 
            ? { ...node, x, y, vx: 0, vy: 0 }
            : node
        )
      );
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNode(null);
  };

  const handleNodeClick = (node: NodeWithPosition) => {
    if (!isDragging && onNodeClick) {
      onNodeClick(node);
    }
  };

  const handleNodeHover = (node: NodeWithPosition | null) => {
    setHoveredNode(node);
    if (onNodeHover) {
      onNodeHover(node);
    }
  };

  // 缩放和平移
  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    setTransform(prev => ({
      ...prev,
      scale: Math.max(0.1, Math.min(3, prev.scale * delta))
    }));
  };

  // 初始化和布局更新
  useEffect(() => {
    initializeNodes();
  }, [initializeNodes]);

  // 力导向布局动画
  useEffect(() => {
    if (layoutType === 'force') {
      const interval = setInterval(applyForceLayout, 50);
      return () => clearInterval(interval);
    }
  }, [applyForceLayout, layoutType]);

  return (
    <svg
      ref={svgRef}
      width={width}
      height={height}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <defs>
        {/* 箭头标记 */}
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill="#666"
          />
        </marker>
        
        {/* 节点阴影滤镜 */}
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3" />
        </filter>
      </defs>
      
      <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
        {/* 绘制边 */}
        {data.relations.map(relation => {
          const source = nodes.find(n => n.id === relation.source);
          const target = nodes.find(n => n.id === relation.target);
          
          if (!source || !target) return null;
          
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          // 计算边的起点和终点（考虑节点半径）
          const radius = nodeSize / 2;
          const sourceX = source.x + (dx / distance) * radius;
          const sourceY = source.y + (dy / distance) * radius;
          const targetX = target.x - (dx / distance) * radius;
          const targetY = target.y - (dy / distance) * radius;
          
          return (
            <g key={relation.id}>
              <line
                x1={sourceX}
                y1={sourceY}
                x2={targetX}
                y2={targetY}
                stroke="#666"
                strokeWidth={Math.max(1, relation.weight * 3)}
                strokeOpacity={0.6}
                markerEnd="url(#arrowhead)"
              />
              {showLabels && relation.label && (
                <text
                  x={(sourceX + targetX) / 2}
                  y={(sourceY + targetY) / 2}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#666"
                  dy="-5"
                >
                  {relation.label}
                </text>
              )}
            </g>
          );
        })}
        
        {/* 绘制节点 */}
        {nodes.map(node => {
          const isHovered = hoveredNode?.id === node.id;
          const currentSize = isHovered ? nodeSize * 1.2 : nodeSize;
          
          return (
            <g key={node.id}>
              {/* 节点圆圈 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={currentSize / 2}
                fill={nodeTypeColors[node.type] || '#666'}
                stroke={isHovered ? '#fff' : 'none'}
                strokeWidth={isHovered ? 3 : 0}
                filter="url(#shadow)"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseDown={(e) => handleMouseDown(e, node)}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
              />
              
              {/* 节点标签 */}
              {showLabels && (
                <text
                  x={node.x}
                  y={node.y + currentSize / 2 + 15}
                  textAnchor="middle"
                  fontSize="12"
                  fill="#333"
                  fontWeight="500"
                  style={{ pointerEvents: 'none' }}
                >
                  {node.name}
                </text>
              )}
              
              {/* 节点图标或首字母 */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={currentSize / 3}
                fill="white"
                fontWeight="bold"
                style={{ pointerEvents: 'none' }}
              >
                {node.name.charAt(0).toUpperCase()}
              </text>
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default GraphVisualization;